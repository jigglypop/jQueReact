#!/usr/bin/env bash
set -e
echo "Building Rust -> WASM with wasm-pack..."
cd rust
# 1) Rust용 wasm32 타겟 준비
rustup target add wasm32-unknown-unknown
# 2) wasm-pack 설치 (필요 시)
if ! command -v wasm-pack &> /dev/null
then
    cargo install wasm-pack
fi
# 3) wasm-pack 빌드 (bundler 타겟 사용)
wasm-pack build \
  --release \
  --target bundler \
  --out-dir ../pkg

echo "Build complete. Output in pkg/ folder."
