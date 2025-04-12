// src/transform.rs

use swc_core::ecma::ast::{
    Module, ModuleItem, Stmt, ExprStmt, Expr, CallExpr, Callee, Lit, MemberProp,
    ExprOrSpread
};
use crate::dom_node::JqDomNode;

/// jQuery Collector: 모듈을 수동 순회하여 jQuery 체인을 찾고, JqDomNode에 담음
pub struct JqueryCollector {
    pub nodes: Vec<JqDomNode>,
}

impl JqueryCollector {
    /// 모듈 전체 순회 (import/export는 무시)
    pub fn collect_from_module(&mut self, module: &Module) {
        for item in &module.body {
            match item {
                ModuleItem::Stmt(stmt) => {
                    self.visit_stmt(stmt);
                }
                ModuleItem::ModuleDecl(_) => { /* ignore */ }
            }
        }
    }

    fn visit_stmt(&mut self, stmt: &Stmt) {
        match stmt {
            Stmt::Expr(expr_stmt) => {
                self.visit_expr_stmt(expr_stmt);
            }
            // if/for 등은 여기서는 생략
            _ => {}
        }
    }

    fn visit_expr_stmt(&mut self, stmt: &ExprStmt) {
        // ex) $("div").css("color","red").text("Hello");
        self.visit_expr(&stmt.expr);
    }

    fn visit_expr(&mut self, expr: &Expr) {
        // 만약 expr가 CallExpr => $()
        if let Expr::Call(call_expr) = expr {
            // top-level callee가 "$"인지
            if let Callee::Expr(callee_expr) = &call_expr.callee {
                if let Expr::Ident(id) = &**callee_expr {
                    if id.sym == "$" {
                        // selector
                        let selector = get_selector_from_args(&call_expr.args);
                        let mut node = JqDomNode::new(selector);

                        // 체인 parse
                        parse_chain_expr(expr, &mut node);

                        self.nodes.push(node);
                        return;
                    }
                }
            }
            // callee가 MemberExpr(...)일 수도 => .text(...) 등
            // 그리고 call_expr.args도 살펴볼 수 있음
            // 하지만 여기선 "체인 parse"를 parse_chain_expr에 맡기는 식
            // or we do a sub-visit of .args
            for arg in &call_expr.args {
                self.visit_expr(&arg.expr);
            }
        } else {
            // 다른 expr 종류는 필요시 재귀
        }
    }
}

/// parse_chain_expr: $("div") => .css("color","red") => ...
fn parse_chain_expr(expr: &Expr, node: &mut JqDomNode) {
    if let Expr::Call(call_expr) = expr {
        if let Callee::Expr(callee_expr) = &call_expr.callee {
            // MemberExpr => .css / .text / ...
            if let Expr::Member(member) = &**callee_expr {
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
                    // 이전 체인 (member.obj) => $("div").css => $("div")
                    parse_chain_expr(&member.obj, node);
                }
            }
            // call_expr.args도 추가 재귀하려면 할 수 있음
        }
    }
}

/// jQuery 인자 파싱
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
    // ex) .css("color","red")
    if call_expr.args.len() == 2 {
        if let (Some(a1), Some(a2)) = (call_expr.args.get(0), call_expr.args.get(1)) {
            if let (Expr::Lit(Lit::Str(k)), Expr::Lit(Lit::Str(v))) = (&*a1.expr, &*a2.expr) {
                node.styles.push((k.value.to_string(), v.value.to_string()));
            }
        }
    }
}

fn handle_text(call_expr: &CallExpr, node: &mut JqDomNode) {
    // .text("Hello")
    if let Some(arg0) = call_expr.args.get(0) {
        if let Expr::Lit(Lit::Str(s)) = &*arg0.expr {
            node.text_content = Some(s.value.to_string());
        }
    }
}

fn handle_append(call_expr: &CallExpr, node: &mut JqDomNode) {
    // .append("<span>foo</span>")
    if let Some(arg0) = call_expr.args.get(0) {
        if let Expr::Lit(Lit::Str(s)) = &*arg0.expr {
            node.children_raw_html.push(s.value.to_string());
        }
    }
}

fn handle_add_class(call_expr: &CallExpr, node: &mut JqDomNode) {
    // .addClass("foo")
    if let Some(arg0) = call_expr.args.get(0) {
        if let Expr::Lit(Lit::Str(s)) = &*arg0.expr {
            node.class_list.push(s.value.to_string());
        }
    }
}

fn handle_attr(call_expr: &CallExpr, node: &mut JqDomNode) {
    // .attr("key","val")
    if call_expr.args.len() == 2 {
        if let (Some(a1), Some(a2)) = (call_expr.args.get(0), call_expr.args.get(1)) {
            if let (Expr::Lit(Lit::Str(k)), Expr::Lit(Lit::Str(v))) = (&*a1.expr, &*a2.expr) {
                node.attributes.push((k.value.to_string(), v.value.to_string()));
            }
        }
    }
}

fn handle_on(call_expr: &CallExpr, node: &mut JqDomNode) {
    // .on("click", function(e){...})
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
