use moe::worker::EncryptedMessagesWorker;

use gloo::worker::Registrable;

fn main() {
    console_error_panic_hook::set_once();

    EncryptedMessagesWorker::registrar().register();
}