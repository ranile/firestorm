#! /usr/bin/fish

set -u CARGO_TARGET_DIR

cargo build --bin worker --target wasm32-unknown-unknown
wasm-bindgen --target no-modules --out-dir ./dist/worker target/wasm32-unknown-unknown/debug/worker.wasm

cargo build --bin decrypt_attachment_worker --target wasm32-unknown-unknown
wasm-bindgen --target no-modules --out-dir ./dist/decrypt_attachment_worker target/wasm32-unknown-unknown/debug/decrypt_attachment_worker.wasm

wasm-pack build --target bundler --dev;