// // WASM 모듈 로드
// const jquereactModule = await import('/public/pkg/jquereact.js');
// await jquereactModule.default();
// const { transpile } = jquereactModule;
//
// // jQuery 코드 예시
// const jqueryCode = `
//   $("div.container").css("color", "red").text("Hello World!")
//     .on("click", function() {
//       console.log("Clicked!");
//     });
// `;
//
// // 변환 실행
//
// export default function App() {
//   const reactCode = transpile(jqueryCode);
//   console.log(reactCode);
//
//   return (
//     <div className="App">
//       <h1>jQueReact Test</h1>
//       <h1>뭐냐</h1>
//       {reactCode}
//     </div>
//   );
// }
import React, { useState, useEffect } from 'react';
export default function App() {
  const [DynamicComponent, setDynamicComponent] = useState(() => () => <div>로딩 중...</div>);
  const [code, setCode] = useState('');

  useEffect(() => {
    async function loadAndTransform() {
      try {
        // WASM 모듈 로드
        const jquereactModule = await import('/public/pkg/jquereact.js');
        await jquereactModule.default();
        const { transpile } = jquereactModule;

        // jQuery 코드 예시
        const jqueryCode = `
          $("div.container").css("color", "red").text("Hello World!");
        `;

        // 변환 실행
        const reactCode = transpile(jqueryCode);
        setCode(reactCode);

        // 평가 가능한 컴포넌트 코드로 변환
        const evalCode = `
          (function() {
            ${reactCode}
            return MyComponent;
          })()
        `;

        // 위험한 eval 사용 - 데모 목적으로만 사용
        try {
          // eslint-disable-next-line no-eval
          const ComponentFunc = eval(evalCode);
          setDynamicComponent(() => ComponentFunc);
        } catch (evalError) {
          console.error('컴포넌트 평가 오류:', evalError);
        }
      } catch (error) {
        console.error('변환 중 오류:', error);
        setCode('오류 발생: ' + error.message);
      }
    }

    loadAndTransform();
  }, []);

  return (
    <div className="App">
      <h1>jQueReact Test</h1>

      <h2>변환 결과 미리보기:</h2>
      <div className="preview-container">
        <DynamicComponent />
      </div>

      <h2>변환된 코드:</h2>
      <pre
        style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '5px',
          overflow: 'auto',
          maxWidth: '100%',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
