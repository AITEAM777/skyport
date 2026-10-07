// Shared helpers for the headless runners: a tiny static server and a Chromium page that has Skyport loaded.
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };

export async function openSkyport({ width = 1600, height = 900, query = '', clearStorage = false } = {}) {
  const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
    if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const url = `http://127.0.0.1:${server.address().port}/${query}`;
  const browser = await chromium.launch({ args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  // Serve three.js from node_modules when present (offline / CDN-blocked environments).
  const localThree = path.join(root, 'node_modules', 'three');
  if (fs.existsSync(localThree)) {
    await page.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\//, (route) => {
      const rel = new URL(route.request().url()).pathname.replace(/^\/npm\/three@[^/]+\//, '');
      const f = path.join(localThree, rel);
      if (!f.startsWith(localThree) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: '' });
      route.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f) });
    });
  }
  // fonts are optional; never wait on them
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await Promise.race([
    page.waitForFunction(() => window.__ready || window.__err, null, { timeout: 180000 }),
    new Promise((_, rej) => page.on('pageerror', e => rej(new Error('page error during boot: ' + e.message)))),
  ]);
  const close = async () => { await browser.close(); server.close(); };
  return { page, context, browser, errors, close, url };
}
