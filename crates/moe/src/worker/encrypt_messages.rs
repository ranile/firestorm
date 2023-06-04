use crate::worker::EncryptedFile;
use gloo::console::log;
use gloo::utils::format::JsValueSerdeExt;
use gloo::worker::Spawnable;
use gloo::worker::{HandlerId, Worker, WorkerBridge, WorkerScope};
use js_sys::JsString;
use serde::{Deserialize, Serialize};
use std::io::Read;
use wasm_bindgen::prelude::wasm_bindgen;
use wasm_bindgen::{JsValue, UnwrapThrowExt};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileToEncrypt {
    bytes: Vec<u8>,
    name: String,
    type_: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkerInput {
    ciphertext: String,
    files: Vec<FileToEncrypt>,
    room_id: String,
    uid: String,
}

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkerOutput {
    uid: String,
    files: Vec<EncryptedFile>,
    room_id: String,
    ciphertext: String,
}

#[wasm_bindgen]
impl WorkerOutput {
    #[wasm_bindgen(getter)]
    pub fn uid(&self) -> JsString {
        JsString::from(self.uid.as_str())
    }

    #[wasm_bindgen(getter)]
    pub fn files(&self) -> js_sys::Array {
        js_sys::Array::from_iter(
            self.files
                .iter()
                .map(|it| JsValue::from_serde(it).unwrap_throw()),
        )
    }

    #[wasm_bindgen(getter)]
    pub fn room_id(&self) -> JsString {
        JsString::from(self.room_id.as_str())
    }
    #[wasm_bindgen(getter)]
    pub fn ciphertext(&self) -> JsString {
        JsString::from(self.ciphertext.as_str())
    }
}

pub struct EncryptedMessagesWorker {}

pub enum WorkerMessage {}

impl Worker for EncryptedMessagesWorker {
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
        let WorkerInput {
            ciphertext,
            files,
            room_id,
            uid,
        } = input;

        let files = files
            .into_iter()
            .map(|FileToEncrypt { bytes, name, type_ }| {
                let mut bytes = &bytes[..];
                let mut encryptor = crate::attachments::AttachmentEncryptor::new(&mut bytes);
                let mut encrypted = Vec::new();
                encryptor.read_to_end(&mut encrypted).unwrap();
                let key = encryptor.finish();
                log!(
                    "LOG FROM WORKER -- enc",
                    format!("{:#?}", key),
                    format!("{:?}", encrypted)
                );
                EncryptedFile {
                    bytes: encrypted,
                    key,
                    name,
                    type_,
                }
            });
        scope.respond(
            who,
            WorkerOutput {
                ciphertext,
                files: files.collect(),
                room_id,
                uid,
            },
        )
    }
}

#[wasm_bindgen]
pub struct JsWorker {
    worker: WorkerBridge<EncryptedMessagesWorker>,
}

#[wasm_bindgen]
impl JsWorker {
    #[wasm_bindgen(js_name = "newMessage")]
    pub async fn new_message(
        &self,
        outbound_session: &mut crate::OutboundSession,
        room_id: String,
        uid: String,
        content: &str,
        files: Vec<web_sys::File>,
    ) {
        let mut new_files = Vec::with_capacity(files.len());
        for file in files {
            let name = file.name();
            let type_ = file.type_();
            let bytes = {
                let file = gloo::file::File::from(file);
                gloo::file::futures::read_as_bytes(&file)
                    .await
                    .unwrap_throw()
            };
            new_files.push(FileToEncrypt { bytes, name, type_ });
        }

        let ciphertext = outbound_session.encrypt(content);

        let input = WorkerInput {
            ciphertext,
            files: new_files,
            room_id,
            uid,
        };
        self.worker.send(input);
    }
}

#[wasm_bindgen(js_name = "initAttachmentsWorker")]
pub fn worker_init(cb: js_sys::Function) -> JsWorker {
    console_error_panic_hook::set_once();

    let bridge = EncryptedMessagesWorker::spawner()
        .callback(move |m| {
            let m = JsValue::from(m);
            let ret = cb.call1(&JsValue::NULL, &m);
            if let Err(e) = ret {
                log!("Error calling callback", e);
            }
        })
        .spawn("/dist/worker/worker.js");

    JsWorker { worker: bridge }
}
