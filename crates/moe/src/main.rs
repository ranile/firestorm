#![allow(warnings)]
use moe::*;

fn main() {
    let alice = UserId("alice".to_string());
    let bob = UserId("bob".to_string());
    store::init();
    let alice_machine = Machine::new(alice.clone(), DeviceId("fuck".to_string()));
    let bob_machine = Machine::new(bob.clone(), DeviceId("0".to_string()));

    let room = RoomId("booba".to_string());
    let keys = alice_machine.share_room_key(&room, vec![bob.clone()].iter());
    let encrypted = alice_machine.encrypt_message(&room, b"i love tits").unwrap();

    let bob_keys = keys.pin();
    let bob_keys = bob_keys.get(&bob).unwrap();
    let _ = bob_machine
        .accept_room_keys(alice_machine.identity_keys(), &room, bob_keys)
        .unwrap();
    let dec = bob_machine
        .decrypt_message(&room, encrypted.clone())
        .unwrap();

    let txt = String::from_utf8(dec).unwrap();
    println!("bob: {txt}!");

    let dec_alice = alice_machine.decrypt_message(&room, encrypted).unwrap();
    let txt_alice = String::from_utf8(dec_alice).unwrap();
    println!("alice: {txt_alice}!");

    let bob_enc = bob_machine.encrypt_message(&room, b"i too love titties");
    assert!(bob_enc.is_none());

    let answer = alice_machine.answer_key_requests();
    let map = flurry::HashMap::new();
    let pin = map.pin();
    pin.insert(DeviceId("0".to_string()), answer);
    drop(pin);
    bob_machine.accept_room_keys(alice_machine.identity_keys(), &room, &map).expect("TODO: panic message");

    let bob_enc = bob_machine.encrypt_message(&room, b"i too love titties").unwrap();
    let alice_dec = alice_machine.decrypt_message(&room, bob_enc).unwrap();
    let txt_alice = String::from_utf8(alice_dec).unwrap();
    println!("bob: {txt_alice}!");


}
