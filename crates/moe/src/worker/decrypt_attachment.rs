use crate::attachments::{AttachmentDecryptor, MediaEncryptionInfo};
use gloo::console::log;
use gloo::utils::format::JsValueSerdeExt;
use gloo::worker::Spawnable;
use gloo::worker::{HandlerId, Worker, WorkerBridge, WorkerScope};
use serde::{Deserialize, Serialize};
use std::io::Read;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::{JsValue, UnwrapThrowExt};

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
        log!(
            "LOG FROM WORKER -- dec",
            format!("{:#?}", info),
            format!("{:?}", bytes)
        );
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
        scope.respond(
            who,
            WorkerOutput {
                bytes: decrypted_data,
            },
        );
    }
}

#[wasm_bindgen]
pub struct JsDecryptAttachmentsWorker {
    worker: WorkerBridge<DecryptAttachmentsWorker>,
}

#[wasm_bindgen]
impl JsDecryptAttachmentsWorker {

    fn make_worker_callback(cb: js_sys::Function) -> impl Fn(WorkerOutput) + 'static {
        move |m| {
            let bytes = m.bytes;
            let m = js_sys::Uint8Array::from(bytes.as_slice());
            let ret = cb.call1(&JsValue::NULL, &m);
            if let Err(e) = ret {
                log!("Error calling callback", e);
            }
        }
    }

    #[wasm_bindgen(constructor)]
    pub fn new(cb: js_sys::Function) -> Self {
        console_error_panic_hook::set_once();
        let bridge = DecryptAttachmentsWorker::spawner()
            .callback(Self::make_worker_callback(cb))
            .spawn("/dist/decrypt_attachment_worker/decrypt_attachment_worker.js");

        JsDecryptAttachmentsWorker { worker: bridge }
    }

    #[wasm_bindgen(js_name = "decryptAttachment")]
    pub async fn decrypt_attachment(&self, blob: web_sys::Blob, info: JsValue) {
        log!("Decrypting attachment");
        let file = gloo::file::Blob::from(blob);
        let bytes = gloo::file::futures::read_as_bytes(&file)
            .await
            .unwrap_throw();
        let info: MediaEncryptionInfo = info.into_serde().unwrap_throw();
        let input = WorkerInput { bytes, info };
        self.worker.send(input);
    }

    pub fn fork(&self, cb: js_sys::Function) -> Self {
        let fork = self.worker.fork(Some(Self::make_worker_callback(cb)));
        Self {
            worker: fork,
        }
    }
}
