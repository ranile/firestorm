#![allow(dead_code, unused)]

use std::collections::BTreeMap;
use vodozemac::megolm::{GroupSession, InboundGroupSession, MegolmMessage, SessionConfig, SessionKey};
use vodozemac::olm::IdentityKeys;

fn random_string(length: usize) -> String {
    use rand::Rng as _;
    rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .map(char::from)
        .take(length)
        .collect::<String>()
}


fn main() {
/*    let mut map: BTreeMap<SenderId, IdentityKeys> = Default::default();
    let account1 = Account::login();
    map.insert(account1.user_id.to_string(), account1.inner.identity_keys());

    let account2 = Account::login();
    map.insert(account2.user_id.to_string(), account2.inner.identity_keys());

    let account3 = Account::login();
    map.insert(account3.user_id.to_string(), account3.inner.identity_keys());


    // account2 sends message
    let mut outbound_sess2 = account2.create_outbound_session();
    let m2 = outbound_sess2.encrypt("out2");
    // let m1 = in2.decrypt(&m2).unwrap();

    let sess_key  = Room::new().session_key;
    let mut in_sess = InboundGroupSession::new(&sess_key, SessionConfig::version_1());

    in_sess.decrypt(&m2).unwrap();*/
    // let mut outbound = vodozemac::megolm::GroupSession::new(vodozemac::megolm::SessionConfig::version_1());
    // let session_key = outbound.session_key(); // send it to server
    //
    //
    // // cache sessions per user (sender); if none found, request session key from server
    // let mut inbound = InboundGroupSession::new(&session_key, SessionConfig::version_1());
    // let m = outbound.encrypt("test");
    // let d = inbound.decrypt(&m).unwrap();
    // println!("{}", String::from_utf8(d.plaintext).unwrap())
    let mut outbound = vodozemac::megolm::GroupSession::new(vodozemac::megolm::SessionConfig::version_1());
    let session_key = outbound.session_key();

    // vodozemac::megolm::GroupSession::pickle()
    let mut inbound1 = InboundGroupSession::new(&session_key, SessionConfig::version_1());
    let mut inbound2= InboundGroupSession::new(&session_key, SessionConfig::version_1());
    // private_messaging();
}

struct Room {
    members: Vec<String>, // UserId
    session_key: SessionKey
}


fn private_messaging() {
    let mut my_account = vodozemac::olm::Account::new();

    my_account.generate_one_time_keys(10);
    let mut their_account = vodozemac::olm::Account::new();
    their_account.generate_one_time_keys(10);

    let mut sess = {
        // obtain one from server
        let (_key_id, one_time_pubkey) = their_account.one_time_keys().into_iter().next().unwrap();

        my_account.create_outbound_session(vodozemac::olm::SessionConfig::version_2(), their_account.curve25519_key(), one_time_pubkey)
    };

    let pre_key_message = sess.encrypt([]);

    let pre_key_message = match pre_key_message {
        vodozemac::olm::OlmMessage::Normal(_) => unreachable!("this is a pre key message"),
        vodozemac::olm::OlmMessage::PreKey(m) => m,
    };

    // let mut their_sess = their_account.create_inbound_session(my_account.curve25519_key(), &pre_key_message).unwrap();
    let (_key_id, one_time_pubkey) = my_account.one_time_keys().into_iter().next().unwrap();
    let mut their_sess = their_account.create_outbound_session(vodozemac::olm::SessionConfig::version_2(), my_account.curve25519_key(), one_time_pubkey);
    let ciphertext = sess.encrypt("my text");

    let plain_text = their_sess.decrypt(&ciphertext).unwrap();
    let plain_text = String::from_utf8(plain_text).unwrap();
    println!("plain_text = {plain_text:?}");

}
/*

*/
