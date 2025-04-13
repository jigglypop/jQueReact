#[derive(Debug)]
pub struct JqDomNode {
    pub selector: String,
    pub styles: Vec<(String, String)>,
    pub attributes: Vec<(String, String)>,
    pub class_list: Vec<String>,
    pub text_content: Option<String>,
    pub children_raw_html: Vec<String>,
    pub events: Vec<(String, String)>,
}

impl JqDomNode {
    pub fn new(selector: String) -> Self {
        Self {
            selector,
            styles: vec![],
            attributes: vec![],
            class_list: vec![],
            text_content: None,
            children_raw_html: vec![],
            events: vec![],
        }
    }
}
