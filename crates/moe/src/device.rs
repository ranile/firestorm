use crate::{Account, DeviceId};
use std::time::SystemTime;
use vodozemac::olm::IdentityKeys;
use vodozemac::Curve25519PublicKey;

#[derive(Debug, Clone, PartialEq, Eq)]
enum TrustState {
    Untrusted,
}

#[derive(Clone)]
pub struct Device {
    trust: TrustState,
    pub keys: IdentityKeys,
    pub id: DeviceId,
}

impl Device {
    pub(crate) fn generate(account: Account) -> Device {
        Self {
            trust: TrustState::Untrusted,
            keys: account.identity_keys(),
            id: account.device_id,
        }
    }
}
