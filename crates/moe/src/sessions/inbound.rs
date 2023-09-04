use std::sync::{Arc, RwLock};
use serde::{Deserialize, Serialize};
use vodozemac::{Curve25519PublicKey, Ed25519PublicKey};
use vodozemac::megolm::{DecryptedMessage, DecryptionError, InboundGroupSession as MegOlmInboundGroupSession, MegolmMessage, SessionConfig, SessionKey};
use vodozemac::olm::IdentityKeys;
use crate::RoomId;

pub struct InboundGroupSession {
    inner: Arc<RwLock<MegOlmInboundGroupSession>>,
    room_id: RoomId,
    signing_key: Ed25519PublicKey,
    sender_key: Curve25519PublicKey
}

impl InboundGroupSession {
    pub(crate) fn new(keys: IdentityKeys, room_id: &RoomId, session_key: &SessionKey) -> Self {
        let inner = MegOlmInboundGroupSession::new(session_key, SessionConfig::version_2());
        Self {
            inner: Arc::new(RwLock::new(inner)),
            room_id: room_id.clone(),
            signing_key: keys.ed25519,
            sender_key: keys.curve25519,
        }
    }

    pub fn decrypt(&self, ciphertext: &MegolmMessage) -> Result<DecryptedMessage, DecryptionError> {
        let mut inner = self.inner.write().unwrap();
        inner.decrypt(ciphertext)
    }

    pub fn pickle(&self) -> PickledInboundGroupSession {
        let inner = self.inner.read().unwrap();
        PickledInboundGroupSession {
            room_id: self.room_id.clone(),
            signing_key: self.signing_key.clone(),
            sender_key: self.sender_key.clone(),
            pickle: inner.pickle(),
        }
    }

    pub fn unpickle(pickle: PickledInboundGroupSession) -> Self {
        let inner = MegOlmInboundGroupSession::from_pickle(pickle.pickle);
        Self {
            inner: Arc::new(RwLock::new(inner)),
            room_id: pickle.room_id,
            signing_key: pickle.signing_key,
            sender_key: pickle.sender_key,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct PickledInboundGroupSession {
    room_id: RoomId,
    signing_key: Ed25519PublicKey,
    sender_key: Curve25519PublicKey,
    pickle: vodozemac::megolm::InboundGroupSessionPickle,
}