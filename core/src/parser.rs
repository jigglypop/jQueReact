use std::sync::Arc;

use anyhow::{anyhow, Result};
use swc_core::common::{FileName, SourceMap, GLOBALS};
use swc_core::ecma::{
    ast::Module,
    parser::{lexer::Lexer, Parser, StringInput, Syntax},
};

pub fn parse_js(code: &str) -> Result<Module> {
    // 글로벌 컨텍스트 설정
    GLOBALS.set(&Default::default(), || {
        // 소스맵 생성
        let cm = Arc::new(SourceMap::default());
        // 소스 파일 생성
        let fm = cm.new_source_file(FileName::Anon.into(), code.into());
        // Lexer 생성
        let lexer = Lexer::new(
            // ES2022 문법 사용
            Syntax::Es(Default::default()),
            // ES 버전 지정
            Default::default(),
            StringInput::from(&*fm),
            None,
        );

        // 파서 생성 및 모듈 파싱
        let mut parser = Parser::new_from(lexer);

        match parser.parse_module() {
            Ok(module) => Ok(module),
            Err(err) => Err(anyhow!("파싱 오류: {:?}", err)),
        }
    })
}
