// Shared public-source discovery. Listings are candidates, not eligibility decisions.
export const CAREER_SOURCES = [
  { id:"tnpsc", name:"TNPSC notifications", url:"https://www.tnpsc.gov.in/notifications.html", category:"Tamil Nadu Government" },
  { id:"tnpsc-apply", name:"TNPSC application portal", url:"https://apply.tnpscexams.in/notification", category:"Tamil Nadu Government" },
  { id:"drdo", name:"DRDO vacancies", url:"https://www.drdo.gov.in/drdo/offerings/vacancies/", category:"Central Government / Defence" },
  { id:"isro", name:"ISRO careers", url:"https://www.isro.gov.in/Careers.html", category:"Central Government / Space" },
  { id:"cdac", name:"C-DAC current jobs", url:"https://cdac.in/index.aspx?id=current_jobs", category:"Central Government / IT" },
  { id:"csir", name:"CSIR recruitment", url:"https://www.csir.res.in/career-opportunities", category:"Research" },
  { id:"iitm", name:"IIT Madras careers", url:"https://www.iitm.ac.in/careers", category:"Teaching / Research" },
  { id:"snuchennai", name:"Shiv Nadar University Chennai careers", url:"https://www.snuchennai.edu.in/careers/", category:"Teaching / Research" },
  { id:"ey", name:"EY careers search", url:"https://careers.ey.com/", category:"Private IT / Data" },
  { id:"cognizant", name:"Cognizant careers", url:"https://careers.cognizant.com/", category:"Private IT / Data" },
  { id:"capgemini", name:"Capgemini careers", url:"https://careers.capgemini.com/", category:"Private IT / Data" },
  { id:"tcs", name:"TCS careers", url:"https://www.tcs.com/careers", category:"Private IT / Data" },
  { id:"accenture", name:"Accenture careers", url:"https://www.accenture.com/in-en/careers", category:"Private IT / Data" },
  { id:"ncs", name:"National Career Service", url:"https://www.ncs.gov.in/", category:"Public job platform" },
  { id:"ugcnet", name:"UGC NET official portal", url:"https://ugcnet.nta.ac.in/", category:"Teaching eligibility" }
];

const KEYWORDS = /data engineer|data science|data scientist|data platform|data integration|data warehouse|databricks|snowflake|teradata|datastage|etl developer|sql developer|python developer|analytics engineer|ai engineer|machine learning|generative ai|research (assistant|associate|engineer|fellow|scientist)|project associate|project scientist|scientific officer|scientific assistant|programmer|systems analyst|assistant professor|associate professor|lecturer|faculty|teaching fellow|computer science|information technology|technical officer|engineer|junior research fellow|senior research fellow|vacanc(y|ies)|recruitment|current jobs/i;
const GENERIC = /^(click here|read more|view more|know more|apply now|home|login|register|careers?|vacancies|recruitment|notifications?|details|view details|download|more|website)$/i;

function cleanText(s="") {
  return s.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&nbsp;/g," ")
    .replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&#x2F;/g,"/")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g," ").trim();
}
function parseAnchors(html, baseUrl) {
  const found=[];
  const re=/<a\b([^>]*?)href\s*=\s*["']([^"'#]+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while((m=re.exec(html))!==null) {
    const label=cleanText(m[4]).slice(0,240);
    if(!label || label.length<4 || GENERIC.test(label) || !KEYWORDS.test(label)) continue;
    try {
      const url=new URL(m[2],baseUrl);
      if(!["http:","https:"].includes(url.protocol)) continue;
      found.push({title:label,url:url.href});
    } catch {}
  }
  return found;
}
export async function discoverCareerJobs({ fetchImpl=fetch, now=new Date() }={}) {
  const checkedAt=now.toISOString();
  const results=await Promise.all(CAREER_SOURCES.map(async source=>{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),7000);
    try {
      const response=await fetchImpl(source.url,{signal:controller.signal,headers:{"user-agent":"ThamizLifeCareerDiscovery/1.0 (public vacancy link discovery; manual verification required)","accept":"text/html,application/xhtml+xml"}});
      if(!response.ok) return {source_id:source.id,name:source.name,url:source.url,category:source.category,status:"error",http_status:response.status,checked_at:checkedAt,error:"Source returned HTTP "+response.status,jobs:[]};
      const html=await response.text();
      const anchors=parseAnchors(html,source.url);
      const jobs=anchors.map(a=>({
        id:source.id+":"+a.url,
        title:a.title,
        employer:source.name,
        category:source.category,
        location:"See official notification",
        salary:null,
        deadline:null,
        official_url:a.url,
        source_url:source.url,
        verification_status:"Requires manual verification",
        eligibility:"Not assessed automatically; check official notification",
        first_discovered_at:checkedAt,
        last_verified_at:checkedAt,
        status:"Needs review"
      }));
      return {source_id:source.id,name:source.name,url:source.url,category:source.category,status:"ok",http_status:response.status,checked_at:checkedAt,matched_links:jobs.length,jobs};
    } catch(e) {
      return {source_id:source.id,name:source.name,url:source.url,category:source.category,status:"error",checked_at:checkedAt,error:e?.name==="AbortError"?"Timed out after 7 seconds":String(e?.message||e),jobs:[]};
    } finally { clearTimeout(timer); }
  }));
  const deduped=new Map();
  for(const result of results) for(const job of result.jobs) {
    const key=job.official_url.split("#")[0];
    if(!deduped.has(key)) deduped.set(key,job);
    else {
      const old=deduped.get(key);
      old.last_verified_at=checkedAt;
    }
  }
  return {schema_version:1,generated_at:checkedAt,timezone:"Asia/Kolkata",discovery_mode:"public page link discovery; manual verification required",sources:results.map(({jobs,...s})=>s),jobs:[...deduped.values()]};
}
