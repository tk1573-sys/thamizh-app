import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discoverCareerJobs } from "../src/career-refresh-core.mjs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"public","career-jobs.json");
await fs.mkdir(path.dirname(output),{recursive:true});
const fresh=await discoverCareerJobs();
let previous={jobs:[],sources:[]};
try { previous=JSON.parse(await fs.readFile(output,"utf8")); } catch {}
const oldByUrl=new Map((previous.jobs||[]).map(j=>[j.official_url,j]));
const merged=fresh.jobs.map(job=>{
  const old=oldByUrl.get(job.official_url);
  if(!old) return job;
  return {...old,...job,first_discovered_at:old.first_discovered_at||job.first_discovered_at,
    user_stage:old.user_stage||"Discovered",notes:old.notes||""};
});
const activeUrls=new Set(merged.map(j=>j.official_url));
for(const old of previous.jobs||[]) {
  if(!activeUrls.has(old.official_url)) merged.push({...old,status:"Not seen in latest refresh",last_seen_at:old.last_verified_at||null});
}
const outputData={...fresh,jobs:merged,history:{previous_generated_at:previous.generated_at||null,refresh_count:(previous.refresh_count||0)+1}};
await fs.writeFile(output,JSON.stringify(outputData,null,2)+"\n");
const healthy=fresh.sources.filter(s=>s.status==="ok").length;
console.log(JSON.stringify({output,generated_at:fresh.generated_at,source_count:fresh.sources.length,healthy_sources:healthy,discovered_links:fresh.jobs.length},null,2));
if(healthy===0) process.exitCode=1;
