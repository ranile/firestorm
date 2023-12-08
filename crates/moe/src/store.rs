use crate::sessions::{InboundGroupSession, OutboundGroupSession, PickledOutboundSession};
use crate::{Account, DeviceId, PickledAccount, RoomId, UserId};
use serde::{Deserialize, Serialize};
use gloo::storage::{LocalStorage, Storage};
use wasm_bindgen::UnwrapThrowExt;

pub fn get_account(user_id: &UserId, device_id: &DeviceId) -> Option<super::Account> {
    let account: PickledAccount = LocalStorage::get(format!("{}:{}", user_id.0, device_id.0))
        .ok()?;
    Some(account.unpickle())
}

pub fn save_account(account: &Account) {
    let user_id = &account.user_id;
    let device_id = &account.device.id;

    LocalStorage::set(format!("{}:{}", user_id.0, device_id.0), account.pickled()).unwrap()
}

pub(crate) fn save_outbound_group_sessions(outbound: OutboundGroupSession) {
    let pickled = outbound.pickle();
    LocalStorage::set(&pickled.room_id.0, &pickled).unwrap()
}

pub(crate) fn get_outbound_group_sessions(room_id: &str) -> Option<OutboundGroupSession> {
    let pickled: PickledOutboundSession = LocalStorage::get(room_id).ok()?;
    Some(OutboundGroupSession::unpickle(pickled))
}

pub(crate) fn save_inbound_group_session(
    room_id: &RoomId,
    inbound: InboundGroupSession,
    session_id: String,
) {
    let pickle = inbound.pickle();
    LocalStorage::set(format!("{}:{}", room_id.0, session_id), &pickle).unwrap()
}

pub(crate) fn get_devices_for_user(user_id: &UserId) -> Vec<super::device::Device> {
    (0..1)
        .map(|i| {
            super::device::Device::generate(
                get_account(user_id, &DeviceId("505c1678-2e23-47b3-9b3d-63cbf16137a8device_id".to_string())).unwrap(),
            )
        })
        .collect()
}

pub(crate) fn get_inbound_group_session(
    room_id: &RoomId,
    session_id: &str,
) -> Option<InboundGroupSession> {
    let pickle: super::sessions::PickledInboundGroupSession = LocalStorage::get(format!("{}:{}", room_id.0, session_id)).ok()?;
    Some(InboundGroupSession::unpickle(pickle))
}

pub(crate) fn save_otk(
    user_id: &UserId,
    device_id: &DeviceId,
    key: &[super::Curve25519PublicKey],
) {
    LocalStorage::set(format!("{}:{}:otk", user_id.0, device_id.0), key)
        .expect_throw("failed to save otk");
}

pub(crate) fn use_otk(
    user_id: &UserId,
    device_id: &DeviceId,
) -> Option<super::Curve25519PublicKey> {
    let mut deser: Vec<super::Curve25519PublicKey> = LocalStorage::get(format!("{}:{}:otk", user_id.0, device_id.0))
        .ok()?;
    let otk = deser.pop()?;
    save_otk(user_id, device_id, &deser);
    Some(otk)
}