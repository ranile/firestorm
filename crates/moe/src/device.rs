use crate::{Account, DeviceId};
use std::time::SystemTime;
use serde::{Deserialize, Serialize};
use vodozemac::olm::IdentityKeys;
use vodozemac::Curve25519PublicKey;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrustState {
    Untrusted,
}

#[derive(Clone, Debug)]
pub struct Device {
    pub trust: TrustState,
    pub keys: IdentityKeys,
    pub id: DeviceId,
}

impl Device {
    pub(crate) fn generate(account: Account) -> Device {
        Self {
            trust: TrustState::Untrusted,
            keys: account.identity_keys(),
            id: account.device.id,
        }
    }

    pub(crate) fn pickle(&self) -> PickledDevice {
        PickledDevice {
            trust: self.trust.clone(),
            keys: self.keys,
            id: self.id.clone(),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct PickledDevice {
    pub trust: TrustState,
    pub keys: IdentityKeys,
    pub id: DeviceId,
}

impl PickledDevice {
    pub fn unpickle(self) -> Device {
        Device {
            trust: self.trust,
            keys: self.keys,
            id: self.id,
        }
    }
}