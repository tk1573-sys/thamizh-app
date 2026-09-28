// Career Coach + mobile resource hub.
// Independent from the main React tree so core resources remain usable if a tab has a rendering issue.
// Personal context here is limited to non-sensitive career/academic planning details.

const CERTS = [
  { name:'AWS Certified Data Engineer – Associate (DEA-C01)', status:'Coupon received · schedule exam', prereq:'No formal prerequisite; AWS targets 2–3 years data-engineering experience and 1–2 years hands-on AWS.', skills:'ETL, S3, Glue, EMR, Redshift, Kinesis, Lambda, Step Functions, SQL, Python, monitoring, security, governance, CI/CD.', url:'https://aws.amazon.com/certification/certified-data-engineer-associate/', guide:'https://docs.aws.amazon.com/aws-certification/latest/data-engineer-associate-01/data-engineer-associate-01.html' },
  { name:'SnowPro Core (COF-C03)', status:'Coupon received · current exam version', prereq:'No formal prerequisite; Snowflake recommends hands-on knowledge.', skills:'Architecture, RBAC/governance, loading, stages, Snowpipe/Streaming, streams/tasks, dynamic tables, performance, SQL, sharing, Iceberg, Cortex, Notebooks.', url:'https://learn.snowflake.com/en/certifications/snowpro-core-c03/', guide:'https://learn.snowflake.com/en/certifications/snowpro-core-c03/' },
  { name:'Databricks Certified Data Engineer Associate', status:'Live session attended · prerequisites/prep in progress', prereq:'No formal prerequisite; related training and hands-on data-engineering experience are recommended.', skills:'Lakehouse, ingestion/loading, SQL/PySpark, Lakeflow Jobs, CI/CD, troubleshooting, monitoring, optimization, governance and security.', url:'https://www.databricks.com/learn/certification/data-engineer-associate', guide:'https://www.databricks.com/learn/certification/data-engineer-associate' },
  { name:'Claude Certified Architect – Foundations', status:'Preparation / scheduling', prereq:'Use Anthropic Academy preparation and hands-on architecture practice.', skills:'Agentic architecture, orchestration, tool design, MCP, Claude Code, prompt engineering, structured output, context management, reliability, evaluation and responsible deployment.', url:'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification', guide:'https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification' },
  { name:'Claude Certified Architect – Professional', status:'Registered / preparation', prereq:'Prepare after strengthening architecture, agentic workflows, tools/MCP and evaluation.', skills:'Production agent architecture, orchestration, reliability, evaluation, security, cost and scalable deployment.', url:'https://www.anthropic.com/learn/certification', guide:'https://www.anthropic.com/learn/certification' },
  { name:'GitHub Copilot (GH-300)', status:'Completed', prereq:'GitHub fundamentals and experience with at least one programming language.', skills:'Responsible AI, Copilot features, data/architecture, prompt/context crafting, productivity, privacy and safeguards.', url:'https://learn.microsoft.com/credentials/certifications/github-copilot/', guide:'https://learn.microsoft.com/credentials/certifications/resources/study-guides/gh-300' }
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
  'Use the live TNPSC notification page for current Combined Technical Services and other openings; verify the individual notification before applying.',
  'DRDO vacancies include JRF/RA/apprentice opportunities at different times; closing dates vary by notice.',
  'SSC publishes current recruitment notices and updates on its official portal; use the live notice/calendar rather than old coaching calendars.',
  'NCS provides government/private vacancy discovery and state employment-portal links; verify the recruiting organisation notice before applying.'
];

// Current non-sensitive career/academic context used by the Coach.
const MEMORY = [
  ['💼 Office','TCS Data Engineer / Finance BI · Datastage, Teradata, SQL, Python, Unix, ETL/Data Warehousing · 9–5 workday'],
  ['🎓 PhD','Part-time PhD in CSE at Shiv Nadar University Chennai · Generative AI research direction · supervisor guidance and regular research meetings'],
  ['📚 Education','M.Tech Data Science completed in 2026 · current priority is PhD coursework + research foundation'],
  ['🔬 Research','Personalized multimodal AI / wearable sensing / behavioural analytics / computer vision for communication-limited care use cases'],
  ['🏅 Certification sprint','AWS Data Engineer Associate · SnowPro Core · Databricks Data Engineer Associate · Claude Architect Foundations/Professional · GitHub Copilot completed'],
  ['📋 Exam track','UGC-NET Computer Science and Applications (087) · maintain a rolling preparation plan alongside PhD and certifications'],
  ['🎯 Career targets','Data Engineer · AI/GenAI Data Engineer · ETL/Data Platform · teaching/Assistant Professor · research/technical government roles']
];

const DAILY_TEMPLATE = [
  ['07:00–07:30','📋 UGC NET','30 min: one CS topic + 10–15 MCQs'],
  ['18:00–18:45','🏅 Certification','45 min: rotate AWS / Snowflake / Databricks / Claude'],
  ['19:00–20:00','🎓 PhD coursework','60 min: one module from the Learn → Coursework planner'],
  ['20:15–20:45','🔬 Research','30 min: one paper note, keyword search, dataset/idea note or Mendeley task'],
  ['20:45–21:05','💼 Career','20 min: one job/application/interview action'],
  ['21:05–21:15','📓 Journal','10 min: record what was completed, blocker and tomorrow’s top 3'],
  ['Every 60–90 min','🧘 Break','Short movement/water/eye break during study or work blocks; adapt to your current needs']
];

const CERT_ROTATION = [
  ['Mon','AWS Data Engineer','S3/Glue/Redshift + 15 practice questions'],
  ['Tue','SnowPro Core','Architecture/RBAC + SQL + 15 questions'],
  ['Wed','Databricks DE','Lakehouse/SQL-PySpark/Lakeflow + lab'],
  ['Thu','Claude Architect','Agents/tools/MCP/context + architecture exercise'],
  ['Fri','AWS + weak areas','Timed mixed practice + error log'],
  ['Sat','Databricks + Snowflake','2 focused labs + revision notes'],
  ['Sun','Weekly review','Mock/questions + next-week plan; no new topic unless needed']
];

const COURSEWORK = [
  { code:'CS8015', title:'Deep Learning for Computer Vision', hours:45, modules:[
    'M1 Visual Features and Matching (10h): image representation, filtering, frequency domain, edges/blobs/corners, scale space, SIFT, feature matching, BoW/VLAD.',
    'M2 Neural Networks Overview (6h): feedforward networks, backpropagation, gradient descent, regularization and training improvements.',
    'M3 Convolutional Neural Networks (10h): CNN backpropagation, architectures, fine-tuning, kernels/deconvolution, CAM/Grad-CAM/Grad-CAM++, detection and segmentation.',
    'M4 Recurrent Neural Networks (9h): RNNs, LSTMs/GRUs, video understanding, attention, image captioning, self-attention and Transformers.',
    'M5 Deep Generative Models (10h): GANs, VAEs, hybrids, improvements and image synthesis.'
  ], outcomes:'Feature extraction/matching; CNN design and fine-tuning; explainable CNN visualisation; RNN/LSTM/GRU/Transformer use; GAN/VAE development.' },
  { code:'CS8044', title:'Biomedical Signal Processing', hours:45, modules:[
    'M1 Preliminaries and Biomedical Signal Origin & Dynamics (9h): ECG/EEG/EMG, artifact filtering, time/frequency filtering, Wiener/adaptive filtering.',
    'M2 Event Detection (9h): ECG P/QRS/T, derivative approaches, Pan-Tompkins, dicrotic notch, EEG correlation.',
    'M3 Waveform Analysis (9h): morphology, correlation, signal length, envelope extraction, RMS, zero-crossing rate, turns count and form factor.',
    'M4 Frequency-Domain Analysis (9h): periodogram, averaged periodogram, Blackman-Tukey, Daniell estimator and PSD measures.',
    'M5 Modelling of Biomedical Systems (9h): point process, parametric modelling, AR models, autocorrelation, Levinson-Durbin, model-order selection and AR/cepstral relations.'
  ], outcomes:'Understand biomedical signals; remove artefacts; detect events and analyse waveforms; apply frequency-domain methods; model biomedical signals.' },
  { code:'CS8051', title:'Generative AI with Large Language Models', hours:45, modules:[
    'M1 Foundations of Generative AI and LLMs (9h): generative AI, evolution of text generation, Transformer architecture and project lifecycle.',
    'M2 Transformer Models and Text Generation (9h): transformer text generation, prompting/prompt engineering, configuration and pre-training.',
    'M3 Advanced Training and Compute (9h): training challenges, multi-GPU strategies, scaling laws, PEFT, LoRA and soft prompts.',
    'M4 Fine-Tuning, Evaluation and Adaptation (9h): instruction fine-tuning, multi-task learning, benchmarks, domain adaptation and fine-tuning.',
    'M5 Ethics, Human Alignment and Deployment (9h): human values, RLHF, responsible deployment, interactive applications, advanced architectures and external-program integration.'
  ], outcomes:'Optimise transformers; design prompting/fine-tuning; address ethics and bias; integrate LLMs with applications; manage the project lifecycle.' },
  { code:'UM8001', title:'Research Methodology', hours:45, modules:[
    'M1 Fundamentals of Research (10h): research problems, criteria, scope/objectives, types/significance, stages, methodology, data collection, analysis and reporting.',
    'M2 Literature Survey (8h): effective literature studies, analysis, plagiarism and research ethics.',
    'M3 Data Collection and Analysis (8h): primary/secondary data, collection methods, qualitative/quantitative analysis and statistics.',
    'M4 Technical Writing and Presentation (9h): reports, manuscripts, proposals, thesis format and presentations.',
    'M5 Research Indicators (10h): publication models, predatory publishing, citation counts, h-index, SNIP, SJR, impact factor, CiteScore, collaboration metrics and altmetrics.'
  ], outcomes:'Research problem formulation; literature survey and ethics; data collection/analysis; technical writing/presentation; research and publication metrics.' }
];

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function link(label,url,cls='cc-link') { return `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`; }
function loadDone(){ try{return JSON.parse(localStorage.getItem('lifecmd_coach_done')||'{}')}catch(_){return {}} }
function saveDone(d){try{localStorage.setItem('lifecmd_coach_done',JSON.stringify(d))}catch(_){} }
function todayKey(){return new Date().toISOString().slice(0,10)}

function render() {
  const root=document.getElementById('career-coach-hub'); if(!root) return;
  const done=loadDone(), day=todayKey();
  const isDone=(i)=>!!done[`${day}:${i}`];
  const toggle=(i)=>{done[`${day}:${i}`]=!isDone(i);saveDone(done);render();};
  const todayTasks=DAILY_TEMPLATE.map((t,i)=>`<div class="cc-task ${isDone(i)?'done':''}"><button class="cc-check" data-i="${i}" aria-label="Complete task">${isDone(i)?'✓':'○'}</button><div><b>${esc(t[0])} · ${esc(t[1])}</b><div>${esc(t[2])}</div></div></div>`).join('');
  const courses=COURSEWORK.map(c=>`<details class="cc-card"><summary><b>${esc(c.code)} · ${esc(c.title)}</b> <span class="cc-pill">${c.hours} hours</span></summary><p>${esc(c.outcomes)}</p><div class="cc-list">${c.modules.map(m=>`<div class="cc-row">${esc(m)}</div>`).join('')}</div></details>`).join('');
  root.innerHTML=`
    <button class="cc-btn" aria-label="Open Career Coach">🤖 Career Coach</button>
    <div class="cc-panel">
      <button class="cc-close" aria-label="Close">×</button>
      <h2>Career Coach · Daily Command Centre</h2>
      <div class="cc-sub">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'short',year:'numeric'})} · non-sensitive career/academic planning context</div>
      <div class="cc-tabs"><button data-tab="today">Today</button><button data-tab="planner">Planner</button><button data-tab="learn">Coursework</button><button data-tab="certs">Certs</button><button data-tab="memory">Context</button><button data-tab="jobs">Roles</button></div>
      <section id="cc-today" class="cc-view">
        <div class="cc-banner">🎯 <b>Today's rule:</b> protect the 9–5 TCS work block, then complete the minimum study set. Finish small tasks consistently rather than trying to do every certification every day.</div>
        <h3>Daily checklist</h3><div class="cc-list">${todayTasks}</div>
        <div class="cc-card"><b>Today's certification rotation</b><p>${CERT_ROTATION[new Date().getDay()===0?6:new Date().getDay()-1][1]} — ${CERT_ROTATION[new Date().getDay()===0?6:new Date().getDay()-1][2]}</p></div>
        <div class="cc-card"><b>End-of-day journal prompt</b><p>1) What did I finish? 2) What blocked me? 3) What is tomorrow's single most important task?</p></div>
      </section>
      <section id="cc-planner" class="cc-view" hidden>
        <h3>7-day learning planner</h3><div class="cc-grid">${CERT_ROTATION.map(r=>`<div class="cc-card"><span class="cc-pill">${esc(r[0])}</span><h3>${esc(r[1])}</h3><p>${esc(r[2])}</p></div>`).join('')}</div>
        <h3 class="cc-section-title">Weekly allocation</h3><div class="cc-list"><div class="cc-row">Mon–Fri: ~2.5–3h/day after work, split across UGC NET, one certification, coursework and research.</div><div class="cc-row">Saturday: deeper labs + coursework catch-up + mock questions.</div><div class="cc-row">Sunday: review errors, update applications, plan the next week and keep a lighter study load.</div></div>
      </section>
      <section id="cc-learn" class="cc-view" hidden><h3>PhD coursework planner · 4 × 45 hours</h3><p class="cc-note">This coursework section is transcribed from the uploaded syllabus. The four listed courses are CS8015, CS8044, CS8051 and UM8001. fileciteturn55file0L3-L4</p><div class="cc-list">${courses}</div><div class="cc-banner">Suggested sequence for your research direction: <b>UM8001 → CS8051 → CS8044 → CS8015</b>, while keeping weekly exposure to all four. This is a planning suggestion, not an official university sequence.</div></section>
      <section id="cc-certs" class="cc-view" hidden><h3>Certification readiness</h3><div class="cc-grid">${CERTS.map(c=>`<div class="cc-card"><span class="cc-pill">${esc(c.status)}</span><h3>${esc(c.name)}</h3><p><b>Prereq:</b> ${esc(c.prereq)}</p><p><b>Skills:</b> ${esc(c.skills)}</p>${link('Official page',c.url)} ${link('Study guide',c.guide)}</div>`).join('')}</div></section>
      <section id="cc-memory" class="cc-view" hidden><h3>Career & academic context</h3><p class="cc-note">Used only to personalise planning. Sensitive health details are intentionally not prefilled here; use the Health tab for information you choose to enter.</p><div class="cc-list">${MEMORY.map(x=>`<div class="cc-row"><b>${esc(x[0])}</b><div>${esc(x[1])}</div></div>`).join('')}</div></section>
      <section id="cc-jobs" class="cc-view" hidden><h3>Teaching · Research · Government · Career</h3><div class="cc-list">${CURRENT_WATCH.map(x=>`<div class="cc-row">${esc(x)}</div>`).join('')}</div><div class="cc-grid">${ROLE_LINKS.map(([n,u])=>`<div class="cc-row">${link(n,u)}</div>`).join('')}</div><div class="cc-card"><b>Career focus</b><p>Data Engineer / Senior DE · AI/GenAI Data Engineer · ETL/Data Platform · teaching/Assistant Professor · research/technical government roles.</p></div></section>
      <div class="cc-health" id="cc-health">Checking deployed API…</div>
    </div>`;
  root.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>toggle(Number(b.dataset.i)));
  root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{root.querySelectorAll('.cc-view').forEach(v=>v.hidden=true);root.querySelector(`#cc-${b.dataset.tab}`).hidden=false;root.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));});
  root.querySelector('[data-tab="today"]').click();
  fetch('/api/health',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{const e=document.getElementById('cc-health');if(e)e.textContent=`Backend health: ${d.status||'OK'} · ${new Date().toLocaleTimeString()}`;}).catch(()=>{const e=document.getElementById('cc-health');if(e)e.textContent='Backend health check unavailable. Static planner works offline; cloud/API features need the deployed API.';});
}

function install() {
  if (document.getElementById('career-coach-hub')) return;
  const style=document.createElement('style');
  style.textContent=`
    #career-coach-hub{position:fixed;right:14px;bottom:14px;z-index:99999;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #career-coach-hub .cc-btn{border:1px solid #4f9eff66;background:#101827;color:#e2e8f0;border-radius:999px;padding:11px 15px;font-weight:800;box-shadow:0 8px 30px #0008;cursor:pointer}
    #career-coach-hub .cc-panel{display:none;position:fixed;right:12px;bottom:68px;width:min(760px,calc(100vw - 24px));max-height:86vh;overflow:auto;background:#0b111c;color:#e2e8f0;border:1px solid #29405f;border-radius:18px;box-shadow:0 20px 70px #000b;padding:16px}
    #career-coach-hub.open .cc-panel{display:block}
    #career-coach-hub h2{font-size:18px;margin:0 0 5px}.cc-sub,.cc-note{color:#94a3b8;font-size:11px;line-height:1.5}.cc-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cc-card{background:#111a28;border:1px solid #223550;border-radius:12px;padding:11px}.cc-card h3{font-size:13px;margin:6px 0}.cc-card p{font-size:11px;line-height:1.5;color:#cbd5e1;margin:5px 0}.cc-link{color:#7db7ff;text-decoration:none;font-size:11px;font-weight:700;margin-right:10px}.cc-pill{display:inline-block;font-size:10px;border:1px solid #2b4665;border-radius:999px;padding:3px 7px;color:#86efac;margin-bottom:6px}.cc-section-title{margin-top:16px}.cc-list{display:grid;gap:6px}.cc-row{background:#0f1724;border:1px solid #1e3049;border-radius:10px;padding:9px;font-size:11px;line-height:1.45}.cc-task{display:flex;gap:9px;align-items:flex-start;background:#0f1724;border:1px solid #1e3049;border-radius:10px;padding:10px;font-size:11px;line-height:1.45}.cc-task.done{opacity:.55}.cc-task.done b{text-decoration:line-through}.cc-check{width:30px;height:30px;border-radius:8px;border:1px solid #36506f;background:#111a28;color:#86efac;font-size:18px;cursor:pointer;flex:0 0 30px}.cc-banner{background:#101c2c;border:1px solid #31517a;border-radius:12px;padding:10px;margin:10px 0;font-size:11px;line-height:1.5}.cc-close{float:right;border:0;background:transparent;color:#94a3b8;font-size:18px;cursor:pointer}.cc-tabs{display:flex;gap:6px;overflow:auto;padding:10px 0}.cc-tabs button{white-space:nowrap;border:1px solid #29405f;background:#101827;color:#cbd5e1;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer}.cc-tabs button.active{border-color:#4f9eff;background:#14243a;color:#fff}.cc-view{margin-top:5px}.cc-health{margin-top:12px;color:#94a3b8;font-size:10px}.cc-card summary{cursor:pointer;font-size:12px;list-style:none}.cc-card summary::-webkit-details-marker{display:none}
    @media(max-width:600px){#career-coach-hub{right:9px;bottom:max(9px,env(safe-area-inset-bottom))}.cc-grid{grid-template-columns:1fr}.cc-panel{max-height:84vh!important}.cc-btn{font-size:12px;padding:10px 13px!important}}
  `;
  document.head.appendChild(style);
  const root=document.createElement('div');root.id='career-coach-hub';document.body.appendChild(root);
  root.querySelector;
  root.addEventListener('click',e=>{if(e.target.classList.contains('cc-btn'))root.classList.toggle('open');if(e.target.classList.contains('cc-close'))root.classList.remove('open')});
  render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
