import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeDemo, validateInput } from './analyzer.js';
import { aiAnalyze } from './ai.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3001);
const hasAI = Boolean(process.env.OPENAI_API_KEY);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function send(res, status, data, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  });
  res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && pathname === '/api/status') {
      return send(res, 200, { aiConfigured: hasAI, mode: hasAI ? 'ai-available' : 'demo-only' });
    }
    if (req.method === 'POST' && pathname === '/api/analyze') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 16000) return send(res, 413, { error: '입력 크기를 줄여주세요.' });
      }
      let input;
      try {
        input = JSON.parse(body);
      } catch {
        return send(res, 400, { error: '잘못된 JSON 형식입니다.' });
      }
      const error = validateInput(input);
      if (error) return send(res, 400, { error });
      if (/\b\d{6}\s*-?\s*\d{7}\b/.test(input.note)) {
        return send(res, 400, { error: '주민등록번호로 보이는 정보가 포함되어 있습니다.' });
      }
      if (input.mode === 'demo') return send(res, 200, analyzeDemo(input));
      if (!hasAI) return send(res, 503, { error: 'AI API 키가 설정되지 않았습니다. 데모 모드를 사용하세요.' });
      try {
        return send(res, 200, await aiAnalyze(input));
      } catch (e) {
        return send(res, 502, { error: 'AI 분석에 실패했습니다.', detail: e.message });
      }
    }
    if (req.method !== 'GET') return send(res, 405, { error: '허용되지 않은 요청입니다.' });
    if (pathname.startsWith('/api/')) return send(res, 404, { error: '찾을 수 없습니다.' });
    const dist = path.join(root, 'dist');
    const resolved = path.resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!(resolved === dist || resolved.startsWith(dist + path.sep))) return send(res, 403, { error: '접근 불가' });
    let filepath = resolved;
    try {
      if (!(await stat(filepath)).isFile()) filepath = path.join(dist, 'index.html');
    } catch {
      filepath = path.join(dist, 'index.html');
    }
    try {
      return send(res, 200, await readFile(filepath), mime[path.extname(filepath)] || 'application/octet-stream');
    } catch {
      return send(res, 404, { error: '배포용 프론트엔드가 없습니다. npm run build를 먼저 실행하세요.' });
    }
  } catch {
    return send(res, 500, { error: '서버 오류가 발생했습니다.' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, '0.0.0.0', () => console.log(`CareBridge API + web http://localhost:${port}`));
}
export { server };
