# jQueReact

**jQueReact**는 **jQuery 코드를 React 코드로 변환**하는 **트랜스파일러(Transpiler)**입니다.  
Rust로 구현된 파서를 사용해 빌드 시점 혹은 사전 변환 과정에서 jQuery 문법을 해석하고, 최종적으로 **React/JSX 코드**를 생성해 줍니다. 이로써 **런타임**에는 굳이 jQuery 라이브러리를 포함하지 않고도, 레거시 jQuery 코드를 React 방식으로 동작하게 만들 수 있습니다.


---

## 목차

1. [프로젝트 개요](#프로젝트-개요)  
2. [특징](#특징)  
3. [동작 원리](#동작-원리)  
4. [사용 예시](#사용-예시)  
5. [장점 & 한계](#장점--한계)  
6. [설치 및 빌드](#설치-및-빌드)  
7. [FAQ](#faq)  
8. [라이선스](#라이선스)  

---

## 프로젝트 개요

**jQueReact**의 핵심 목표는 다음과 같습니다:

- **레거시 jQuery 코드 → React 코드 자동 변환**  
  - 명령형 DOM 조작을 선언형 React 컴포넌트로 대체  
  - 빌드 후에는 jQuery 라이브러리를 배포하지 않고도 해당 로직 구동 가능
- **점진적 전환**  
  - 기존 jQuery 프로젝트를 조금씩 React 생태계로 이관  
  - 추가로 필요한 스크립트만 변환하거나, 전체 파일을 한꺼번에 변환 가능

---

## 특징

1. **Rust & WebAssembly 기반**  
   - SWC, Tree-sitter 등 Rust 생태계의 빠른 JS 파싱 엔진을 활용  
   - WASM으로 컴파일되어 Node.js, 브라우저 등 다양한 환경에서 고성능 동작
2. **빌드 타임 트랜스파일**  
   - 개발·빌드 단계에서 jQuery 코드를 React로 변환  
   - 배포 시점에는 React 코드만 포함해도 되므로 성능 최적화 가능
3. **유연한 규칙**  
   - `.css()`, `.on()`, `.attr()`, `.append()` 등 주요 jQuery 메서드를 React 속성/이벤트/JSX로 매핑  
   - ajax, animation 등 복잡한 패턴은 필요 시 맞춤 설정 가능

---

## 동작 원리

1. **jQuery 소스 파싱**  
   - Rust 기반 파서가 `$("selector").css("color","red")...` 등을 AST로 변환  
2. **추상화(Intermediate Representation)**  
   - jQuery 체인을 **DOM 요소 + 스타일 + 이벤트** 등으로 분석해 중간 표현(IR) 생성  
3. **React 코드(혹은 JSX) 생성**  
   - IR을 바탕으로 `<div style={{ color: 'red' }} onClick={...}>...</div>` 같은 React 컴포넌트 코드 생성  
4. **최종 결과물**  
   - 변환된 React 코드(JSX) 혹은 JS 코드를 프로젝트 소스에 포함해 번들링  
   - 런타임에는 **jQuery 종속성이 사라지고** 오직 React 코드만 동작

---

## 사용 예시

```js
import init, { transpile_jquery_to_react } from "jquereact";

async function runTranspileExample() {
  // 1) WebAssembly 초기화 (비동기)
  await init();

  // 2) 변환할 jQuery 코드 예시
  const jQueryCode = `
    $("div.container").css("color", "red").text("Hello!")
      .on("click", function(e) {
        console.log("Clicked!", e);
      });
  `;

  // 3) 트랜스파일 실행
  const reactCode = transpile_jquery_to_react(jQueryCode);

  console.log("=== Transpiled React code ===");
  console.log(reactCode);
  
  /*
    출력 예시:
    function TransformedComponent() {
      function handleClick(e) { console.log("Clicked!", e); }
      return (
        <div className="container" style={{ color: "red" }} onClick={handleClick}>
          Hello!
        </div>
      );
    }
  */
}

runTranspileExample();
```

> 이 출력 코드를 Babel/TypeScript 등으로 처리하면 최종 배포용 React 코드가 완성됩니다.

---

## 장점 & 한계

### 장점

1. **런타임 최적화**  
   - 변환은 빌드 시점에서 완료 → 배포된 앱에서는 jQuery가 필요 없음  
   - React 트리셰이킹 등 생태계 활용 가능
2. **점진적 레거시 제거**  
   - 프로젝트 일부 jQuery 코드만 먼저 변환 후, 단계적으로 영역 확장 가능  
   - jQuery와 React 혼재된 코드베이스에서 “조금씩” React로 옮겨가는 전략
3. **고성능 파싱/변환**  
   - Rust + WASM 기반 → 빠른 AST 처리 및 트랜스파일

### 한계

1. **동적/복잡한 로직 완벽 변환 한계**  
   - jQuery 플러그인, 애니메이션, 이벤트 위임 등 일부 패턴은 수동 리팩토링 필요  
2. **적절한 매핑 규칙 필수**  
   - `.on("click") → onClick`, `.css() → style`, `.text() → children` 등은 단순하지만,  
     `.ajax()`나 `.fadeIn()`은 React에서 적절한 대체가 정해져 있지 않음
3. **추가 빌드 단계**  
   - 변환 과정이 CI/CD 파이프라인에 추가되어야 함  
   - 유지보수를 위해 변환 규칙(매핑 로직)을 확장/관리 필요

---

## 설치 및 빌드

### 1) npm 설치 (사용자)

```bash
npm install jquereact
```

설치 후, Node.js나 브라우저 환경에서 `import init, { transpile_jquery_to_react } from 'jquereact'` 형태로 사용 가능.

### 2) Rust + WASM 빌드 (개발자)

```bash
# Rust와 wasm-pack 설치
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# jQueReact 저장소 클론 후
npm run build

# => wasm-pack build --target bundler --out-dir pkg
```

빌드 후, `pkg/` 폴더에 `.wasm` 및 JS 래퍼 파일, `.d.ts`(타입 정의) 등이 생깁니다.

### 3) CI/CD 연동

- **빌드 단계**에서 `transpile_jquery_to_react`를 호출해 jQuery 코드를 변환 후, 결과 React 코드를 최종 번들로 통합  
- (옵션) 브라우저만 사용하는 경우, WebAssembly 파일(.wasm)을 CDN 또는 로컬 서버로 서빙하여 사용



## 라이선스

이 프로젝트는 [MIT 라이선스](./LICENSE)를 따릅니다. 자유롭게 수정, 사용, 배포할 수 있습니다.  
프로젝트 관련 문의나 이슈는 [GitHub Issues](https://github.com/yourname/jQueReact/issues)에 등록해 주세요.

