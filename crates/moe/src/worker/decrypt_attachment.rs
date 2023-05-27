use std::io::Read;
use gloo::console::{console_dbg, log};
use gloo::worker::{HandlerId, Worker, WorkerBridge, WorkerScope};
use serde::{Deserialize, Serialize};
use wasm_bindgen::{JsValue, UnwrapThrowExt};
use wasm_bindgen::prelude::wasm_bindgen;
use gloo::worker::Spawnable;
use gloo::utils::format::JsValueSerdeExt;
use crate::attachments::{AttachmentDecryptor, DecryptorError, MediaEncryptionInfo};

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkerInput {
    bytes: Vec<u8>,
    info: MediaEncryptionInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkerOutput {
    bytes: Vec<u8>,
}

pub struct DecryptAttachmentsWorker {}

pub enum WorkerMessage {}

impl Worker for DecryptAttachmentsWorker {
    type Message = WorkerMessage;

    type Input = WorkerInput;

    type Output = WorkerOutput;

    fn create(_scope: &WorkerScope<Self>) -> Self {
        Self {}
    }

    fn update(&mut self, _scope: &WorkerScope<Self>, msg: Self::Message) {
        match msg {}
    }

    fn received(&mut self, scope: &WorkerScope<Self>, input: Self::Input, who: HandlerId) {
        let WorkerInput { bytes, info } = input;
        let mut bytes = &bytes[..];
        log!("LOG FROM WORKER -- dec", format!("{:#?}", info), format!("{:?}", bytes));
        let mut decryptor = match AttachmentDecryptor::new(&mut bytes, info) {
            Ok(d) => d,
            Err(e) => {
                log!("Error creating decryptor", e.to_string());
                return;
            }
        };
        let mut decrypted_data = Vec::new();
        match decryptor.read_to_end(&mut decrypted_data) {
            Ok(_) => {}
            Err(e) => {
                log!("Error decrypting attachment", e.to_string());
                return;
            }
        }
        scope.respond(who, WorkerOutput {
            bytes: decrypted_data,
        });
    }
}

#[wasm_bindgen]
pub struct JsDecryptAttachmentsWorker {
    worker: WorkerBridge<DecryptAttachmentsWorker>,
}

#[wasm_bindgen]
impl JsDecryptAttachmentsWorker {
    #[wasm_bindgen(js_name = "decryptAttachment")]
    pub async fn decrypt_attachment(
        &self,
        blob: web_sys::Blob,
        info: JsValue,
    ) {
        log!("Decrypting attachment");
        let file = gloo::file::Blob::from(blob);
        let bytes = gloo::file::futures::read_as_bytes(&file).await.unwrap_throw();
        let info: MediaEncryptionInfo = info.into_serde().unwrap_throw();
        let input = WorkerInput {
            bytes,
            info,
        };
        self.worker.send(input);
    }
}

#[wasm_bindgen(js_name = "newDecryptAttachmentsWorker")]
pub fn new(cb: js_sys::Function) -> JsDecryptAttachmentsWorker {

    console_error_panic_hook::set_once();

    let bridge = DecryptAttachmentsWorker::spawner()
        .callback(move |m| {
            let bytes = m.bytes;
            let m = js_sys::Uint8Array::from(bytes.as_slice());
            let ret = cb.call1(&JsValue::NULL, &m);
            if let Err(e) = ret {
                log!("Error calling callback", e);
            }
        })
        .spawn("/crates/moe/dist/decrypt_attachment_worker/decrypt_attachment_worker.js");

    JsDecryptAttachmentsWorker {
        worker: bridge,
    }
}
