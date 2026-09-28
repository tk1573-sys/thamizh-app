// Career Coach + mobile resource hub. Kept independent from the main React tree so
// links remain usable even if a tab has a rendering issue.
const CERTS = [
  { name:'AWS Certified Data Engineer – Associate (DEA-C01)', status:'Coupon received · schedule exam', prereq:'No formal prerequisite; AWS targets 2–3 years data-engineering experience and 1–2 years hands-on AWS.', skills:'ETL, S3, Glue, EMR, Redshift, Kinesis, Lambda, Step Functions, data stores, SQL, Python, monitoring, security, governance, CI/CD.', url:'https://aws.amazon.com/certification/certified-data-engineer-associate/', guide:'https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/data-engineer-associate-01.html' },
  { name:'SnowPro Core (COF-C03)', status:'Coupon received · current exam version', prereq:'No formal prerequisite; Snowflake recommends about 6+ months of hands-on knowledge.', skills:'AI Data Cloud architecture, RBAC/governance, loading/unloading, stages, Snowpipe/Streaming, streams/tasks, dynamic tables, performance, SQL, sharing, Iceberg, Cortex, Notebooks.', url:'https://learn.snowflake.com/en/certifications/snowpro-core-c03/', guide:'https://learn.snowflake.com/en/certifications/snowpro-core-c03/' },
  { name:'Databricks Certified Data Engineer Associate', status:'Live session attended · complete prerequisites/prep', prereq:'No formal prerequisite; related training and hands-on data-engineering experience are recommended.', skills:'Lakehouse, ingestion/loading, SQL/PySpark transformations, Lakeflow Jobs, CI/CD, troubleshooting, monitoring, optimization, governance and security.', url:'https://www.databricks.com/learn/certification/data-engineer-associate', guide:'https://www.databricks.com/learn/certification/data-engineer-associate' },
  { name:'Claude Certified Architect – Foundations', status:'Registered / preparation', prereq:'Use Anthropic Academy preparation; focus on architecture and hands-on Claude development.', skills:'Agentic architecture, orchestration, tool design, MCP, Claude Code, prompt engineering, structured output, context management, reliability, cost/evaluation and responsible deployment.', url:'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification', guide:'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification' },
  { name:'GitHub Copilot (GH-300)', status:'Completed', prereq:'GitHub fundamentals plus experience with at least one programming language are expected for the exam profile.', skills:'Responsible AI, Copilot features, data/architecture, prompt/context crafting, productivity, privacy, content exclusions and safeguards.', url:'https://learn.microsoft.com/credentials/certifications/github-copilot/', guide:'https://learn.microsoft.com/credentials/certifications/resources/study-guides/gh-300' }
];

const ROLE_LINKS = [
  ['Central government – UPSC recruitment','https://www.upsc.gov.in/recruitment/recruitment-advertisement'],
  ['Central government – SSC','https://ssc.gov.in/'],
  ['Central government – National Career Service','https://ncs.gov.in/latest-update'],
  ['All-state employment portals via NCS','https://ncs.gov.in/devPortalList'],
  ['Central government – Employment News','https://employmentnews.gov.in/newemp/careers.aspx'],
  ['Banking – IBPS','https://www.ibps.in/'],
  ['Tamil Nadu – TNPSC','https://www.tnpsc.gov.in/'],
  ['Tamil Nadu – Teachers Recruitment Board','https://trb.tn.gov.in/'],
  ['Tamil Nadu – Medical Services Recruitment Board','https://www.mrb.tn.gov.in/'],
  ['Tamil Nadu – Uniformed Services Recruitment Board','https://tnusrb.tn.gov.in/'],
  ['Tamil Nadu – Employment Exchange','https://tnvelaivaaippu.gov.in/'],
  ['Teaching / eligibility – UGC','https://www.ugc.gov.in/'],
  ['UGC-NET – NTA','https://ugcnet.nta.ac.in/'],
  ['Research – DRDO vacancies','https://drdo.gov.in/drdo/offerings/vacancies'],
  ['Research – ISRO careers','https://www.isro.gov.in/Careers.html'],
  ['Research / technology – C-DAC careers','https://www.cdac.in/index.aspx?id=ca_careers'],
  ['Research / scientific – CSIR careers','https://www.csir.res.in/career-opportunities'],
  ['Research – BARC careers','https://barc.gov.in/careers/index.html'],
  ['Research – ICMR','https://main.icmr.nic.in/careers'],
  ['Research funding – ANRF','https://www.anrfonline.in/']
];

const CURRENT_WATCH = [
  'TNPSC Notification 08/2026: Combined Technical Services Examination (Interview Posts) — application window shown by TNPSC as 07 Sep–06 Oct 2026.',
  'DRDO vacancies currently include multiple JRF/RA/apprentice opportunities; individual closing dates vary, so open the official vacancy notice before applying.',
  'SSC is publishing 2026 recruitment notices and updates on its official portal; use the live notice/calendar rather than an old coaching-site calendar.',
  'NCS publishes classified government/research vacancies and links to state employment portals; use it as an additional discovery layer, then verify the recruiting organisation notice.'
];

const CAREER_ACTIONS = [
  'Data Engineer / Senior Data Engineer: SQL + Python + ETL + cloud + Spark + system design.',
  'AI Data Engineer / GenAI Data Engineer: add RAG, evaluation, LLM APIs, MCP and production data pipelines.',
  'Assistant Professor / teaching: track UGC-NET eligibility plus each university/state recruitment notification.',
  'Research roles: PhD + publications + reproducible experiments + Python/ML + research methodology + domain datasets.',
  'Government technical roles: verify every notification for degree, age, experience, category, discipline and application dates before applying.'
];

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function link(label,url,cls='cc-link') { return `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`; }

function install() {
  if (document.getElementById('career-coach-hub')) return;
  const style=document.createElement('style');
  style.textContent=`
    #career-coach-hub{position:fixed;right:14px;bottom:14px;z-index:99999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #career-coach-hub .cc-btn{border:1px solid #4f9eff66;background:#101827;color:#e2e8f0;border-radius:999px;padding:11px 15px;font-weight:800;box-shadow:0 8px 30px #0008;cursor:pointer}
    #career-coach-hub .cc-panel{display:none;position:fixed;right:12px;bottom:68px;width:min(650px,calc(100vw - 24px));max-height:82vh;overflow:auto;background:#0b111c;color:#e2e8f0;border:1px solid #29405f;border-radius:18px;box-shadow:0 20px 70px #000b;padding:16px}
    #career-coach-hub.open .cc-panel{display:block}
    #career-coach-hub h2{font-size:18px;margin:0 0 5px}.cc-sub{color:#94a3b8;font-size:12px;margin-bottom:12px}.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cc-card{background:#111a28;border:1px solid #223550;border-radius:12px;padding:11px}.cc-card h3{font-size:13px;margin:0 0 7px}.cc-card p{font-size:11px;line-height:1.5;color:#cbd5e1;margin:5px 0}.cc-link{color:#7db7ff;text-decoration:none;font-size:11px;font-weight:700;margin-right:10px}.cc-pill{display:inline-block;font-size:10px;border:1px solid #2b4665;border-radius:999px;padding:3px 7px;color:#86efac;margin-bottom:6px}.cc-section{margin-top:15px}.cc-section h3{font-size:14px;margin:0 0 8px}.cc-list{display:grid;gap:6px}.cc-row{background:#0f1724;border:1px solid #1e3049;border-radius:10px;padding:9px;font-size:11px;line-height:1.45}.cc-close{float:right;border:0;background:transparent;color:#94a3b8;font-size:18px;cursor:pointer}
    @media(max-width:600px){#career-coach-hub{right:9px;bottom:max(9px,env(safe-area-inset-bottom))}.cc-grid{grid-template-columns:1fr}.cc-panel{max-height:82vh!important}.cc-btn{font-size:12px;padding:10px 13px!important}}
  `;
  document.head.appendChild(style);
  const root=document.createElement('div'); root.id='career-coach-hub';
  root.innerHTML=`<button class="cc-btn" aria-label="Open Career Coach">🤖 Career Coach</button><div class="cc-panel"><button class="cc-close" aria-label="Close">×</button><h2>Career Coach & Opportunity Hub</h2><div class="cc-sub">Current-source snapshot: Sep 2026. Use official notification pages for final eligibility and deadlines.</div><div class="cc-section"><h3>🏅 Certification readiness</h3><div class="cc-grid">${CERTS.map(c=>`<div class="cc-card"><span class="cc-pill">${esc(c.status)}</span><h3>${esc(c.name)}</h3><p><b>Prereq:</b> ${esc(c.prereq)}</p><p><b>Skills:</b> ${esc(c.skills)}</p>${link('Exam / certification',c.url)} ${link('Guide',c.guide)}</div>`).join('')}</div></div><div class="cc-section"><h3>📌 Current government/research watch</h3><div class="cc-list">${CURRENT_WATCH.map(x=>`<div class="cc-row">${esc(x)}</div>`).join('')}</div></div><div class="cc-section"><h3>🎯 Career focus</h3><div class="cc-list">${CAREER_ACTIONS.map(x=>`<div class="cc-row">${esc(x)}</div>`).join('')}</div></div><div class="cc-section"><h3>🏛️ Teaching · Research · Government</h3><div class="cc-grid">${ROLE_LINKS.map(([n,u])=>`<div class="cc-row">${link(n,u)}</div>`).join('')}</div></div><div class="cc-section"><h3>🧪 App health</h3><div id="cc-health" class="cc-row">Checking backend…</div></div></div>`;
  document.body.appendChild(root);
  root.querySelector('.cc-btn').onclick=()=>root.classList.toggle('open');
  root.querySelector('.cc-close').onclick=()=>root.classList.remove('open');
  fetch('/api/health',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{document.getElementById('cc-health').textContent=`Backend health: ${d.status||'OK'} · ${new Date().toLocaleTimeString()}`;}).catch(()=>{document.getElementById('cc-health').textContent='Backend health check unavailable. Static features can still open; cloud sync/API features need the deployed API.';});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
