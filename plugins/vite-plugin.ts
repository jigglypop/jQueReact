// plugins/vite-plugin.ts
import type { Plugin } from 'vite';
import fs from 'fs/promises';
import path from 'path';
import { transformJQueryToReact } from '../src/transformer';
import { minimatch } from 'minimatch';

interface JQueReactOptions {
  include?: string[];
  exclude?: string[];
  outputDir?: string;
  prettier?: boolean;
  customComponentName?: (filePath: string) => string;
}

export default function jquereactPlugin(options: JQueReactOptions = {}): Plugin {
  const {
    include = ['**/*.jquery.js', '**/*.jquery.html'],
    exclude = ['**/node_modules/**', '**/dist/**'],
    outputDir = 'src/components',
    prettier = true,
    customComponentName,
  } = options;

  return {
    name: 'vite-plugin-jquereact',

    async buildStart() {
      // 출력 디렉토리 생성
      try {
        await fs.mkdir(path.resolve(process.cwd(), outputDir), { recursive: true });
      } catch (error) {
        console.error('JQueReact: 출력 디렉토리 생성 실패', error);
      }
    },

    async handleHotUpdate({ file, server }) {
      // 파일이 포함 패턴과 일치하고 제외 패턴과 일치하지 않는지 확인
      const shouldProcess =
        include.some((pattern) => minimatch(file, pattern)) &&
        !exclude.some((pattern) => minimatch(file, pattern));

      if (shouldProcess) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const outputFilePath = getOutputPath(file, outputDir, customComponentName);
          const transformed = await transformJQueryToReact(content, {
            filePath: file,
            prettier,
            componentName: path.basename(outputFilePath, path.extname(outputFilePath)),
          });

          await fs.writeFile(outputFilePath, transformed);
          console.log(`JQueReact: ${file} -> ${outputFilePath}`);

          // 변환된 파일이 이미 로드된 경우 해당 모듈 무효화
          const module = server.moduleGraph.getModuleById(outputFilePath);
          if (module) {
            return [module];
          }
        } catch (error) {
          console.error(`JQueReact: ${file} 처리 중 오류 발생`, error);
        }
      }

      return [];
    },

    async transform(code, id) {
      // 빌드 시간에 실행
      const shouldProcess =
        include.some((pattern) => minimatch(id, pattern)) &&
        !exclude.some((pattern) => minimatch(id, pattern));

      if (shouldProcess) {
        try {
          const outputFilePath = getOutputPath(id, outputDir, customComponentName);
          const transformed = await transformJQueryToReact(code, {
            filePath: id,
            prettier,
            componentName: path.basename(outputFilePath, path.extname(outputFilePath)),
          });

          await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
          await fs.writeFile(outputFilePath, transformed);
          console.log(`JQueReact: ${id} -> ${outputFilePath}`);
        } catch (error) {
          console.error(`JQueReact: ${id} 처리 중 오류 발생`, error);
        }
      }

      // 원본 코드 수정 없이 반환
      return null;
    },
  };
}

// 입력 경로에서 출력 경로 생성
function getOutputPath(
  filePath: string,
  outputDir: string,
  customComponentName?: (filePath: string) => string,
): string {
  const relativePath = path.relative(process.cwd(), filePath);
  const dirName = path.dirname(relativePath);
  const baseName = path.basename(filePath, path.extname(filePath)).replace('.jquery', '');

  const componentName = customComponentName
    ? customComponentName(filePath)
    : toComponentName(baseName);

  return path.join(process.cwd(), outputDir, dirName, `${componentName}.tsx`);
}

// 파일 이름을 React 컴포넌트 이름으로 변환
function toComponentName(name: string): string {
  return name
    .split(/[-_.]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
