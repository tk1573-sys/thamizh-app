/*
 * Career Coach — mobile-safe career / learning hub.
 * No API keys and no private health details are embedded here.
 * Progress is mirrored into the app's unified life-memory-v2 local store.
 */
const today = new Date().toISOString().slice(0, 10);
const tasks = [
  ['Daily Core', '45 min SQL/Python: one problem + one production-style ETL improvement'],
  ['Certification', '60 min on the current priority certification; rotate SnowPro, Databricks, AWS and Claude'],
  ['PhD Coursework', '60 min on one CS8015/CS8044/CS8051/UM8001 module + 5-line notes'],
  ['Research', '30 min: one paper, Mendeley record, dataset/experiment note or supervisor action'],
  ['Career', '20 min: one application, resume bullet, GitHub improvement or interview question'],
  ['UGC NET', '30 min: one Computer Science topic + 15 MCQs; log weak areas'],
  ['Journal', '10 min: record completed work, blocker and tomorrow Top 3'],
];
const courses = [
  ['CS8015', 'Deep Learning for Computer Vision', ['Visual Features and Matching', 'Neural Networks Overview', 'Convolutional Neural Networks', 'Recurrent Neural Networks', 'Deep Generative Models']],
  ['CS8044', 'Biomedical Signal Processing', ['Biomedical Signal Origin and Dynamics', 'Event Detection', 'Waveform Analysis', 'Frequency-Domain Analysis', 'Modelling of Biomedical Systems']],
  ['CS8051', 'Generative AI with Large Language Models', ['Foundations of Generative AI and LLMs', 'Transformer Models and Text Generation', 'Advanced Training and Computational Considerations', 'Model Fine-Tuning, Evaluation and Adaptation', 'Ethical Considerations, Human Alignment and Deployment']],
  ['UM8001', 'Research Methodology', ['Fundamentals of Research', 'Literature Survey', 'Data Collection and Analysis', 'Technical Writing and Presentation', 'Research Indicators']],
];
const certs = [
  { name: 'AWS Certified Data Engineer – Associate (DEA-C01)', status: 'Preparing / priority', url: 'https://aws.amazon.com/certification/certified-data-engineer-associate/', pre: 'AWS targets candidates with data-engineering experience; hands-on AWS practice is strongly recommended.', skills: 'Advanced SQL, Python, ETL/ELT, S3, Glue, Athena, Redshift, EMR, Kinesis, MWAA/Step Functions, IAM/KMS, data quality, monitoring, governance, cost and performance, Git and IaC.' },
  { name: 'SnowPro Core (COF-C03)', status: 'Preparing now', url: 'https://learn.snowflake.com/en/certifications/snowpro-core/', pre: 'Practical Snowflake experience is recommended; follow the current COF-C03 exam guide.', skills: 'Snowflake architecture, virtual warehouses, SQL, loading/unloading, stages, file formats, semi-structured data, RBAC, Time Travel, cloning, sharing, performance and cost optimization.' },
  { name: 'Databricks Certified Data Engineer Associate', status: 'Preparing now', url: 'https://www.databricks.com/learn/certification/data-engineer-associate', pre: 'No formal degree prerequisite; Databricks Fundamentals and hands-on Lakehouse practice are useful preparation.', skills: 'Lakehouse architecture, Delta Lake, Unity Catalog, SQL/PySpark, ingestion, Auto Loader, Lakeflow, Spark Declarative Pipelines, Jobs, data modeling, governance, performance and DevOps.' },
  { name: 'Databricks Certified Generative AI Engineer Associate', status: 'Preparing', url: 'https://www.databricks.com/learn/certification/generative-ai-engineer-associate', pre: 'No formal degree prerequisite; hands-on Databricks GenAI work is strongly useful.', skills: 'LLM application design, RAG, Vector Search, model serving, MLflow, Unity Catalog, evaluation, prompting, agents/MCP and production security.' },
  { name: 'AWS Certified Machine Learning Engineer – Associate (MLA-C02)', status: 'Current beta / investigate', url: 'https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/', pre: 'MLA-C02 is the current English transition path after MLA-C01 ended in English on 28 September 2026; verify beta eligibility before committing.', skills: 'ML data preparation, traditional ML and foundation models, SageMaker/Bedrock, deployment, orchestration, CI/CD, monitoring, security, agents and responsible operations.' },
  { name: 'AWS Certified Generative AI Developer – Professional (AIP-C01)', status: 'Later target', url: 'https://aws.amazon.com/certification/certified-generative-ai-developer-professional/', pre: 'Treat as a later professional-level target after stronger cloud and production GenAI experience.', skills: 'Bedrock, foundation models, RAG/agents, application architecture, APIs, IAM/security, networking, observability, deployment/IaC, cost and production operations.' },
  { name: 'AWS Certified Solutions Architect – Professional', status: 'Later target', url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/', pre: 'Build substantial AWS architecture experience before prioritising this professional certification.', skills: 'Multi-account architecture, networking, security, resilience, storage, compute, databases, migration, observability, cost optimization, Well-Architected and IaC.' },
  { name: 'Claude Architect Professional', status: 'Registered / preparing', url: 'https://www.anthropic.com/learn/certification', pre: 'Follow the current Anthropic certification portal and your registered exam instructions.', skills: 'LLM architecture, Claude/Claude Code, prompting, tool use, agents, context management, evaluation, safety, privacy and production integration.' },
  { name: 'Claude Associate Foundations → Architect Foundations', status: 'Foundation roadmap', url: 'https://www.anthropic.com/learn/certification', pre: 'Use the current Anthropic Academy/certification requirements for the exact exam path.', skills: 'AI fluency, Claude fundamentals, effective prompting, responsible AI, context, tool use and solution architecture.' },
  { name: 'GitHub Copilot Certification', status: 'Completed', url: 'https://learn.github.com/certifications', pre: 'Completed; retain practical Git/Copilot skills through real development work.', skills: 'Responsible AI, Copilot features, prompt/context crafting, developer workflows, testing, privacy and safeguards.' },
];
const government = [
  { group: 'CENTRAL GOVERNMENT', items: [
    ['UPSC Recruitment', 'Specialist, technical, scientific and academic recruitment advertisements.', 'https://www.upsc.gov.in/recruitment/recruitment-advertisement'],
    ['SSC', 'CGL and other central recruitment; inspect each notice for degree, age and post-specific eligibility.', 'https://ssc.gov.in/'],
    ['National Career Service', 'Central employment portal and vacancy search; also provides state employment portal links.', 'https://www.ncs.gov.in/latest-update'],
    ['All-State Employment Portals', 'State employment portal directory for recurring state-level searches.', 'https://www.ncs.gov.in/devPortalList'],
  ]},
  { group: 'RESEARCH / SCIENTIST / TECHNICAL', items: [
    ['ISRO Careers', 'Scientist/Engineer, technical and research opportunities; check the exact centre and discipline notice.', 'https://www.isro.gov.in/Careers.html'],
    ['DRDO Vacancies', 'JRF, RA, project, apprenticeship and technical/scientist notices; eligibility varies by laboratory and advertisement.', 'https://www.drdo.gov.in/drdo/offerings/vacancies'],
    ['DRDO RAC', 'Scientist recruitment and research/technical scientist pathways.', 'https://rac.gov.in/'],
    ['CSIR Careers', 'Project Scientist, Project Associate and research/IT opportunities across CSIR laboratories.', 'https://www.csir.res.in/en/career-opportunities/recruitment'],
    ['C-DAC Careers', 'AI, data, software, HPC, cybersecurity and project/research opportunities.', 'https://www.cdac.in/index.aspx?id=ca_careers'],
    ['ANRF', 'Research funding and research ecosystem information for long-term PhD/research planning.', 'https://www.anrfonline.in/'],
  ]},
  { group: 'TEACHING / ACADEMIC', items: [
    ['UGC-NET / NTA', 'Computer Science & Applications (087) preparation and official cycle notices.', 'https://ugcnet.nta.ac.in/'],
    ['Tamil Nadu TRB', 'Assistant Professor, school and other teaching recruitment; inspect the live notification for exact qualification rules.', 'https://www.trb.tn.gov.in/'],
    ['University academic recruitment', 'Assistant Professor, project faculty, research assistant and research staff openings; eligibility varies by institution.', 'https://www.ncs.gov.in/'],
  ]},
  { group: 'TAMIL NADU GOVERNMENT', items: [
    ['TNPSC', 'Group I/II/IIA/IV and technical-service recruitment; use the live dashboard and notification.', 'https://www.tnpsc.gov.in/'],
    ['TNPSC Exam Dashboard', 'Current examination and notification status.', 'https://www.tnpsc.gov.in/English/Examdashboard.aspx'],
    ['TN Government Recruitment Portal', 'Department and state recruitment notices.', 'https://ima4recruitments.tn.gov.in/'],
    ['Tamil Nadu Career Services', 'State employment and career-service information.', 'https://tamilnaducareerservices.tn.gov.in/Vle/vle_home/'],
  ]},
  { group: 'ARMY / NAVY TECHNICAL', items: [
    ['Indian Navy IT / technical officer entries', 'Some cycles accept CS/IT/data/AI-related qualifications, but officer entry includes SSB, medical and service requirements. It is not a guaranteed desk-only/no-physical-work career.', 'https://www.joinindiannavy.gov.in/'],
    ['Indian Army IT / technical entries', 'Monitor official technical/officer notifications. Medical, SSB and military-service requirements apply.', 'https://joinindianarmy.nic.in/'],
  ]},
];
const modernSkills = [
  ['Core Data Engineering', 'Advanced SQL, Python, Unix/Bash, Git, ETL/ELT, data structures, APIs, file formats, debugging, testing and documentation.'],
  ['Data Architecture', 'Dimensional modelling, star/snowflake schemas, OLTP vs OLAP, partitioning, indexing, CDC, SCD, schema evolution and lake/lakehouse/warehouse patterns.'],
  ['AWS Cloud', 'S3, IAM, VPC basics, Glue, Athena, Redshift, EMR, Lambda, Step Functions/MWAA, CloudWatch, KMS and Secrets Manager.'],
  ['Modern Lakehouse', 'Databricks, Spark/PySpark, Delta Lake, Unity Catalog, Auto Loader, Lakeflow, streaming and workload/cost tuning.'],
  ['Cloud Warehouse', 'Snowflake SQL, warehouses, stages, file formats, semi-structured data, RBAC, Time Travel, cloning, sharing and performance/cost.'],
  ['Transformation / ELT', 'dbt models, tests, documentation, snapshots, incremental models and lineage; understand where dbt complements Spark/Snowflake.'],
  ['Orchestration / Integration', 'Airflow concepts, cloud orchestrators, Fivetran/connectors, REST/JDBC/ODBC and event-driven pipelines.'],
  ['Streaming', 'Kafka concepts, partitions, consumer groups, offsets, schema registry and Spark Structured Streaming/Kinesis basics.'],
  ['Data Quality & Governance', 'Testing, profiling, lineage, catalogs, RBAC, PII handling, encryption, retention and auditability.'],
  ['DevOps for Data', 'CI/CD, GitHub Actions, Docker basics, Terraform/CloudFormation/CDK, environments, secrets, rollback and observability.'],
  ['GenAI for Data Engineers', 'Embeddings, vector stores, RAG, evaluation, agents, MCP, LLM APIs, prompt/context engineering, Bedrock and Databricks GenAI.'],
  ['Production Engineering', 'SLAs/SLOs, idempotency, retries, backfills, incident response, cost optimization, monitoring, logging, alerting and capacity planning.'],
];
const planner = [
  ['Week 1 — Foundation', 'Advanced SQL + Python ETL + Git + one production-style pipeline; finish SnowPro weak areas.'],
  ['Week 2 — Modern DE', 'Spark/PySpark + Delta + Unity Catalog + Lakeflow; build a bronze → silver → gold pipeline.'],
  ['Week 3 — Cloud DE', 'AWS S3 + Glue + Athena + Redshift + IAM + CloudWatch; map the same pipeline to AWS.'],
  ['Week 4 — Engineering maturity', 'dbt + data quality + orchestration + CI/CD + Docker/IaC basics; document architecture and tests.'],
  ['Ongoing — GenAI edge', 'Databricks GenAI/RAG + Bedrock + evaluation/agents; connect learning to your PhD research rather than isolated demos.'],
];
function esc(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function readMemory() { try { return JSON.parse(localStorage.getItem('life-memory-v2') || '{}'); } catch (_) { return {}; } }
function saveMemory(patch) { try { const current = readMemory(); const next = { ...current, ...patch, updatedAt: new Date().toISOString() }; localStorage.setItem('life-memory-v2', JSON.stringify(next)); return next; } catch (_) { return null; } }
function install() {
  if (document.getElementById('career-coach')) return;
  const style = document.createElement('style');
  style.textContent = `#career-coach{position:fixed;right:12px;bottom:12px;z-index:99999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.cc-open{padding:12px 16px;border-radius:999px;border:1px solid #4f9eff;background:#101827;color:#fff;font-weight:800;box-shadow:0 4px 20px #0008;cursor:pointer}.cc-panel{display:none;position:fixed;right:12px;bottom:68px;width:min(920px,calc(100vw - 24px));max-height:88vh;overflow:auto;background:#0b111c;color:#e2e8f0;border:1px solid #29405f;border-radius:18px;padding:15px;box-shadow:0 16px 60px #000b}.open .cc-panel{display:block}.cc-header{display:flex;justify-content:space-between;gap:12px;align-items:center}.cc-close{border:1px solid #29405f;background:#101827;color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer}.cc-tabs{display:flex;gap:6px;overflow:auto;margin:10px 0}.cc-tabs button{white-space:nowrap;border:1px solid #29405f;background:#101827;color:#cbd5e1;border-radius:999px;padding:8px 11px;cursor:pointer}.cc-section{display:none}.cc-section.active{display:block}.cc-card,.cc-row,.cc-task{background:#101827;border:1px solid #223550;border-radius:10px;padding:10px;margin:7px 0;font-size:12px;line-height:1.55}.cc-task{display:flex;gap:10px;align-items:flex-start}.cc-check{width:24px;height:24px;flex:0 0 auto}.cc-link{color:#7db7ff;margin-right:10px;text-decoration:none}.cc-note{color:#94a3b8;font-size:11px}.cc-badge{display:inline-block;padding:3px 7px;border-radius:999px;border:1px solid #29405f;margin-left:5px;font-size:10px;color:#a8c7ff}@media(max-width:600px){.cc-panel{right:6px;bottom:60px;width:calc(100vw - 12px);max-height:91vh;padding:11px}}`;
  document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 'career-coach';
  root.innerHTML = `<button class="cc-open" type="button">🤖 Career Coach</button><div class="cc-panel" role="dialog" aria-label="Career Coach"><div class="cc-header"><div><h2 style="margin:0">Career Coach</h2><div class="cc-note">Daily execution · learning planner · certifications · PhD coursework · jobs</div></div><button class="cc-close" type="button">Close</button></div><div class="cc-tabs"><button data-section="today">Today</button><button data-section="planner">Planner</button><button data-section="certs">Certifications</button><button data-section="coursework">Coursework</button><button data-section="jobs">Jobs</button><button data-section="skills">Modern DE</button><button data-section="memory">Progress</button></div><section class="cc-section" id="cc-today"><h3>Today's tasks · ${today}</h3><div id="cc-tasks"></div><p class="cc-note">Task completion is saved locally and mirrored to life-memory-v2.</p></section><section class="cc-section" id="cc-planner"><h3>5-week learning planner</h3>${planner.map(([a,b]) => `<div class="cc-card"><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</section><section class="cc-section" id="cc-certs"><h3>Certification roadmap</h3>${certs.map(c => `<article class="cc-card"><b>${esc(c.name)}</b> <span class="cc-badge">${esc(c.status)}</span><p><b>Prerequisite:</b> ${esc(c.pre)}</p><p><b>Skills:</b> ${esc(c.skills)}</p><a class="cc-link" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Official page ↗</a></article>`).join('')}</section><section class="cc-section" id="cc-coursework"><h3>PhD coursework</h3>${courses.map(c => `<details class="cc-card"><summary><b>${esc(c[0])} · ${esc(c[1])}</b></summary>${c[2].map((m,i) => `<div class="cc-row">Module ${i+1}: ${esc(m)}</div>`).join('')}</details>`).join('')}</section><section class="cc-section" id="cc-jobs"><h3>Teaching · Research · Government</h3><p class="cc-note">Recruitment changes frequently. Always open the official notification and verify age, qualification, discipline, reservation and deadline before applying.</p>${government.map(g => `<h4>${esc(g.group)}</h4>${g.items.map(([a,b,u]) => `<article class="cc-card"><b>${esc(a)}</b><p>${esc(b)}</p><a class="cc-link" href="${esc(u)}" target="_blank" rel="noopener noreferrer">Official source ↗</a></article>`).join('')}`).join('')}</section><section class="cc-section" id="cc-skills"><h3>Modern Data Engineer skill map</h3>${modernSkills.map(([a,b]) => `<div class="cc-card"><b>${esc(a)}</b><p>${esc(b)}</p></div>`).join('')}</section><section class="cc-section" id="cc-memory"><h3>Progress memory</h3><div class="cc-card"><b>Unified memory status</b><p id="cc-memory-summary"></p><button id="cc-save-memory" type="button">Save Coach progress</button></div><div class="cc-card"><b>Career context</b><p>TCS Data Engineer / Finance BI · DataStage · Teradata · SQL · Python · Unix · ETL · M.Tech Data Science · part-time PhD in CSE · Generative AI research · UGC NET CS · certification roadmap.</p></div></section></div>`;
  document.body.appendChild(root);
  const renderTasks = () => { let done = {}; try { done = JSON.parse(localStorage.getItem('coach_done') || '{}'); } catch (_) {} const box = root.querySelector('#cc-tasks'); box.innerHTML = tasks.map((t,i) => `<label class="cc-task"><input class="cc-check" type="checkbox" data-task="${i}" ${done[`${today}-${i}`] ? 'checked' : ''}><span><b>${esc(t[0])}</b><br>${esc(t[1])}</span></label>`).join(''); box.querySelectorAll('[data-task]').forEach(el => el.addEventListener('change', e => { let d={}; try{d=JSON.parse(localStorage.getItem('coach_done')||'{}')}catch(_){} d[`${today}-${e.target.dataset.task}`]=e.target.checked; localStorage.setItem('coach_done',JSON.stringify(d)); saveMemory({coach:{date:today,completedTasks:Object.keys(d).filter(k=>k.startsWith(`${today}-`)).length}}); updateMemory(); })); };
  const updateMemory = () => { const m=readMemory(); const c=m.coach||{}; const el=root.querySelector('#cc-memory-summary'); if(el) el.textContent=`Last saved: ${m.updatedAt||'not yet'} · Today completed: ${c.completedTasks||0}`; };
  const setSection = id => { root.querySelectorAll('.cc-section').forEach(el=>el.classList.toggle('active',el.id===`cc-${id}`)); };
  root.querySelector('.cc-open').addEventListener('click',()=>{root.classList.add('open');setSection('today');}); root.querySelector('.cc-close').addEventListener('click',()=>root.classList.remove('open')); root.querySelectorAll('.cc-tabs button').forEach(b=>b.addEventListener('click',()=>setSection(b.dataset.section)));
  root.querySelector('#cc-save-memory').addEventListener('click',()=>{saveMemory({coach:{date:today,completedTasks:root.querySelectorAll('[data-task]:checked').length,plannerVersion:'2026-10',coursework:courses.map(c=>c[0])}});updateMemory();});
  renderTasks(); updateMemory(); setSection('today');
}
if (typeof window !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true }); else install(); }
export { tasks, courses, certs, government, modernSkills, planner };
