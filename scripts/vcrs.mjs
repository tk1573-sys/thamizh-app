import fs from "node:fs";
import process from "node:process";
const app=fs.readFileSync("src/App.jsx","utf8");
const vite=fs.readFileSync("vite.config.js","utf8");
const requiredTabs=["now","jobs","radar","monthly","career","skills","learn","ugc","phd","snu","office","health","journal","resume","certs","govt","buddy","coach"];
const tabMatches=[...app.matchAll(/\{tab===["']([^"']+)["']&&/g)].map(m=>m[1]);
const missingTabs=requiredTabs.filter(t=>!tabMatches.includes(t));
const pins=[...app.matchAll(/<PinGate\b[^>]*storeKey=["']([^"']+)["']/g)].map(m=>m[1]);
const missingPins=["health","journal"].filter(k=>!pins.includes(k));
const stale=["CCDV-F","Deadline TODAY August 17","Reg: Sep 2026","GCP Professional Data Engineer"];
const staleHits=stale.filter(s=>app.includes(s));
const checks=[
  ["all 18 tabs rendered",missingTabs.length===0,missingTabs],
  ["Health + Journal PIN gates present",missingPins.length===0,missingPins],
  ["Gemini proxy used",app.includes('fetch("/api/gemini"'),"missing /api/gemini"],
  ["API handlers present",fs.existsSync("api/health.js")&&fs.existsSync("api/gemini.js"),"missing /api handlers"],
  ["PWA denies API navigation fallback",vite.includes("/^\\/api(?:\\/|$)/"),"missing Workbox API denylist"],
  ["obvious stale strings removed",staleHits.length===0,staleHits]
];
let failed=0;
for(const [name,ok,detail] of checks){console.log((ok?"PASS":"FAIL")+" | "+name+(ok?"":" | "+JSON.stringify(detail)));if(!ok)failed++;}
if(failed)process.exit(1);
console.log("VCRS static audit PASS");
