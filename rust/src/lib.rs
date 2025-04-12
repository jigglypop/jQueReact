use wasm_bindgen::prelude::*;
use anyhow::Result;

mod parser;

#[wasm_bindgen]
pub fn transpile(input: &str) -> String {
    // 1. 파싱

    let parse_result = parser::parse(input);
    format!("// Transpiled from: {}\nfunction MyComponent() {{}}", input)
}
