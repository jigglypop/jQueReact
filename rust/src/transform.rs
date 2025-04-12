// src/transform.rs

use swc_core::ecma::ast::{
    Module, ModuleItem, Stmt, ExprStmt, Expr, CallExpr, Callee, Lit,
    MemberProp, ExprOrSpread
};

use crate::dom_node::JqDomNode;

/// jQuery Collector: 모듈을 수동 순회 => jQuery 체인 -> JqDomNode
pub struct JqueryCollector {
    pub nodes: Vec<JqDomNode>,
}

impl JqueryCollector {
    /// 상위에서 호출: 모듈 전체를 수동 스캔
    pub fn collect_from_module(&mut self, module: &Module) {
        for item in &module.body {
            match item {
                ModuleItem::Stmt(stmt) => {
                    self.visit_stmt(stmt);
                }
                ModuleItem::ModuleDecl(_) => {
                    // import/export 등은 무시
                }
            }
        }
    }

    fn visit_stmt(&mut self, stmt: &Stmt) {
        match stmt {
            Stmt::Expr(expr_stmt) => {
                // ex) $("div").text("Hello!")
                self.visit_expr_stmt(expr_stmt);
            }
            // if, for, etc. => 생략
            _ => {}
        }
    }

    fn visit_expr_stmt(&mut self, stmt: &ExprStmt) {
        // expr might be CallExpr($...) or something
        self.visit_expr(&stmt.expr);
    }

    /// "expression"을 방문
    fn visit_expr(&mut self, expr: &Expr) {
        // 만약 CallExpr
        if let Expr::Call(call_expr) = expr {
            // top-level callee
            if let Callee::Expr(c_expr) = &call_expr.callee {
                match &**c_expr {
                    // Case 1) direct "$"
                    Expr::Ident(id) if id.sym == "$" => {
                        // => jQuery start
                        let selector = get_selector_from_args(&call_expr.args);
                        let mut node = JqDomNode::new(selector);

                        // 체인 파싱 => parse_chain_expr
                        parse_chain_expr(expr, &mut node);

                        self.nodes.push(node);
                        return;
                    }
                    // Case 2) MemberExpr => e.g. .text(...)
                    // => 그 object 안에 $()가 숨어있을 수도 있음
                    Expr::Member(_) => {
                        // let's do sub-loc approach:
                        // 시도: parse_chain_expr를 바로 써서
                        // 안에 $()가 있는지 탐색
                        let mut node = JqDomNode::new("unknown_selector".into());
                        parse_chain_expr(expr, &mut node);

                        // 만약 selector가 실제로 바뀌었다면 => jQuery chain
                        if node.selector != "unknown_selector" || !node.styles.is_empty()
                            || node.text_content.is_some() || !node.events.is_empty()
                        {
                            // => 인식됨
                            self.nodes.push(node);
                            return;
                        }
                    }
                    _ => {}
                }
            }

            // 추가로 call_expr.args 내부 expr도 재귀 (ex: fn($("div")))
            for arg in &call_expr.args {
                self.visit_expr(&arg.expr);
            }
        } else {
            // 다른 expr타입 => 필요시 재귀
        }
    }
}

/// 체인 파싱 ex) $("div").css("color","red").text("Hello")
/// => 최상위가 .text => 그 object가 .css => 그 object가 $()
fn parse_chain_expr(expr: &Expr, node: &mut JqDomNode) {
    if let Expr::Call(call_expr) = expr {
        if let Callee::Expr(c_expr) = &call_expr.callee {
            match &**c_expr {
                // 만약 Ident("$") => jQuery start
                Expr::Ident(id) if id.sym == "$" => {
                    // selector
                    let sel = get_selector_from_args(&call_expr.args);
                    node.selector = sel;
                }
                // 만약 MemberExpr => .text, .css, .append ...
                Expr::Member(member) => {
                    if let MemberProp::Ident(ident) = &member.prop {
                        let method = ident.sym.as_ref();
                        match method {
                            "css" => handle_css(call_expr, node),
                            "text" => handle_text(call_expr, node),
                            "append" => handle_append(call_expr, node),
                            "addClass" => handle_add_class(call_expr, node),
                            "attr" => handle_attr(call_expr, node),
                            "on" => handle_on(call_expr, node),
                            _ => {}
                        }
                        // 이전 체인: parse_chain_expr(&member.obj, node)
                        // => $("div").css => $("div")
                        parse_chain_expr(&member.obj, node);
                    }
                }
                _ => {}
            }
        }
        // call_expr.args => 재귀할 수도
    }
}

/// selector
fn get_selector_from_args(args: &Vec<ExprOrSpread>) -> String {
    if let Some(arg0) = args.get(0) {
        if let Expr::Lit(Lit::Str(s)) = &*arg0.expr {
            return s.value.to_string();
        }
    }
    "unknown_selector".into()
}

// 이하 메서드별 로직
fn handle_css(call_expr: &CallExpr, node: &mut JqDomNode) {
    if call_expr.args.len() == 2 {
        if let (Some(a1), Some(a2)) = (call_expr.args.get(0), call_expr.args.get(1)) {
            if let (Expr::Lit(Lit::Str(k)), Expr::Lit(Lit::Str(v))) = (&*a1.expr, &*a2.expr) {
                node.styles.push((k.value.to_string(), v.value.to_string()));
            }
        }
    }
}

fn handle_text(call_expr: &CallExpr, node: &mut JqDomNode) {
    if let Some(arg0) = call_expr.args.get(0) {
        if let Expr::Lit(Lit::Str(s)) = &*arg0.expr {
            node.text_content = Some(s.value.to_string());
        }
    }
}

fn handle_append(call_expr: &CallExpr, node: &mut JqDomNode) {
    if let Some(arg0) = call_expr.args.get(0) {
        if let Expr::Lit(Lit::Str(st)) = &*arg0.expr {
            node.children_raw_html.push(st.value.to_string());
        }
    }
}

fn handle_add_class(call_expr: &CallExpr, node: &mut JqDomNode) {
    if let Some(arg0) = call_expr.args.get(0) {
        if let Expr::Lit(Lit::Str(st)) = &*arg0.expr {
            node.class_list.push(st.value.to_string());
        }
    }
}

fn handle_attr(call_expr: &CallExpr, node: &mut JqDomNode) {
    if call_expr.args.len() == 2 {
        if let (Some(a1), Some(a2)) = (call_expr.args.get(0), call_expr.args.get(1)) {
            if let (Expr::Lit(Lit::Str(k)), Expr::Lit(Lit::Str(v))) = (&*a1.expr, &*a2.expr) {
                node.attributes.push((k.value.to_string(), v.value.to_string()));
            }
        }
    }
}

fn handle_on(call_expr: &CallExpr, node: &mut JqDomNode) {
    if call_expr.args.len() >= 2 {
        if let Some(a1) = call_expr.args.get(0) {
            if let Expr::Lit(Lit::Str(evt)) = &*a1.expr {
                if let Some(a2) = call_expr.args.get(1) {
                    let callback_str = format!("{:?}", &*a2.expr);
                    node.events.push((evt.value.to_string(), callback_str));
                }
            }
        }
    }
}
