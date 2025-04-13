// src/index.ts
export { transformJQueryToReact } from './transformer';
export { initWasm, transpile } from './wasm-interface';
export type { JQueReactConfig } from './config';

// Vite 플러그인 다시 내보내기
import vitePlugin from '../plugins/vite-plugin';
export { vitePlugin };
