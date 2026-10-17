import { useEffect, useMemo, useState } from "react";

const JOBS_KEY="thamiz-career-jobs-cache-v1";
const TRACKER_KEY="thamiz-career-applications-v1";
const SOURCES_KEY="thamiz-career-refresh-meta-v1";
const initialJobs=[];
const safeRead=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||"null");return value??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};
const stageOptions=["Discovered","Shortlisted","Eligibility Checked","Ready to Apply","Applied","Assessment","Interview","Offer","Negotiation","Accepted","Rejected","Withdrawn"];
const styles={
 panel:{background:"linear-gradient(135deg,rgba(14,20,32,.98),rgba(20,26,38,.96))",border:"1px solid #1E2D45",borderRadius:14,padding:14,marginBottom:14,color:"#E2E8F0"},
 button:{background:"#15253a",border:"1px solid #35516f",borderRadius:8,padding:"8px 11px",color:"#E2E8F0",fontWeight:700,cursor:"pointer"},
 field:{background:"#080C12",border:"1px solid #1E2D45",borderRadius:7,padding:"8px",color:"#E2E8F0",width:"100%",boxSizing:"border-box"},
 small:{fontSize:11,color:"#94A3B8",lineHeight:1.5}
};
const seedJobs=[{id:"source:tnpsc",title:"TNPSC official notifications",employer:"TNPSC",category:"Tamil Nadu Government",official_url:"https://www.tnpsc.gov.in/notifications.html",verification_status:"Official portal; individual posts require review",status:"Needs review"},{id:"source:drdo",title:"DRDO vacancies",employer:"DRDO",category:"Central Government / Defence",official_url:"https://www.drdo.gov.in/drdo/offerings/vacancies/",verification_status:"Official portal; individual posts require review",status:"Needs review"},{id:"source:isro",title:"ISRO careers",employer:"ISRO",category:"Central Government / Space",official_url:"https://www.isro.gov.in/Careers.html",verification_status:"Official portal; individual posts require review",status:"Needs review"},{id:"source:cdac",title:"C-DAC current jobs",employer:"C-DAC",category:"Central Government / IT",official_url:"https://cdac.in/index.aspx?id=current_jobs",verification_status:"Official portal; individual posts require review",status:"Needs review"}];
export default function CareerCommandCentre(){
 const [jobs,setJobs]=useState(()=>safeRead(JOBS_KEY,initialJobs));
 const [applications,setApplications]=useState(()=>safeRead(TRACKER_KEY,[]));
 const [meta,setMeta]=useState(()=>safeRead(SOURCES_KEY,null));
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [filter,setFilter]=useState("All");
 const [search,setSearch]=useState("");
 const [newTitle,setNewTitle]=useState("");
 const [newEmployer,setNewEmployer]=useState("");
 const [newUrl,setNewUrl]=useState("");
 const [newCategory,setNewCategory]=useState("Private IT / Data");
 const [newSalary,setNewSalary]=useState("");
 useEffect(()=>{save(JOBS_KEY,jobs);},[jobs]);
 useEffect(()=>{save(TRACKER_KEY,applications);},[applications]);
 useEffect(()=>{save(SOURCES_KEY,meta);},[meta]);
 const refresh=async()=>{
  setLoading(true);setError("");
  try{
   const response=await fetch("/api/career-refresh",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
   const data=await response.json();
   if(!response.ok) throw new Error(data.message||data.error||"Refresh failed. Check source health.");
   const existing=new Map(jobs.map(j=>[j.official_url,j]));
   const merged=(data.jobs||[]).map(j=>({...existing.get(j.official_url),...j,first_discovered_at:existing.get(j.official_url)?.first_discovered_at||j.first_discovered_at,user_stage:existing.get(j.official_url)?.user_stage||"Discovered",notes:existing.get(j.official_url)?.notes||""}));
   const seen=new Set(merged.map(j=>j.official_url));
   const historic=jobs.filter(j=>j.official_url&&!seen.has(j.official_url)).map(j=>({...j,status:"Not seen in latest refresh"}));
   setJobs([...merged,...historic]);setMeta({generated_at:data.generated_at,sources:data.sources||[],jobs_found:(data.jobs||[]).length});save(SOURCES_KEY,{generated_at:data.generated_at,sources:data.sources||[],jobs_found:(data.jobs||[]).length});
  }catch(e){setError(String(e?.message||e)+" — the last saved feed was kept.");}
  finally{setLoading(false);}
 };
 const shown=useMemo(()=>jobs.filter(j=>(filter==="All"||j.category===filter||j.user_stage===filter)&&(!search||[j.title,j.employer,j.category,j.location].join(" ").toLowerCase().includes(search.toLowerCase()))),[jobs,filter,search]);
 const updateStage=(url,stage)=>setJobs(prev=>prev.map(j=>j.official_url===url?{...j,user_stage:stage}:j));
 const addManual=()=>{
  if(!newTitle.trim()||!newEmployer.trim()||!newUrl.trim())return;
  let url;try{url=new URL(newUrl).href;}catch{return;}
  setJobs(prev=>prev.some(j=>j.official_url===url)?prev:[{id:"manual:"+url,title:newTitle.trim(),employer:newEmployer.trim(),category:newCategory,official_url:url,salary:newSalary.trim()||null,verification_status:"Requires manual verification",eligibility:"Check official posting",status:"Manually added",first_discovered_at:new Date().toISOString(),user_stage:"Discovered",notes:""},...prev]);
  setNewTitle("");setNewEmployer("");setNewUrl("");setNewSalary("");
 };
 const allJobs=jobs.length?jobs:seedJobs;
 const counts={tracked:applications.length,applied:jobs.filter(j=>["Applied","Assessment","Interview","Offer","Negotiation","Accepted"].includes(j.user_stage)).length,shortlisted:jobs.filter(j=>["Shortlisted","Eligibility Checked","Ready to Apply"].includes(j.user_stage)).length,highRisk:(meta?.sources||[]).filter(s=>s.status!=="ok").length};
 return <section style={styles.panel} aria-label="Career Command Centre">
  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
   <div><div style={{fontSize:17,fontWeight:800,color:"#34D399"}}>🧭 Career Command Centre</div><div style={{fontSize:12,color:"#CBD5E1",marginTop:4}}>60-day target: secure a suitable offer above ₹7.5 LPA; IT/data roles first, teaching and research in parallel.</div></div>
   <button type="button" style={{...styles.button,opacity:loading ? 0.65 : 1}} disabled={loading} onClick={refresh}>{loading?"Refreshing official sources…":"↻ Refresh Jobs Now"}</button>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(125px,1fr))",gap:8,marginTop:12}}>
   {[["CIT benchmark","₹60,000/month · ₹7.2 LPA"],["Target","Above ₹7.5 LPA"],["Tracked applications",String(counts.tracked)],["In application stages",String(counts.applied)],["Shortlisted",String(counts.shortlisted)],["Sources with errors",String(counts.highRisk)]].map(([label,value])=><div key={label} style={{background:"#080C12",border:"1px solid #1E2D45",borderRadius:9,padding:10}}><div style={{fontSize:10,color:"#94A3B8"}}>{label}</div><div style={{fontSize:12,fontWeight:800,marginTop:5}}>{value}</div></div>)}
  </div>
  <div style={{...styles.small,marginTop:8}}>Last refresh: {meta?.generated_at?new Date(meta.generated_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"Not refreshed in this browser yet"} · Candidate profile is based on your brief; salary, eligibility and closing dates are never inferred from a link title.</div>
  {error&&<div role="alert" style={{marginTop:8,padding:9,borderRadius:8,background:"#3b1720",color:"#fecaca",fontSize:12}}>{error}</div>}
  <div style={{fontSize:13,fontWeight:800,marginTop:14,marginBottom:8}}>Saved and discovered opportunities</div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8}}>
   <input aria-label="Search jobs" style={styles.field} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, employer, category"/>
   <select aria-label="Filter jobs" style={styles.field} value={filter} onChange={e=>setFilter(e.target.value)}>{["All",...new Set([...jobs.map(j=>j.category).filter(Boolean),...stageOptions])].map(v=><option key={v}>{v}</option>)}</select>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:8,marginTop:10}}>
   {allJobs.filter(j=>(filter==="All"||j.category===filter||j.user_stage===filter)&&(!search||[j.title,j.employer,j.category,j.location].join(" ").toLowerCase().includes(search.toLowerCase()))).slice(0,30).map((job,i)=><article key={job.official_url||job.id||i} style={{background:"#111a29",border:"1px solid #26364d",borderRadius:10,padding:11}}>
    <div style={{fontSize:10,color:"#34D399",fontWeight:800}}>{job.category||"Opportunity"} · {job.verification_status||"Requires manual verification"}</div>
    <div style={{fontSize:13,fontWeight:800,marginTop:5}}>{job.title}</div><div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>{job.employer}{job.location?" · "+job.location:""}</div>
    <div style={{fontSize:11,color:"#CBD5E1",marginTop:6}}>Salary: {job.salary||"Not published / not verified"} · Deadline: {job.deadline||"Check official notice"}</div>
    <div style={{display:"flex",gap:6,alignItems:"center",marginTop:8,flexWrap:"wrap"}}><select aria-label={"Application stage for "+job.title} style={{...styles.field,width:"auto",flex:1,minWidth:130}} value={job.user_stage||"Discovered"} onChange={e=>updateStage(job.official_url,e.target.value)}>{stageOptions.map(s=><option key={s}>{s}</option>)}</select><a href={job.official_url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#60A5FA",fontWeight:800}}>Open source ↗</a></div>
    <div style={{fontSize:10,color:"#94A3B8",marginTop:6}}>First found: {job.first_discovered_at?new Date(job.first_discovered_at).toLocaleDateString("en-IN"):"Seed source"} · Last checked: {job.last_verified_at?new Date(job.last_verified_at).toLocaleDateString("en-IN"):"Not checked"}</div>
   </article>)}
  </div>
  <details style={{marginTop:12}}><summary style={{cursor:"pointer",fontSize:12,fontWeight:800}}>Add an opportunity manually</summary>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginTop:9}}>
    <input style={styles.field} aria-label="Job title" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Job title"/>
    <input style={styles.field} aria-label="Employer" value={newEmployer} onChange={e=>setNewEmployer(e.target.value)} placeholder="Employer"/>
    <input style={styles.field} aria-label="Official URL" value={newUrl} onChange={e=>setNewUrl(e.target.value)} placeholder="https:// official job link"/>
    <input style={styles.field} aria-label="Salary" value={newSalary} onChange={e=>setNewSalary(e.target.value)} placeholder="Published salary (optional)"/>
    <select style={styles.field} aria-label="Job category" value={newCategory} onChange={e=>setNewCategory(e.target.value)}>{["Private IT / Data","AI / GenAI","Teaching / Faculty","Research","Central Government","Tamil Nadu Government","Defence"].map(c=><option key={c}>{c}</option>)}</select>
    <button type="button" style={styles.button} onClick={addManual}>Save opportunity</button>
   </div>
   <p style={styles.small}>Saved in this browser. Use the app's existing encrypted cloud sync to move browser-side progress between devices.</p>
  </details>
  <details style={{marginTop:10}}><summary style={{cursor:"pointer",fontSize:12,fontWeight:800}}>Source health ({(meta?.sources||[]).length} checked)</summary>
   <div style={{display:"grid",gap:5,marginTop:8}}>{(meta?.sources||[]).map(s=><div key={s.source_id} style={{fontSize:11,display:"flex",gap:8,flexWrap:"wrap"}}><span style={{color:s.status==="ok"?"#34D399":"#F87171",fontWeight:800}}>{s.status==="ok"?"OK":"ERROR"}</span><a href={s.url} target="_blank" rel="noreferrer" style={{color:"#60A5FA"}}>{s.name}</a><span style={{color:"#94A3B8"}}>{s.error||("HTTP "+s.http_status+" · "+(s.matched_links||0)+" matching links")}</span></div>)}</div>
  </details>
  <p style={{...styles.small,marginBottom:0,marginTop:10}}>Automation note: the scheduled GitHub Actions workflow refreshes the public discovery feed daily at 08:00 IST. This button performs a live refresh now; locally tracked stages remain in this browser. A source link is not proof that a vacancy is open or that you are eligible.</p>
 </section>;
}
