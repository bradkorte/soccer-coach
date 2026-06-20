// Soccer Coach — dev preview server
// Run: node preview-server.mjs
// Then browser opens automatically at http://localhost:3000

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';

const __dir = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.jsx':  'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];
  const filePath = join(__dir, url === '/' ? 'preview.html' : url);
  if (!existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
  const mime = MIME[extname(filePath)] || 'text/plain';
  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
  res.end(readFileSync(filePath));
});
