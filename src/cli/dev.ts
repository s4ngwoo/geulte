import chokidar from 'chokidar';
import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve, extname } from 'path';
import { runBuild } from './build.js';
import { executeFilter } from '../core/filter-engine.js';
import {
  RebuildHub,
  injectLiveReloadScript,
} from '../application/dev/rebuild-hub.js';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function writeSse(res: ServerResponse, data: unknown): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function runDev(port = 3000, projectRoot_?: string): Promise<void> {
  const projectRoot = resolve(projectRoot_ ?? process.cwd());
  const distDir = join(projectRoot, 'dist');
  const hub = new RebuildHub();

  console.log('\x1b[36m🔧 초기 빌드 중...\x1b[0m');
  await runBuild({ syncDb: false, projectRoot }).catch((e) => {
    console.warn(`\x1b[33m⚠  초기 빌드 실패: ${e.message}\x1b[0m`);
  });

  const watcher = chokidar.watch(
    [
      join(projectRoot, 'content'),
      join(projectRoot, 'config.yaml'),
      join(projectRoot, 'geulte.config.mjs'),
      join(projectRoot, 'geulte.config.js'),
      join(projectRoot, 'templates'),
    ],
    { ignoreInitial: true, persistent: true },
  );

  let rebuilding = false;

  async function rebuild(path: string) {
    if (rebuilding) return;
    rebuilding = true;
    console.log(`\x1b[33m↻  변경 감지: ${path}\x1b[0m`);
    try {
      await runBuild({ syncDb: false, projectRoot });
      console.log('\x1b[32m✓ 리빌드 완료\x1b[0m');
      hub.notify({ type: 'reload' });
    } catch (e) {
      const message = (e as Error).message;
      console.warn(`\x1b[31m✗ 리빌드 실패: ${message}\x1b[0m`);
      hub.notify({ type: 'error', message });
    }
    rebuilding = false;
  }

  watcher.on('change', rebuild).on('add', rebuild).on('unlink', rebuild);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = new URL(req.url ?? '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // SSE live reload
    if (pathname === '/_geulte/livereload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      writeSse(res, { type: 'hello' });
      const unsub = hub.subscribe((event) => writeSse(res, event));
      req.on('close', () => unsub());
      return;
    }

    if (pathname === '/api/filter') {
      try {
        const postsData = readFileSync(join(distDir, '_geulte/data/posts.json'), 'utf-8');
        const allPosts = JSON.parse(postsData);
        const criteria = {
          tags: parsedUrl.searchParams.getAll('tags').filter(Boolean),
          topics: parsedUrl.searchParams.getAll('topics').filter(Boolean),
          keywords: parsedUrl.searchParams.getAll('keywords').filter(Boolean),
          category: parsedUrl.searchParams.get('category'),
          series: parsedUrl.searchParams.get('series'),
        };
        const page = Math.max(1, parseInt(parsedUrl.searchParams.get('page') ?? '1', 10));
        const result = executeFilter(allPosts, criteria, page, 20);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: (err as Error).message }));
      }
    }

    if (pathname === '/api/track-view' && req.method === 'POST') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify({ ok: true, view_count: null }));
    }
    if (pathname === '/api/track-view' && req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      });
      return res.end();
    }

    let urlPath = decodeURIComponent(pathname).normalize('NFC');
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    let filePath = join(distDir, urlPath);

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    } else if (!existsSync(filePath)) {
      const indexCandidate = join(filePath, 'index.html');
      if (existsSync(indexCandidate)) {
        filePath = indexCandidate;
      } else if (existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      }
    }

    try {
      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = extname(filePath);
        const mime = MIME_TYPES[ext] ?? 'application/octet-stream';
        const raw = readFileSync(filePath);
        const body =
          ext === '.html' ? injectLiveReloadScript(raw.toString('utf-8')) : raw;
        res.writeHead(200, { 'Content-Type': mime });
        res.end(body);
      } else {
        const notFound = join(distDir, '404.html');
        if (existsSync(notFound)) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(injectLiveReloadScript(readFileSync(notFound, 'utf-8')));
        } else {
          res.writeHead(404);
          res.end('404 Not Found');
        }
      }
    } catch {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  server.listen(port, () => {
    console.log(`\n\x1b[32m🌍 개발 서버 실행 중: http://localhost:${port}\x1b[0m`);
    console.log('\x1b[90m   content/ 변경 시 자동 리빌드 + 브라우저 새로고침. Ctrl+C로 종료.\x1b[0m\n');
  });

  process.on('SIGINT', () => {
    watcher.close();
    server.close();
    process.exit(0);
  });
}
