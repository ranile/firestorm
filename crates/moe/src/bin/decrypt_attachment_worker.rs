use moe::worker::DecryptAttachmentsWorker;

use gloo::worker::Registrable;

fn main() {
    console_error_panic_hook::set_once();

    DecryptAttachmentsWorker::registrar().register();
}
