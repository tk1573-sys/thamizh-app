import fs from "node:fs";
import process from "node:process";

const app = fs.readFileSync("src/App.jsx", "utf8");
const vite = fs.readFileSync("vite.config.js", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const requiredTabs = ["now","jobs","radar","monthly","career","skills","learn","ugc","phd","snu","office","health","journal","resume","certs","govt","buddy","coach"];
const tabMatches = [...app.matchAll(/\{tab===["']([^"']+)["']&&/g)].map(m => m[1]);
const navIds = [...app.matchAll(/\["(now|jobs|radar|monthly|career|skills|learn|ugc|phd|snu|office|health|journal|resume|certs|govt|buddy|coach)","[^"]+","[^"]+"\]/g)].map(m => m[1]);
const missingTabs = requiredTabs.filter(t => !tabMatches.includes(t));
const missingNav = requiredTabs.filter(t => !navIds.includes(t));

const pins = [...app.matchAll(/<PinGate\b[^>]*storeKey=["']([^"']+)["']/g)].map(m => m[1]);
const missingPins = ["health","journal"].filter(k => !pins.includes(k));

const stale = [
  "Deadline TODAY August 17",
  "URGENT: Claude Architect certification deadline Aug 31 2026",
  "Registration opens September 2026",
  "registration window typically opens September–October",
  "GCP DE (Nov 2026)",
  "ISRO Scientist SC deadline is Aug 17"
];
const staleHits = stale.filter(s => app.includes(s));

const aiSystems = [...app.matchAll(/system:`([\\s\\S]*?)`,messages:/g)].map(m => m[1]);
const privateHealthLeakTerms = ["Bipolar I", "Type 2 Diabetes", "140kg", "FBS 197", "HbA1c", "Dyslipidemia", "Glycomet GP contains"];
const aiPrivateHealthHits = privateHealthLeakTerms.filter(term => aiSystems.some(s => s.includes(term)));

const checks = [
  ["V — all 18 app tabs render", missingTabs.length === 0, missingTabs],
  ["V — all 18 nav buttons map to rendered tabs", missingNav.length === 0, missingNav],
  ["V — deep-link allowlist contains all tabs", requiredTabs.every(t => app.includes(`VALID_APP_TABS = new Set(`) && app.includes(`"${t}"`)), "missing deep-link id"],
  ["C — Health + Journal PIN gates present", missingPins.length === 0, missingPins],
  ["C — journal persistence wired", app.includes('"j-entries"') && app.includes("saveJournal"), "missing journal persistence"],
  ["C — health persistence wired", app.includes('"h-log"') && app.includes("saveHealth"), "missing health persistence"],
  ["C — Office persistence wired", app.includes('"o-data"') && app.includes("saveOff"), "missing office persistence"],
  ["C — Gemini proxy used", app.includes('fetch("/api/gemini"'), "missing /api/gemini"],
  ["C — API handlers present", fs.existsSync("api/health.js") && fs.existsSync("api/gemini.js"), "missing /api handlers"],
  ["R — PWA denies API navigation fallback", vite.includes("/^\\/api(?:\\/|$)/"), "missing Workbox API denylist"],
  ["R — production build script exists", pkg.scripts?.build === "vite build", pkg.scripts?.build],
  ["R — current UGC guidance does not invent a registration date", !app.includes("registration window typically opens"), "stale UGC window claim"],
  ["S — obvious stale live-job prompts removed", staleHits.length === 0, staleHits],
  ["S — private medical details are not embedded in AI system prompts", aiPrivateHealthHits.length === 0, aiPrivateHealthHits],
  ["S — Gemini API key is not exposed in client source", !app.includes("GEMINI_API_KEY"), "GEMINI_API_KEY found in App.jsx"],
  ["C — certification command centre data exists", app.includes("const certificationTracks = [") && app.includes("const futureCertifications = ["), "certification data missing"],
  ["C — all active certification tracks have modules", ["aws-dea","snowpro-core","dbx-dea","claude-foundations","claude-professional","dbx-genai"].every(id => app.includes('id:"'+id+'"') && app.includes("modules:[")), "missing certification modules"],
  ["C — certification progress and wrong-answer persistence wired", app.includes('"cert-progress"') && app.includes('"cert-wrong"') && app.includes("saveCertProgress"), "missing certification persistence"],
  ["C — certification system works without Gemini", app.includes("Offline Question Bank") && app.includes("Today's Study Mission"), "missing offline study path"],
  ["C — unified long-term memory exists", app.includes('"life-memory-v2"') && app.includes("memoryHydrated"), "missing unified memory store"],
  ["C — Office/Health/Journal mirror into unified memory", app.includes('office: {data:offData}') && app.includes('health: {log:healthLog}') && app.includes('journal: {entries, dailyPlans}'), "missing durable tab mirrors"],
  ["C — PhD research hub is canonical and shared with SNU", app.includes("const phdResearchHub = {") && app.includes("phdResearchHub.snuScope") && app.includes("Overall PhD → SNU Research Map"), "missing PhD/SNU research linkage"],
  ["C — SNU advisor uses canonical PhD research context", app.includes("OVERALL PHD RESEARCH: ${phdResearchHub.workingTitle}") && app.includes("PROBLEM STATEMENTS: ${phdResearchHub.problemStatements.join"), "SNU AI context is disconnected from canonical research hub"],
  ["C — encrypted cross-device sync client exists", app.includes("encryptSyncSnapshot") && app.includes("decryptSyncSnapshot") && app.includes("/api/sync?id="), "missing encrypted cloud sync client"],
  ["C — encrypted sync API exists", sync.includes("from \"@vercel/blob\"") && sync.includes('access:"private"') && sync.includes("allowOverwrite:true"), "missing private Vercel Blob sync API"]
];

let failed = 0;
for (const [name, ok, detail] of checks) {
  console.log((ok ? "PASS" : "FAIL") + " | " + name + (ok ? "" : " | " + JSON.stringify(detail)));
  if (!ok) failed++;
}
if (failed) process.exit(1);
console.log("VCRS static audit PASS");
