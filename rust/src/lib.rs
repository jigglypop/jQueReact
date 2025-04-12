// src/lib.rs

use wasm_bindgen::prelude::*;

mod parser;
mod transform;
mod dom_node;
mod generator;

use crate::{
    parser::parse_js,
    transform::JqueryCollector,
    generator::generate_react_code,
};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

#[wasm_bindgen]
pub fn transpile(input: &str) -> String {
    // 1) parse
    let module = match parse_js(input) {
        Ok(m) => m,
        Err(e) => {
            return format!("// parse error: {:?}", e);
        }
    };

    console_log!("Parsed module: {:?}", module);

    // 2) transform (manual)
    let mut collector = JqueryCollector { nodes: vec![] };
    collector.collect_from_module(&module);

    if collector.nodes.is_empty() {
        console_log!("No jQuery chain found");
        return "// No usage found\nfunction MyComponent(){}".to_string();
    }

    // just take first node
    let node = &collector.nodes[0];
    let code = generate_react_code(node);

    code
}
