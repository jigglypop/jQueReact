#[derive(Debug)]
pub struct JqDomNode {
    pub selector: String,                     // $("div.container") 등
    pub styles: Vec<(String, String)>,        // from .css("key","value")
    pub attributes: Vec<(String, String)>,    // from .attr("key","value")
    pub class_list: Vec<String>,              // from .addClass("foo")
    pub text_content: Option<String>,         // from .text("hello")
    pub children_raw_html: Vec<String>,       // from .append("<span>...</span>")
    pub events: Vec<(String, String)>,        // from .on("click", "function(e){...}")
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
