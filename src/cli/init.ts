import { mkdirSync, writeFileSync, cpSync, existsSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_DIR = resolve(__dirname, '../../templates/scaffold');

export async function runInit(projectName: string) {
  const targetDir = resolve(process.cwd(), projectName);

  if (existsSync(targetDir)) {
    console.error(`\x1b[31m✗ 디렉토리가 이미 존재합니다: ${targetDir}\x1b[0m`);
    process.exit(1);
  }

  console.log(`\x1b[36m🌱 글터 프로젝트 생성 중: ${projectName}\x1b[0m`);

  // 스캐폴드 복사
  cpSync(SCAFFOLD_DIR, targetDir, { recursive: true });

  // package.json의 name을 프로젝트명으로 교체
  const pkgPath = join(targetDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log(`
\x1b[32m✓ 프로젝트 생성 완료!\x1b[0m

다음 단계:
  \x1b[36mcd ${projectName}\x1b[0m
  \x1b[36mnpm install\x1b[0m
  \x1b[36mnpx geulte dev\x1b[0m

config.yaml을 편집해 사이트 정보를 설정하세요.
content/posts/ 폴더에 마크다운 글을 추가하세요.
`);
}
