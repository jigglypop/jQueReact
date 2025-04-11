// src/index.ts
import init, { transpile_jquery_to_react } from "../pkg/jquereact";

// 브라우저 로드 시점에 호출 (window.onload 등)
async function main() {
  // WASM 초기화 (비동기)
  await init();

  const inputCode = `
    $("div.container").text("Hello from jQuery!");
  `;
  const result = transpile_jquery_to_react(inputCode);

  console.log("== WASM Transpile Result ==");
  console.log(result);

  // 화면에 표시 (디버그용)
  const outputEl = document.getElementById("output");
  if (outputEl) {
    outputEl.textContent = result;
  }
}

main().catch(err => console.error(err));
