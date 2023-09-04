use vodozemac::Curve25519PublicKey;
use vodozemac::olm::{InboundCreationResult, OlmMessage, PreKeyMessage, Session, SessionCreationError};
use crate::{Account, DeviceId, UserId};

#[derive(Clone)]
pub struct OlmSessionManager {
    account: Account,
}

impl OlmSessionManager {
    pub(crate) fn new(account: Account) -> Self {
        Self {
            account,
        }
    }

    fn create_outbound_session(&self, user_id: &UserId, device_id: &DeviceId, identity_key: Curve25519PublicKey) -> Session {
        // TODO: attempt to find an existing session
        self.account.create_outbound_session(
            identity_key,
            crate::store::use_otk(user_id, device_id).unwrap(),
        )
    }

    pub(crate) fn encrypt(
        &self, user_id: &UserId, device_id: &DeviceId, identity_key: Curve25519PublicKey, plaintext: &[u8]
    ) -> (OlmMessage, String) {
        let mut outbound = self.create_outbound_session(user_id, device_id, identity_key);
        let ciphertext = outbound.encrypt(plaintext);
        let session_id = outbound.session_id();
        (ciphertext, session_id)
    }

    pub fn decrypt(&self, key: Curve25519PublicKey, pre_key: &PreKeyMessage) -> Vec<u8> {
        let inbound = self.create_inbound_session(key, pre_key).unwrap();
        inbound.plaintext
    }

    fn create_inbound_session(&self, key: Curve25519PublicKey, pre_key: &PreKeyMessage) -> Result<InboundCreationResult, SessionCreationError> {
        self.account.create_inbound_session(key, pre_key)
    }
}
