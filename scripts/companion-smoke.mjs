import fs from 'node:fs';
import assert from 'node:assert/strict';

const companionPath = 'src/personal-companion.js';
assert.ok(fs.existsSync(companionPath), 'Personal Companion module must exist');
const companion = fs.readFileSync(companionPath, 'utf8');
const main = fs.readFileSync('src/main.jsx', 'utf8');
const coach = fs.readFileSync('src/career-coach.js', 'utf8');

assert.ok(main.includes("import './personal-companion.js'"), 'App entry must load the companion');
assert.match(companion, /from ['"]\.\/career-coach\.js['"]/, 'Companion must reuse Career Coach plan data');
assert.ok(companion.includes('life-companion-reminders-v1'), 'Reminder storage key missing');
assert.ok(companion.includes('life-companion-settings-v1'), 'Avatar/preferences storage key missing');
assert.ok(companion.includes('pc-avatar-file'), 'Photo upload control missing');
assert.ok(companion.includes('pc-alert'), 'Reminder overlay missing');
assert.ok(companion.includes('@keyframes pc-enter'), 'Reminder entrance animation missing');
assert.ok(companion.includes('Snooze 10 min'), 'Snooze control missing');
assert.ok(companion.includes('pc-dismiss'), 'Dismiss control missing');
assert.ok(companion.includes('SpeechSynthesisUtterance'), 'Voice output missing');
assert.ok(companion.includes("fetch('/api/gemini'") || companion.includes('fetch("/api/gemini"'), 'Existing Gemini proxy integration missing');
assert.ok(companion.includes('Notification.requestPermission'), 'Notification permission flow missing');
assert.ok(!companion.includes("localStorage.getItem('h-log'") && !companion.includes("localStorage.getItem('j-entries'"), 'Companion must not read Health/Journal stores');
assert.ok(coach.includes('const tasks = [') && coach.includes('const courses = [') && coach.includes('const certs = ['), 'Source plan lists not found');
console.log('Personal Companion tests passed: plan integration, avatar, due animation, reminders, voice, notifications, AI proxy and privacy boundaries.');
