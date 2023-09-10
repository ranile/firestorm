use ducktor::FromJsValue;
use gloo::utils::errors::JsError;
use js_sys::{Function, Promise};
use vodozemac::{Curve25519PublicKey, Ed25519PublicKey};
use vodozemac::olm::IdentityKeys;
use wasm_bindgen::prelude::*;
use wasm_bindgen::{JsCast, UnwrapThrowExt};
use wasm_bindgen_futures::JsFuture;
use crate::device::{Device, TrustState};
use crate::{DeviceId, UserId};
use crate::managers::KeyRequest;

// type ResultingFuture<O> = impl std::future::Future<Output = Result<O, JsError>>;
// type AsyncCallback<O> = impl Fn(String) -> ResultingFuture<O>;

type Result<T, E = JsError> = std::result::Result<T, E>;

pub type GetDevicesForUserFnFuture = impl std::future::Future<Output = Result<Vec<Device>>>;
type GetDevicesForUser = impl Fn(String) -> GetDevicesForUserFnFuture;

pub type GetOtkForUserFnFuture = impl std::future::Future<Output = Result<String>>;
type GetOtkForUser = impl Fn(String, String) -> GetOtkForUserFnFuture;

async fn awaited_promise(res: Result<JsValue, JsValue>) -> Result<JsValue> {
    let res = res.map_err(|e| {
        JsError::try_from(e).expect_throw("not an error")
    })?;
    let res =
        JsFuture::from(res.dyn_into::<Promise>().expect_throw("expected a promise"))
            .await
            .map_err(|e| JsError::try_from(e).expect_throw("not an error"))?;

    Ok(res)
}

#[wasm_bindgen]
pub struct Api {
    get_devices_for_user: GetDevicesForUser,
    get_otk_for_user: GetOtkForUser,
}

#[wasm_bindgen]
impl Api {
    #[wasm_bindgen(constructor)]
    pub fn new(get_devices_for_user: Function, get_otk_for_user: Function) -> Self {
        let get_devices_for_user = move |v: String| {
            let res = get_devices_for_user
                .call1(&JsValue::NULL, &JsValue::from_str(&v));
            async move {
                let res = awaited_promise(res).await?;
                let res = js_sys::Array::from(&res);
                let res = res.iter().map(|v| {
                    #[derive(FromJsValue)]
                    struct UserDevice {
                        device_id: String,
                        curve25519: String,
                        ed25519: String,
                    }

                    let v: UserDevice = UserDevice::from(&v);
                    Device {
                        trust: TrustState::Untrusted,
                        keys: IdentityKeys {
                            curve25519: Curve25519PublicKey::from_base64(v.curve25519.as_str()).expect_throw("expected a valid base64 encoded curve25519 key"),
                            ed25519: Ed25519PublicKey::from_base64(v.ed25519.as_str()).expect_throw("expected a valid base64 encoded ed25519 key"),
                        },
                        id: DeviceId(v.device_id),
                    }
                }).collect();
                Ok(res)
            }
        };

        let get_otk_for_user = move |user_id: String, device_id: String| {
            let ret = get_otk_for_user.call2(&JsValue::NULL, &JsValue::from_str(&user_id), &JsValue::from_str(&device_id));
            async move {
                let ret = awaited_promise(ret).await?;
                let otk = ret.as_string().expect_throw("one time key is a string");
                Ok(otk)
            }
        };
        Self {
            get_devices_for_user: Box::new(get_devices_for_user),
            get_otk_for_user,
        }
    }
}

impl Api {
    pub async fn get_devices_for_user(&self, user_id: UserId) -> Result<Vec<Device>> {
        (self.get_devices_for_user)(user_id.0).await
    }

    pub async fn get_one_time_keys_for_user(&self, user_id: UserId, device_id: DeviceId) -> Result<Curve25519PublicKey> {
        (self.get_otk_for_user)(user_id.0, device_id.0).await.map(|v| {
            Curve25519PublicKey::from_base64(v.as_str()).expect_throw("expected a valid base64 encoded curve25519 key")
        })
    }

    pub async fn request_session_keys(&self, request: KeyRequest) {
        todo!("request session keys: {request:?}")
    }
}