export const jQueryPatterns = {
  // 이벤트 위임 패턴
  delegatedEvents: {
    detect: (code: string) => /\$\(.*\)\.on\(['"]\w+['"], ['"].*['"], function/.test(code),
    transform: (match: RegExpMatchArray) => {
      // 이벤트 위임을 React 이벤트 + 조건부 처리로 변환
      return `/* 이벤트 위임 변환 */`;
    },
  },

  // AJAX 패턴
  ajaxCall: {
    detect: (code: string) => /\$\.ajax\(/.test(code),
    transform: (match: RegExpMatchArray, options: any) => {
      // 선택한 라이브러리(axios/fetch)에 맞게 변환
      return options.ajaxHandler === 'axios' ? `/* axios 변환 */` : `/* fetch 변환 */`;
    },
  },

  // 플러그인 패턴
  jqueryPlugin: {
    detect: (code: string, pluginList: string[]) => {
      return pluginList.some((plugin) => new RegExp(`\$\\(.*\\)\\.${plugin}`).test(code));
    },
    transform: (match: RegExpMatchArray, options: any) => {
      // 플러그인 매핑에 따라 대체 컴포넌트 사용
      return `/* 플러그인 변환 */`;
    },
  },
};
