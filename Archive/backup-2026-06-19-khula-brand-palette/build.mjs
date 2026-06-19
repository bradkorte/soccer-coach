/**
 * build.mjs — Khula PWA builder
 *
 * Run:   node build.mjs
 * Push:  see README — node build.mjs then git push
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── 1. Ensure @babel/standalone ───────────────────────────────────────────
if (!existsSync('./node_modules/@babel/standalone/babel.min.js')) {
  console.log('Installing @babel/standalone (one-time ~2 MB)...');
  execSync('npm install --save-dev @babel/standalone', { stdio: 'inherit' });
  console.log('Installed');
}
const Babel = require('@babel/standalone');

// ── 2. CDN URLs ───────────────────────────────────────────────────────────
const CDN          = 'https://cdnjs.cloudflare.com/ajax/libs';
const REACT_URL    = CDN + '/react/18.2.0/umd/react.production.min.js';
const REACTDOM_URL = CDN + '/react-dom/18.2.0/umd/react-dom.production.min.js';
console.log('React 18: CDN (cached by SW after first load)');

// ── 3. Compile JSX ────────────────────────────────────────────────────────
let jsx = readFileSync('./soccer-coach.jsx', 'utf8');
jsx = jsx
  .replace(/^import\s+\{([^}]+)\}\s+from\s+['"]react['"]\s*;?/m, (_, n) => 'var { ' + n.trim() + ' } = React;')
  .replace(/^import\s+React\s+from\s+['"]react['"]\s*;?/m, '')
  .replace(/^import\s+ReactDOM\s+from\s+['"]react-dom['"]\s*;?/m, '')
  .replace(/^import\s+.*?from\s+['"]react-dom\/client['"]\s*;?/m, '')
  .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?$/gm, '')
  .replace(/^export\s+default\s+/gm, '')
  .replace(/^export\s+\{[^}]*\}\s*;?$/gm, '');

console.log('Compiling soccer-coach.jsx (' + (jsx.length / 1024).toFixed(0) + ' KB)...');
const { code: compiled } = Babel.transform(jsx, {
  presets: [['react', { runtime: 'classic' }]],
  filename: 'soccer-coach.jsx',
});
console.log('Compiled: ' + (compiled.length / 1024).toFixed(0) + ' KB');

function escScript(s) {
  return s.replace(/<\/(script)/gi, '<\\/$1');
}

// ── 4. manifest.json — relative paths so it works on any host/subdirectory ─
const manifest = {
  name: "Khula",
  short_name: "Khula",
  start_url: "./",
  display: "standalone",
  background_color: "#166534",
  theme_color: "#E8A020",
  orientation: "portrait",
  icons: [{
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%230D0D0D'/%3E%3Ctext y='.9em' font-size='80'%3E%E2%9A%BD%3C/text%3E%3C/svg%3E",
    sizes: "any",
    type: "image/svg+xml",
    purpose: "any maskable"
  }]
};
writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2), 'utf8');
console.log('manifest.json written');

// ── 5. sw.js — relative paths so scope works under any subdirectory ────────
const swLines = [
  "const CACHE = 'soccer-coach-v2';",
  "const PRECACHE = ['./','./index.html','./manifest.json','" + REACT_URL + "','" + REACTDOM_URL + "'];",
  "",
  "self.addEventListener('install', e => {",
  "  self.skipWaiting();",
  "  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(err => console.warn('SW precache:', err)));",
  "});",
  "",
  "self.addEventListener('activate', e => {",
  "  e.waitUntil(",
  "    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))",
  "      .then(() => self.clients.claim())",
  "  );",
  "});",
  "",
  "self.addEventListener('fetch', e => {",
  "  if (e.request.method !== 'GET') return;",
  "  e.respondWith(",
  "    caches.match(e.request).then(cached => {",
  "      if (cached) return cached;",
  "      return fetch(e.request).then(resp => {",
  "        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;",
  "        const clone = resp.clone();",
  "        caches.open(CACHE).then(c => c.put(e.request, clone));",
  "        return resp;",
  "      }).catch(() => {",
  "        if (e.request.destination === 'document') return caches.match('./index.html');",
  "      });",
  "    })",
  "  );",
  "});",
];
writeFileSync('./sw.js', swLines.join('\n'), 'utf8');
console.log('sw.js written');

// ── 6. index.html ─────────────────────────────────────────────────────────
const htmlParts = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="theme-color" content="#F5C04A">',
  '<meta name="apple-mobile-web-app-title" content="Khula">',
  '<title>Khula</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">',
  '<link rel="manifest" href="manifest.json">',
  '<style>',
  '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
  "body{margin:0;font-family:'Outfit',sans-serif;background:#0D0D0D;color:#FFFFFF;overflow-x:hidden}",
  '#splash{position:fixed;inset:0;background:#0D0D0D;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;gap:16px;z-index:9999}',
  '.spin{width:36px;height:36px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}',
  '@keyframes spin{to{transform:rotate(360deg)}}',
  '</style>',
  '</head>',
  '<body>',
  '<div id="splash">',
  '  <div style="font-size:2rem;font-family:Outfit,sans-serif;font-weight:900;color:#F5C04A;letter-spacing:4px">KHULA</div>',
  '  <div class="spin"></div>',
  '  <div id="splashMsg">Starting&#x2026;</div>',
  '</div>',
  '<div id="root"></div>',
  '<script>',
  'window.onerror=function(msg,src,line,col,err){',
  '  var el=document.getElementById("splashMsg");',
  '  if(el) el.textContent="JS Error: "+(err?err.message:msg)+" (line "+line+")";',
  '  return true;',
  '};',
  'window.onunhandledrejection=function(e){',
  '  var el=document.getElementById("splashMsg");',
  '  if(el) el.textContent="Unhandled: "+(e.reason&&e.reason.message||e.reason);',
  '};',
  "if('serviceWorker' in navigator){",
  "  window.addEventListener('load',()=>{",
  "    navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('SW reg failed:',err));",
  '  });',
  '}',
  '</script>',
  '<script crossorigin src="' + REACT_URL + '"></script>',
  '<script crossorigin src="' + REACTDOM_URL + '"></script>',
  '<script>',
  '(function(){',
  '"use strict";',
  'var _setMsg=function(m){var el=document.getElementById("splashMsg");if(el)el.textContent=m;};',
  'try{',
  escScript(compiled),
  'ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));',
  'document.getElementById("splash").style.display="none";',
  '}catch(e){',
  '_setMsg("Error: "+e.message);',
  'console.error("App error:", e);',
  '}',
  '})();',
  '</script>',
  '</body>',
  '</html>',
];

const html = htmlParts.join('\n');
writeFileSync('./index.html', html, 'utf8');
const kb = (html.length / 1024).toFixed(0);
console.log('');
console.log('Built index.html (' + kb + ' KB)');
console.log('All PWA files ready: index.html  manifest.json  sw.js');
console.log('');
console.log('  Rebuild: node build.mjs');
