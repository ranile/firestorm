#! /usr/bin/bash

unset CARGO_TARGET_DIR


if [ "$1" == '--release' ]; then
  PROFILE='release'
else
  PROFILE='debug'
fi


cargo build --bin worker --target wasm32-unknown-unknown $1
wasm-bindgen --target no-modules --out-dir ./dist/worker "target/wasm32-unknown-unknown/$PROFILE/worker.wasm"

cargo build --bin decrypt_attachment_worker --target wasm32-unknown-unknown $1
wasm-bindgen --target no-modules --out-dir ./dist/decrypt_attachment_worker "target/wasm32-unknown-unknown/$PROFILE/decrypt_attachment_worker.wasm"

if [ "$1" == '--release' ]; then
  wasm-pack build --target bundler
else
  wasm-pack build --target bundler --dev
fi
