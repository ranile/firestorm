mod attachments;
mod json_web_key;
mod serde;
mod worker;

use vodozemac::megolm::{GroupSession, GroupSessionPickle, InboundGroupSession, MegolmMessage, SessionConfig, SessionKey};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct OutboundSession {
    session: GroupSession,
}

#[wasm_bindgen]
impl OutboundSession {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();

        let session = GroupSession::new(SessionConfig::version_1());
        Self { session }
    }

    pub fn session_key(&self) -> String {
        self.session.session_key().to_base64()
    }

    pub fn encrypt(&mut self, message: &str) -> String {
        let m = self.session.encrypt(message);
        m.to_base64()
    }


    pub fn pickle(&self, pickle_key: &[u8]) -> String {
        self.session.pickle().encrypt(pickle_key.try_into().expect("should be 32 bytes"))
    }

    pub fn from_pickle(ciphertext: &str, pickle_key: &[u8]) -> Result<OutboundSession, JsValue> {
        let pickle_key = pickle_key.try_into().expect("should be 32 bytes");
        let pickle = GroupSessionPickle::from_encrypted(ciphertext, pickle_key).map_err(|e| JsError::from(e))?;
        let session = GroupSession::from_pickle(pickle);
        Ok(Self { session })
    }
}

#[wasm_bindgen]
pub struct InboundSession {
    session: InboundGroupSession,
}

#[wasm_bindgen]
impl InboundSession {
    #[wasm_bindgen(constructor)]
    pub fn new(key: &str) -> Result<InboundSession, JsValue> {
        let session_key = SessionKey::from_base64(key).map_err(JsError::from)?;
        let inbound = InboundGroupSession::new(&session_key, SessionConfig::version_1());

        Ok(Self { session: inbound })
    }

    pub fn decrypt(&mut self, message: &str) -> Result<String, JsValue> {
        let message = MegolmMessage::from_base64(message).map_err(JsError::from)?;
        let decrypted = self.session.decrypt(&message).map_err(JsError::from)?;
        let plaintext = String::from_utf8(decrypted.plaintext).map_err(JsError::from)?;

        Ok(plaintext)
    }
}

pub fn encrypt_file(file: web_sys::File) {
    // TODO: implement
    // Steps:
    // 1. read file into Vec<u8>
    // 2. encrypt using attachments:AttachmentEncryptor
    // 3. finalize attachment
    // 4. return the metadata and the ciphertext
}

#[cfg(test)]
mod tests {
    use crate::{InboundSession, OutboundSession};

    wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);
    use wasm_bindgen_test::wasm_bindgen_test as test;

    #[test]
    fn message_encryption_roundtrip() {
        let msg = "i fucked your mum";

        let mut outbound = OutboundSession::new();
        let session_key = outbound.session_key();
        let ciphertext = outbound.encrypt(msg);

        let mut inbound = InboundSession::new(&session_key).unwrap();
        let plaintext = inbound.decrypt(&ciphertext).unwrap();
        assert_eq!(plaintext, msg);

        let mut inbound = InboundSession::new(&session_key).unwrap();
        let plaintext = inbound.decrypt(&ciphertext).unwrap();
        assert_eq!(plaintext, msg);

    }
}