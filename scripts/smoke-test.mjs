import fs from 'node:fs';
import assert from 'node:assert/strict';

const required = [
  'index.html', 'src/main.jsx', 'src/App.jsx', 'src/career-coach.js',
  'api/health.js', 'api/sync.js', 'vite.config.js'
];
for (const file of required) assert.ok(fs.existsSync(file), `Missing ${file}`);

const index = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.jsx', 'utf8');
const coach = fs.readFileSync('src/career-coach.js', 'utf8');
const vite = fs.readFileSync('vite.config.js', 'utf8');
const sync = fs.readFileSync('api/sync.js', 'utf8');

assert.match(index, /viewport[^>]+viewport-fit=cover/);
assert.match(main, /virtual:pwa-register/);
assert.match(main, /career-coach\.js/);
assert.match(vite, /VitePWA/);
assert.match(vite, /registerType:\s*['"]autoUpdate['"]/);
assert.match(sync, /storeId/);
assert.match(coach, /AWS Certified Data Engineer/);
assert.match(coach, /SnowPro Core/);
assert.match(coach, /Databricks Certified Data Engineer/);
assert.match(coach, /Claude Certified Architect/);
assert.match(coach, /GitHub Copilot/);
assert.match(coach, /tnpsc\.gov\.in/);
assert.match(coach, /trb\.tn\.gov\.in/);
assert.match(coach, /upsc\.gov\.in/);
assert.match(coach, /ssc\.gov\.in/);
assert.match(coach, /ncs\.gov\.in/);
assert.match(coach, /ugcnet\.nta\.ac\.in/);

console.log('Smoke tests passed: mobile/PWA, Blob sync wiring, certification hub and official opportunity links.');
