use moe::worker::EncryptedAttachmentsWorker;

use gloo::worker::Registrable;

fn main() {
    console_error_panic_hook::set_once();

    EncryptedAttachmentsWorker::registrar().register();
}