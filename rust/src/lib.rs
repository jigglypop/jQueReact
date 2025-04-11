use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn transpile_jquery_to_react(input: &str) -> String {
    format!("// Transpiled from: {}\nfunction MyComponent() {{}}", input)
}
