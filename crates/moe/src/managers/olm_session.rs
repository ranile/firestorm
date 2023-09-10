use std::sync::Arc;
use vodozemac::Curve25519PublicKey;
use vodozemac::olm::{InboundCreationResult, OlmMessage, PreKeyMessage, Session, SessionCreationError};
use wasm_bindgen::UnwrapThrowExt;
use crate::{Account, DeviceId, UserId};
use crate::api::Api;

#[derive(Clone)]
pub struct OlmSessionManager {
    account: Account,
    pub api: Arc<Api>,
}

impl OlmSessionManager {
    pub(crate) fn new(account: Account, api: Arc<Api>) -> Self {
        Self {
            account,
            api
        }
    }

    async fn create_outbound_session(&self, user_id: &UserId, device_id: &DeviceId, identity_key: Curve25519PublicKey) -> Session {
        // TODO: attempt to find an existing session
        let key = self.api.get_one_time_keys_for_user(user_id.clone(), device_id.clone()).await.expect_throw("failed to get OTK");
        self.account.create_outbound_session(
            identity_key,
            key,
        )
    }

    pub(crate) async fn encrypt(
        &self, user_id: &UserId, device_id: &DeviceId, identity_key: Curve25519PublicKey, plaintext: &[u8]
    ) -> (OlmMessage, String) {
        let mut outbound = self.create_outbound_session(user_id, device_id, identity_key).await;
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
