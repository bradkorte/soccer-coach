/**
 * serve.mjs — Local network server for Soccer Coach PWA
 *
 * Run: node serve.mjs
 *
 * Then on your iPhone, open Safari and go to the URL printed below.
 * Tap Share → "Add to Home Screen" to install as a PWA.
 *
 * Requirements: Mac and iPhone on the same Wi-Fi network.
 */

import { createServer }                          from 'http';
import { readFileSync, existsSync }              from 'fs';
import { extname, join }                         from 'path';
import { networkInterfaces }                     from 'os';

const PORT = 3000;
const DIR  = new URL('.', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.txt':  'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  // Normalise URL — strip query string, decode
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';

  const file = join(DIR, url);

  if (!existsSync(file)) {
    // SPA fallback — serve index.html for any unknown path
    const index = join(DIR, 'index.html');
    if (existsSync(index)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(index));
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  const ext  = extname(file).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  // Service workers require specific headers
  const extra = url.endsWith('sw.js')
    ? { 'Service-Worker-Allowed': '/', 'Cache-Control': 'no-cache' }
    : {};

  res.writeHead(200, { 'Content-Type': mime, ...extra });
  res.end(readFileSync(file));
});

server.listen(PORT, '0.0.0.0', () => {
  // Find local network IP
  const nets = networkInterfaces();
  let localIP = 'localhost';
  for (const iface of Object.values(nets).flat()) {
    if (iface.family === 'IPv4' && !iface.internal) { localIP = iface.address; break; }
  }

  console.log('');
  console.log('⚽  Soccer Coach PWA server running');
  console.log('');
  console.log('  Local:    http://localhost:' + PORT);
  console.log('  Network:  http://' + localIP + ':' + PORT);
  console.log('');
  console.log('📱 On iPhone (same Wi-Fi):');
  console.log('  1. Open Safari → http://' + localIP + ':' + PORT);
  console.log('  2. Tap Share ⬆️  → "Add to Home Screen"');
  console.log('  3. App installs as PWA with offline support');
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
