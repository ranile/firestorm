use serde::{Deserialize, Serialize};
use vodozemac::megolm::MegolmMessage;
use wasm_bindgen::prelude::wasm_bindgen;

mod serde_megolm_message {
    use super::*;

    pub fn serialize<S>(value: &MegolmMessage, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        value.to_base64().serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<MegolmMessage, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let base64 = String::deserialize(deserializer)?;
        MegolmMessage::from_base64(&base64).map_err(serde::de::Error::custom)
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct EncryptedMessage {
    #[serde(with = "serde_megolm_message")]
    pub(crate) megolm: MegolmMessage,
    pub(crate) session_id: String,
}

#[wasm_bindgen]
impl EncryptedMessage {
    #[wasm_bindgen(constructor)]
    pub fn new(megolm: String, session_id: String) -> Self {
        Self {
            megolm: MegolmMessage::from_base64(&megolm).unwrap(),
            session_id,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn megolm(&self) -> String {
        self.megolm.to_base64()
    }
    #[wasm_bindgen(getter, js_name = "sessionId")]
    pub fn session_id(&self) -> String {
        self.session_id.clone()
    }
}
