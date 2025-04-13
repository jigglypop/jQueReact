use crate::dom_node::JqDomNode;

pub fn generate_react_code(node: &JqDomNode) -> String {
    let jsx = node_to_jsx(node);
    format!(
    r#"function MyComponent() {{
        return (
            {}
        );
    }}"#, jsx)
}

fn node_to_jsx(node: &JqDomNode) -> String {
    let (tag, classes) = parse_selector(&node.selector);
    let mut all_classes = classes;
    for c in &node.class_list {
        if !all_classes.contains(c) {
            all_classes.push(c.clone());
        }
    }
    // style
    let style_part = if !node.styles.is_empty() {
        let pairs: Vec<String> = node.styles.iter()
            .map(|(k,v)| format!(r#"{}: "{}""#, k, v))
            .collect();
        format!(r#" style={{ {{ {} }} }}"#, pairs.join(", "))
    } else {
        "".to_string()
    };

    let mut inner = String::new();
    // text_content
    if let Some(txt) = &node.text_content {
        inner.push_str(txt);
    }
    // children_html
    for html in &node.children_raw_html {
        inner.push_str(html);
    }

    // event
    let mut event_str = String::new();
    for (evt, cb) in &node.events {
        let react_evt = match evt.as_str() {
            "click" => "onClick",
            _ => "onClick",
        };
        event_str.push_str(&format!(r#" {}={{(e) => {{ {} }} }}"#, react_evt, cb));
    }

    let class_str = if !all_classes.is_empty() {
        format!(r#" className="{}""#, all_classes.join(" "))
    } else {
        "".to_string()
    };

    format!(
        "<{tag}{cls}{style}{ev}>{inner}</{tag}>",
        tag=tag,
        cls=class_str,
        style=style_part,
        ev=event_str,
        inner=inner
    )
}

fn parse_selector(sel: &str) -> (String, Vec<String>) {
    // e.g. "div.container" -> ("div", ["container"])
    if let Some(dot) = sel.find('.') {
        let tag = &sel[..dot];
        let cls = &sel[dot+1..];
        (tag.to_string(), vec![cls.to_string()])
    } else {
        (sel.to_string(), vec![])
    }
}
