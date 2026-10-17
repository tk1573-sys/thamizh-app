import fs from 'node:fs';
import assert from 'node:assert/strict';

const required = [
  'src/CareerCommandCentre.jsx', 'src/career-refresh-core.mjs', 'api/career-refresh.js', 'scripts/career-refresh.mjs', '.github/workflows/daily-career-refresh.yml',
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
assert.match(coach, /Claude Architect Professional/);
assert.match(coach, /GitHub Copilot/);
assert.match(coach, /tnpsc\.gov\.in/);
assert.match(coach, /trb\.tn\.gov\.in/);
assert.match(coach, /upsc\.gov\.in/);
assert.match(coach, /ssc\.gov\.in/);
assert.match(coach, /ncs\.gov\.in/);
assert.match(coach, /ugcnet\.nta\.ac\.in/);

const careerUi = fs.readFileSync('src/CareerCommandCentre.jsx', 'utf8');
const careerCore = fs.readFileSync('src/career-refresh-core.mjs', 'utf8');
const careerApi = fs.readFileSync('api/career-refresh.js', 'utf8');
const careerWorkflow = fs.readFileSync('.github/workflows/daily-career-refresh.yml', 'utf8');
assert.match(careerUi, /Refresh Jobs Now/);
assert.match(careerUi, /thamiz-career-applications-v1/);
assert.match(careerCore, /Requires manual verification/);
assert.match(careerApi, /discoverCareerJobs/);
assert.match(careerWorkflow, /30 2 \* \* \*/);
console.log('Smoke tests passed: PWA, sync, career source discovery, daily workflow and application tracking.');
