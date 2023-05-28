mod encrypt_messages;
mod decrypt_attachment;
use gloo::utils::format::JsValueSerdeExt;
use wasm_bindgen::prelude::*;
use js_sys::{JsString, Uint8Array};
use serde::{Deserialize, Serialize};
use crate::attachments::MediaEncryptionInfo;
pub use encrypt_messages::*;
pub use decrypt_attachment::*;


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