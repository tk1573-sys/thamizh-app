import fs from 'node:fs';
import assert from 'node:assert/strict';

const required = [
  'index.html', 'src/main.jsx', 'src/App.jsx', 'src/career-hub.js',
  'api/health.js', 'api/sync.js', 'vite.config.js'
];
for (const file of required) assert.ok(fs.existsSync(file), `Missing ${file}`);

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.jsx', 'utf8');
const hub = fs.readFileSync('src/career-hub.js', 'utf8');
const vite = fs.readFileSync('vite.config.js', 'utf8');
const sync = fs.readFileSync('api/sync.js', 'utf8');

assert.match(index, /viewport[^>]+viewport-fit=cover/);
assert.match(main, /virtual:pwa-register/);
assert.match(main, /career-hub\.js/);
assert.match(vite, /VitePWA/);
assert.match(vite, /registerType:\s*['"]autoUpdate['"]/);
assert.match(sync, /storeId/);
assert.match(hub, /AWS Certified Data Engineer/);
assert.match(hub, /SnowPro Core/);
assert.match(hub, /Databricks Certified Data Engineer/);
assert.match(hub, /Claude Certified Architect/);
assert.match(hub, /GitHub Copilot/);
assert.match(hub, /tnpsc\.gov\.in/);
assert.match(hub, /trb\.tn\.gov\.in/);
assert.match(hub, /upsc\.gov\.in/);
assert.match(hub, /ssc\.gov\.in/);
assert.match(hub, /ncs\.gov\.in/);
assert.match(hub, /ugcnet\.nta\.ac\.in/);

console.log('Smoke tests passed: mobile/PWA, Blob sync wiring, certification hub and official opportunity links.');
