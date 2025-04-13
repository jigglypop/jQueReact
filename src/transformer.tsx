import { initWasm, transpile } from './wasm-interface';
import * as prettier from 'prettier';
import { parse as parseHTML } from 'node-html-parser';

interface TransformOptions {
  filePath: string;
  prettier?: boolean;
  componentName?: string;
  useHooks?: boolean;
}

// WASM 모듈 초기화 상태
let wasmInitialized = false;

export async function transformJQueryToReact(
  content: string,
  options: TransformOptions,
): Promise<string> {
  if (!wasmInitialized) {
    await initWasm();
    wasmInitialized = true;
  }

  const { filePath, prettier: usePrettier = true, componentName = 'JQueryComponent' } = options;

  let transformedCode = '';

  // 확장자로 파일 타입 결정
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'html' || ext === 'htm') {
    transformedCode = await transformHtmlFile(content, componentName);
  } else {
    transformedCode = await transformJsFile(content, componentName);
  }

  // Prettier 포맷팅 적용
  if (usePrettier) {
    try {
      transformedCode = await prettier.format(transformedCode, {
        parser: 'typescript',
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        bracketSpacing: true,
        jsxBracketSameLine: false,
      });
    } catch (error) {
      console.warn('JQueReact: Prettier 포맷팅 적용 실패', error);
    }
  }

  return transformedCode;
}

// JavaScript/jQuery 파일 변환
async function transformJsFile(content: string, componentName: string): Promise<string> {
  try {
    // 주요 jQuery 패턴 감지
    const containsJQuery = /\$\(|\bjQuery\b/.test(content);

    if (!containsJQuery) {
      return createEmptyComponent(
        componentName,
        `// jQuery 코드가 감지되지 않았습니다.
// 원본 코드:
/*
${content}
*/`,
      );
    }

    // Rust/WASM 모듈을 통한 변환
    let reactCode = transpile(content);

    // 변환 결과가 비어있거나 오류가 있는 경우
    if (reactCode.startsWith('// parse error') || reactCode.includes('No usage found')) {
      return createEmptyComponent(
        componentName,
        `// jQuery -> React 변환 실패
// 원본 코드:
/*
${content}
*/`,
      );
    }

    // 컴포넌트 이름 교체
    reactCode = reactCode.replace(/function MyComponent/, `function ${componentName}`);

    // 필요한 import 추가
    return `import React from 'react';

// 원본 jQuery 코드에서 변환됨:
/*
${content.slice(0, 300)}${content.length > 300 ? '...' : ''}
*/

${reactCode}

export default ${componentName};
`;
  } catch (error) {
    console.error('jQuery JS 변환 오류:', error);
    return createEmptyComponent(
      componentName,
      `// 변환 중 오류 발생: ${error}
// 원본 코드:
/*
${content.slice(0, 300)}${content.length > 300 ? '...' : ''}
*/`,
    );
  }
}

// HTML 파일 변환
async function transformHtmlFile(content: string, componentName: string): Promise<string> {
  try {
    const root = parseHTML(content);

    // 스크립트 태그 찾기
    const scripts = root.querySelectorAll('script');
    let jQueryCode = '';

    // 스크립트 태그 내용 수집
    scripts.forEach((script) => {
      const src = script.getAttribute('src');
      if (!src) {
        const scriptContent = script.text;
        if (scriptContent && /\$\(|\bjQuery\b/.test(scriptContent)) {
          jQueryCode += scriptContent + '\n';
        }
      }
    });

    // jQuery 코드가 있는 경우에만 변환
    let reactComponents = '';
    if (jQueryCode) {
      reactComponents = transpile(jQueryCode);
      // 컴포넌트 이름 교체
      reactComponents = reactComponents.replace(
        /function MyComponent/,
        `function ${componentName}Content`,
      );
    }

    // HTML 구조를 JSX로 변환
    const jsxStructure = convertHtmlToJsx(root);

    return `import React, { useEffect, useRef } from 'react';

// 원본 HTML에서 변환됨:
/*
${content.slice(0, 300)}${content.length > 300 ? '...' : ''}
*/

${reactComponents}

function ${componentName}() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // jQuery 초기화 로직을 여기에 추가할 수 있습니다.
    if (containerRef.current) {
      // ...
    }
    
    return () => {
      // 정리 로직
    };
  }, []);
  
  return (
    <div ref={containerRef}>
      ${jsxStructure}
      {/* ${componentName}Content 컴포넌트를 여기에 포함할 수 있습니다 */}
    </div>
  );
}

export default ${componentName};
`;
  } catch (error) {
    console.error('HTML 변환 오류:', error);
    return createEmptyComponent(componentName, `// HTML 변환 중 오류 발생: ${error}`);
  }
}

// HTML을 JSX로 변환
function convertHtmlToJsx(root: any): string {
  // 기본적인 HTML -> JSX 변환 (간소화된 버전)
  let html = root
    .toString()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 스크립트 제거
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=');

  // 최대 5개 라인으로 제한
  const lines = html.split('\n').slice(0, 5);
  if (html.split('\n').length > 5) {
    lines.push('{/* ... 추가 HTML 생략 ... */}');
  }

  return lines.join('\n');
}

// 기본 컴포넌트 생성
function createEmptyComponent(name: string, comment: string): string {
  return `import React from 'react';

${comment}

function ${name}() {
  return (
    <div className="jquereact-component">
      <p>jQuery에서 변환된 컴포넌트</p>
    </div>
  );
}

export default ${name};
`;
}
