use std::sync::{Arc, RwLock};
use std::time::SystemTime;
use vodozemac::megolm::{GroupSession, MegolmMessage, SessionConfig, SessionKey};
use crate::RoomId;


#[derive(Clone)]
pub struct OutboundGroupSession {
    inner: Arc<RwLock<GroupSession>>,
    room_id: RoomId,
    creation_time: u64,
}

impl OutboundGroupSession {
    pub fn new(room_id: RoomId) -> Self {
        let inner = GroupSession::new(SessionConfig::version_2());
        let creation_time = js_sys::Date::now() as u64;

        Self {
            inner: Arc::new(RwLock::new(inner)),
            room_id,
            creation_time,
        }
    }
    pub fn session_key(&self) -> SessionKey {
        self.inner.read().unwrap().session_key()
    }

    pub fn session_id(&self) -> String {
        self.inner.read().unwrap().session_id()
    }

    pub fn encrypt(&self, plaintext: &[u8]) -> (MegolmMessage, String) {
        let mut inner = self.inner.write().unwrap();
        let ciphertext = inner.encrypt(plaintext);

        (ciphertext, inner.session_id())
    }
}