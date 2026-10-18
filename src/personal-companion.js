/*
 * Personal AI Companion v1 for Thamizh's Life Command Centre.
 * Friendly English mentor; reminders/avatar stay in this browser.
 * AI requests use the existing same-origin /api/gemini proxy.
 */
import { tasks, courses, certs } from './career-coach.js';

const REMINDERS_KEY = 'life-companion-reminders-v1';
const SETTINGS_KEY = 'life-companion-settings-v1';
const DEFAULTS = { personality: 'Friendly mentor', language: 'English', speak: true, desktopNotifications: false, avatarDataUrl: '' };
const SYSTEM_PROMPT = [
  'You are Thamizh’s friendly personal mentor, motivator, and reminder companion.',
  'Respond in English. Be warm, practical, encouraging, and honest; never use guilt or shame.',
  'Support career planning, Data Engineering, certifications, PhD coursework, research planning, time management, and everyday routines.',
  'Break big goals into small next actions. Prefer one or two actionable suggestions.',
  'Never claim a reminder was created unless the application confirms it.',
  'Do not diagnose health conditions. Do not ask for or expose private Health or Journal records.',
].join(' ');

const parse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; } };
const getReminders = () => { const x = parse(localStorage.getItem(REMINDERS_KEY), []); return Array.isArray(x) ? x : []; };
const getSettings = () => Object.assign({}, DEFAULTS, parse(localStorage.getItem(SETTINGS_KEY), {}));
const saveSettings = patch => { const next = Object.assign({}, getSettings(), patch); localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); return next; };
const saveReminders = items => localStorage.setItem(REMINDERS_KEY, JSON.stringify(items));
const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const localDateInput = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
const humanDate = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Invalid date' : d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

const templates = [
  ...tasks.map(t => ({ title: t[0], notes: t[1], group: 'Daily Coach' })),
  ...courses.map(c => ({ title: c[0] + ' — ' + c[1], notes: 'Study module: ' + c[2][0] + '. Write a short summary after the session.', group: 'PhD Coursework' })),
  ...certs.filter(c => !/completed/i.test(c.status)).map(c => ({ title: c.name, notes: 'Study focus: ' + c.skills.split(',').slice(0, 3).join(', ') + '. Check the official exam guide.', group: 'Certification' })),
];

function avatarMarkup() {
  const data = getSettings().avatarDataUrl;
  return data ? '<img class="pc-avatar-photo" src="' + data + '" alt="Your avatar">' : '<div class="pc-avatar-default" aria-label="Cartoon avatar">☺</div>';
}

function install() {
  if (document.getElementById('personal-companion')) return;

  const css = [
    '#pc-launcher{position:fixed;left:12px;bottom:12px;z-index:99990;background:#26204f;color:#fff;border:1px solid #6657e8;border-radius:999px;padding:10px 14px;font:700 13px system-ui;cursor:pointer;box-shadow:0 4px 18px #0005}',
    '#pc-panel{display:none;position:fixed;left:12px;bottom:62px;z-index:99991;width:min(470px,calc(100vw - 24px));max-height:84vh;overflow:auto;background:#101626;color:#eef2ff;border:1px solid #36345f;border-radius:17px;padding:14px;box-shadow:0 14px 55px #0008;font:13px system-ui}',
    '#pc-panel.pc-open{display:block}.pc-head{display:flex;align-items:center;gap:9px;margin-bottom:12px}.pc-head h2{font-size:17px;margin:0}.pc-muted{font-size:11px;color:#a6b2ce;line-height:1.45}',
    '.pc-small-avatar{width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid #8173ff;flex:none}.pc-avatar-photo{width:100%;height:100%;object-fit:cover}.pc-avatar-default{width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(140deg,#9b8fff,#4e3cba);font-size:27px;color:#fff}',
    '.pc-tabs,.pc-actions{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}.pc-btn{border:1px solid #3a4562;background:#1b2439;color:#edf2ff;padding:8px 10px;border-radius:9px;cursor:pointer;font:600 12px system-ui}.pc-btn.primary{background:#6657e8;border-color:#6657e8;color:white}',
    '.pc-tab{display:none}.pc-tab.active{display:block}.pc-field{display:grid;gap:5px;margin:9px 0;color:#c5cde4;font-size:12px}.pc-field input,.pc-field select,.pc-field textarea{box-sizing:border-box;width:100%;padding:9px;border-radius:8px;border:1px solid #394562;background:#090f1c;color:#f3f5ff;font:13px system-ui}',
    '.pc-card{border:1px solid #263551;background:#151e31;border-radius:10px;padding:10px;margin:7px 0;line-height:1.45}.pc-card-title{font-weight:750}.pc-card p{margin:5px 0}.pc-card .pc-actions{margin-bottom:0}',
    '.pc-chat-log{height:180px;overflow:auto;padding:9px;border:1px solid #2b3752;background:#090f1c;border-radius:10px}.pc-chat-line{font-size:12px;line-height:1.5;margin:0 0 9px;white-space:pre-wrap;overflow-wrap:anywhere}.pc-chat-line b{color:#b8adff}',
    '.pc-note{font-size:10px;color:#8f9cb9;line-height:1.45;margin-top:10px}',
    '#pc-alert{display:none;position:fixed;right:18px;bottom:16px;z-index:99999;box-sizing:border-box;width:min(390px,calc(100vw - 20px));padding:13px;background:#fbfaff;color:#292643;border:1px solid #dcd8f9;border-radius:17px;box-shadow:0 16px 55px #0007;font-family:system-ui}',
    '#pc-alert.pc-active{display:block;animation:pc-enter .9s cubic-bezier(.2,.8,.2,1) both}.pc-alert-head{display:flex;gap:11px;align-items:center}.pc-walker{position:relative;flex:0 0 90px;width:90px;height:110px;animation:pc-bob .45s ease-in-out infinite alternate}.pc-walker .pc-avatar-photo,.pc-walker .pc-avatar-default{position:absolute;top:0;left:20px;width:49px;height:49px;border:2px solid #6b5ce7;border-radius:50%;object-fit:cover;box-sizing:border-box;overflow:hidden}.pc-walker .pc-avatar-default{font-size:26px;display:grid;place-items:center;background:linear-gradient(140deg,#9b8fff,#4e3cba);color:white}',
    '.pc-body{position:absolute;top:51px;left:24px;width:42px;height:34px;border-radius:12px 12px 8px 8px;background:linear-gradient(140deg,#4d90ef,#2258b5)}.pc-arm,.pc-leg{position:absolute;border-radius:8px;transform-origin:top;animation-duration:.45s;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}.pc-arm{top:56px;width:7px;height:25px;background:#e9b795}.pc-arm.a{left:20px;animation-name:pc-arm-a}.pc-arm.b{left:62px;animation-name:pc-arm-b}.pc-leg{top:81px;width:9px;height:20px;background:#263450}.pc-leg.a{left:32px;animation-name:pc-leg-a}.pc-leg.b{left:50px;animation-name:pc-leg-b}',
    '.pc-alert-title{font-size:15px;font-weight:800;margin:0 0 5px;color:#332c68}.pc-alert-notes{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.45}.pc-alert-time{font-size:10px;color:#7f7a98;margin-top:5px}.pc-alert-buttons{display:flex;gap:7px;margin-top:10px}.pc-alert-buttons button{flex:1;border:0;padding:9px;border-radius:9px;font-weight:750;cursor:pointer}.pc-snooze{background:#e9e6fa;color:#332c68}.pc-done{background:#6657e8;color:#fff}',
    '@keyframes pc-enter{from{transform:translateX(115%);opacity:.2}to{transform:translateX(0);opacity:1}}@keyframes pc-bob{from{transform:translateY(0)}to{transform:translateY(-5px)}}@keyframes pc-arm-a{from{transform:rotate(25deg)}to{transform:rotate(-25deg)}}@keyframes pc-arm-b{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}@keyframes pc-leg-a{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}@keyframes pc-leg-b{from{transform:rotate(25deg)}to{transform:rotate(-25deg)}}',
    '@media(prefers-reduced-motion:reduce){#pc-alert.pc-active,.pc-walker,.pc-arm,.pc-leg{animation:none}}@media(max-width:520px){#pc-launcher{left:7px;bottom:7px;padding:9px 10px}#pc-panel{left:6px;bottom:54px;width:calc(100vw - 12px);max-height:89vh;padding:10px}#pc-alert{right:6px;bottom:6px}}'
  ].join('');
  const style = document.createElement('style'); style.id = 'personal-companion-style'; style.textContent = css; document.head.appendChild(style);

  const templateOptions = templates.map((t, i) => '<option value="' + i + '">' + esc(t.group + ' · ' + t.title) + '</option>').join('');
  const initialDue = localDateInput(new Date(Date.now() + 30 * 60000));
  const root = document.createElement('div');
  root.id = 'personal-companion';
  root.innerHTML = '<button id="pc-launcher" type="button" aria-expanded="false">✦ Personal Companion</button>' +
  '<section id="pc-panel" aria-label="Personal AI Companion">' +
    '<div class="pc-head"><div class="pc-small-avatar" id="pc-small-avatar">' + avatarMarkup() + '</div><div style="flex:1"><h2>Personal AI Companion</h2><div class="pc-muted">Friendly mentor · English · your plans, one next step at a time</div></div><button id="pc-close" class="pc-btn" type="button">Close</button></div>' +
    '<div class="pc-tabs"><button class="pc-btn primary" data-tab="reminders" type="button">Reminders</button><button class="pc-btn" data-tab="chat" type="button">Chat with me</button><button class="pc-btn" data-tab="avatar" type="button">My avatar</button></div>' +
    '<section id="pc-tab-reminders" class="pc-tab active"><div class="pc-card"><b>Build a reminder from your plan</b><div class="pc-muted">Templates come from Career Coach tasks, PhD coursework, and certifications.</div><label class="pc-field">Plan item<select id="pc-template"><option value="">Choose a plan item…</option>' + templateOptions + '</select></label></div>' +
    '<form id="pc-reminder-form"><label class="pc-field">Reminder title<input id="pc-title" maxlength="120" required placeholder="What do you want to remember?"></label><label class="pc-field">Details<textarea id="pc-notes" rows="2" maxlength="500" placeholder="Optional next step or notes"></textarea></label><label class="pc-field">Date and time<input id="pc-due" type="datetime-local" required value="' + initialDue + '"></label><label class="pc-field">Repeat<select id="pc-repeat"><option value="once">One time</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><button type="submit" class="pc-btn primary">＋ Save reminder</button></form>' +
    '<div class="pc-actions"><button id="pc-notifications" class="pc-btn" type="button">Enable desktop notifications</button><button id="pc-test" class="pc-btn" type="button">Test walking avatar</button></div><div id="pc-reminder-list"></div><div class="pc-note">The animated companion appears only when a reminder is due. Keep the Life Command Centre/PWA open for reminders to fire.</div></section>' +
    '<section id="pc-tab-chat" class="pc-tab"><div id="pc-chat-log" class="pc-chat-log" aria-live="polite"><p class="pc-chat-line"><b>Companion:</b> Hi! I’m your friendly mentor. Tell me what’s on your mind and we’ll choose a practical next step.</p></div><form id="pc-chat-form"><label class="pc-field">Message<input id="pc-chat-input" maxlength="2000" required placeholder="Help me plan my study session…"></label><div class="pc-actions"><button id="pc-send" class="pc-btn primary" type="submit">Send message</button><button id="pc-speak-last" class="pc-btn" type="button">Speak last reply</button></div></form><div class="pc-note">Uses the existing /api/gemini server proxy. Private Health and Journal records are not sent to AI.</div></section>' +
    '<section id="pc-tab-avatar" class="pc-tab"><div class="pc-card"><b>Make the avatar look like you</b><p class="pc-muted">Upload your portrait. It is reduced in your browser and stored locally; it is not uploaded to the AI service.</p><label class="pc-field">Photo<input id="pc-avatar-file" type="file" accept="image/png,image/jpeg,image/webp"></label><div class="pc-actions"><button id="pc-clear-avatar" class="pc-btn" type="button">Use cartoon default</button><label style="display:flex;align-items:center;gap:6px"><input id="pc-speak-setting" type="checkbox"> Speak reminders aloud</label></div></div><div class="pc-card"><b>Personality</b><p>Friendly mentor, encouraging motivator, respectful accountability.</p><b>Language</b><p>English</p></div></section>' +
  '</section>' +
  '<aside id="pc-alert" role="alertdialog" aria-label="Reminder due" aria-live="assertive"><div class="pc-alert-head"><div class="pc-walker" id="pc-walker">' + avatarMarkup() + '<div class="pc-body"></div><div class="pc-arm a"></div><div class="pc-arm b"></div><div class="pc-leg a"></div><div class="pc-leg b"></div></div><div><h3 id="pc-alert-title" class="pc-alert-title">Your reminder</h3><div id="pc-alert-notes" class="pc-alert-notes"></div><div id="pc-alert-time" class="pc-alert-time"></div></div></div><div class="pc-alert-buttons"><button id="pc-snooze" class="pc-snooze" type="button">Snooze 10 min</button><button id="pc-dismiss" class="pc-done" type="button">Done for now</button></div></aside>';
  document.body.appendChild(root);

  const panel = root.querySelector('#pc-panel');
  const alertBox = root.querySelector('#pc-alert');
  let activeId = null;
  let chatHistory = [];
  let lastReply = '';

  function speak(text) {
    const settings = getSettings();
    if (!settings.speak || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'en-IN'; u.rate = 0.96;
    const voice = window.speechSynthesis.getVoices().find(v => /^en(-IN|-GB|-US)?/i.test(v.lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  }
  function refreshAvatar() {
    root.querySelector('#pc-small-avatar').innerHTML = avatarMarkup();
    const walker = root.querySelector('#pc-walker');
    walker.querySelectorAll('.pc-avatar-photo,.pc-avatar-default').forEach(el => el.remove());
    walker.insertAdjacentHTML('afterbegin', avatarMarkup());
  }
  function renderList() {
    const items = getReminders().sort((a, b) => a.active === b.active ? new Date(a.dueAt) - new Date(b.dueAt) : Number(b.active) - Number(a.active));
    const host = root.querySelector('#pc-reminder-list');
    if (!items.length) { host.innerHTML = '<div class="pc-card"><b>No reminders yet.</b><p class="pc-muted">Select a plan template above or create your own reminder.</p></div>'; return; }
    host.innerHTML = items.map(r => '<article class="pc-card"><div class="pc-card-title">' + (r.active ? '◷ ' : '✓ ') + esc(r.title) + '</div><div class="pc-muted">' + esc(humanDate(r.dueAt)) + ' · ' + esc(({ once: 'One time', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' })[r.repeat] || 'One time') + (r.source ? ' · ' + esc(r.source) : '') + '</div>' + (r.notes ? '<p>' + esc(r.notes) + '</p>' : '') + '<div class="pc-actions"><button class="pc-btn" type="button" data-edit="' + esc(r.id) + '">Edit / Reactivate</button><button class="pc-btn" type="button" data-delete="' + esc(r.id) + '">Delete</button></div></article>').join('');
    host.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => { saveReminders(getReminders().filter(r => r.id !== b.dataset.delete)); renderList(); }));
    host.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => {
      const r = getReminders().find(x => x.id === b.dataset.edit); if (!r) return;
      root.querySelector('#pc-title').value = r.title; root.querySelector('#pc-notes').value = r.notes || '';
      root.querySelector('#pc-due').value = localDateInput(new Date(r.dueAt)); root.querySelector('#pc-repeat').value = r.repeat || 'once';
      root.querySelector('#pc-reminder-form').dataset.editId = r.id;
      root.querySelector('#pc-reminder-form [type=submit]').textContent = 'Save changes';
      panel.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }
  function showReminder(r) {
    activeId = r.id;
    root.querySelector('#pc-alert-title').textContent = r.title;
    root.querySelector('#pc-alert-notes').textContent = r.notes || 'Time for your next small step. You’ve got this!';
    root.querySelector('#pc-alert-time').textContent = 'Your friendly mentor · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    refreshAvatar();
    alertBox.classList.remove('pc-active'); void alertBox.offsetWidth; alertBox.classList.add('pc-active');
    speak(r.title + (r.notes ? '. ' + r.notes : '. You can do this.'));
    const settings = getSettings();
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      try { const n = new Notification('Personal Companion', { body: r.title, icon: settings.avatarDataUrl || undefined, tag: 'companion-' + r.id }); n.onclick = () => { window.focus(); n.close(); }; } catch (_) {}
    }
  }
  function nextOccurrence(r) {
    const next = new Date(r.dueAt), now = new Date();
    if (r.repeat === 'daily') next.setDate(next.getDate() + 1);
    else if (r.repeat === 'weekly') next.setDate(next.getDate() + 7);
    else if (r.repeat === 'monthly') { const month = next.getMonth() + 1; next.setDate(1); next.setMonth(month); next.setDate(Math.min(28, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate())); }
    else return null;
    let guard = 0;
    while (next <= now && guard++ < 400) {
      if (r.repeat === 'daily') next.setDate(next.getDate() + 1);
      else if (r.repeat === 'weekly') next.setDate(next.getDate() + 7);
      else { const month = next.getMonth() + 1; next.setDate(1); next.setMonth(month); next.setDate(Math.min(28, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate())); }
    }
    return next.toISOString();
  }
  function finish(mode) {
    if (!activeId) return;
    const items = getReminders(), r = items.find(x => x.id === activeId);
    if (r) {
      if (mode === 'snooze') { r.dueAt = new Date(Date.now() + 10 * 60000).toISOString(); r.lastFiredFor = ''; }
      else { const next = nextOccurrence(r); if (next) { r.dueAt = next; r.lastFiredFor = ''; } else r.active = false; }
      saveReminders(items);
    }
    activeId = null; alertBox.classList.remove('pc-active'); renderList();
  }
  function checkDue() {
    if (activeId) return;
    const now = Date.now(), items = getReminders();
    const due = items.find(r => r.active && new Date(r.dueAt).getTime() <= now && r.lastFiredFor !== r.dueAt);
    if (!due) return;
    due.lastFiredFor = due.dueAt; saveReminders(items); showReminder(due);
  }

  root.querySelector('#pc-launcher').addEventListener('click', () => {
    const opened = panel.classList.toggle('pc-open');
    root.querySelector('#pc-launcher').setAttribute('aria-expanded', String(opened));
    if (opened) renderList();
  });
  root.querySelector('#pc-close').addEventListener('click', () => { panel.classList.remove('pc-open'); root.querySelector('#pc-launcher').setAttribute('aria-expanded', 'false'); });
  root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('primary', b === button));
    root.querySelectorAll('.pc-tab').forEach(section => section.classList.toggle('active', section.id === 'pc-tab-' + button.dataset.tab));
  }));
  root.querySelector('#pc-template').addEventListener('change', event => {
    const t = templates[Number(event.target.value)]; if (!t) return;
    root.querySelector('#pc-title').value = t.title; root.querySelector('#pc-notes').value = t.notes;
  });
  root.querySelector('#pc-reminder-form').addEventListener('submit', event => {
    event.preventDefault();
    const title = root.querySelector('#pc-title').value.trim(), dueValue = root.querySelector('#pc-due').value, due = new Date(dueValue);
    if (!title || !dueValue || Number.isNaN(due.getTime()) || due.getTime() < Date.now() - 60000) { window.alert('Enter a title and a date/time in the future.'); return; }
    const form = root.querySelector('#pc-reminder-form'), editId = form.dataset.editId, items = getReminders();
    let r;
    if (editId) {
      r = items.find(x => x.id === editId);
      if (r) Object.assign(r, { title, notes: root.querySelector('#pc-notes').value.trim(), dueAt: due.toISOString(), repeat: root.querySelector('#pc-repeat').value, lastFiredFor: '', active: true });
      delete form.dataset.editId; form.querySelector('[type=submit]').textContent = '＋ Save reminder';
    } else {
      const t = templates[Number(root.querySelector('#pc-template').value)];
      r = { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), title, notes: root.querySelector('#pc-notes').value.trim(), dueAt: due.toISOString(), repeat: root.querySelector('#pc-repeat').value, active: true, lastFiredFor: '', source: t ? t.group : 'Personal' };
      items.push(r);
    }
    saveReminders(items); form.reset(); root.querySelector('#pc-due').value = localDateInput(new Date(Date.now() + 30 * 60000)); root.querySelector('#pc-template').value = ''; renderList();
  });
  root.querySelector('#pc-snooze').addEventListener('click', () => finish('snooze'));
  root.querySelector('#pc-dismiss').addEventListener('click', () => finish('dismiss'));
  root.querySelector('#pc-test').addEventListener('click', () => showReminder({ id: 'test-demo', title: 'A quick demo reminder', notes: 'This is how your walking companion appears. Your real reminders will show their saved title and notes.' }));
  root.querySelector('#pc-notifications').addEventListener('click', async () => {
    if (!('Notification' in window)) { window.alert('This browser does not support desktop notifications. The animated reminder still works while the app is open.'); return; }
    const permission = await Notification.requestPermission(); saveSettings({ desktopNotifications: permission === 'granted' });
    window.alert(permission === 'granted' ? 'Desktop notifications enabled.' : 'Notifications were not enabled. The in-app reminder will still work.');
  });
  root.querySelector('#pc-avatar-file').addEventListener('change', event => {
    const file = event.target.files && event.target.files[0]; if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { window.alert('Choose a PNG, JPG, or WebP image.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 384, scale = Math.min(max / img.width, max / img.height, 1), canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        try { saveSettings({ avatarDataUrl: canvas.toDataURL('image/jpeg', 0.82) }); refreshAvatar(); }
        catch (_) { window.alert('The image could not be saved. Please choose a smaller photo.'); }
      };
      img.onerror = () => window.alert('Could not read this image. Try another photo.'); img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  root.querySelector('#pc-clear-avatar').addEventListener('click', () => { saveSettings({ avatarDataUrl: '' }); refreshAvatar(); });
  root.querySelector('#pc-speak-setting').checked = getSettings().speak !== false;
  root.querySelector('#pc-speak-setting').addEventListener('change', event => saveSettings({ speak: event.target.checked }));

  const log = root.querySelector('#pc-chat-log');
  function chatLine(role, text) {
    const p = document.createElement('p'); p.className = 'pc-chat-line';
    const b = document.createElement('b'); b.textContent = role + ': '; p.appendChild(b); p.appendChild(document.createTextNode(text));
    log.appendChild(p); log.scrollTop = log.scrollHeight;
  }
  root.querySelector('#pc-chat-form').addEventListener('submit', async event => {
    event.preventDefault();
    const input = root.querySelector('#pc-chat-input'), send = root.querySelector('#pc-send'), message = input.value.trim();
    if (!message) return;
    input.value = ''; chatLine('You', message); chatHistory.push({ role: 'user', content: message });
    send.disabled = true; send.textContent = 'Thinking…';
    try {
      const response = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: chatHistory.slice(-12), system: SYSTEM_PROMPT, max_tokens: 600 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'AI service unavailable.');
      const reply = data.content && data.content.map(part => part.text || '').join('').trim();
      if (!reply) throw new Error('The AI returned an empty response.');
      chatHistory.push({ role: 'assistant', content: reply }); lastReply = reply; chatLine('Companion', reply); speak(reply);
    } catch (error) {
      chatLine('Companion', 'I could not reach the AI service right now. ' + (error && error.message ? error.message : 'Please try again later.'));
    } finally { send.disabled = false; send.textContent = 'Send message'; }
  });
  root.querySelector('#pc-speak-last').addEventListener('click', () => speak(lastReply || 'Tell me what you want to work on next, and we will make a small plan.'));

  refreshAvatar(); renderList();
  window.setInterval(checkDue, 15000);
  checkDue();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDue(); });
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
}
