use serde::{Deserialize, Serialize};
use vodozemac::megolm::MegolmMessage;

mod serde_megolm_message {
    use super::*;

    pub fn serialize<S>(value: &MegolmMessage, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        value.to_base64().serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<MegolmMessage, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let base64 = String::deserialize(deserializer)?;
        MegolmMessage::from_base64(&base64).map_err(serde::de::Error::custom)
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct EncryptedMessage {
    #[serde(flatten, with = "serde_megolm_message")]
    pub megolm: MegolmMessage,
    pub session_id: String,
}
