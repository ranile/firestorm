use std::collections::HashMap;
use js_sys::{Map, Object};
use vodozemac::{Curve25519PublicKey, KeyError, olm};
use wasm_bindgen::{JsError, UnwrapThrowExt};
use wasm_bindgen::prelude::*;
use ducktor::FromJsValue;
use vodozemac::olm::{OlmMessage, PreKeyMessage, SessionConfig};

#[derive(FromJsValue)]
struct UserIdentityKeys {
    curve25519: String,
    ed25519: String,
}

#[wasm_bindgen]
pub struct UserAccount {
    inner: olm::Account,
}

#[wasm_bindgen]
impl UserAccount {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: olm::Account::new()
        }
    }

    #[wasm_bindgen(js_name = "identityKeys")]
    pub fn identity_keys(&self) -> JsValue {
        let keys = self.inner.identity_keys();
        let keys = UserIdentityKeys {
            curve25519: keys.curve25519.to_base64(),
            ed25519: keys.ed25519.to_base64(),
        };
        keys.into()
    }

    #[wasm_bindgen(js_name = "generateOneTimeKeys")]
    pub fn generate_one_time_keys(&mut self, count: usize) -> Map {
        self.inner.generate_one_time_keys(count);
        let map = Map::new();
        for (key, value) in self.inner.one_time_keys() {
            map.set(&key.to_base64().into(), &value.to_base64().into());
        }
        map
    }

    #[wasm_bindgen(js_name = "markKeysAsPublished")]
    pub fn mark_keys_as_published(&mut self) {
        self.inner.mark_keys_as_published();
    }

    pub fn to_pickle(&self, key: &[u8]) -> String {
        self.inner.pickle().encrypt(key.try_into().expect_throw("key should be 32 bytes"))
    }

    pub fn from_pickle(ciphertext: &str, key: &[u8]) -> Result<UserAccount, JsError> {
        let key = key.try_into().expect_throw("key should be 32 bytes");
        let pickle = olm::AccountPickle::from_encrypted(ciphertext, key).map_err(JsError::from)?;
        let account = olm::Account::from_pickle(pickle);
        Ok(Self { inner: account })
    }
}

pub struct RoomMember {
    user_id: String,
    identity_key: String,
    one_time_key: String,

}

pub fn encrypt_room_session_key(user_account: &UserAccount, session_key: String, room_members: Vec<RoomMember>) -> Result<HashMap<String, PreKeyMessage>, KeyError> {
    let mut map = HashMap::new();
    for member in room_members {
        let mut outbound = user_account.inner.create_outbound_session(
            SessionConfig::version_2(),
            Curve25519PublicKey::from_base64(&member.identity_key)?,
            Curve25519PublicKey::from_base64(&member.one_time_key)?,
        );
        let ciphertext = outbound.encrypt(session_key.as_bytes());
        match ciphertext {
            OlmMessage::Normal(_) => unreachable!("first message should be a PreKeyMessage"),
            OlmMessage::PreKey(pkm) => { map.insert(member.user_id, pkm); }
        }
    }


    Ok(map)
}

pub fn decrypt_room_session_key(user_account: &mut UserAccount, encryptor_identity_key: String, message: PreKeyMessage) -> Result<Vec<u8>, JsValue> {
    let mut inbound = user_account.inner.create_inbound_session(
        Curve25519PublicKey::from_base64(&encryptor_identity_key).unwrap(),
        &message,
    ).unwrap();
    Ok(inbound.plaintext)
}

#[cfg(test)]
mod test {
    wasm_bindgen_test::wasm_bindgen_test_configure!(run_in_browser);
    use wasm_bindgen_test::wasm_bindgen_test as test;
    use super::*;

    /*
    Alice and Bob are two users
    Alice creates a room that she wants Bob join
    Alice adds Bob to the room
    Alice sends the key to Bob
    Bob gets the invite and key
    Bob decrypts the keys
    Bob can now decrypt the messages
    */
    #[test]
    fn roundtrip() {
        let alice = UserAccount::new();
        let alice_identity_keys = alice.identity_keys();
        let alice_identity_keys = UserIdentityKeys::from(&alice_identity_keys);

        let mut bob = UserAccount::new();
        let bob_identity_keys = bob.identity_keys();
        let bob_identity_keys = UserIdentityKeys::from(&bob_identity_keys);
        let bob_one_time_keys = bob.generate_one_time_keys(1);

        let member = RoomMember {
            user_id: "boob".to_string(),
            identity_key: bob_identity_keys.curve25519,
            one_time_key: bob_one_time_keys.values().next().unwrap().value().as_string().unwrap(),
        };

        let keys = encrypt_room_session_key(
            &alice,
            "secret".to_string(),
            vec![member])
            .unwrap();

        let key = keys.values().next().unwrap();
        let key = decrypt_room_session_key(&mut bob, alice_identity_keys.curve25519, key.clone()).unwrap();

        let key = String::from_utf8(key).unwrap();
        assert_eq!(key, "secret");
    }
}