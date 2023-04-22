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

/*
pub struct SessionKey {
    room_id: String,
    user_id: String,
    inner: vodozemac::megolm::SessionKey,
}

pub fn init_room(members: Vec<RoomMember>) {
    let mut outbound = vodozemac::megolm::GroupSession::new(vodozemac::megolm::SessionConfig::version_1());
    let session_key = outbound.session_key();

    let b64 = session_key.to_base64();
    let mut inbound = InboundGroupSession::new(&vodozemac::megolm::SessionKey::from_base64(&b64).unwrap(), vodozemac::megolm::SessionConfig::version_1());

    // broadcast this key to the other users
    let _ = members.into_iter().map(|member| EncryptedSessionKeyForUser {
        session_key: encrypt_session_key(&b64, member.identity_key, member.one_time_key),
        user_id: member.user_id
    });

}
struct UserAccount {
    inner: Account,
}

static MY_ACCOUNT: OnceCell<Account> = OnceCell::new();

pub fn encrypt_session_key(message: &str, identity_key: Curve25519PublicKey, one_time_key: Curve25519PublicKey) -> OlmMessage {
    let my_account = MY_ACCOUNT.get().unwrap();
    let mut sess = my_account.create_outbound_session(SessionConfig::version_2(), identity_key, one_time_key);
    sess.encrypt(message)
}

pub fn init() {}

pub struct RoomMember {
    user_id: String,
    one_time_key: Curve25519PublicKey,
    identity_key: Curve25519PublicKey,
}

struct EncryptedSessionKeyForUser {
    user_id: String,
    session_key: OlmMessage,
}
*/

#[cfg(test)]
mod tests {
    use crate::{InboundSession, OutboundSession};

    #[test]
    fn it_works() {
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