use crate::device::Device;
use crate::sessions::{InboundGroupSession, OutboundGroupSession};
use crate::{DeviceId, RoomId, UserId};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use vodozemac::olm::{
    Account as OlmAccount, IdentityKeys, InboundCreationResult, PreKeyMessage, Session,
    SessionConfig, SessionCreationError,
};
use vodozemac::{Curve25519PublicKey, KeyId};

#[derive(Clone)]
pub struct Account {
    olm: Arc<RwLock<OlmAccount>>,
    pub user_id: UserId,
    pub device_id: DeviceId,
    // pub one_time_keys: Vec<Curve25519PublicKey>,
}

impl Account {
    pub fn new(user_id: UserId, device_id: DeviceId) -> Self {
        let mut olm = OlmAccount::new();

        let keys = olm.generate_one_time_keys(10);
        crate::store::save_otk(&user_id, &device_id, &keys.created);
        olm.mark_keys_as_published();
        Self {
            olm: Arc::new(RwLock::new(olm)),
            user_id,
            device_id,
            // one_time_keys: keys.created,
        }
    }

    pub fn pickled(&self) -> PickledAccount {
        PickledAccount {
            user_id: self.user_id.clone(),
            device_id: self.device_id.clone(),
            pickle: self.olm.read().unwrap().pickle(),
            // one_time_keys: self.one_time_keys.clone(),
        }
    }

    pub fn identity_keys(&self) -> IdentityKeys {
        self.olm.read().unwrap().identity_keys()
    }
    // pub fn one_time_keys(&mut self) -> &mut Vec<Curve25519PublicKey> {
    //     &mut self.one_time_keys
    // }
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
    pub device_id: DeviceId,
    pub pickle: vodozemac::olm::AccountPickle,
    // pub one_time_keys: Vec<Curve25519PublicKey>,
}

impl PickledAccount {
    pub fn unpickle(self) -> Account {
        let account = vodozemac::olm::Account::from_pickle(self.pickle);
        Account {
            olm: Arc::new(RwLock::new(account)),
            user_id: self.user_id,
            device_id: self.device_id,
            // one_time_keys: self.one_time_keys,
        }
    }
}
