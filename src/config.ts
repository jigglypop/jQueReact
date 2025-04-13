// src/config.ts - 구성 옵션 정의
export interface JQueReactConfig {
  // 입력/출력 설정
  include: string[];
  exclude: string[];
  outputDir: string;
  // 변환 옵션
  preserveOriginal: boolean;
  reactOptions: {
    useHooks: boolean;
    componentNameStrategy: 'filename' | 'camelCase' | 'custom';
    customComponentName?: (filename: string) => string;
  };
  // 고급 옵션
  transformOptions: {
    handleEvents: boolean;
    handleAjax: boolean | 'axios' | 'fetch';
    jqueryPlugins?: Record<string, string>; // 플러그인 -> React 매핑
  };
  // 오류 처리
  onError: 'throw' | 'warn' | 'ignore';
  logger?: (message: string, level: 'info' | 'warn' | 'error') => void;
}

export function loadConfig(configPath: string): JQueReactConfig {
  // 파일 기반 설정 로드 로직
  // 기본값과 사용자 설정 병합
  return {
    include: ['src/**/*.{js,html}'],
    exclude: ['node_modules', 'dist'],
    outputDir: 'src/components',
    preserveOriginal: true,
    reactOptions: {
      useHooks: true,
      componentNameStrategy: 'filename',
    },
    transformOptions: {
      handleEvents: true,
      handleAjax: 'axios',
    },
    onError: 'warn',
  };
}
