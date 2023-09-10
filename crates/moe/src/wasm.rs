use wasm_bindgen::prelude::*;
use crate::{DeviceId, Machine, RoomId, UserId};
use ducktor::FromJsValue;
use gloo::utils::format::JsValueSerdeExt;
use js_sys::{Array, JsString};
use wasm_bindgen::UnwrapThrowExt;
use crate::api::Api;
use crate::message::EncryptedMessage;

#[derive(Debug, Clone)]
#[wasm_bindgen]
pub struct IdentityKeys {
    curve25519: String,
    ed25519: String,
}
#[wasm_bindgen]

impl IdentityKeys {
    #[wasm_bindgen(getter)]
    pub fn curve25519(&self) -> JsString {
        JsValue::from_str(&self.curve25519).unchecked_into()
    }
    #[wasm_bindgen(getter)]
    pub fn ed25519(&self) -> JsString {
        JsValue::from_str(&self.ed25519).unchecked_into()
    }
}

impl From<vodozemac::olm::IdentityKeys> for IdentityKeys {
    fn from(keys: vodozemac::olm::IdentityKeys) -> Self {
        IdentityKeys {
            curve25519: keys.curve25519.to_base64(),
            ed25519: keys.ed25519.to_base64(),
        }
    }
}

impl Into<vodozemac::olm::IdentityKeys> for IdentityKeys {
    fn into(self) -> vodozemac::olm::IdentityKeys {
        vodozemac::olm::IdentityKeys {
            ed25519: vodozemac::Ed25519PublicKey::from_base64(&self.ed25519).unwrap(),
            curve25519: vodozemac::Curve25519PublicKey::from_base64(&self.curve25519).unwrap()
        }
    }
}

#[wasm_bindgen]
impl Machine {
    #[wasm_bindgen(constructor)]
    pub fn new_js(user_id: String, device_id: String, api: Api) -> Self {
        console_error_panic_hook::set_once();
        Self::new(UserId(user_id), DeviceId(device_id), api)
    }

    #[wasm_bindgen(getter, js_name = "identityKeys")]
    pub fn identity_keys_js(&self) -> IdentityKeys {
        self.identity_keys().into()
    }
    #[wasm_bindgen(js_name = "shareRoomKey")]
    pub async fn share_room_key_js(
        &self,
        room_id: &str,
        // Vec<String> when https://github.com/rustwasm/wasm-bindgen/pull/3554 is released
        users: Array,
    ) -> JsValue {
        let users = users.to_vec().into_iter()
            .map(|js_value| UserId(js_value.as_string().expect_throw("ids must be strings")));

        let keys = self.share_room_key(&RoomId(room_id.to_string()), users).await;
        JsValue::from_serde(&keys).unwrap_throw()
    }

    #[wasm_bindgen(js_name = "encrypt")]
    pub fn encrypt_js(&self, room_id: &str, plaintext: &[u8]) -> Option<EncryptedMessage> {
        self.encrypt_message(&RoomId(room_id.to_string()), plaintext)
    }


    #[wasm_bindgen(js_name = "decrypt")]
    pub fn decrypt_js(&self, room_id: &str, message: EncryptedMessage) -> Result<Vec<u8>, JsError> {
        self.decrypt_message(&RoomId(room_id.to_string()), message).map_err(JsError::from)
    }

    #[wasm_bindgen(js_name = getOneTimeKeys)]
    pub fn get_one_time_keys(&self, count: usize) -> Vec<js_sys::JsString> {
        let result = self.account.generate_one_time_keys(count);
        result.created.into_iter().map(|it| JsValue::from(it.to_base64()).unchecked_into()).collect()
    }
    #[wasm_bindgen(js_name = markOneTimeKeysAsPublished)]
    pub fn mark_one_time_keys_as_published(&self) {
        self.account.mark_keys_as_published();
    }

    #[wasm_bindgen(js_name = "doWork")]
    pub async fn do_work(&self) {
        let fut = match self.api.get_devices_for_user(UserId("079e586f-e715-4d5e-8e32-3381075cbe25".to_string())).await {
            Ok(v) =>v,
            Err(e) => {
                gloo::console::error!(format!("error: {:?}", e));
                return;
            }
        };
        gloo::console::log!(format!("got devices: {:?}", fut));
    }


}