use std::sync::Arc;
use flurry::HashMap;
use serde::{Deserialize, Serialize};
use vodozemac::Curve25519PublicKey;
use vodozemac::megolm::{MegolmMessage, SessionKey};
use vodozemac::olm::{IdentityKeys, OlmMessage, PreKeyMessage,};
use wasm_bindgen::UnwrapThrowExt;
use crate::{Account, DeviceId, RoomId, UserId};
use crate::api::Api;
use crate::device::Device;
use crate::managers::OlmSessionManager;
use crate::message::EncryptedMessage;
use crate::sessions::{InboundGroupSession, OutboundGroupSession};

pub struct MegOlmGroupSessionManager {
    account: Account,
    sessions: HashMap<RoomId, OutboundGroupSession>,
    pub olm_session_manager: OlmSessionManager,
    pub api: Arc<Api>,
}

impl MegOlmGroupSessionManager {
    pub fn new(account: Account, olm_session_manager: OlmSessionManager, api: Arc<Api>) -> Self {
        Self {
            account,
            sessions: HashMap::new(), // build from store
            olm_session_manager,
            api,
        }
    }

    pub fn create_outbound_group_session(
        &self,
        room_id: &RoomId,
    ) -> (OutboundGroupSession, InboundGroupSession) {
        let (outbound, inbound) = self
            .account
            .create_group_session_pair(room_id);
        let pin = self.sessions.pin();
        pin.insert(room_id.clone(), outbound.clone());
        crate::store::save_outbound_group_sessions(outbound.clone());
        drop(pin);
        (outbound, inbound)
    }

    pub(crate) async fn share_room_key(&self, room_id: &RoomId, users: impl Iterator<Item=UserId>) -> HashMap<UserId, HashMap<DeviceId, SendableDeviceKey>> {
        let (outbound, inbound) = self.get_or_create_outbound_session(room_id);

        let session_key = outbound.session_key();
        let session_key = session_key.to_bytes();
        if let Some(inbound) = inbound {
            crate::store::save_inbound_group_session(room_id, inbound, outbound.session_id());
            crate::store::save_outbound_group_sessions(outbound);
        }

        // TODO: rotation
        // TODO: filter devices that already have the session

        let map = HashMap::new();
        for user in users {
            let devices_keys = HashMap::new();
            let devices: Vec<Device> = self.get_devices_for_user(&user).await;
            for mut device in devices {
                let (ciphertext, session_id) = self.olm_session_manager.encrypt(
                    &user,
                    &device.id,
                    device.keys.curve25519,
                    &session_key
                ).await;

                let device_key = SendableDeviceKey {
                    key: ciphertext,
                    session_id,
                };

                let pin = devices_keys.pin();
                pin.insert(device.id, device_key);
            }
            let pin = map.pin();
            pin.insert(user.clone(), devices_keys);
        }
        map
    }

    fn get_or_create_outbound_session(&self, room_id: &RoomId) -> (OutboundGroupSession, Option<InboundGroupSession>) {
        let pin = self.sessions.pin();
        match pin.get(room_id) {
            None => {
                let (outbound, inbound) = self.create_outbound_group_session(room_id);
                (outbound, Some(inbound))
            }
            Some(outbound) => {
                (outbound.clone(), None)
            }
        }
    }

    pub fn create_inbound_session(
        &self,
        room_id: &RoomId,
        keys: IdentityKeys,
        session_id: &str,
        pre_key: &PreKeyMessage,
    ) {
        // dbg!("creating inbound session", &room_id, &self.account.device.id);
        let session_key = self.olm_session_manager.decrypt(
            keys.curve25519,
            pre_key
        );
        let session_key  = SessionKey::from_bytes(&session_key).unwrap();
        let inbound = InboundGroupSession::new(keys, room_id, &session_key);
        crate::store::save_inbound_group_session(room_id, inbound, session_id.to_string());
    }

    pub async fn encrypt(
        &self,
        room_id: &RoomId,
        content: &[u8],
    ) -> Option<EncryptedMessage> {
        gloo::console::log!("encrypting message for");
        let outbound = match crate::store::get_outbound_group_sessions(&room_id.0) {
            None => {
                self.request_session_keys(room_id).await;
                return None
            }
            Some(outbound) => outbound
        };

        let encrypted = outbound.encrypt(content);

        Some(EncryptedMessage {
            megolm: encrypted.0,
            session_id: encrypted.1,
        })
    }

    pub fn decrypt(&self, room_id: &RoomId, session_id: &str, message: &MegolmMessage) -> Result<Vec<u8>, DecryptError> {
        let inbound = crate::store::get_inbound_group_session(&room_id, session_id);
        match inbound {
            None => {
                Err(DecryptError::NoKeys)
            }
            Some(inbound) => Ok(inbound.decrypt(message).map_err(DecryptError::DecryptionError)?.plaintext)
        }
    }
    async fn request_session_keys(&self, room_id: &RoomId) {
        // todo!("API request for {}", room_id.0)'
        let request = KeyRequest {
            requested_from: UserId("alice".to_string()), // TODO: room_members
            requester_id: self.account.user_id.clone(),
            requester_device_id: self.account.device.id.clone(),
            requester_identity_key: self.account.identity_keys().curve25519,
            room_id: room_id.clone(),
        };
        self.api.request_session_keys(request).await;
    }

    pub async fn answer_key_request(&self, request: KeyRequest) -> SendableDeviceKey {
        eprintln!("answering key request {request:?}");
        let pin = self.sessions.pin();
        let outbound = pin.get(&request.room_id).expect("no outbound session");
        let session_key = outbound.session_key();
        let session_key = session_key.to_bytes();
        let (ciphertext, session_id) = self.olm_session_manager.encrypt(
            &request.requester_id,
            &request.requester_device_id,
            request.requester_identity_key,
            &session_key
        ).await;

        SendableDeviceKey {
            key: ciphertext,
            session_id,
        }
    }
    async fn get_devices_for_user(&self, user_id: &UserId) -> Vec<Device> {
        self.api.get_devices_for_user(user_id.clone()).await.expect_throw("failed to get devices")
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SendableDeviceKey {
    pub key: OlmMessage,
    pub session_id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct KeyRequest {
    pub requested_from: UserId,
    pub requester_id: UserId,
    pub requester_device_id: DeviceId,
    pub requester_identity_key: Curve25519PublicKey,
    pub room_id: RoomId,
}

pub enum DecryptError {
    NoKeys,
    DecryptionError(vodozemac::megolm::DecryptionError),
}