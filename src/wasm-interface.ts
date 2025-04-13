// src/wasm-interface.ts
import init, { transpile as wasmTranspile } from '../public/pkg/jquereact.js';

let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) return;

  try {
    await init();
    initialized = true;
    console.log('JQueReact: WASM 모듈 초기화 완료');
  } catch (error) {
    console.error('JQueReact: WASM 모듈 초기화 실패', error);
    throw error;
  }
}

export function transpile(jqueryCode: string): string {
  if (!initialized) {
    throw new Error('WASM 모듈이 초기화되지 않았습니다. initWasm()을 먼저 호출하세요.');
  }

  try {
    return wasmTranspile(jqueryCode);
  } catch (error) {
    console.error('jQuery -> React 변환 중 오류:', error);
    return `// 변환 오류: ${error.message}`;
  }
}
