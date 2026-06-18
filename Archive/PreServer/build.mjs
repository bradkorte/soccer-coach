/**
 * build.mjs — Soccer Coach PWA builder
 *
 * Run once: node build.mjs
 *
 * What it does:
 *   1. Installs @babel/standalone locally (one-time, ~2 MB)
 *   2. Downloads React 18 + ReactDOM 18 production builds from CDN
 *   3. Compiles soccer-coach.jsx → plain JS (no Babel needed on device)
 *   4. Writes index.html — a single file with zero external dependencies
 *
 * Requirements: Node.js 18+ (already installed if you ran preview-server.mjs)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── 1. Ensure @babel/standalone is available ───────────────────────────────
if (!existsSync('./node_modules/@babel/standalone/babel.min.js')) {
  console.log('📦 Installing @babel/standalone (one-time ~2 MB)…');
  execSync('npm install --save-dev @babel/standalone', { stdio: 'inherit' });
  console.log('✓ Installed');
}
const Babel = require('@babel/standalone');

// ── 2. React loaded via CDN tags in HTML (no local caching needed) ────────
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs';
const REACT_URL    = `${CDN}/react/18.2.0/umd/react.production.min.js`;
const REACTDOM_URL = `${CDN}/react-dom/18.2.0/umd/react-dom.production.min.js`;
console.log('✓ React 18: CDN tags (cached by browser after first load)');

// ── 4. Compile JSX ────────────────────────────────────────────────────────
let jsx = readFileSync('./soccer-coach.jsx', 'utf8');

// Replace ES module imports with global destructures so the compiled output
// works in a plain <script> tag where React/ReactDOM are UMD globals.
jsx = jsx
  // import { useState, ... } from "react"  →  var { useState, ... } = React
  .replace(
    /^import\s+\{([^}]+)\}\s+from\s+['"]react['"]\s*;?/m,
    (_, names) => `var { ${names.trim()} } = React;`
  )
  // import React from "react"  →  (React is already global)
  .replace(/^import\s+React\s+from\s+['"]react['"]\s*;?/m, '')
  // import ReactDOM from "react-dom"  →  (ReactDOM is already global)
  .replace(/^import\s+ReactDOM\s+from\s+['"]react-dom['"]\s*;?/m, '')
  // import ... from "react-dom/client"  →  (already global)
  .replace(/^import\s+.*?from\s+['"]react-dom\/client['"]\s*;?/m, '')
  // any remaining bare import lines (safety net)
  .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?$/gm, '')
  // export default App  →  (App is already in scope)
  .replace(/^export\s+default\s+/gm, '')
  // export { App }  →  strip entirely
  .replace(/^export\s+\{[^}]*\}\s*;?$/gm, '');

console.log(`⚙️  Compiling soccer-coach.jsx (${(jsx.length / 1024).toFixed(0)} KB)…`);
const { code: compiled } = Babel.transform(jsx, {
  presets: [['react', { runtime: 'classic' }]],
  filename: 'soccer-coach.jsx',
});
console.log(`✓ Compiled: ${(compiled.length / 1024).toFixed(0)} KB`);

// ── 5. Escape </script> so it can't close inline <script> tags early ──────
// The browser's HTML parser is not JS-aware: it closes a <script> block the
// moment it sees the literal string </script>, even inside a string literal.
function escScript(s) {
  return s.replace(/<\/(script)/gi, '<\\/$1');
}

// ── 6. Build HTML ─────────────────────────────────────────────────────────
const html =
`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#166534">
<meta name="apple-mobile-web-app-title" content="Soccer Coach">
<title>Soccer Coach</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0fdf4;color:#1f2937;overflow-x:hidden}
#splash{position:fixed;inset:0;background:#166534;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;gap:16px;z-index:9999}
.spin{width:36px;height:36px;border:4px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
<script>
(function(){
  var mf={name:"Soccer Coach",short_name:"Coach",start_url:".",display:"standalone",
    background_color:"#166534",theme_color:"#166534",
    icons:[{src:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23166534'/%3E%3Ctext y='.9em' font-size='80'%3E%E2%9A%BD%3C/text%3E%3C/svg%3E",sizes:"512x512",type:"image/svg+xml"}]};
  var b=new Blob([JSON.stringify(mf)],{type:'application/json'});
  var l=document.createElement('link');
  l.rel='manifest';l.href=URL.createObjectURL(b);
  document.head.appendChild(l);
})();
</script>
</head>
<body>
<div id="splash">
  <div style="font-size:3rem">⚽</div>
  <div class="spin"></div>
  <div id="splashMsg">Starting…</div>
</div>
<div id="root"></div>
<script>
window.onerror=function(msg,src,line,col,err){
  var el=document.getElementById('splashMsg');
  if(el) el.textContent='JS Error: '+(err?err.message:msg)+' (line '+line+')';
  return true;
};
window.onunhandledrejection=function(e){
  var el=document.getElementById('splashMsg');
  if(el) el.textContent='Unhandled: '+(e.reason&&e.reason.message||e.reason);
};
</script>

<!-- React 18 — loaded from CDN, cached by browser after first load -->
<script crossorigin src="${REACT_URL}"></script>
<script crossorigin src="${REACTDOM_URL}"></script>

<!-- App (pre-compiled — no Babel required on device) -->
<script>
(function(){
"use strict";
var _setMsg=function(m){var el=document.getElementById('splashMsg');if(el)el.textContent=m;};
try{
` + escScript(compiled) + `
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
document.getElementById('splash').style.display='none';
}catch(e){
_setMsg('Error: '+e.message);
console.error('App error:', e);
}
})();
</script>
</body>
</html>`;

writeFileSync('./index.html', html, 'utf8');
const kb = (html.length / 1024).toFixed(0);
console.log('');
console.log('Built index.html (' + kb + ' KB)');
console.log('');
console.log('To update: node build.mjs');

