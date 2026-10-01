const today=new Date().toISOString().slice(0,10);
const tasks=[
 ['Daily Core','45 min SQL/Python: one problem + one production-style ETL improvement'],
 ['Certification','60 min on the current priority cert; rotate SnowPro, Databricks, AWS and Claude'],
 ['PhD Coursework','60 min on one CS8015/CS8044/CS8051/UM8001 module + 5-line notes'],
 ['Research','30 min: one paper, Mendeley record, dataset/experiment note or supervisor action'],
 ['Career','20 min: one application, resume bullet, GitHub improvement or interview question'],
 ['UGC NET','30 min: one CS topic + 15 MCQs; log weak areas'],
 ['Journal','10 min: record completed work, blocker and tomorrow Top 3'],
];
const courses=[
 ['CS8015','Deep Learning for Computer Vision',['Visual Features and Matching','Neural Networks Overview','Convolutional Neural Networks','Recurrent Neural Networks','Deep Generative Models']],
 ['CS8044','Biomedical Signal Processing',['Biomedical Signal Origin and Dynamics','Event Detection','Waveform Analysis','Frequency-Domain Analysis','Modelling of Biomedical Systems']],
 ['CS8051','Generative AI with Large Language Models',['Foundations of Generative AI and LLMs','Transformer Models and Text Generation','Advanced Training and Computational Considerations','Model Fine-Tuning, Evaluation and Adaptation','Ethical Considerations, Human Alignment and Deployment']],
 ['UM8001','Research Methodology',['Fundamentals of Research','Literature Survey','Data Collection and Analysis','Technical Writing and Presentation','Research Indicators']]
];
const certs=[
 {name:'AWS Certified Data Engineer – Associate (DEA-C01)',status:'Preparing / priority',url:'https://aws.amazon.com/certification/certified-data-engineer-associate/',pre:'2–3 years DE background is the target profile; 1–2 years AWS hands-on is recommended.',skills:'ETL/ELT, Python/SQL, S3, Glue, Athena, Redshift, EMR, Kinesis, MWAA/Step Functions, IAM/KMS, data quality, monitoring, governance, cost/performance, Git, IaC.'},
 {name:'SnowPro Core (COF-C03)',status:'Preparing now',url:'https://learn.snowflake.com/en/certifications/snowpro-core/',pre:'Snowflake recommends practical experience; current SnowPro Core track is COF-C03.',skills:'Snowflake architecture, warehouses, RBAC, SQL, loading/unloading, stages, file formats, semi-structured data, Time Travel, Fail-safe, cloning, sharing, performance and cost optimization.'},
 {name:'Databricks Certified Data Engineer Associate',status:'Preparing now',url:'https://www.databricks.com/learn/certification/data-engineer-associate',pre:'No formal degree prerequisite; Databricks Fundamentals plus hands-on Lakehouse practice is the practical starting point.',skills:'Lakehouse architecture, Delta Lake, Unity Catalog, SQL/PySpark, batch/streaming ingestion, Auto Loader, Lakeflow Connect/Jobs, Spark Declarative Pipelines, data modeling, governance, performance and DevOps.'},
 {name:'Databricks Certified Generative AI Engineer Associate',status:'Preparing',url:'https://www.databricks.com/learn/certification/generative-ai-engineer-associate',pre:'No formal prerequisite; hands-on Databricks experience is strongly useful.',skills:'LLM application design, RAG, Vector Search, model serving, MLflow, Unity Catalog, evaluation, prompt/chain design, agents/MCP and production security.'},
 {name:'AWS Certified Machine Learning Engineer – Associate (MLA-C02)',status:'Current beta / investigate',url:'https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/',pre:'Updated MLA-C02 beta is the current English path after MLA-C01 ended in English on Sep 28, 2026.',skills:'ML data preparation, traditional ML + foundation models, SageMaker/Bedrock, deployment/orchestration, CI/CD, monitoring, security, agents and responsible operations.'},
 {name:'AWS Certified Generative AI Developer – Professional (AIP-C01)',status:'Later target',url:'https://aws.amazon.com/certification/certified-generative-ai-developer-professional/',pre:'AWS targets production-grade experience; 2+ years cloud/production development and 1 year hands-on GenAI are recommended.',skills:'Bedrock, foundation models, RAG/agents, application architecture, APIs, security/IAM, networking, observability, deployment/IaC, cost and production operations.'},
 {name:'AWS Certified Solutions Architect – Professional (SAP-C02/SAP-C03 transition)',status:'Later target',url:'https://aws.amazon.com/certification/certified-solutions-architect-professional/',pre:'Build strong AWS architecture experience first; current exam is transitioning to SAP-C03.',skills:'Multi-account architecture, networking, security, resilience, storage, compute, databases, migration, observability, cost optimization, Well-Architected and IaC.'},
 {name:'Claude Architect Professional',status:'Registered / preparing',url:'https://www.anthropic.com/learn/certification',pre:'Follow the current Anthropic certification portal and your registered exam path.',skills:'LLM architecture, Claude/Claude Code, prompting, tool use, agents, context management, evaluation, safety, privacy and production integration.'},
 {name:'Claude Associate Foundations → Architect Foundations',status:'Roadmap / foundation refresh',url:'https://www.anthropic.com/learn/certification',pre:'Use Anthropic Academy/current certification requirements.',skills:'AI fluency, Claude fundamentals, effective prompting, responsible AI, context, tool use and basic solution architecture.'},
 {name:'GitHub Copilot Certification',status:'Completed',url:'https://learn.github.com/certifications',pre:'Completed; retain practical GitHub/Copilot skills.',skills:'Responsible AI, Copilot features, prompt engineering, developer use cases, testing, privacy and exclusions.'}
];
const government=[
 {group:'OPEN / CURRENTLY ACTIONABLE',items:[
  ['ISRO LPSC Scientist/Engineer SC — deadline 13 Oct 2026','Scientist/Engineer technical recruitment; verify the exact discipline in the advertisement before applying.','https://www.isro.gov.in/ISRO_EN/LPSCRecruitment14.html'],
  ['CSIR-TKDL Project Personnel — IT and related project roles — deadline 12 Oct 2026','Central research/project recruitment; inspect the IT post qualification and experience in the advertisement.','https://www.csir.res.in/en/career-opportunities/recruitment/engagement-project-personnel-it-ayurveda-unani-sowa-rigpa-siddha'],
  ['DRDO current vacancies — JRF/RA/research and technical openings','Track current laboratory-level JRF/RA/project roles; discipline and age vary by notice.','https://www.drdo.gov.in/drdo/offerings/vacancies'],
  ['DRDO RCI apprenticeship 2027 — 1 Oct to 1 Nov 2026','Open notice exists, but apprenticeship is generally less aligned with your experienced DE profile; verify eligibility before spending time.','https://www.drdo.gov.in/drdo/offerings/vacancies'],
 ]},
 {group:'RESEARCH / SCIENTIST WATCHLIST',items:[
  ['ISRO Scientist/Engineer and PhD Scientist/Engineer-SD','Monitor ICRB and centre-specific recruitment; ISRO lists Computer Science among scientific/technical opportunities and maintains a PhD scientist pathway.','https://www.isro.gov.in/CareerOpportunities.html'],
  ['DRDO RAC Scientist B / Scientist posts','Monitor RAC for Scientist B and higher scientist recruitment. Scientist B is an entry-level scientist route; exact discipline, GATE and advertisement conditions must be checked for each cycle.','https://rac.gov.in/'],
  ['CSIR labs / Project Scientist / Project Associate / IT research','Monitor CSIR recruitment and individual laboratory notices; useful for research + AI/data experience.','https://www.csir.res.in/en/career-opportunities/recruitment'],
  ['C-DAC technical/project/research roles','Monitor AI, data, software, HPC and research project openings.','https://www.cdac.in/index.aspx?id=ca_careers'],
 ]},
 {group:'TEACHING / ACADEMIC WATCHLIST',items:[
  ['TN TRB / Government Arts & Science College Assistant Professor','For Computer Science, government-college recruitment follows relevant PG + NET/SET/SLET or PhD conditions under the applicable UGC/TN rules. Check the live notification.','https://www.trb.tn.gov.in/'],
  ['UGC-NET Computer Science & Applications (087)','Continue NET preparation; use the official NTA cycle page for the live application/exam window.','https://ugcnet.nta.ac.in/'],
  ['University Assistant Professor / Project Faculty / Research roles','Monitor university recruitment portals plus NCS; eligibility varies by institution and UGC rules.','https://www.ncs.gov.in/'],
 ]},
 {group:'TNPSC / STATE GOVERNMENT',items:[
  ['TNPSC Group I / II / IIA / IV','Track each notification rather than assuming an old cycle remains open. TNPSC publishes annual planners and exam dashboards; technical services are particularly relevant to your degree profile.','https://www.tnpsc.gov.in/'],
  ['TNPSC Combined Technical Services — Degree/PG level','Monitor interview and non-interview technical-service notifications for degree/PG-specific posts.','https://www.tnpsc.gov.in/English/Examdashboard.aspx'],
  ['Tamil Nadu Government recruitment portal','Use the state recruitment portal for department/project vacancies and current openings.','https://ima4recruitments.tn.gov.in/'],
  ['Tamil Nadu Career Services','Additional state employment/job-fair and recruitment information.','https://tamilnaducareerservices.tn.gov.in/Vle/vle_home/'],
 ]},
 {group:'ARMY / NAVY — TECHNICAL, BUT NOT “NO PHYSICAL”',items:[
  ['Indian Navy SSC Executive (IT) / technical officer entries','Your CS/Data/AI education can overlap with IT entries in some cycles, but officer entries still require SSB and military medical/fitness standards and can involve service duties. They are not guaranteed desk-only jobs.','https://www.joinindiannavy.gov.in/'],
  ['Indian Army technical/IT officer entries','Monitor official officer-entry notifications for eligible CS/IT technical streams. Military officer roles cannot be treated as zero-physical-duty careers; medical/SSB/service requirements apply.','https://joinindianarmy.nic.in/'],
 ]},
 {group:'CENTRAL GENERAL WATCHLIST',items:[
  ['UPSC recruitment / direct specialist posts','Check current Recruitment Advertisements for technical, scientific and academic posts.','https://www.upsc.gov.in/recruitment/recruitment-advertisement'],
  ['SSC','Track CGL/technical/scientific/computer-related posts when your education and age fit the notice.','https://ssc.gov.in/'],
  ['NCS','Central employment portal and government vacancy aggregation.','https://www.ncs.gov.in/latest-update'],
 ]}
];
const modernSkills=[
 ['Core Data Engineering','Advanced SQL, Python, Unix/Bash, Git, ETL/ELT, data structures, APIs, file formats, debugging, testing, documentation'],
 ['Data Architecture','Dimensional modeling, star/snowflake schemas, OLTP vs OLAP, partitioning, indexing, CDC, SCD, schema evolution, lake/lakehouse/warehouse patterns'],
 ['Cloud','One cloud deeply first (AWS for you): S3, IAM, VPC basics, Glue, Athena, Redshift, EMR, Lambda, Step Functions/MWAA, CloudWatch, KMS, Secrets Manager'],
 ['Modern Lakehouse','Databricks, Spark/PySpark, Delta Lake, Unity Catalog, Auto Loader, Lakeflow, streaming, workload/cost tuning'],
 ['Cloud Warehouse','Snowflake SQL, warehouses, stages, file formats, semi-structured data, RBAC, Time Travel, cloning, sharing, performance/cost'],
 ['Transformation / ELT','dbt models, tests, documentation, snapshots, incremental models, lineage; understand where dbt complements Spark/Snowflake'],
 ['Orchestration / Integration','Airflow concepts, cloud orchestrators, Fivetran/connectors, REST/JDBC/ODBC, event-driven pipelines'],
 ['Streaming','Kafka concepts, partitions, consumer groups, offsets, schema registry; Spark Structured Streaming/Kinesis basics'],
 ['Data Quality & Governance','Great Expectations/dbt tests, profiling, lineage, catalogs, RBAC, PII, encryption, retention, auditability'],
 ['DevOps for Data','CI/CD, GitHub Actions, Docker basics, IaC (Terraform/CloudFormation/CDK), environments, secrets, rollback and observability'],
 ['GenAI for Data Engineers','Embeddings, vector stores, RAG, evaluation, agents, MCP, LLM APIs, prompt/context engineering, Bedrock/Databricks Mosaic AI'],
 ['Production Engineering','SLAs/SLOs, idempotency, retries, backfills, incident response, cost optimization, monitoring, logging, alerting and capacity planning']
];
const planner=[
 ['Week 1 — Foundation','SQL advanced + Python ETL + Git + one small production-style pipeline; finish SnowPro weak topics.'],
 ['Week 2 — Modern DE','Databricks Spark/PySpark + Delta + Unity Catalog + Lakeflow; build one bronze→silver→gold pipeline.'],
 ['Week 3 — Cloud DE','AWS S3 + Glue + Athena + Redshift + IAM + CloudWatch; map the same pipeline to AWS.'],
 ['Week 4 — Engineering maturity','dbt + data quality + orchestration + CI/CD + Docker/IaC basics; document architecture and tests.'],
 ['Ongoing — GenAI edge','Databricks GenAI/RAG + Bedrock + evaluation/agents; connect it to your PhD research rather than learning isolated demos.']
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readMemory(){try{return JSON.parse(localStorage.getItem('life-memory-v2')||'{}')}catch(_){return {}}}
function saveMemory(patch){try{const m=readMemory();const next={...m,...patch,updatedAt:new Date().toISOString()};localStorage.setItem('life-memory-v2',JSON.stringify(next));return next}catch(_){return null}}
function install(){
 if(document.getElementById('career-coach'))return;
 const s=document.createElement('style');s.textContent='#career-coach{position:fixed;right:10px;bottom:10px;z-index:99999;font-family:system-ui}.cc-open{padding:11px 15px;border-radius:999px;border:1px solid #4f9eff;background:#101827;color:#fff;font-weight:800;box-shadow:0 4px 20px #0008}.cc-panel{display:none;position:fixed;right:10px;bottom:65px;width:min(900px,calc(100vw - 20px));max-height:88vh;overflow:auto;background:#0b111c;color:#e2e8f0;border:1px solid #29405f;border-radius:18px;padding:15px}.open .cc-panel{display:block}.cc-tabs{display:flex;gap:6px;overflow:auto;margin:10px 0}.cc-tabs button{white-space:nowrap;border:1px solid #29405f;background:#101827;color:#cbd5e1;border-radius:999px;padding:7px 10px}.cc-card,.cc-row,.cc-task{background:#101827;border:1px solid #223550;border-radius:10px;padding:10px;margin:6px 0;font-size:11px;line-height:1.55}.cc-task{display:flex;gap:8px}.cc-check{width:28px;height:28px}.cc-link{color:#7db7ff;margin-right:8px;text-decoration:none}.cc-note{color:#94a3b8;font-size:11px}.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cc-badge{display:inline-block;padding:3px 7px;border-radius:999px;border:1px solid #29405f;margin:2px;font-size:10px}@media(max-width:600px){.cc-grid{grid-template-columns:1fr}.cc-panel{bottom:58px;max-height:90vh}}
';document.head.appendChild(s);
 const r=document.createElement('div');r.id='career-coach';document.body.appendChild(r);
 function render(active='today'){
  let done={};try{done=JSON.parse(localStorage.getItem('coach_done')||'{}')}catch(_){}
  const mem=readMemory();
  const section=(id,title,body)=>'<section id="v-'+id+'" '+(active===id?'':'hidden')+'><h3>'+title+'</h3>'+body+'</section>';
  const taskHtml=tasks.map((x,i)=>'<div class="cc-task"><button class="cc-check" data-i="'+i+'">'+(done[today+'-'+i]?'✓':'○')+'</button><div><b>'+esc(x[0])+'</b><br>'+esc(x[1])+'</div></div>').join('');
  const courseHtml=courses.map(c=>'<details class="cc-card"><summary><b>'+esc(c[0]+' · '+c[1])+'</b></summary>'+c[2].map((m,i)=>'<div class="cc-row">Module '+(i+1)+': '+esc(m)+'</div>').join('')+'</details>').join('');
  const certHtml=certs.map(c=>'<div class="cc-card"><b>'+esc(c.name)+'</b> <span class="cc-badge">'+esc(c.status)+'</span><br><span class="cc-note">Pre-req: '+esc(c.pre)+'</span><br><span>'+esc(c.skills)+'</span><br><a class="cc-link" target="_blank" rel="noopener" href="'+c.url+'">Official page ↗</a></div>').join('');
  const govHtml=government.map(g=>'<details class="cc-card"><summary><b>'+esc(g.group)+'</b></summary>'+g.items.map(x=>'<div class="cc-row"><b>'+esc(x[0])+'</b><br>'+esc(x[1])+'<br><a class="cc-link" target="_blank" rel="noopener" href="'+x[2]+'">Official source ↗</a></div>').join('')+'</details>').join('');
  const skillsHtml=modernSkills.map(x=>'<div class="cc-row"><b>'+esc(x[0])+'</b><br>'+esc(x[1])+'</div>').join('');
  const plannerHtml=planner.map(x=>'<div class="cc-row"><b>'+esc(x[0])+'</b><br>'+esc(x[1])+'</div>').join('');
  const memKeys=Object.keys(mem||{}).filter(k=>!['updatedAt'].includes(k)).slice(0,20);
  const memHtml='<div class="cc-row"><b>Unified progress memory</b><br>'+((memKeys.length?memKeys.map(k=>'<span class="cc-badge">'+esc(k)+'</span>').join(''):'No shared memory snapshot found yet.'))+'<br><span class="cc-note">Office, Health, Journal, PhD, learning and other tabs can continue to write to the shared life-memory-v2 store. Coach progress is saved there as well as in its local checklist.</span></div><button id="save-snapshot" class="cc-open">Save progress snapshot</button>';
  r.innerHTML='<button class="cc-open">🤖 Career Coach</button><div class="cc-panel"><button class="cc-close" style="float:right">×</button><h2>Career Coach · '+today+'</h2><div class="cc-note">9–5 TCS + PhD + certifications + UGC NET + career transition</div><div class="cc-tabs"><button data-t="today">Today</button><button data-t="learn">Learn</button><button data-t="cert">Certifications</button><button data-t="govt">Govt / Research</button><button data-t="skills">Modern DE</button><button data-t="memory">Progress Memory</button></div>'+section('today','Today · Daily tasks',taskHtml)+section('learn','PhD Coursework + Learning Planner',courseHtml+plannerHtml)+section('cert','Certification roadmap · prerequisites + skills',certHtml)+section('govt','Government / teaching / research watchlist',govHtml+'<div class="cc-note">Snapshot verified against official sources on 1 Oct 2026. Vacancy windows change; always open the official notice before applying. “Technical” Army/Navy officer roles are not zero-physical jobs because SSB, medical and service requirements still apply.</div>')+section('skills','Modern Data Engineer skill map',skillsHtml)+section('memory','Unified progress memory',memHtml)+'</div>';
  r.querySelector('.cc-open').onclick=()=>r.classList.add('open');r.querySelector('.cc-close').onclick=()=>r.classList.remove('open');
  r.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{done[today+'-'+b.dataset.i]=!done[today+'-'+b.dataset.i];try{localStorage.setItem('coach_done',JSON.stringify(done))}catch(_){};saveMemory({coach:{date:today,done}});render('today');r.classList.add('open')});
  r.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>render(b.dataset.t));
  const snap=r.querySelector('#save-snapshot');if(snap)snap.onclick=()=>{saveMemory({coach:{date:today,done,certifications:certs.map(c=>({name:c.name,status:c.status})),learning:planner,governmentSnapshot:'2026-10-01'}});snap.textContent='✓ Snapshot saved';setTimeout(()=>render('memory'),400)};
 }
 render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();