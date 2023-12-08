#![feature(type_alias_impl_trait)]
#![allow(warnings)]
mod account;
mod device;
mod message;

use std::sync::Arc;
use crate::managers::{KeyRequest, MegOlmGroupSessionManager, OlmSessionManager, SendableDeviceKey};
use crate::message::EncryptedMessage;
pub use account::*;
use flurry::HashMap;
use serde::{Deserialize, Serialize};
use vodozemac::megolm::DecryptionError;
use vodozemac::olm::{IdentityKeys, OlmMessage, SessionCreationError};
use vodozemac::Curve25519PublicKey;

use wasm_bindgen::prelude::*;
use crate::api::Api;

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

pub mod store;
mod wasm;
pub mod api;

#[wasm_bindgen]
pub struct Machine {
    account: Account,
    olm_session_manager: OlmSessionManager,
    meg_olm_group_session_manager: MegOlmGroupSessionManager,
    api: Arc<Api>,
}

impl Machine {
    pub fn new(user_id: UserId, device_id: DeviceId, api: Api) -> Self {
        let api = Arc::new(api);
        let account = store::get_account(&user_id, &device_id)
            .unwrap_or_else(|| {
                println!("creating account");
                let acc = Account::new(user_id, device_id);

                store::save_account(&acc);
                acc
            });
        let olm_session_manager = OlmSessionManager::new(account.clone(), Arc::clone(&api));
        let meg_olm_group_session_manager =
            MegOlmGroupSessionManager::new(account.clone(), olm_session_manager.clone(), Arc::clone(&api));

        Self {
            account,
            olm_session_manager,
            meg_olm_group_session_manager,
            api
        }
    }
    pub fn identity_keys(&self) -> IdentityKeys {
        self.account.identity_keys()
    }

    pub async fn share_room_key(
        &self,
        room_id: &RoomId,
        users: impl Iterator<Item = UserId>,
    ) -> HashMap<UserId, HashMap<DeviceId, SendableDeviceKey>> {
        self.meg_olm_group_session_manager
            .share_room_key(room_id, users).await
    }

    pub fn accept_room_keys(
        &self,
        sender_keys: IdentityKeys,
        room_id: &RoomId,
        keys: &HashMap<DeviceId, SendableDeviceKey>,
    ) -> Result<(), SessionCreationError> {
        let pin = keys.pin();
        let Some(device_key) = pin.remove(&self.account.device.id) else {
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

    pub async fn encrypt_message(&self, room_id: &RoomId, plaintext: &[u8]) -> Option<EncryptedMessage> {
        self.meg_olm_group_session_manager.encrypt(room_id, plaintext).await
    }

    pub fn decrypt_message(
        &self,
        room_id: &RoomId,
        message: EncryptedMessage,
    ) -> Result<Vec<u8>, managers::DecryptError> {
        self.meg_olm_group_session_manager
            .decrypt(room_id, &message.session_id, &message.megolm)
    }

    pub fn answer_key_requests(&self) -> SendableDeviceKey {
        todo!()
    }
}

#[wasm_bindgen]
pub fn init() {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
}