/*
 * Optional, user-authorized Life Coach publisher.
 * This is not a companion UI. Configure at /coach-sync-setup.html.
 * Only explicitly selected planning data is published; Health/Journal logs
 * and life-memory-v2 are never uploaded by this module.
 */
const ENABLED_KEY = "life-coach-sync-enabled-v1";
const TOKEN_KEY = "life-coach-sync-token-v1";
const PROFILE_KEY = "life-coach-sync-profile-v1";
const lastBodyKey = "life-coach-sync-last-publish-v1";
const endpoint = "/api/coach-sync";
const LIMIT = 280;

function parse(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value == null ? fallback : value; }
  catch (_) { return fallback; }
}
function clean(value, max = 3000) {
  if (value == null) return "";
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return "";
  return String(value).trim().slice(0, max);
}
function record(id, area, title, details, status, priority, targetDate, source) {
  const name = clean(title, 300);
  if (!name) return null;
  return {
    id: clean(id, 150) || ("plan-" + Math.random().toString(16).slice(2)),
    area: clean(area, 100) || "Personal",
    title: name, details: clean(details, 3000),
    status: clean(status, 80) || "Planned",
    priority: clean(priority, 50) || "Normal",
    target_date: clean(targetDate, 80),
    source: clean(source, 100) || "Life Command Centre"
  };
}
function uniqueRecords(values) {
  const seen = new Set();
  return values.filter(Boolean).filter(item => {
    const key = item.id || (item.area + "|" + item.title);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, LIMIT);
}

function buildApprovedPack() {
  const profile = parse(PROFILE_KEY, {});
  const memory = parse("life-memory-v2", {});
  const goals = [];
  const tasks = [];
  const projects = [];
  const deadlines = [];

  // Optional user-authored goals, entered in the setup utility.
  (Array.isArray(profile.goals) ? profile.goals : []).forEach((item, i) => {
    const r = record(item.id || ("goal-" + i), item.area || "Personal Goal", item.title, item.details, item.status, item.priority, item.target_date, "Coach sharing setup");
    if (r) goals.push(r);
  });

  // Career Coach daily tasks are already part of the product's curated plan.
  const daily = [
    ["Daily Core", "45 min SQL/Python: one problem + one production-style ETL improvement", "Learning"],
    ["Certification", "60 min on the current priority certification; rotate SnowPro, Databricks, AWS and Claude", "Certification"],
    ["PhD Coursework", "60 min on one CS8015/CS8044/CS8051/UM8001 module + 5-line notes", "PhD / Coursework"],
    ["Research", "30 min: one paper, Mendeley record, dataset/experiment note or supervisor action", "PhD / Research"],
    ["Career", "20 min: one application, resume bullet, GitHub improvement or interview question", "Career"],
    ["UGC NET", "30 min: one Computer Science topic + 15 MCQs; log weak areas", "Academic"],
    ["Journal", "10 min: record completed work, blocker and tomorrow Top 3", "Personal routine"]
  ];
  daily.forEach((x, i) => {
    const r = record("daily-" + i, x[2], x[0], x[1], "Planned", "Normal", "", "Career Coach template");
    if (r) tasks.push(r);
  });

  // Actual PhD task records shared from the existing tracker; no meeting transcript or private notes.
  const phdTasks = Array.isArray(memory.phd?.tasks) ? memory.phd.tasks : [];
  phdTasks.filter(x => x && String(x.status || "").toLowerCase() !== "done").forEach((x, i) => {
    const r = record(x.id || ("phd-task-" + i), "PhD / Research", x.title || x.desc, x.notes || x.details || "", x.status, x.priority, x.due, "PhD Planner");
    if (r) tasks.push(r);
  });

  // Application tracker: share status and a short description only; no resume/JD text.
  const appStatus = memory.career?.appStatus && typeof memory.career.appStatus === "object" ? memory.career.appStatus : {};
  Object.entries(appStatus).slice(0, 100).forEach(([id, status]) => {
    const r = record(id, "Career / Applications", "Application " + id, "", typeof status === "string" ? status : "Tracked", "Normal", "", "Career Radar");
    if (r) tasks.push(r);
  });

  // Shared pending work is a structured follow-up list; do not publish notes/history.
  const pending = Array.isArray(memory.shared?.pending) ? memory.shared.pending : [];
  pending.filter(x => x && String(x.status || "").toLowerCase() !== "done").forEach((x, i) => {
    const r = record(x.id || ("pending-" + i), x.category || "Follow-up", x.desc || x.title, "", x.status, x.priority, x.due, "Shared Pending");
    if (r) tasks.push(r);
    if (x.due && r) deadlines.push(record((r.id || "d") + "-deadline", r.area, r.title, "", r.status, r.priority, x.due, "Shared Pending"));
  });

  // PhD meetings share only a date and action summary the user has stored as action items.
  // Meeting transcripts/instructions are deliberately excluded.
  const meetings = Array.isArray(memory.phd?.meetings) ? memory.phd.meetings : [];
  meetings.filter(x => x && x.nextDate).forEach((x, i) => {
    const r = record(x.id || ("meeting-" + i), "PhD / Supervisor", "Supervisor follow-up", clean(x.actions, 500), "Planned", "High", x.nextDate, "PhD Planner");
    if (r) deadlines.push(r);
  });

  const shareHealth = profile.share_health_context === true;
  return {
    schema_version: 1,
    source: "Thamizh Life Command Centre",
    updated_at: new Date().toISOString(),
    profile: {
      display_name: clean(profile.display_name || "Thamizh", 100),
      coaching_style: clean(profile.coaching_style || "Friendly mentor", 100),
      language: clean(profile.language || "English", 40),
      personal_traits: clean(profile.personal_traits, 3000),
      coaching_preferences: clean(profile.coaching_preferences, 3000),
      constraints: clean(profile.constraints, 3000),
      share_health_context: shareHealth,
      health_context: shareHealth ? clean(profile.health_context, 2000) : ""
    },
    goals: uniqueRecords(goals),
    tasks: uniqueRecords(tasks),
    projects: uniqueRecords(projects),
    deadlines: uniqueRecords(deadlines)
  };
}

async function publishNow() {
  if (localStorage.getItem(ENABLED_KEY) !== "true") return;
  const token = clean(localStorage.getItem(TOKEN_KEY), 500);
  if (!token) return;
  const pack = buildApprovedPack();
  const body = JSON.stringify(pack);
  if (body === localStorage.getItem(lastBodyKey)) return;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, "Cache-Control": "no-store" },
    body
  });
  if (!response.ok) {
    // Do not silently drop sharing state. The setup utility can show the error.
    try { localStorage.setItem("life-coach-sync-last-error-v1", response.status + ": " + (await response.text()).slice(0, 500)); } catch (_) {}
    return;
  }
  localStorage.setItem(lastBodyKey, body);
  localStorage.setItem("life-coach-sync-last-published-v1", new Date().toISOString());
  localStorage.removeItem("life-coach-sync-last-error-v1");
}

function schedulePublish() {
  if (localStorage.getItem(ENABLED_KEY) !== "true") return;
  window.clearTimeout(window.__lifeCoachPublishTimer);
  window.__lifeCoachPublishTimer = window.setTimeout(() => {
    publishNow().catch(error => {
      try { localStorage.setItem("life-coach-sync-last-error-v1", String(error).slice(0, 500)); } catch (_) {}
    });
  }, 1800);
}
if (typeof window !== "undefined") {
  window.addEventListener("storage", event => {
    if (event.key === PROFILE_KEY || event.key === TOKEN_KEY || event.key === ENABLED_KEY) schedulePublish();
  });
  window.addEventListener("life-coach-sync-publish-now", () => publishNow().catch(error => {
    try { localStorage.setItem("life-coach-sync-last-error-v1", String(error).slice(0, 500)); } catch (_) {}
  }));
  // Deliberately do not auto-publish without an explicit opt-in toggle.
  window.setInterval(schedulePublish, 5 * 60 * 1000);
}
export { buildApprovedPack, publishNow };
