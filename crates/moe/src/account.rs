use crate::device::{Device, TrustState, PickledDevice};
use crate::sessions::{InboundGroupSession, OutboundGroupSession};
use crate::{DeviceId, RoomId, UserId};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, RwLock};
use vodozemac::olm::{Account as OlmAccount, IdentityKeys, InboundCreationResult, OneTimeKeyGenerationResult, PreKeyMessage, Session, SessionConfig, SessionCreationError};
use vodozemac::{Curve25519PublicKey};

#[derive(Clone)]
pub struct Account {
    olm: Arc<RwLock<OlmAccount>>,
    pub user_id: UserId,
    pub device: Device,
    // pub one_time_keys: Vec<Curve25519PublicKey>,
}

impl Account {
    pub fn new(user_id: UserId, device_id: DeviceId) -> Self {
        let olm = OlmAccount::new();
        let keys = olm.identity_keys();

        Self {
            olm: Arc::new(RwLock::new(olm)),
            user_id,
            device: Device {
                trust: TrustState::Untrusted,
                keys,
                id: device_id,
            },
        }
    }

    pub fn pickled(&self) -> PickledAccount {
        PickledAccount {
            user_id: self.user_id.clone(),
            device: self.device.pickle(),
            pickle: self.olm.read().unwrap().pickle(),
        }
    }

    pub fn identity_keys(&self) -> IdentityKeys {
        self.olm.read().unwrap().identity_keys()
    }
    pub fn generate_one_time_keys(&self, count: usize) -> OneTimeKeyGenerationResult {
        let mut olm = self.olm.write().unwrap();
        let result = olm.generate_one_time_keys(count);
        drop(olm);
        result
    }

    pub fn mark_keys_as_published(&self) {
        let mut olm = self.olm.write().unwrap();
        olm.mark_keys_as_published();
    }

    pub fn create_outbound_session(
        &self,
        identity_key: Curve25519PublicKey,
        one_time_key: Curve25519PublicKey,
    ) -> Session {
        let mut olm = self.olm.read().unwrap();
        olm.create_outbound_session(SessionConfig::version_2(), identity_key, one_time_key)
    }

    pub(crate) fn create_group_session_pair(
        &self,
        room_id: &RoomId,
    ) -> (OutboundGroupSession, InboundGroupSession) {
        let outbound = OutboundGroupSession::new(room_id.clone());
        let keys = self.olm.read().unwrap().identity_keys();

        let inbound = InboundGroupSession::new(keys, room_id, &outbound.session_key());

        ((outbound, inbound))
    }

    pub fn create_inbound_session(
        &self,
        their_identity_key: Curve25519PublicKey,
        pre_key_message: &PreKeyMessage,
    ) -> Result<InboundCreationResult, SessionCreationError> {
        let mut olm = self.olm.write().unwrap();
        let s = olm.create_inbound_session(their_identity_key, pre_key_message);
        drop(olm);
        s
    }
}

#[derive(Serialize, Deserialize)]
pub struct PickledAccount {
    pub user_id: UserId,
    pub device: PickledDevice,
    pub pickle: vodozemac::olm::AccountPickle,
    // pub one_time_keys: Vec<Curve25519PublicKey>,
}

impl PickledAccount {
    pub fn unpickle(self) -> Account {
        let account = vodozemac::olm::Account::from_pickle(self.pickle);
        Account {
            olm: Arc::new(RwLock::new(account)),
            user_id: self.user_id,
            device: self.device.unpickle(),
        }
    }
}
