#!/usr/bin/env bash
set -e

echo "Build Rust -> WASM"
cd rust

# 1) Rust wasm32 target
rustup target add wasm32-unknown-unknown

# 2) wasm-pack 설치 안되어 있으면 설치
if ! command -v wasm-pack &>/dev/null
then
    cargo install wasm-pack
fi

# 3) wasm-pack build
wasm-pack build \
    --target web \
    --out-dir ../public/pkg \
    --dev

echo "Build complete: public/pkg"
