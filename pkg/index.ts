import init, { transpile_jquery_to_react } from "../pkg/jquereact";

async function main() {
  await init();
  const inputCode = `
    $("div.container").text("Hello from jQuery!");
  `;
  const result = transpile_jquery_to_react(inputCode);
  console.log("== WASM Transpile Result ==");
  console.log(result);
  const outputEl = document.getElementById("output");
  if (outputEl) {
    outputEl.textContent = result;
  }
}

main().catch(err => console.error(err));
