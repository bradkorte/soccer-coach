/**
 * build.mjs — Khula PWA builder
 *
 * Run:   node build.mjs
 *
 * React is downloaded once and cached locally in react-cache/.
 * After the first build, the app works fully offline with no CDN dependency.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import https from 'https';

const require = createRequire(import.meta.url);

// ── 1. Ensure @babel/standalone ───────────────────────────────────────────
if (!existsSync('./node_modules/@babel/standalone/babel.min.js')) {
  console.log('Installing @babel/standalone (one-time ~2 MB)...');
  execSync('npm install --save-dev @babel/standalone', { stdio: 'inherit' });
  console.log('Installed');
}
const Babel = require('@babel/standalone');

// ── 2. Fetch React & ReactDOM (cached locally after first download) ────────
const CACHE_DIR   = './react-cache';
const REACT_CACHE = CACHE_DIR + '/react.min.js';
const RDOM_CACHE  = CACHE_DIR + '/react-dom.min.js';
const REACT_URL   = 'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js';
const RDOM_URL    = 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js';

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 20000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode)); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function getReact() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR);
  if (existsSync(REACT_CACHE) && existsSync(RDOM_CACHE)) {
    console.log('React 18: using local cache (react-cache/)');
    return { reactSrc: readFileSync(REACT_CACHE,'utf8'), rdomSrc: readFileSync(RDOM_CACHE,'utf8') };
  }
  console.log('React 18: downloading from CDN (one-time, will cache locally)...');
  try {
    const reactSrc = await download(REACT_URL);
    const rdomSrc  = await download(RDOM_URL);
    writeFileSync(REACT_CACHE, reactSrc, 'utf8');
    writeFileSync(RDOM_CACHE,  rdomSrc,  'utf8');
    console.log('React cached to react-cache/ — future builds use local copy');
    return { reactSrc, rdomSrc };
  } catch (e) {
    console.error('ERROR: Could not download React:', e.message);
    console.error('Check your internet connection and run build.mjs again.');
    process.exit(1);
  }
}

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

// ── 4. manifest.json ─────────────────────────────────────────────────────
const manifest = {
  name: "Khula", short_name: "Khula", start_url: "./", display: "standalone",
  background_color: "#166534", theme_color: "#E8A020", orientation: "portrait",
  icons: [{ src:"./apple-touch-icon.png", sizes:"224x208", type:"image/png", purpose:"any maskable" }]
};
writeFileSync('./manifest.json', JSON.stringify(manifest, null, 2), 'utf8');
console.log('manifest.json written');

// ── 5. sw.js — React is inlined so no CDN URLs needed ────────────────────
const swLines = [
  "const CACHE = 'soccer-coach-v5';",
  "const PRECACHE = ['./','./index.html','./manifest.json','./apple-touch-icon.png'];",
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

// ── 6. Build index.html with React inlined ────────────────────────────────
const { reactSrc, rdomSrc } = await getReact();

const head = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#F5C04A">
<meta name="apple-mobile-web-app-title" content="Khula">
<title>Khula</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="apple-touch-icon" href="./apple-touch-icon.png">
<link rel="manifest" href="manifest.json">
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;font-family:'Outfit',sans-serif;background:#0D0D0D;color:#FFFFFF;overflow-x:hidden}
#root{padding-top:env(safe-area-inset-top);box-sizing:border-box}
#splash{position:fixed;inset:0;background:#0D0D0D;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;gap:16px;z-index:9999}
.spin{width:36px;height:36px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="splash">
  <div style="font-size:2rem;font-family:Outfit,sans-serif;font-weight:900;color:#F5C04A;letter-spacing:4px">KHULA</div>
  <div class="spin"></div>
  <div id="splashMsg">Starting&#x2026;</div>
</div>
<div id="root"></div>
<script>
window.onerror=function(msg,src,line,col,err){
  var el=document.getElementById("splashMsg");
  if(el) el.textContent="JS Error: "+(err?err.message:msg)+" (line "+line+")";
  return true;
};
window.onunhandledrejection=function(e){
  var el=document.getElementById("splashMsg");
  if(el) el.textContent="Unhandled: "+(e.reason&&e.reason.message||e.reason);
};
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('SW reg failed:',err));
  });
}
</script>`;

const tail = `<script>
(function(){
"use strict";
var _setMsg=function(m){var el=document.getElementById("splashMsg");if(el)el.textContent=m;};
try{
${escScript(compiled)}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
document.getElementById("splash").style.display="none";
}catch(e){
_setMsg("Error: "+e.message);
console.error("App error:", e);
}
})();
</script>
</body>
</html>`;

const html = head + '\n<!-- React 18 inlined -->\n<script>' + escScript(reactSrc) + '</script>\n<script>' + escScript(rdomSrc) + '</script>\n' + tail;
writeFileSync('./index.html', html, 'utf8');
const kb = (html.length / 1024).toFixed(0);
console.log('');
console.log('Built index.html (' + kb + ' KB) — React inlined, no CDN needed');
console.log('All PWA files ready: index.html  manifest.json  sw.js');
console.log('');
console.log('  Rebuild: node build.mjs');
