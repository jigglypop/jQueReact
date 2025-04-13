#!/usr/bin/env bash
set -e
echo "step1) Building Rust -> WASM with wasm-pack"
cd core
# 1) Rust용 wasm32 타겟 준비
rustup target add wasm32-unknown-unknown
# 2) wasm-pack 설치 (필요 시)
if ! command -v wasm-pack &> /dev/null
then
    cargo install wasm-pack
fi
# 3) wasm-pack 빌드 (web 타겟 사용)
wasm-pack build \
  --release \
  --target web \
  --out-dir ../public/pkg

echo "Build Complete. Output in pkg/ folder."