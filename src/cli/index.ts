#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf-8'),
);

const program = new Command();

program
  .name('geulte')
  .description('Obsidian 스타일 마크다운을 다중 분류 블로그로 변환하는 정적 사이트 프레임워크')
  .version(pkg.version);

// ── geulte init <project-name> ────────────────────────────────────────────
program
  .command('init <project-name>')
  .description('새 글터 프로젝트를 스캐폴딩합니다')
  .action(async (projectName: string) => {
    const { runInit } = await import('./init.js');
    await runInit(projectName);
  });

// ── geulte build ──────────────────────────────────────────────────────────
program
  .command('build')
  .description('정적 사이트 빌드 + Supabase 동기화')
  .option('--no-sync', 'Supabase 동기화 건너뜀')
  .option('--root <path>', '프로젝트 루트 경로')
  .action(async (opts: { sync: boolean; root?: string }) => {
    const { runBuild } = await import('./build.js');
    await runBuild({ syncDb: opts.sync, projectRoot: opts.root });
  });

// ── geulte dev ────────────────────────────────────────────────────────────
program
  .command('dev')
  .description('로컬 개발 서버 실행 (파일 변경 감지 및 자동 리빌드)')
  .option('-p, --port <port>', '포트 번호', '3000')
  .option('--root <path>', '프로젝트 루트 경로')
  .action(async (opts: { port: string; root?: string }) => {
    const { runDev } = await import('./dev.js');
    await runDev(parseInt(opts.port, 10), opts.root);
  });

// ── geulte sync ───────────────────────────────────────────────────────────
program
  .command('sync')
  .description('빌드 없이 Supabase 메타데이터/백링크만 동기화')
  .option('--root <path>', '프로젝트 루트 경로')
  .action(async (opts: { root?: string }) => {
    const { runSync } = await import('./sync.js');
    await runSync(opts.root);
  });

program.parse();
