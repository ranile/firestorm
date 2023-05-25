#![allow(warnings)]

use std::io::Read;
use gloo::console::log;
use gloo::worker::{Codec, HandlerId, Worker, WorkerBridge, WorkerScope};
use gloo::worker::Spawnable;
use gloo::utils::format::JsValueSerdeExt;
use js_sys::{JsString, Uint8Array};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use wasm_bindgen::{JsCast, JsValue, UnwrapThrowExt};
use wasm_bindgen::prelude::wasm_bindgen;
use crate::attachments::MediaEncryptionInfo;

#[wasm_bindgen]
#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptedFile {
    bytes: Vec<u8>,
    key: MediaEncryptionInfo,
    name: String,
    type_: String,
}

#[wasm_bindgen]
impl EncryptedFile {
    #[wasm_bindgen(getter)]
    pub fn bytes(&self) -> Uint8Array {
        Uint8Array::from(&self.bytes[..])
    }

    #[wasm_bindgen(getter)]
    pub fn key(&self) -> JsValue {
        JsValue::from_serde(&self.key).unwrap_throw()
    }
    #[wasm_bindgen(getter)]
    pub fn name(&self) -> JsString {
        JsString::from(self.name.as_str())
    }
    #[wasm_bindgen(js_name = "type", getter)]
    pub fn type_(&self) -> JsString {
        JsString::from(self.type_.as_str())
    }

}

#[derive(Debug)]
pub enum Steps {
    Respond { output: EncryptedFile, id: HandlerId },
}

#[derive(Debug, Serialize, Deserialize)]
pub enum WorkerInput {
    EncryptFile { bytes: Vec<u8>, name: String, type_: String },
}

#[derive(Serialize, Deserialize)]
pub enum WorkerOutput {
    EncryptedFile(EncryptedFile),
}

struct EncryptedAttachmentsCodec;
impl Codec for EncryptedAttachmentsCodec {
    fn encode<I>(input: I) -> JsValue where I: Serialize {
        let s= serde_json::to_string(&input).expect_throw("failed to encode message");
        log!("encode: input", &s);
        JsValue::from(s)
    }

    fn decode<O>(input: JsValue) -> O where O: for<'de> Deserialize<'de> {
        log!("decode: input", &input);
        let s = input.as_string().expect_throw("input was not string");
        serde_json::from_str(&s).expect_throw("failed to decode message")
    }
}

pub struct EncryptedAttachmentsWorker {}

impl Worker for EncryptedAttachmentsWorker {
    type Message = Steps;

    type Input = WorkerInput;

    type Output = WorkerOutput;

    fn create(_scope: &WorkerScope<Self>) -> Self {
        log!("create");
        Self {}
    }

    fn update(&mut self, scope: &WorkerScope<Self>, msg: Self::Message) {
        match msg {
            Steps::Respond { id, output } => {
                scope.respond(id, WorkerOutput::EncryptedFile(output));
            }
        }
    }

    fn received(&mut self, scope: &WorkerScope<Self>, input: Self::Input, who: HandlerId) {
        log!("received", format!("{:?}", input));
        match input {
            WorkerInput::EncryptFile { type_, mut bytes, name } => {
                let mut bytes = &bytes[..];
                let mut encryptor = crate::attachments::AttachmentEncryptor::new(&mut bytes);
                let mut encrypted = Vec::new();
                encryptor.read_to_end(&mut encrypted).unwrap();
                let key = encryptor.finish();
                let output = EncryptedFile {
                    bytes: encrypted,
                    key,
                    name,
                    type_,
                };
                scope.send_message(Steps::Respond { output, id: who });
            }
        }
    }
}

#[wasm_bindgen]
pub struct JsWorker {
    worker: WorkerBridge<EncryptedAttachmentsWorker>,
}

#[wasm_bindgen]
impl JsWorker {
    #[wasm_bindgen]
    pub async fn send_file(&self, file: web_sys::File) {
        let file = gloo::file::File::from(file);
        let bytes = gloo::file::futures::read_as_bytes(&file).await;
        let bytes = match bytes {
            Ok(bytes) => bytes,
            Err(e) => todo!("throw error: {e}")
        };

        let input = WorkerInput::EncryptFile {
            bytes: bytes,
            name: file.name(),
            type_: file.raw_mime_type(),
        };


        self.worker.send(input);
        log!("sent");
    }
}

#[wasm_bindgen]
pub fn worker_init(cb: js_sys::Function) -> JsWorker {
    console_error_panic_hook::set_once();

    let bridge = EncryptedAttachmentsWorker::spawner()
        .callback(move |m| {
            let WorkerOutput::EncryptedFile(m) = m;
            let m = JsValue::from(m);
            log!("Worker Callback: m", &m);
            let ret = cb.call1(&JsValue::NULL, &m);
            match ret {
                Ok(v) => log!("Worker Callback: Ok", v),
                Err(e) => log!("Worker Callback: Err", e),
            }
        })
        .spawn("/crates/moe/dist/worker/worker.js");

    JsWorker {
        worker: bridge,
    }
}