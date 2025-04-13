#!/usr/bin/env node
// bin/jquereact.ts
import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob'; // import 방식 변경
import { transformJQueryToReact } from '../src/transformer';

program.name('jquereact').description('jQuery를 React 컴포넌트로 변환').version('0.0.1');

program
  .command('transform')
  .description('jQuery 파일을 React 컴포넌트로 변환')
  .argument('<pattern>', 'jQuery 파일 경로 (glob 패턴)')
  .option('-o, --output <dir>', '출력 디렉토리', 'src/components')
  .option('-p, --prettier', 'Prettier로 포맷팅 적용', true)
  .action(async (globPattern, options) => {
    try {
      // 파일 찾기 - 새로운 glob API 사용
      const files = await glob(globPattern);

      if (files.length === 0) {
        console.log('변환할 파일을 찾을 수 없습니다.');
        return;
      }

      console.log(`${files.length}개 파일 변환 시작...`);

      // 출력 디렉토리 생성
      await fs.mkdir(path.resolve(process.cwd(), options.output), { recursive: true });

      // 모든 파일 처리
      let successCount = 0;
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const baseName = path.basename(file, path.extname(file));
          const componentName = toComponentName(baseName);

          const transformed = await transformJQueryToReact(content, {
            filePath: file,
            prettier: options.prettier,
            componentName,
          });

          const outputFilePath = path.join(process.cwd(), options.output, `${componentName}.tsx`);

          await fs.writeFile(outputFilePath, transformed);
          console.log(`✅ ${file} -> ${outputFilePath}`);
          successCount++;
        } catch (error) {
          console.error(`❌ ${file} 처리 중 오류:`, error);
        }
      }

      console.log(`변환 완료: ${successCount}/${files.length} 파일 성공`);
    } catch (error) {
      console.error('변환 중 오류 발생:', error);
      process.exit(1);
    }
  });

program.parse();

// 파일 이름을 컴포넌트 이름으로 변환
function toComponentName(name: string): string {
  return name
    .replace(/\.jquery$/, '') // .jquery 접미사 제거
    .split(/[-_.]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
