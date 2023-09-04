#![allow(warnings)]
mod account;
mod device;
mod message;

use crate::managers::{KeyRequest, MegOlmGroupSessionManager, OlmSessionManager, SendableDeviceKey};
use crate::message::EncryptedMessage;
pub use account::*;
use flurry::HashMap;
use serde::{Deserialize, Serialize};
use vodozemac::megolm::DecryptionError;
use vodozemac::olm::{Account as OlmAccount, IdentityKeys, OlmMessage, SessionCreationError};
use vodozemac::Curve25519PublicKey;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
pub struct UserId(pub String);

#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
pub struct RoomId(pub String);

#[derive(Debug, Clone, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
pub struct DeviceId(pub String);

macro_rules! module {
    ($vis:vis $module:ident($($sub:ident),+)) => {
        $vis mod $module {
            $(
                mod $sub;
                pub use $sub::*;
            )+
        }
    };
}

module!(managers(group_session, olm_session));
module!(pub(crate) sessions(outbound, inbound));

pub mod store {
    use crate::sessions::{InboundGroupSession, OutboundGroupSession};
    use crate::{Account, DeviceId, PickledAccount, RoomId, UserId};
    use serde::{Deserialize, Serialize};
    use sled::Db;
    use std::cell::OnceCell;
    use std::sync::OnceLock;

    static SLED: OnceLock<Db> = OnceLock::new();

    pub fn init() {
        SLED.set(sled::open("./_sled").expect("failed to open sled"))
            .unwrap();
    }

    pub fn sled() -> &'static Db {
        SLED.get().expect("sled not initialized")
    }

    pub fn get_account(user_id: &UserId, device_id: &DeviceId) -> Option<super::Account> {
        let account = sled()
            .get(format!("{}:{}", user_id.0, device_id.0))
            .expect("failed to get account");
        println!("account {}", account.is_some());
        let account: PickledAccount = bincode::deserialize(&account?).ok()?;
        Some(account.unpickle())
    }

    pub fn save_account(account: &Account) {
        let user_id = &account.user_id;
        let device_id = &account.device_id;

        let encoded: Vec<u8> = bincode::serialize(&account.pickled()).unwrap();

        let saved = sled()
            .insert(format!("{}:{}", user_id.0, device_id.0), encoded)
            .expect("failed to save account");
        sled().flush().unwrap();
        // assert!(saved.is_none());
    }

    pub(crate) fn save_outbound_group_sessions(p0: OutboundGroupSession) {}

    pub(crate) fn save_inbound_group_session(
        room_id: &RoomId,
        inbound: InboundGroupSession,
        session_id: String,
    ) {
        let pickle = inbound.pickle();
        let encoded: Vec<u8> = bincode::serialize(&pickle).unwrap();
        let saved = sled()
            .insert(format!("{}:{}", room_id.0, session_id), encoded)
            .expect("failed to save account");
        sled().flush().unwrap();
        assert!(saved.is_none());
    }

    pub(crate) fn get_devices_for_user(user_id: &UserId) -> Vec<super::device::Device> {
        (0..1)
            .map(|i| {
                super::device::Device::generate(
                    get_account(user_id, &DeviceId(i.to_string())).unwrap(),
                )
            })
            .collect()
    }

    pub(crate) fn get_inbound_group_session(
        room_id: &RoomId,
        session_id: &str,
    ) -> InboundGroupSession {
        let saved = sled()
            .get(format!("{}:{}", room_id.0, session_id))
            .expect("failed to get inbound group session")
            .expect("inbound group session not found");
        let pickle: super::sessions::PickledInboundGroupSession =
            bincode::deserialize(&saved).unwrap();
        InboundGroupSession::unpickle(pickle)
    }

    pub(crate) fn save_otk(
        user_id: &UserId,
        device_id: &DeviceId,
        key: &[super::Curve25519PublicKey],
    ) {
        let serialized = bincode::serialize(key).unwrap();
        sled()
            .insert(format!("{}:{}:otk", user_id.0, device_id.0), serialized)
            .expect("failed to save otk");
        sled().flush().unwrap();
    }

    pub(crate) fn use_otk(
        user_id: &UserId,
        device_id: &DeviceId,
    ) -> Option<super::Curve25519PublicKey> {
        let saved = sled()
            .get(format!("{}:{}:otk", user_id.0, device_id.0))
            .expect("failed to get otk")?;
        let mut deser: Vec<super::Curve25519PublicKey> = bincode::deserialize(&saved).unwrap();
        let otk = deser.pop()?;
        save_otk(user_id, device_id, &deser);
        Some(otk)
    }
}

pub struct Machine {
    account: Account,
    olm_session_manager: OlmSessionManager,
    meg_olm_group_session_manager: MegOlmGroupSessionManager,
}

impl Machine {
    pub fn new(user_id: UserId, device_id: DeviceId) -> Self {
        let account = store::get_account(&user_id, &device_id)
            .unwrap_or_else(|| Self::create_account(user_id, device_id));
        let olm_session_manager = OlmSessionManager::new(account.clone());
        let meg_olm_group_session_manager =
            MegOlmGroupSessionManager::new(account.clone(), olm_session_manager.clone());

        Self {
            account,
            olm_session_manager,
            meg_olm_group_session_manager,
        }
    }

    fn create_account(user_id: UserId, device_id: DeviceId) -> Account {
        println!("creating account");
        let acc = Account::new(user_id, device_id);

        store::save_account(&acc);
        acc
    }

    pub fn identity_keys(&self) -> IdentityKeys {
        self.account.identity_keys()
    }

    pub fn share_room_key<'a>(
        &self,
        room_id: &RoomId,
        users: impl Iterator<Item = &'a UserId>,
    ) -> HashMap<UserId, HashMap<DeviceId, SendableDeviceKey>> {
        self.meg_olm_group_session_manager
            .share_room_key(room_id, users)
    }

    pub fn accept_room_keys(
        &self,
        sender_keys: IdentityKeys,
        room_id: &RoomId,
        keys: &HashMap<DeviceId, SendableDeviceKey>,
    ) -> Result<(), SessionCreationError> {
        let pin = keys.pin();
        let Some(device_key) = pin.remove(&self.account.device_id) else {
            todo!("our keys don't contain a key for this device")
        };
        let OlmMessage::PreKey(ref pre_key) = device_key.key else {
            unreachable!("olm sessions are disposable")
        };

        self.meg_olm_group_session_manager.create_inbound_session(
            room_id,
            sender_keys,
            &device_key.session_id,
            &pre_key,
        );

        Ok(())
    }

    pub fn encrypt_message(&self, room_id: &RoomId, plaintext: &[u8]) -> Option<EncryptedMessage> {
        self.meg_olm_group_session_manager
            .encrypt(room_id, plaintext)
    }

    pub fn decrypt_message(
        &self,
        room_id: &RoomId,
        message: EncryptedMessage,
    ) -> Result<Vec<u8>, DecryptionError> {
        self.meg_olm_group_session_manager
            .decrypt(room_id, &message.session_id, &message.megolm)
    }

    pub fn answer_key_requests(&self) -> SendableDeviceKey {
        let db = crate::store::sled();
        let request = db.get("request_session_keys").unwrap().unwrap();
        let req: KeyRequest = bincode::deserialize(&request).unwrap();
        self.meg_olm_group_session_manager.answer_key_request(req)
    }
}
