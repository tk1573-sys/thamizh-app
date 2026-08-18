import { useState, useEffect, useCallback } from "react";

// ─── Palette ─────────────────────────────────────────────────────────────────
const P = {
  bg:"#080C12", card:"#0E1420", card2:"#141A26", card3:"#1A2133",
  border:"#1E2D45", a1:"#4F9EFF", a2:"#34D399", a3:"#FB923C",
  a4:"#A78BFA", a5:"#F87171", muted:"#64748B", text:"#E2E8F0", sub:"#CBD5E1",
};
const gl = (c,ex={}) => ({
  background:"linear-gradient(135deg,rgba(14,20,32,0.95),rgba(20,26,38,0.9))",
  border:`1px solid ${c ? c+"44" : P.border}`,
  borderRadius:14, backdropFilter:"blur(16px)",
  boxShadow: c ? `0 4px 32px ${c}22, inset 0 1px 0 ${c}33` : "0 4px 16px rgba(0,0,0,0.5)",
  ...ex
});
const glow = c => ({ boxShadow:`0 0 24px ${c}44, 0 4px 16px ${c}22` });

// ─── PIN: pure React state — no storage dependency ────────────────────────────
// Stores hashed PIN in component memory only (per session).
// On first visit: user sets PIN → stored in sessionStorage (tab-level, safe).
// Re-entering tab: user must re-enter PIN each session for security.
function hashPin(pin) {
  // Simple djb2 hash — enough for local privacy, not sent anywhere
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) + h) + pin.charCodeAt(i);
  return String(h >>> 0);
}

function PinDots({ count, filled, color }) {
  return (
    <div style={{ display:"flex", gap:10, justifyContent:"center", margin:"18px 0" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width:14, height:14, borderRadius:"50%",
          background: i < filled ? color : "rgba(255,255,255,0.1)",
          border: `2px solid ${i < filled ? color : "rgba(255,255,255,0.15)"}`,
          transition:"all 0.15s ease",
          transform: i < filled ? "scale(1.1)" : "scale(1)",
        }}/>
      ))}
    </div>
  );
}

function NumPad({ onKey, onDelete, color }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, maxWidth:230, margin:"0 auto" }}>
      {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i) =>
        k === "" ? <div key={i}/> : (
          <button key={i}
            onClick={() => k === "⌫" ? onDelete() : onKey(k)}
            style={{
              padding:"15px 0", borderRadius:12,
              background: k==="⌫" ? `${P.a5}18` : `rgba(255,255,255,0.05)`,
              border: `1px solid ${k==="⌫" ? P.a5+"55" : "rgba(255,255,255,0.1)"}`,
              color: k==="⌫" ? P.a5 : P.text,
              fontSize: k==="⌫" ? 18 : 20, fontWeight:600, cursor:"pointer",
              transition:"all 0.1s",
            }}>
            {k}
          </button>
        )
      )}
    </div>
  );
}

function PinGate({ label, color, icon, storeKey, children }) {
  // phase: "checking" | "setup1" | "setup2" | "locked" | "open"
  const [phase, setPhase]   = useState("checking");
  const [pin1, setPin1]     = useState("");   // new PIN entry 1
  const [pin2, setPin2]     = useState("");   // new PIN entry 2 (confirm)
  const [entry, setEntry]   = useState("");   // unlock attempt
  const [shake, setShake]   = useState(false);
  const [msg, setMsg]       = useState("");

  const SK = "pin_hash_" + storeKey;

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SK);
      if (stored) setPhase("locked");
      else setPhase("setup1");
    } catch(_) {
      setPhase("setup1");
    }
  }, [SK]);

  const doShake = (m) => { setMsg(m); setShake(true); setTimeout(()=>setShake(false),500); };

  // Setup phase 1 → advance to phase 2 when 4+ digits entered
  useEffect(() => {
    if (phase !== "setup1" || pin1.length < 4) return;
    const t = setTimeout(() => { setPhase("setup2"); setMsg(""); }, 300);
    return () => clearTimeout(t);
  }, [pin1, phase]);

  // Setup phase 2 → validate + save
  useEffect(() => {
    if (phase !== "setup2" || pin2.length < pin1.length) return;
    const t = setTimeout(() => {
      if (pin2 === pin1) {
        try { sessionStorage.setItem(SK, hashPin(pin1)); } catch(_) {}
        setMsg(""); setPhase("open");
      } else {
        doShake("PINs don't match — try again");
        setPin1(""); setPin2(""); setPhase("setup1");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pin2, pin1, phase, SK]);

  // Unlock: check entry against stored hash
  useEffect(() => {
    if (phase !== "locked" || entry.length < 4) return;
    const t = setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(SK);
        if (stored === hashPin(entry)) {
          setMsg(""); setPhase("open");
        } else {
          doShake("Wrong PIN");
          setEntry("");
        }
      } catch(_) { setEntry(""); }
    }, 200);
    return () => clearTimeout(t);
  }, [entry, phase, SK]);

  const addDigit = (d) => {
    if (phase === "setup1" && pin1.length < 6) setPin1(p => p+d);
    if (phase === "setup2" && pin2.length < 6) setPin2(p => p+d);
    if (phase === "locked" && entry.length < 6) setEntry(p => p+d);
  };
  const delDigit = () => {
    if (phase === "setup1") setPin1(p => p.slice(0,-1));
    if (phase === "setup2") setPin2(p => p.slice(0,-1));
    if (phase === "locked") setEntry(p => p.slice(0,-1));
  };
  const resetPin = () => {
    try { sessionStorage.removeItem(SK); } catch(_) {}
    setPin1(""); setPin2(""); setEntry(""); setPhase("setup1"); setMsg("");
  };

  if (phase === "checking") return (
    <div style={{textAlign:"center",padding:60,color:P.muted}}>Loading...</div>
  );
  if (phase === "open") return children;

  const current = phase==="setup1" ? pin1 : phase==="setup2" ? pin2 : entry;

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:420,padding:16}}>
      <div style={{
        ...gl(color), padding:32, textAlign:"center",
        maxWidth:300, width:"100%",
        animation: shake ? "shake 0.4s ease" : "none",
      }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
        <div style={{fontSize:48,marginBottom:8}}>{icon}</div>
        <div style={{fontSize:18,fontWeight:800,color,marginBottom:4}}>{label}</div>

        {phase === "setup1" && <>
          <div style={{fontSize:13,color:P.muted,marginBottom:2}}>Create a PIN to protect this section</div>
          <div style={{fontSize:11,color:P.a3}}>Enter 4–6 digits</div>
          <PinDots count={6} filled={pin1.length} color={color}/>
        </>}

        {phase === "setup2" && <>
          <div style={{fontSize:13,color:P.muted,marginBottom:2}}>Re-enter your PIN to confirm</div>
          <div style={{fontSize:11,color:P.a2}}>✓ First PIN set ({pin1.length} digits)</div>
          <PinDots count={6} filled={pin2.length} color={color}/>
        </>}

        {phase === "locked" && <>
          <div style={{fontSize:13,color:P.muted}}>Enter your PIN to unlock</div>
          <PinDots count={6} filled={entry.length} color={color}/>
        </>}

        {msg && <div style={{fontSize:12,color:P.a5,fontWeight:600,marginBottom:10}}>{msg}</div>}

        <NumPad color={color} onKey={addDigit} onDelete={delDigit}/>

        {phase === "locked" && (
          <button onClick={resetPin} style={{marginTop:14,background:"transparent",border:`1px solid ${P.border}`,borderRadius:8,padding:"8px 20px",color:P.muted,fontSize:11,cursor:"pointer"}}>
            Forgot PIN? Reset
          </button>
        )}
        <div style={{fontSize:10,color:P.muted,marginTop:18}}>
          🔒 PIN stays in this browser tab only
        </div>
      </div>
    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────
const pillars = [
  { id:"job", label:"Career", color:P.a1, emoji:"💼" },
  { id:"phd", label:"PhD SSN", color:P.a4, emoji:"🎓" },
  { id:"ugc", label:"UGC NET", color:P.a2, emoji:"📋" },
  { id:"cert", label:"Certs", color:P.a3, emoji:"🏅" },
  { id:"govt", label:"Govt Jobs", color:P.a5, emoji:"🏛️" },
];

const monthPlan = [
  { month:"July 2026", theme:"PhD Begins · Career Foundation", color:P.a1, items:{
    job:["Update LinkedIn headline: Data Engineer | GenAI | PhD Scholar | Python","Apply 5+ Senior DE / AI-DE roles/week on Naukri, LinkedIn, Instahyre","Resume update: 4 variants (Senior DE, AI-DE, Analytics Eng, Asst Prof)","Begin Python basics: Automate the Boring Stuff (free) – 1 hr/day","SQL: LeetCode Easy problems daily – 2 per day"],
    phd:["PhD orientation at SSN – attend all sessions","Meet assigned supervisor – confirm GenAI/LLM research area","Set up PhD workspace: Notion/Obsidian for notes, Google Scholar alerts","Build reading list: survey papers on RAG, LLMs, Multimodal AI","Sync PhD timetable with TCS work schedule"],
    ugc:["Download UGC NET Dec 2026 official syllabus from ugcnet.nta.ac.in","Start DBMS: ER model, normalisation 1NF-BCNF, SQL queries","20 MCQs/day on GeeksForGeeks DBMS section","Register on Testbook / Adda247 for mock test series"],
    cert:["Resume Databricks DEA course – set target: exam by Sep 2026","Complete pending Gemini Talent Pool modules (TCS)","GCP: start Google Cloud Skills Boost free learning path"],
    govt:["Register on drdo.gov.in, isro.gov.in, nic.in, cdac.in portals","Track DRDO CEPTAM 2026 notification","Check ISRO Scientist-SC openings for CS/IT stream"],
  }},
  { month:"August 2026", theme:"Python + SQL Momentum", color:P.a2, items:{
    job:["Python: complete Pandas, NumPy, file I/O, REST APIs (Kaggle free course)","SQL: LeetCode Medium window functions, CTEs, performance tuning","Build Project 1: Python ETL script – CSV → clean → transform → email report","Apply 5+ roles/week; maintain application tracker spreadsheet","Interview prep: 30 SQL problems on LeetCode + HackerRank"],
    phd:["Attend Semester 1 first month classes + submit any assignments","Write 500-word research problem statement draft","Start literature review: read and annotate 8 papers (2 per week)","Meet supervisor – confirm thesis chapter outline"],
    ugc:["Complete DBMS unit fully – move to OS: scheduling, memory, deadlocks","DSA: Trees, Graphs, sorting algorithms, Dynamic Programming basics","2 full mock tests – detailed analysis of wrong answers","20 MCQs/day – increase to 25/day"],
    cert:["Databricks DEA: 60% course complete","GCP BigQuery: practice with free tier + public datasets","Python intermediate: list comprehensions, decorators, error handling"],
    govt:["Apply DRDO CEPTAM if notification opens","Prep programming MCQs: C, DBMS, networking","Check BEL/HAL/ECIL annual engineer recruitment"],
  }},
  { month:"September 2026", theme:"GenAI + Cloud + Databricks Exam", color:P.a3, items:{
    job:["PySpark basics: SparkSession, DataFrames, transformations on Databricks Community","LangChain: chains, prompt templates, memory, output parsers","Build Project 2: PySpark ETL job on Databricks Community Edition (free)","Apply 5+ AI-DE and GenAI-DE roles/week – shift focus to AI roles","LeetCode: 2 hard SQL problems/week for Senior DE interviews"],
    phd:["Chapter 1 first draft: Introduction + Research Motivation (1000 words)","Identify 1 national conference for abstract submission (Nov–Dec 2026)","Attend PhD colloquium if offered by SSN","Supervisor meeting: review progress, refine problem statement"],
    ugc:["Computer Networks: OSI, TCP/IP, subnetting, routing protocols, DNS/HTTP","TOC: DFA, NFA, epsilon-NFA conversion, CFG, PDA – 15 problems/day","UGC NET Dec 2026 registration opens – REGISTER IMMEDIATELY when open (Sep–Oct)","30 MCQs/day – 2 full mocks this month"],
    cert:["DATABRICKS DEA EXAM – target this month or early October","GCP Professional DE: 40% prep done","Spark Udemy: complete remaining modules"],
    govt:["Apply NIC Scientist B if notification out","ISRO VSSC/SAC – check quarterly openings","TNPSC Group 1/2 technical posts – check notification"],
  }},
  { month:"October 2026", theme:"Interview Sprint + UGC NET Registration", color:P.a4, items:{
    job:["Build Project 3: RAG chatbot – PDF question answering using LangChain + ChromaDB","Portfolio: 3 GitHub projects with README, demo screenshots, live links","LinkedIn: post 1 article on GenAI + Data Engineering (establishes credibility)","Target 5+ interview calls this month – convert at least 2 to technical rounds","Mock interview: 1/week using Pramp, system design for data pipelines"],
    phd:["Submit conference abstract (GenAI / NLP track) to identified conference","Chapter 1 revised after supervisor feedback","Start Chapter 2 outline: Literature Review (collect 20 papers minimum)","Attend any FDP (Faculty Development Programme) if offered"],
    ugc:["REGISTER FOR UGC NET DEC 2026 – do not miss this window","Programming: C pointers, Java OOP, Python generators – MCQ intensive","Software Engineering: SDLC, Agile, UML, testing types","Full Paper 1 + Paper 2 combined mock – analyse results thoroughly"],
    cert:["GCP Professional DE: 70% prep – schedule exam for Nov","AWS DE Associate: begin Stephane Maarek Udemy course (₹499 on sale)","dbt Learn: start free course at courses.getdbt.com"],
    govt:["DRDO CEPTAM written test if shortlisted","SSC CGL technical posts 2026 – check eligibility and notification","Coast Guard / Navy civilian tech roles – quarterly check"],
  }},
  { month:"November 2026", theme:"UGC NET Final Push + Cert Completion", color:P.a5, items:{
    job:["Evaluate any job offers – negotiate strongly for 40-60% hike","If offer received: assess role fit vs TCS + PhD compatibility","LinkedIn: post 2nd article (Python automation + ETL use case)","Keep applying 3+ roles/week even if in negotiations","Walking Professor: finalise 1–2 weekend slots at engineering colleges"],
    phd:["Chapter 1 final version submitted to supervisor","Chapter 2 first draft: Literature Review (1500 words)","Attend conference if abstract accepted","Apply for SSN internal PhD fellowship / funding if available"],
    ugc:["FINAL MONTH BEFORE EXAM – 2 hours/day dedicated slot non-negotiable","Complete all 5 UGC NET previous year papers (Dec 2022 to Jun 2026)","Paper 1: all 10 units revised – teaching, research, reasoning, ICT","Paper 2: formula cheat sheets for DBMS, OS, Networks, TOC","Sunday: 1 full timed mock – target 65%+ consistently"],
    cert:["GCP Professional DE: EXAM THIS MONTH","Databricks cert: post on LinkedIn if passed","AWS DE: 50% complete – exam plan for Jan 2027"],
    govt:["Submit all pending central govt applications before year-end","DRDO/ISRO: prepare domain test if any shortlisting received","NIC Scientist B: follow up on application status"],
  }},
  { month:"December 2026", theme:"UGC NET EXAM + Year Review", color:P.a2, items:{
    job:["Year-end TCS hike review or new role onboarding","Update all certs and PhD status on LinkedIn","Plan 2027: Senior DE lead / AI Architect / full-time Asst Prof target","Post retrospective article: 6-month transformation story"],
    phd:["Semester 1 results + Semester 2 planning","Submit Chapter 2 to supervisor","Identify Scopus-indexed journal for 2027 paper submission","Attend PhD year-end colloquium at SSN"],
    ugc:["UGC NET DECEMBER 2026 EXAM – CLEAR IT","After exam: apply immediately for Asst Professor eligibility certificate","If cleared: start applying to CSE/IT/DS Asst Professor positions","Whether cleared or not: plan for June 2027 attempt as backup"],
    cert:["Full cert stack review: Databricks ✓ Gemini ✓ GCP ✓","2027 plan: AWS DE Associate (Jan), Snowflake (Mar), dbt Certified (May)","Update all credentials on LinkedIn with certificate links"],
    govt:["Review status of all 2026 govt applications submitted","BEL/HAL/ECIL – mark 2027 recruitment cycle calendar","DRDO/ISRO 2027: prepare for domain-specific written test"],
  }},
];

const careerRoles = [
  { role:"AI Data Engineer", level:"#1 Target – Highest ROI 2026", color:P.a4,
    salary:"₹20–50 LPA", timeline:"3–5 months with LangChain + RAG projects",
    skills:["LangChain / LlamaIndex","RAG pipelines","ChromaDB / FAISS / Pinecone","Gemini + OpenAI APIs","FastAPI","Python (strong)","MLflow / model tracking","Docker basics"],
    companies:["Google India","Microsoft India","Sarvam AI","Krutrim","Ola AI","Swiggy AI team","CRED","Razorpay","PhonePe"],
    why:"Your PhD in GenAI at SSN + Gemini Talent Pool + LangChain portfolio = perfect candidate. 2026 peak demand. Highest salary you can target from TCS background.",
  },
  { role:"Senior Data Engineer", level:"Immediate – apply this week", color:P.a1,
    salary:"₹15–35 LPA", timeline:"0–2 months with Databricks cert",
    skills:["PySpark / Spark","Apache Airflow / Prefect","dbt (data build tool)","Delta Lake / Iceberg","Databricks (cert in progress)","GCP BigQuery","Python (intermediate)","Kafka basics"],
    companies:["Zoho","Freshworks","TCS Digital","Accenture Analytics","PayPay","Meesho","Razorpay","Flipkart Data"],
    why:"4.3yr TCS exp + SQL/DataStage/Teradata + Databricks cert = Senior DE immediately. 40-60% hike possible with just a resume update. Apply now, don't wait.",
  },
  { role:"Analytics Engineer", level:"High demand – SQL is your strength", color:P.a2,
    salary:"₹12–28 LPA", timeline:"2–3 months – dbt learnable in 3 weeks",
    skills:["dbt (learn in 3 weeks – courses.getdbt.com free)","SQL advanced (your strongest skill)","Python basic","Looker / Metabase / Tableau","Data modeling","Snowflake / BigQuery","Git"],
    companies:["Flipkart","Amazon India","Urban Company","Groww","Zerodha","Paytm","Zetwerk","Dunzo"],
    why:"Your advanced SQL + ETL background maps perfectly. dbt is the new must-have. Often less competitive than DE roles. Growing fast in Indian market 2026.",
  },
  { role:"Assistant Professor CSE/DS/AI", level:"Academia – parallel career path", color:P.a3,
    salary:"₹6–14 LPA private | ₹15–18 LPA deemed/central", timeline:"UGC NET Dec 2026 → apply Jan 2027",
    skills:["UGC NET CS (required)","PhD in progress – SSN (strong differentiator)","Teaching: DS, DBMS, Big Data, AI/ML, Python","Research publications","Lab guidance for students"],
    companies:["Shiv Nadar University (SNU), Chennai","VIT","SRM","Amrita","PSG College","BITS adjunct","Private engineering colleges Chennai"],
    why:"PhD at SSN + UGC NET = direct Asst Prof eligibility. Start as walking/visiting professor now while in TCS. One of the most stable careers with zero burnout pressure.",
  },
  { role:"Senior ETL / DataStage Dev", level:"Apply NOW – zero reskilling", color:P.a5,
    salary:"₹10–22 LPA", timeline:"Apply this week – immediate",
    skills:["IBM DataStage (you have this)","Teradata (you have this)","SQL advanced (you have this)","Unix/Shell scripting (you have this)","ServiceNow (you have this)"],
    companies:["IBM India","Cognizant","Capgemini","DXC Technology","Mphasis","HCL Tech","Infosys BPM","Wipro"],
    why:"Zero reskilling. Just resume + interview prep. Use as bridge role while building modern DE + AI skills. Immediate 40-60% hike from TCS salary.",
  },
  { role:"Govt Tech Roles", level:"SC advantage – stability + security", color:P.a2,
    salary:"₹7–16 LPA + pension + perks", timeline:"6–12 months – SC reservation helps",
    skills:["CS fundamentals: DBMS, OS, Networks, DSA (same as UGC NET prep)","Python / C programming MCQs","IT infrastructure + data systems","GATE CS score (helpful for some roles)"],
    companies:["DRDO (CEPTAM)","ISRO (Scientist SC)","NIC (Scientist B)","C-DAC","BEL","HAL","TNPSC technical"],
    why:"SC reservation = major advantage. PhD in progress + UGC NET = additional eligibility. Your UGC NET prep directly overlaps with DRDO/ISRO exam syllabus.",
  },
];

const skillRoadmap = [
  { name:"Python – From Zero", icon:"🐍", color:P.a1, priority:"Start NOW – foundation of everything else",
    phases:[
      { phase:"Month 1 (Jul): Absolute Basics", free:true,
        resource:"Automate the Boring Stuff with Python – automatetheboringstuff.com (completely free)",
        topics:["Variables, data types, operators","if/else, for loops, while loops","Functions, parameters, return values","Lists, tuples, dicts, sets – master all four"] },
      { phase:"Month 2 (Aug): Data Python", free:true,
        resource:"Kaggle Python + Pandas micro-courses – kaggle.com/learn (free with certificate)",
        topics:["Pandas: read CSV, filter, groupby, merge, pivot tables","NumPy: arrays, broadcasting, math operations","Matplotlib: bar charts, line graphs, scatter plots","requests library: call REST APIs, parse JSON responses"] },
      { phase:"Month 3 (Sep): DE Python", free:false,
        resource:"Databricks Community Edition (free) + Taming Big Data with Spark – Frank Kane Udemy ₹499",
        topics:["PySpark: SparkSession, DataFrames, transformations, actions","SQLAlchemy: connect Python to databases","Build ETL pipeline: extract from API, transform with Pandas, load to DB","Error handling, logging, scheduling with schedule library"] },
      { phase:"Month 4 (Oct): AI Python", free:true,
        resource:"LangChain docs (python.langchain.com) + DeepLearning.AI free courses (deeplearning.ai)",
        topics:["LangChain chains, prompt templates, output parsers","Build a RAG pipeline: PDF → chunks → embeddings → ChromaDB → query","FastAPI: create REST endpoint for your LLM app","Docker basics: package your Python app in a container"] },
    ],
    projects:["P1: CSV cleaner that sends formatted email report automatically","P2: REST API data fetcher that stores in SQLite + plots trend charts","P3: PySpark ETL job running on Databricks Community Edition","P4: RAG chatbot – ask questions about any PDF using LangChain + ChromaDB"],
  },
  { name:"SQL – Deep Mastery", icon:"🗄️", color:P.a2, priority:"Your biggest strength – make it unbeatable",
    phases:[
      { phase:"Week 1–2 (Jul): Foundation Refresh", free:true,
        resource:"Mode Analytics SQL Tutorial – mode.com/sql-tutorial (completely free, best structured)",
        topics:["JOINs: INNER, LEFT, RIGHT, FULL OUTER, CROSS, SELF JOIN","GROUP BY, HAVING, aggregate functions: COUNT, SUM, AVG, MAX, MIN","Subqueries: scalar, correlated, EXISTS, IN, NOT IN","CTEs (WITH clause): simple and chained CTEs"] },
      { phase:"Week 3–4 (Jul–Aug): Advanced SQL", free:true,
        resource:"LeetCode SQL free tier – solve Easy then Medium | SQLZoo (sqlzoo.net)",
        topics:["Window functions: ROW_NUMBER, RANK, DENSE_RANK, NTILE","LEAD, LAG, FIRST_VALUE, LAST_VALUE, NTH_VALUE","PARTITION BY – understand this deeply with examples","Recursive CTEs – hierarchy and tree queries"] },
      { phase:"Month 2 (Aug): Performance + Design", free:true,
        resource:"PostgreSQL locally (free) + pgAdmin | EXPLAIN ANALYZE + dbt Learn (courses.getdbt.com free)",
        topics:["Indexes: B-tree, bitmap, covering, partial indexes","Query execution plans: how to read EXPLAIN output","Normalisation: 1NF, 2NF, 3NF, BCNF – with real examples","Star schema vs snowflake schema, SCD Type 1/2/3, dbt models"] },
      { phase:"Month 3+ (Sep–Oct): Cloud SQL", free:true,
        resource:"GCP BigQuery free tier ($300 credit) + dbt Cloud free tier",
        topics:["BigQuery: partitioning, clustering, nested/repeated fields, ARRAY_AGG","dbt: models, tests, documentation, materializations, snapshots","Teradata specifics: QUALIFY, SAMPLE, SET vs MULTISET tables","SQL for interviews: 50 LeetCode problems documented as portfolio"] },
    ],
    projects:["P1: Solve 50 LeetCode SQL – screenshot solutions for portfolio README","P2: Build star schema from raw CSV + dbt models + data quality tests","P3: BigQuery dashboard: public dataset → complex SQL → Looker Studio viz","P4: NL-to-SQL generator using your Teradata knowledge + LangChain"],
  },
  { name:"GenAI & LangChain", icon:"🤖", color:P.a4, priority:"PhD fuel + highest salary multiplier in 2026",
    phases:[
      { phase:"Month 1 (Jul–Aug): AI Foundations", free:true,
        resource:"Google Gemini Talent Pool (TCS – you have access) + fast.ai Practical DL (fast.ai free)",
        topics:["LLMs: tokens, context window, temperature, top-k, top-p","Prompt engineering: zero-shot, few-shot, chain-of-thought, ReAct","Gemini API via TCS Talent Pool – use it for experiments","Hugging Face basics: load model, tokenizer, inference pipeline"] },
      { phase:"Month 2 (Aug–Sep): LangChain Core", free:true,
        resource:"LangChain docs (python.langchain.com) + DeepLearning.AI LangChain short course (free)",
        topics:["LLMChain, SequentialChain, RouterChain","Prompt templates, output parsers, structured output","Memory: ConversationBufferMemory, ConversationSummaryMemory","Document loaders, text splitters (recursive, semantic)"] },
      { phase:"Month 3 (Sep–Oct): RAG Systems", free:true,
        resource:"DeepLearning.AI RAG course (free) + ChromaDB docs + LlamaIndex docs",
        topics:["RAG architecture: retrieval-augmented generation explained","Embeddings: text-embedding-ada-002, GTE, BGE, Gemini embeddings","Vector stores: ChromaDB (local free), FAISS, Pinecone (free tier)","Build document Q&A: PDF to answers in under 50 lines of Python"] },
      { phase:"Month 4 (Oct–Nov): Production + Agents", free:true,
        resource:"FastAPI tutorial (fastapi.tiangolo.com free) + LangChain agents docs",
        topics:["FastAPI: build REST API for your LLM app with authentication","Docker: Dockerfile, build, run, push to Docker Hub","MLflow: experiment tracking, model registry, metrics logging","LangChain Agents: ReAct agent with custom tools + function calling"] },
    ],
    projects:["P1: ChatPDF – upload PDF, ask questions using RAG + ChromaDB","P2: SQL query generator using LangChain + Teradata schema context","P3: ETL monitoring agent – LangChain agent that checks pipeline health and alerts","P4: Research assistant for PhD – summarise papers, extract key points, compare findings"],
  },
  { name:"Cloud Platforms", icon:"☁️", color:P.a3, priority:"GCP first (Gemini synergy), then AWS for market breadth",
    phases:[
      { phase:"Month 1 (Jul–Aug): GCP Core", free:true,
        resource:"Google Cloud Skills Boost – cloudskillsboost.google (free learning paths + $300 credit for new accounts)",
        topics:["BigQuery: load data, SQL queries, schedule jobs, partitioning","Cloud Storage: buckets, lifecycle rules, access control, IAM","Pub/Sub: topics, subscriptions, push vs pull, ordering","Service accounts, IAM roles, least privilege principle"] },
      { phase:"Month 2 (Aug–Sep): GCP Data Engineering", free:true,
        resource:"GCP Data Engineering learning path on Skills Boost (free badges with hands-on labs)",
        topics:["Dataflow: Apache Beam batch and streaming pipelines","Cloud Composer: managed Airflow, DAG deployment, sensors","Vertex AI basics: model deployment, prediction endpoints","Looker Studio: connect BigQuery, build dashboards, share reports"] },
      { phase:"Month 3 (Sep–Oct): AWS Essentials", free:false,
        resource:"Stephane Maarek AWS DE Associate – Udemy ₹499 | AWS Skill Builder free tier (skillbuilder.aws)",
        topics:["S3: storage classes, lifecycle, versioning, event notifications","AWS Glue: ETL jobs, crawlers, Data Catalog, job bookmarks","Redshift: COPY command, distribution keys, sort keys, WLM","Lambda: event-driven ETL, trigger on S3 upload, 15-min timeout"] },
      { phase:"Month 4 (Oct–Nov): Cert Prep", free:true,
        resource:"ExamPro GCP DE YouTube (free) + official Google practice questions (free)",
        topics:["GCP Professional DE exam: 50 Qs, 2 hours, $200 USD","Practice: Whizlabs or ExamPro mock exams","Review: BigQuery optimization, Dataflow patterns, IAM security","AWS DE: practice exams – Udemy course includes these"] },
    ],
    projects:["P1: GCP pipeline – Pub/Sub → Dataflow → BigQuery → Looker Studio dashboard","P2: AWS pipeline – S3 event → Lambda trigger → Glue ETL → Redshift load"],
  },
];

const ugcSchedule = [
  { month:"July 2026", focus:"DBMS + DSA Start", daily:"20 MCQs/day + 1hr theory", resource:"GFG DBMS unit-wise + Abdul Bari Algorithms YouTube" },
  { month:"August 2026", focus:"OS + Programming MCQs", daily:"25 MCQs/day + 1 mock test", resource:"Galvin OS summary notes + Neso Academy YouTube" },
  { month:"September 2026", focus:"CN + TOC + REGISTER", daily:"25 MCQs/day + 2 mocks", resource:"Ravindrababu Ravula YouTube + GATE Overflow" },
  { month:"October 2026", focus:"Paper 1 + SE + Registration done", daily:"30 MCQs/day + 2 mocks", resource:"Testbook UGC NET Paper 1 full mock series" },
  { month:"November 2026", focus:"FULL REVISION MODE", daily:"40 MCQs/day + 1 timed mock/week", resource:"Adda247 previous year papers 2022–2026" },
  { month:"December 2026", focus:"EXAM MONTH – Previous papers only", daily:"Rest 2 full days before exam day", resource:"NTA official sample papers only" },
];

const ugcPaper2 = [
  { unit:"DBMS", weight:"8–10 Qs (Highest)", topics:["ER model, EER, mapping to relational schema","Normalisation: 1NF, 2NF, 3NF, BCNF, 4NF with examples","SQL: JOINs, GROUP BY, subqueries, correlated queries, triggers, views","Transactions: ACID properties, serializability, 2PL, timestamp ordering","Indexing: B+ tree structure, hashing (static/dynamic), dense vs sparse"] },
  { unit:"Operating Systems", weight:"8–10 Qs (Highest)", topics:["CPU Scheduling: FCFS, SJF (preemptive/non-preemptive), Round Robin, Priority, MLFQ","Deadlock: 4 conditions, prevention, avoidance (Banker's), detection, recovery","Memory Management: paging, segmentation, TLB, virtual memory, page replacement (FIFO/LRU/Optimal)","File Systems: FAT, inode structure, directory implementation, disk scheduling (SCAN/LOOK/C-LOOK)"] },
  { unit:"DSA + Algorithms", weight:"8–10 Qs (Highest)", topics:["Trees: BST operations, AVL rotations, Red-Black, B-tree, heap (min/max), Huffman","Graphs: BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, Kruskal, Prim, topological sort","Sorting: complexity of merge, quick, heap, counting, radix, bucket – know all","Dynamic Programming: LCS, LIS, 0/1 Knapsack, Matrix Chain, Edit Distance"] },
  { unit:"Theory of Computation", weight:"5–7 Qs (Medium)", topics:["DFA, NFA, epsilon-NFA: construction, conversion, minimization","Regular expressions, Regular grammars, Pumping lemma for RL","CFG, PDA, CFL properties, ambiguity, Pumping lemma for CFL","Turing Machines, decidability, halting problem, Rice's theorem"] },
  { unit:"Computer Networks", weight:"5–7 Qs (Medium)", topics:["OSI 7 layers and TCP/IP 5 layers – every protocol at each layer","TCP: 3-way handshake, flow control (sliding window), congestion control (Tahoe/Reno)","IP addressing: subnetting calculations, CIDR, VLSM – practice is essential","Application layer: DNS resolution, HTTP/HTTPS methods, FTP active/passive, SMTP, DHCP"] },
  { unit:"Programming Languages", weight:"5–7 Qs (Medium)", topics:["C: pointers arithmetic, arrays, structs, dynamic allocation (malloc/calloc/free)","OOP concepts: inheritance, polymorphism, encapsulation, abstraction with examples","Java: exception handling hierarchy, generics, Collections framework, Iterator","Python: iterators, generators, list/dict comprehensions, decorators, *args/**kwargs"] },
  { unit:"Software Engineering", weight:"4–5 Qs (Lower)", topics:["SDLC models: Waterfall, Agile, Scrum, Spiral, RAD – when to use each","UML diagrams: use case, class, sequence, activity, state diagrams","Testing types: unit, integration, system, acceptance, regression, black-box vs white-box","Software metrics: cyclomatic complexity (McCabe), function points, COCOMO model"] },
];

const ugcPaper1 = [
  { unit:"Teaching Aptitude", weight:"5–7 Qs", tips:"Teaching methods (lecture, seminar, project-based, flipped), Bloom's taxonomy levels, characteristics of effective teaching, learner types (visual/auditory/kinesthetic)" },
  { unit:"Research Methodology", weight:"5–7 Qs", tips:"Types: basic/applied/action/descriptive/experimental. Hypothesis: null/alternative. Sampling: random, stratified, cluster, systematic, snowball. Data: primary/secondary. Research ethics, plagiarism" },
  { unit:"Logical Reasoning", weight:"5–7 Qs", tips:"Syllogisms (all/some/no – Venn diagrams), blood relations, seating arrangements, number series, coding-decoding, analogies. Practice daily – speed matters here" },
  { unit:"Data Interpretation", weight:"5–7 Qs", tips:"Bar charts, pie charts, line graphs, tables, mixed DI. Practice calculating percentages and ratios fast. 2 minutes maximum per question in exam" },
  { unit:"ICT", weight:"4–5 Qs", tips:"Internet protocols (HTTP, FTP, SMTP, TCP/IP), database terminology, MS Office shortcuts, e-learning platforms, cyber security basics (phishing, malware, firewall, VPN)" },
  { unit:"Environment + People", weight:"3–4 Qs", tips:"Environment Protection Act 1986, Wildlife Protection Act 1972, Biodiversity Act 2002, biodiversity hotspots in India, pollution types and permissible standards, sustainable development goals (SDGs)" },
  { unit:"Higher Education", weight:"3–4 Qs", tips:"UGC functions, NAAC, NIRF ranking, NEP 2020 key points, university governance structure, academic ethics and integrity" },
];

const govtJobs = [
  { org:"DRDO", role:"Scientist B / CEPTAM Tech Asst", physical:"None – desk role", timing:"CEPTAM 2026 expected – watch drdo.gov.in", color:P.a5, icon:"🛡️" },
  { org:"ISRO", role:"Scientist/Engineer SC (CS/IT)", physical:"Written test + interview only", timing:"Check isro.gov.in quarterly for all centres", color:P.a3, icon:"🚀" },
  { org:"NIC", role:"Scientist B (IT)", physical:"None – technical MCQ + interview", timing:"MeitY portal + nic.in/careers – check monthly", color:P.a1, icon:"💻" },
  { org:"C-DAC", role:"Project Engineer B/C", physical:"None", timing:"Rolling recruitment – cdac.in/careers", color:P.a4, icon:"🖥️" },
  { org:"BEL / HAL / ECIL", role:"Engineer Trainee CS/ECE", physical:"Routine medical – non-combat", timing:"Annual PSU cycle Q2–Q3 2027 (plan ahead)", color:P.a2, icon:"⚙️" },
  { org:"TNPSC", role:"Group 1/2 Technical / AE", physical:"None for technical posts", timing:"tnpsc.gov.in – watch state-level notifications", color:P.a5, icon:"🏛️" },
];

const certList = [
  { cert:"Claude Certified Developer Foundations (CCDV-F)", status:"🚨 DEADLINE: August 31, 2026 — 6 weeks away!", when:"Aug 31, 2026", color:P.a5, urgent:true, daysLeft:()=>Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24))), tip:"Anthropic's official Claude developer certification. Study: claude.ai/docs, Anthropic API docs, prompt engineering guide. Topics: API usage, prompt design, safety, tool use, multi-turn conversations. Free to attempt via Anthropic's certification portal. Add to LinkedIn immediately after passing — high market signal in 2026." },
  { cert:"Databricks Certified Data Engineer Associate", status:"🔥 Priority 2 – target Sep/Oct 2026", when:"Sep–Oct 2026", color:P.a3, tip:"You already started. 45 MCQs, 90 min. Use community.databricks.com free + Databricks Academy prep materials. Exam voucher ~$200 USD." },
  { cert:"Google Gemini Enterprise Developer", status:"TCS Talent Pool – complete all modules", when:"Aug 2026", color:P.a4, tip:"Complete all Google Cloud Skills Boost modules via TCS Talent Pool. Already partially done – finish every module and claim the badge." },
  { cert:"GCP Professional Data Engineer", status:"High value – Nov 2026 target", when:"Nov 2026", color:P.a1, tip:"Builds on Gemini Talent Pool knowledge. Exam $200 USD. Use Skills Boost + ExamPro free YouTube. Salary impact: +₹5–10 LPA immediately." },
  { cert:"AWS Data Engineer Associate", status:"Jan 2027 target", when:"Jan 2027", color:P.a2, tip:"Stephane Maarek Udemy course (₹499 on sale). After GCP, this becomes much easier – 60% overlapping concepts. High market demand in India." },
  { cert:"dbt Certified Developer", status:"Feb 2027 target", when:"Feb 2027", color:P.a3, tip:"Free learning at courses.getdbt.com. Exam ~$200 USD. Strong differentiator for Analytics Engineer roles. Pairs well with BigQuery + Snowflake." },
  { cert:"Python PCEP or PCAP", status:"Optional – validates Python formally", when:"Sep 2026", color:P.muted, tip:"Python Institute exams. PCEP is entry level (~$59), quick prep. Good for resume validation while you build Python projects." },
];

const weeklyTemplate = [
  { day:"Mon", type:"work", blocks:[{time:"9AM–6PM",task:"TCS Work + commute",color:P.a1},{time:"7–8PM",task:"Python – current chapter + 1 coding exercise",color:P.a3},{time:"8–9PM",task:"UGC NET – 20 MCQs (DBMS/OS/DSA)",color:P.a2}] },
  { day:"Tue", type:"work", blocks:[{time:"9AM–6PM",task:"TCS Work + commute",color:P.a1},{time:"7–8PM",task:"SQL – LeetCode 2 problems or dbt practice",color:P.a2},{time:"8–9PM",task:"Databricks DEA course modules",color:P.a3}] },
  { day:"Wed", type:"work", blocks:[{time:"9AM–6PM",task:"TCS Work + commute",color:P.a1},{time:"7–8PM",task:"PhD coursework or paper reading (2 papers/week)",color:P.a4},{time:"8–9PM",task:"UGC NET – 20 MCQs (Networks/TOC/Programming)",color:P.a2}] },
  { day:"Thu", type:"work", blocks:[{time:"9AM–6PM",task:"TCS Work + commute",color:P.a1},{time:"7–8PM",task:"GenAI / LangChain / Gemini API hands-on practice",color:P.a4},{time:"8–9PM",task:"Job applications – minimum 3 roles applied",color:P.a5}] },
  { day:"Fri", type:"work", blocks:[{time:"9AM–6PM",task:"TCS Work + commute",color:P.a1},{time:"7–8PM",task:"PhD writing – chapter drafting or lit review",color:P.a4},{time:"8–9PM",task:"Build portfolio project (Python/SQL/GenAI – code something)",color:P.a3}] },
  { day:"Sat", type:"weekend", blocks:[{time:"9AM–11AM",task:"PhD: SSN classes or self-study (Sat if scheduled)",color:P.a4},{time:"11AM–1PM",task:"Deep skill session: Python/SQL/Cloud (2 hrs focused)",color:P.a3},{time:"3–5PM",task:"Govt job prep + applications + Udemy catch-up",color:P.a5}] },
  { day:"Sun", type:"weekend", blocks:[{time:"9–11AM",task:"UGC NET full timed mock test (Paper 1 + Paper 2)",color:P.a2},{time:"11AM–12PM",task:"Mock analysis – every wrong answer reviewed + noted",color:P.a2},{time:"3–5PM",task:"Weekly review + plan next week + job application check",color:P.a1}] },
];

const dietPlan = [
  { meal:"Early Morning", time:"7:00 AM", emoji:"🌤️", items:["1 glass warm water with lemon (no sugar)","+ 1 small banana OR 4 soaked almonds"], why:"Must eat something BEFORE Glycomet GP. This is non-negotiable for your safety – glimepiride causes hypoglycemia without food." },
  { meal:"Breakfast (after morning meds)", time:"8:00–8:30 AM", emoji:"🌅", items:["2 idli + sambar (skip heavy coconut chutney) OR","1 bowl oats upma with vegetables OR","2 small dosas with less oil + tomato chutney","+ 1 glass unsweetened buttermilk"], why:"Take all morning medicines after eating. Sambar gives protein. Buttermilk aids digestion and keeps you full longer." },
  { meal:"Mid-Morning", time:"11:00 AM", emoji:"🕐", items:["1 fruit: guava, papaya, or orange (NOT mango or grapes)","OR 1 small bowl sprouts chaat"], why:"Prevents blood sugar crash and overeating at lunch. Don't skip this snack." },
  { meal:"Lunch", time:"1:00–1:30 PM", emoji:"☀️", items:["1 cup brown rice (or 2 small rotis)","1 cup sambar OR rasam","1 cup vegetable curry (avoid deep fried)","1 cup plain curd","Small salad: cucumber + tomato + onion"], why:"Brown rice raises blood sugar slowly. Rasam is very low calorie and hydrating. Curd is excellent for gut health." },
  { meal:"Evening Snack", time:"4:30–5:00 PM", emoji:"🌤️", items:["1 cup green tea (no sugar)","+ handful peanuts OR roasted chana","OR 1 small bowl poha or upma"], why:"Peanuts and chana give good protein without spiking blood sugar. Avoid biscuits and sweets at this time." },
  { meal:"Dinner (before night meds)", time:"7:30–8:00 PM", emoji:"🌙", items:["2 small rotis OR 1 cup rice (less than lunch)","1 cup dal (toor, moong, or chana – any type)","1 cup vegetable curry","1 cup curd OR low-fat milk"], why:"Eat dinner BEFORE taking night Glycomet GP. Keep dinner lighter than lunch. Dal + roti gives complete protein." },
  { meal:"Before Bed (optional)", time:"10:00 PM", emoji:"🌙", items:["1 glass warm low-fat milk (no sugar)","OR 1 square dark chocolate if craving is strong"], why:"A small treat before bed prevents midnight hunger and bingeing. Both options are perfectly fine. No guilt." },
];

const exercisePlan = [
  { day:"Mon + Wed + Fri", activity:"🚶 Post-Dinner Walk", duration:"10–15 min", level:"Very Easy 😌", tip:"After dinner, 10 minutes around your house or building. Start with 5 minutes if needed. No gym. No special clothes." },
  { day:"Tue + Thu", activity:"🧘 Gentle Stretching", duration:"5–10 min", level:"Very Easy 😌", tip:"Stretch arms, legs, neck while sitting on bed. YouTube: 5 min beginner stretch. That is the entire plan for these days." },
  { day:"Saturday", activity:"🚶 Longer Walk", duration:"20 min", level:"Easy 🙂", tip:"Walk to nearby shop, park, or around your area. Listen to music or podcast. Make it enjoyable, not exercise." },
  { day:"Sunday", activity:"🛌 Full Rest", duration:"0 min", level:"Rest 😴", tip:"Complete rest. Normal daily life only. Rest days are part of the plan. Never feel guilty about them." },
];

const medicines = [
  { time:"Morning ☀️", color:P.a1, meds:["Fluoxetine 20mg (Floatin)","Addwize OD 18mg","Attentrol 10mg","Petril Beta (Clonazepam + Propranolol)","Zonisamide 100mg (Zonimid)","Glycomet GP 2/500 — BEFORE breakfast ⚠️","Vildagliptin 50mg — AFTER breakfast"] },
  { time:"Night 🌙", color:P.a4, meds:["Arkamin — as prescribed","Epitril Beta","Zonisamide 100mg (after first month)","Glycomet GP 2/500 — BEFORE dinner ⚠️","Vildagliptin 50mg — AFTER dinner","Lipvas 10mg","Healvit (multivitamin)"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0,10);
const fmtDate  = k => { const d=new Date(k); return d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}); };

// ─── Storage: localStorage (persists across sessions on same device) ─────────
function storeGet(key) {
  try { return localStorage.getItem(key); } catch(_) { return null; }
}
function storeSet(key, val) {
  try { localStorage.setItem(key, val); } catch(_) {}
}


// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]       = useState("now");
  const [monthIdx, setMonth]= useState(0);
  const [pillar, setPillar] = useState("job");
  const [careerIdx, setCareer] = useState(0);
  const [skillIdx, setSkill]   = useState(0);
  const [ugcView, setUgcView]  = useState("schedule");

  // Journal
  const [entries, setEntries]   = useState({});
  const [selDay, setSelDay]     = useState(todayKey());
  const [dNote, setDNote]       = useState("");
  const [dRem, setDRem]         = useState("");
  const [dMood, setDMood]       = useState("3");
  const [jSaved, setJSaved]     = useState(false);

  // Health
  const [hTab, setHTab]         = useState("today");
  const [healthLog, setHLog]    = useState({});
  const [hDay, setHDay]         = useState(todayKey());
  const [hForm, setHForm]       = useState({weight:"",bs:"",mood:"3",water:"0",meds:{morning:false,night:false},note:""});
  const [hSaved, setHSaved]     = useState(false);
  const [hAiQ, setHAiQ]         = useState("");
  const [hAiA, setHAiA]         = useState("");
  const [hAiLoad, setHAiLoad]   = useState(false);

  // Office
  const [offDay, setOffDay]       = useState(todayKey());
  const [tickets, setTickets]     = useState([]);
  const [pending, setPending]     = useState([]);
  const [ideas, setIdeas]         = useState([]);
  const [offNote, setOffNote]     = useState("");
  const [offSaved, setOffSaved]   = useState(false);
  const [offData, setOffData]     = useState({});
  const [tF, setTF] = useState({type:"INC",no:"",desc:"",pri:"P3",status:"In Progress",notes:""});
  const [showTF, setShowTF] = useState(false);
  const [pF, setPF] = useState({desc:"",due:"",status:"Pending"});
  const [showPF, setShowPF] = useState(false);
  const [dF, setDF] = useState({idea:"",cat:"Automation",status:"Idea"});
  const [showDF, setShowDF] = useState(false);

  // Coach
  const [cQ, setCQ] = useState("");
  const [cA, setCA] = useState("");
  const [cLoad, setCLoad] = useState(false);

  // Learning tracker
  const [learnTab, setLearnTab]       = useState("dashboard");
  const [learnProgress, setLearnProgress] = useState({});
  const [quizTopic, setQuizTopic]     = useState("DBMS");
  const [quizQ, setQuizQ]             = useState(null);
  const [quizLoad, setQuizLoad]       = useState(false);
  const [quizAns, setQuizAns]         = useState("");
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [flashcard, setFlashcard]     = useState(null);
  const [flashLoad, setFlashLoad]     = useState(false);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [switchGuideQ, setSwitchGuideQ] = useState("");
  const [switchGuideA, setSwitchGuideA] = useState("");
  const [switchGuideLoad, setSwitchGuideLoad] = useState(false);

  // PhD Planner
  const [phdTab, setPhdTab]             = useState("overview");
  const [phdMeetings, setPhdMeetings]   = useState([]);
  const [phdMForm, setPhdMForm]         = useState({date:"",type:"In-Person",instructions:"",actions:"",nextDate:""});
  const [showPhdM, setShowPhdM]         = useState(false);
  const [phdTasks, setPhdTasks]         = useState([]);
  const [phdTForm, setPhdTForm]         = useState({title:"",category:"Literature",due:"",status:"Pending",notes:"",chapter:""});
  const [showPhdT, setShowPhdT]         = useState(false);
  const [phdAiQ, setPhdAiQ]             = useState("");
  const [phdAiA, setPhdAiA]             = useState("");
  const [phdAiLoad, setPhdAiLoad]       = useState(false);

  // Persistent cross-day pending work (survives beyond the day it was created)
  const [allPending, setAllPending]     = useState([]);   // [{id,desc,due,status,addedDate,updatedDate,followUps:[{date,note}],snoozed}]
  const [apForm, setApForm]             = useState({desc:"",due:"",category:"Office"});
  const [showApF, setShowApF]           = useState(false);
  const [followUpId, setFollowUpId]     = useState(null);
  const [followUpNote, setFollowUpNote] = useState("");

  // Govt Career Radar
  const [radarTab, setRadarTab]         = useState("radar");
  const [radarCat, setRadarCat]         = useState("all");
  const [appStatus, setAppStatus]       = useState({});  // {jobId: status}
  const [radarAiQ, setRadarAiQ]         = useState("");
  const [radarAiA, setRadarAiA]         = useState("");
  const [radarAiLoad, setRadarAiLoad]   = useState(false);

  // Jobs
  const [jobsTab, setJobsTab]           = useState("govt");
  const [jobAiQ, setJobAiQ]             = useState("");
  const [jobAiA, setJobAiA]             = useState("");
  const [jobAiLoad, setJobAiLoad]       = useState(false);

  // Advice Buddy
  const [adviceQ, setAdviceQ]           = useState("");
  const [adviceA, setAdviceA]           = useState("");
  const [adviceLoad, setAdviceLoad]     = useState(false);
  const [phdLitTab, setPhdLitTab]       = useState("survey");
  const [phdCourseTab, setPhdCourseTab] = useState("courses");

  // AI Life Agent
  const [agentRunning, setAgentRunning]   = useState(false);
  const [agentLog, setAgentLog]           = useState([]);
  const [agentSuggestions, setAgentSugs]  = useState([]);
  const [showAgent, setShowAgent]         = useState(false);
  const [certStudyQ, setCertStudyQ]       = useState("");
  const [certStudyA, setCertStudyA]       = useState("");
  const [certStudyLoad, setCertStudyLoad] = useState(false);
  const [certTab, setCertTab]             = useState("roadmap");

  // Resume & ATS
  const [resumeTab, setResumeTab] = useState("builder");
  const [rVariant, setRVariant]   = useState("Senior Data Engineer");
  const [rExtra, setRExtra]       = useState("");
  const [rResult, setRResult]     = useState("");
  const [rLoad, setRLoad]         = useState(false);
  const [jd, setJd]               = useState("");
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoad, setAtsLoad]     = useState(false);



  const [mob, setMob] = useState(typeof window!=="undefined"?window.innerWidth<768:false);
  useEffect(()=>{const h=()=>setMob(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  // Load persisted data
  useEffect(()=>{
    try {
      const j = storeGet("j-entries"); if(j) setEntries(JSON.parse(j));
      const o = storeGet("o-data");
      if(o){const p=JSON.parse(o);setOffData(p);const t=todayKey();if(p[t]){setTickets(p[t].tickets||[]);setPending(p[t].pending||[]);setIdeas(p[t].ideas||[]);setOffNote(p[t].note||"");}}
      const h = storeGet("h-log"); if(h){const p=JSON.parse(h);setHLog(p);const t=todayKey();if(p[t])setHForm(f=>({...f,...p[t]}));}
      const lp = storeGet("learn-progress"); if(lp) setLearnProgress(JSON.parse(lp));
      const pm = storeGet("phd-meetings"); if(pm) setPhdMeetings(JSON.parse(pm));
      const pt = storeGet("phd-tasks");    if(pt) setPhdTasks(JSON.parse(pt));
      const ap = storeGet("all-pending");  if(ap) setAllPending(JSON.parse(ap));
      const as_ = storeGet("app-status");  if(as_) setAppStatus(JSON.parse(as_));
    } catch(_){}
  },[]);

  useEffect(()=>{const e=entries[selDay]||{};setDNote(e.note||"");setDRem(e.reminder||"");setDMood(e.mood||"3");setJSaved(false);},[selDay,entries]);

  // ── data helpers ─────────────────────────────────────────────────────────────
  const saveJournal = () => {
    const u={...entries,[selDay]:{note:dNote,reminder:dRem,mood:dMood,ts:Date.now()}};
    setEntries(u); setJSaved(true);
    storeSet("j-entries",JSON.stringify(u));
    setTimeout(()=>setJSaved(false),2000);
  };
  const saveOff = (day,data) => {
    setOffData(prev => {
      const u={...prev,[day]:data};
      storeSet("o-data",JSON.stringify(u));
      return u;
    });
  };
  const switchOff = d => {
    setOffDay(d); const o=offData[d]||{};
    setTickets(o.tickets||[]); setPending(o.pending||[]); setIdeas(o.ideas||[]); setOffNote(o.note||"");
  };
  const addTicket = () => {
    if(!tF.desc.trim())return;
    const u=[...tickets,{...tF,id:Date.now().toString()}]; setTickets(u);
    saveOff(offDay,{tickets:u,pending,ideas,note:offNote});
    setTF({type:"INC",no:"",desc:"",pri:"P3",status:"In Progress",notes:""}); setShowTF(false);
  };
  const updT = (id,status)=>{const u=tickets.map(t=>t.id===id?{...t,status}:t);setTickets(u);saveOff(offDay,{tickets:u,pending,ideas,note:offNote});};
  const delT = id=>{const u=tickets.filter(t=>t.id!==id);setTickets(u);saveOff(offDay,{tickets:u,pending,ideas,note:offNote});};
  const addPending = () => {
    if(!pF.desc.trim())return;
    const u=[...pending,{...pF,id:Date.now().toString()}]; setPending(u);
    saveOff(offDay,{tickets,pending:u,ideas,note:offNote});
    setPF({desc:"",due:"",status:"Pending"}); setShowPF(false);
  };
  const updP = (id,status)=>{const u=pending.map(p=>p.id===id?{...p,status}:p);setPending(u);saveOff(offDay,{tickets,pending:u,ideas,note:offNote});};
  const delP = id=>{const u=pending.filter(p=>p.id!==id);setPending(u);saveOff(offDay,{tickets,pending:u,ideas,note:offNote});};
  const addIdea = () => {
    if(!dF.idea.trim())return;
    const u=[...ideas,{...dF,id:Date.now().toString()}]; setIdeas(u);
    saveOff(offDay,{tickets,pending,ideas:u,note:offNote});
    setDF({idea:"",cat:"Automation",status:"Idea"}); setShowDF(false);
  };
  const saveOffNote = ()=>{saveOff(offDay,{tickets,pending,ideas,note:offNote});setOffSaved(true);setTimeout(()=>setOffSaved(false),2000);};
  const saveHealth = ()=>{
    const u={...healthLog,[hDay]:{...hForm,ts:Date.now()}};setHLog(u);setHSaved(true);
    storeSet("h-log",JSON.stringify(u));
    setTimeout(()=>setHSaved(false),2000);
  };
  const saveLearnProgress = (updated) => {
    setLearnProgress(updated);
    storeSet("learn-progress", JSON.stringify(updated));
  };
  const markDone = (trackKey, itemKey) => {
    const updated = {...learnProgress, [trackKey]: {...(learnProgress[trackKey]||{}), [itemKey]: true}};
    saveLearnProgress(updated);
  };
  const unmarkDone = (trackKey, itemKey) => {
    const updated = {...learnProgress};
    if(updated[trackKey]) { delete updated[trackKey][itemKey]; }
    saveLearnProgress(updated);
  };

  // PhD helpers
  const savePhdMeetings = (u) => { setPhdMeetings(u); storeSet("phd-meetings", JSON.stringify(u)); };
  const savePhdTasks    = (u) => { setPhdTasks(u);    storeSet("phd-tasks",    JSON.stringify(u)); };
  const addPhdMeeting = () => {
    if(!phdMForm.date.trim()||!phdMForm.instructions.trim()) return;
    const u=[...phdMeetings,{...phdMForm,id:Date.now().toString(),ts:Date.now()}];
    savePhdMeetings(u); setPhdMForm({date:"",type:"In-Person",instructions:"",actions:"",nextDate:""}); setShowPhdM(false);
  };
  const addPhdTask = () => {
    if(!phdTForm.title.trim()) return;
    const u=[...phdTasks,{...phdTForm,id:Date.now().toString(),ts:Date.now()}];
    savePhdTasks(u); setPhdTForm({title:"",category:"Literature",due:"",status:"Pending",notes:"",chapter:""}); setShowPhdT(false);
  };
  const updPhdTask = (id,field,val) => {
    const u=phdTasks.map(t=>t.id===id?{...t,[field]:val,updatedTs:Date.now()}:t);
    savePhdTasks(u);
  };
  const delPhdTask = id => { const u=phdTasks.filter(t=>t.id!==id); savePhdTasks(u); };
  const askPhdAI = async () => {
    if(!phdAiQ.trim()) return; setPhdAiLoad(true); setPhdAiA("");
    const meetings = phdMeetings.slice(-3).map(m=>`Meeting ${m.date}: ${m.instructions}`).join(". ");
    const tasks = phdTasks.filter(t=>t.status!=="Done").slice(0,5).map(t=>`${t.title} (${t.status}, due ${t.due||"TBD"})`).join(", ");
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:900,system:`You are a PhD research advisor for Thamizamudhan K, PhD scholar at SSN College of Engineering under Dr. K.D. Badri Narayanan. Research: Human-Centered Multimodal AI for Healthcare. Part-time PhD while working at TCS. Started July 2026. Recent meeting instructions: ${meetings}. Current open tasks: ${tasks}. Be specific, practical, encouraging.`,messages:[{role:"user",content:phdAiQ}]})});
      const d=await r.json(); setPhdAiA(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch(_){ setPhdAiA("Connection error. Please try again."); }
    setPhdAiLoad(false);
  };

  // ── AI Life Agent ─────────────────────────────────────────────────────────────
  const runLifeAgent = async () => {
    setAgentRunning(true); setAgentLog([]); setAgentSugs([]);
    const log = [];
    const addLog = (icon, msg, color="muted") => {
      log.push({icon,msg,color,ts:new Date().toLocaleTimeString()});
      setAgentLog([...log]);
    };

    addLog("🤖","Life Agent starting analysis...","a1");

    // Gather context
    const today = todayKey();
    const overduePending = allPending.filter(p=>p.status!=="Done"&&p.due&&p.due<today);
    const overduePhdTasks = phdTasks.filter(t=>t.status!=="Done"&&t.due&&t.due<today);
    const pendingOpen = allPending.filter(p=>p.status!=="Done").length;
    const daysToClaudeCert = Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24)));
    const recentHealth = Object.entries(healthLog).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,3);
    const missedMeds = recentHealth.filter(([,e])=>!e.meds?.morning||!e.meds?.night).length;
    const recentJournal = Object.entries(entries).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,1);
    const lastJournalDays = recentJournal.length ? Math.floor((new Date()-new Date(recentJournal[0][0]))/(1000*60*60*24)) : 99;

    addLog("🔍","Scanning all sections for issues and opportunities...","a3");
    await new Promise(r=>setTimeout(r,400));

    // Analysis
    if(daysToClaudeCert<=42) addLog("🚨",`Claude cert (CCDV-F) deadline in ${daysToClaudeCert} days — August 31, 2026!`,"a5");
    if(overduePending.length) addLog("⚠️",`${overduePending.length} overdue follow-up items in Office need replanning`,"a5");
    if(overduePhdTasks.length) addLog("⚠️",`${overduePhdTasks.length} overdue PhD tasks — review timeline`,"a5");
    if(missedMeds>0) addLog("💊",`Missed medicine logging ${missedMeds} of last 3 days — health tracking incomplete`,"a3");
    if(lastJournalDays>2) addLog("📓",`No journal entry for ${lastJournalDays} days — reflection gap`,"a3");
    if(pendingOpen>5) addLog("📋",`${pendingOpen} open follow-ups — consider closing or replanning`,"a3");
    if(phdMeetings.length===0) addLog("🎓","No PhD meetings logged yet — log your first supervisor session","a4");
    if(tickets.filter(t=>t.status==="Blocked").length>0) addLog("🚫",`${tickets.filter(t=>t.status==="Blocked").length} blocked tickets in Office — needs escalation`,"a5");
    addLog("🧠","Generating personalised recommendations...","a2");
    await new Promise(r=>setTimeout(r,600));

    // Call AI for smart suggestions
    try {
      const context = [
        `Today: ${today}. Days to Claude cert CCDV-F deadline (Aug 31): ${daysToClaudeCert}.`,
        `Overdue office follow-ups: ${overduePending.length}. Open follow-ups: ${pendingOpen}.`,
        `Overdue PhD tasks: ${overduePhdTasks.length}. PhD meetings logged: ${phdMeetings.length}.`,
        `Missed medicine logs last 3 days: ${missedMeds}. Days since last journal: ${lastJournalDays}.`,
        `Blocked tickets: ${tickets.filter(t=>t.status==="Blocked").length}.`,
        `Cert urgent: Claude CCDV-F (Aug 31), Databricks DEA (Sep-Oct 2026), GCP DE (Nov 2026).`,
      ].join(" ");

      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:700,
          system:`You are a smart life planning agent for Thamizamudhan K, 27, Chennai. TCS Data Engineer 4.3yr. PhD student at SSN under Dr. K.D. Badri Narayanan (GenAI/Healthcare AI). UGC NET Dec 2026. URGENT: Claude CCDV-F cert deadline Aug 31 2026. Also: Databricks DEA, GCP DE, health management (Bipolar I, T2 Diabetes). Analyse the context and return EXACTLY 5 specific, actionable recommendations ranked by urgency. Format: JSON array of {priority:1-5, icon:"emoji", title:"short title", action:"specific action to take today or this week", tab:"which app tab to go to", urgency:"high|medium|low"}. Return only the JSON array, no other text.`,
          messages:[{role:"user",content:`Analyse my situation and give 5 smart recommendations: ${context}`}]
        })
      });
      const d = await r.json();
      const raw = d.content?.map(b=>b.text||"").join("")||"[]";
      const si=raw.indexOf("["); const ei=raw.lastIndexOf("]");
      const sugs = JSON.parse(si>=0&&ei>=0?raw.slice(si,ei+1):"[]");
      setAgentSugs(sugs);
      addLog("✅","Analysis complete — "+sugs.length+" recommendations ready","a2");
    } catch(_) {
      addLog("✅","Analysis complete — check recommendations below","a2");
      setAgentSugs([
        {priority:1,icon:"🚨",title:"Claude CCDV-F Cert",action:`${daysToClaudeCert} days left to Aug 31! Start studying today: claude.ai/docs and Anthropic prompt engineering guide. Dedicate 30 min/day.`,tab:"certs",urgency:"high"},
        {priority:2,icon:"⚠️",title:"Replan Overdue Items",action:`${overduePending.length} office follow-ups are overdue. Go to Office → Follow-Up Board and set new target dates now.`,tab:"office",urgency:"high"},
        {priority:3,icon:"🎓",title:"PhD Task Review",action:`${overduePhdTasks.length} PhD tasks need replanning. Open PhD tab → Tasks and replan with realistic new dates.`,tab:"phd",urgency:"medium"},
        {priority:4,icon:"💊",title:"Health Logging",action:"Log your medicines and health data daily. Consistent tracking helps manage diabetes better.",tab:"health",urgency:"medium"},
        {priority:5,icon:"📓",title:"Daily Reflection",action:`Last journal entry was ${lastJournalDays} days ago. Write today's entry — even 2 lines counts.`,tab:"journal",urgency:"low"},
      ]);
    }
    setAgentRunning(false);
  };

  const askCertStudy = async () => {
    if(!certStudyQ.trim()) return; setCertStudyLoad(true); setCertStudyA("");
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:800,system:`You are an expert on Anthropic's Claude and the Claude Certified Developer Foundations (CCDV-F) certification. Help this candidate prepare. Cover: Claude API, prompt engineering, tool use, safety, multi-turn conversations, system prompts, vision capabilities, context windows, streaming, Claude models (Haiku/Sonnet/Opus). Be specific and practical. The exam deadline is August 31, 2026.`,messages:[{role:"user",content:certStudyQ}]})});
      const d=await r.json(); setCertStudyA(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch(_){setCertStudyA("Connection error. Please try again.");}
    setCertStudyLoad(false);
  };

  const askAdviceBuddy = async () => {
    if(!adviceQ.trim()) return; setAdviceLoad(true); setAdviceA("");
    const open = allPending.filter(p=>p.status!=="Done").length;
    const odPhd = phdTasks.filter(t=>t.status!=="Done"&&t.due&&t.due<todayKey()).length;
    const daysCCDVF = Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24)));
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`You are a warm, practical life coach and research advisor for Thamizamudhan K, 27, Chennai. You know everything about him:

LIFE CONTEXT (August 2026):
- Works full-time at TCS as Data Engineer (4.3 years): SQL/Teradata/DataStage/Unix/ServiceNow
- Part-time PhD at Shiv Nadar University (SNU) under Dr. K.D. Badri Narayanan
- Research: Human-Centered Multimodal Explainable AI with Wearables for Special Kids
- Health: Bipolar I (stable), Type 2 Diabetes (FBS managed), Obesity (140kg) — energy varies
- URGENT: Claude CCDV-F cert deadline August 31 (${daysCCDVF} days left)
- Databricks DEA exam: September 2026
- UGC NET CS: December 2026
- ISRO application deadline: August 17 (TODAY/TOMORROW!)
- ${open} open follow-up items in office tracker
- ${odPhd} overdue PhD tasks

RESEARCH DETAILS:
- Theme: Human-Centered Multimodal Explainable AI with Wearable Sensors for Special Needs Children
- Scope: Autism, ADHD, Cerebral Palsy, non-verbal children
- Modalities: Wearables (HRV, accel, temp) + Computer Vision (facial emotion) + Speech (cry/emotion)
- Key ideas: Personalized distress prediction, XAI for caregivers, federated learning, digital twin
- Supervisor instructions: Ideology of many, 15-20 keywords, 7-10 PS, minimal dataset, 4-year timeline

PERSONALITY: Tends to take on too much. Needs reminders to pace himself. Health must come first. Responds well to structured practical advice. Bipolar — never push on bad days. Tamil background.

Give warm, honest, practical advice. Acknowledge the challenges of managing everything. Suggest specific actions. Be a friend who happens to be an expert.`,messages:[{role:"user",content:adviceQ}]})});
      const d=await r.json(); setAdviceA(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch(_){setAdviceA("Connection error. Please try again.");}
    setAdviceLoad(false);
  };

  const saveAppStatus = (id, status) => {
    const u = {...appStatus, [id]: status};
    setAppStatus(u); storeSet("app-status", JSON.stringify(u));
  };
  const askRadarAI = async () => {
    if(!radarAiQ.trim()) return; setRadarAiLoad(true); setRadarAiA("");
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`You are a government career advisor specialising in Indian central and state government technical recruitment (2026). Your client has: B.E ECE, M.Tech Data Science, PhD CS/GenAI (part-time at Shiv Nadar University, ongoing). 4.5 years TCS Data Engineering experience (SQL/Teradata/DataStage/Python/Unix). SC category (reservation + fee waiver + age relaxation). No valid GATE score currently. Looking for desk/technical/research/scientist roles. Prefers no physical efficiency test. Wants PhD-compatible posting. Be accurate, specific, and honest about eligibility. If GATE is required, say so clearly. Never assume eligibility — verify each criterion.`,messages:[{role:"user",content:radarAiQ}]})});
      const d=await r.json(); setRadarAiA(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch(_){setRadarAiA("Connection error.");}
    setRadarAiLoad(false);
  };

  const askJobAI = async () => {
    if(!jobAiQ.trim()) return; setJobAiLoad(true); setJobAiA("");
    try {
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:900,system:`You are a career advisor specialising in Indian government and private tech jobs in 2026. Your client: Thamizamudhan K, 27, Chennai. SC category. TCS Data Engineer 4.3 years. Expert: SQL Teradata, IBM DataStage, Unix Shell. Learning: Python, PySpark, LangChain, GCP. Education: B.E ECE, M.Tech DS, PhD CSE GenAI SSN (ongoing). Certs: Claude CCDV-F (Aug 31 deadline), Databricks DEA (Sep 2026), GCP DE (Nov 2026). UGC NET Dec 2026. Today is August 14 2026. SC quota gives 5-year age relaxation. GATE score needed for ISRO/NIC. Give specific, actionable, honest advice about jobs matching this profile. Name specific organizations, portals, and deadlines.`,messages:[{role:"user",content:jobAiQ}]})});
      const d=await r.json(); setJobAiA(d.content?.map(b=>b.text||"").join("")||"No response.");
    } catch(_){setJobAiA("Connection error. Please try again.");}
    setJobAiLoad(false);
  };

  // Persistent cross-day pending helpers
  const saveAllPending = u => { setAllPending(u); storeSet("all-pending", JSON.stringify(u)); };
  const addPersistentPending = () => {
    if(!apForm.desc.trim()) return;
    const u=[...allPending,{...apForm,id:Date.now().toString(),addedDate:todayKey(),updatedDate:todayKey(),status:"Pending",followUps:[],snoozed:false}];
    saveAllPending(u); setApForm({desc:"",due:"",category:"Office"}); setShowApF(false);
  };
  const updPendingStatus = (id,status) => {
    const u=allPending.map(p=>p.id===id?{...p,status,updatedDate:todayKey()}:p);
    saveAllPending(u);
  };
  const snoozePending = (id,newDue) => {
    const u=allPending.map(p=>p.id===id?{...p,due:newDue,snoozed:true,updatedDate:todayKey(),followUps:[...p.followUps,{date:todayKey(),note:`Rescheduled to ${newDue}`}]}:p);
    saveAllPending(u);
  };
  const addFollowUp = (id) => {
    if(!followUpNote.trim()) return;
    const u=allPending.map(p=>p.id===id?{...p,updatedDate:todayKey(),followUps:[...p.followUps,{date:todayKey(),note:followUpNote}]}:p);
    saveAllPending(u); setFollowUpNote(""); setFollowUpId(null);
  };
  const delPersistentPending = id => { const u=allPending.filter(p=>p.id!==id); saveAllPending(u); };

  const switchH = d=>{setHDay(d);const e=healthLog[d];if(e)setHForm({weight:e.weight||"",bs:e.bs||"",mood:e.mood||"3",water:e.water||"0",meds:e.meds||{morning:false,night:false},note:e.note||""});else setHForm({weight:"",bs:"",mood:"3",water:"0",meds:{morning:false,night:false},note:""});};

  const askH = async()=>{
    if(!hAiQ.trim())return; setHAiLoad(true); setHAiA("");
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`You are a compassionate non-judgmental health coach. Patient: Thamizamudhan K, 27, 184cm, 140kg, BMI 41.4. Conditions: Bipolar I (stable), Type 2 Diabetes (FBS 197, HbA1c ~7.6%), Dyslipidemia (TG 226, HDL 30), Obesity. CRITICAL: Glycomet GP contains glimepiride – must eat within 30min of taking it or hypoglycemia risk. Person is self-described lazy (valid). Eating is coping mechanism – never shame food. South Indian food preferences. Bipolar – never destabilise. Gradual sustainable changes only. Warm, patient, non-judgmental.`,messages:[{role:"user",content:hAiQ}]})});
      const d=await r.json(); setHAiA(d.content?.map(b=>b.text||"").join("")||"No response.");
    }catch(_){setHAiA("Error connecting. Please try again.");}
    setHAiLoad(false);
  };
  const askC = async()=>{
    if(!cQ.trim())return; setCLoad(true); setCA("");
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`You are an expert career coach for Thamizamudhan K, Data Engineer at TCS 4.3yr, 27yrs, Chennai. Year: July 2026. PhD just started at SSN in GenAI/CS. Profile: B.E ECE, M.Tech DS, SC category. Skills: SQL advanced, IBM DataStage ETL, Teradata, Unix/Shell, ServiceNow. Currently learning: Python (beginner-intermediate), PySpark, LangChain, GCP. Goals: Senior DE / AI-DE career switch, UGC NET Dec 2026 CS, PhD progress, Databricks+GCP certs, DRDO/ISRO/NIC govt roles. Be specific, practical, 2026 Indian market aware. Use bullet points. Encourage realistically.`,messages:[{role:"user",content:cQ}]})});
      const d=await r.json(); setCA(d.content?.map(b=>b.text||"").join("")||"No response.");
    }catch(_){setCA("Error connecting. Please try again.");}
    setCLoad(false);
  };

  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});
  const mE=["","😔","😐","🙂","😊","🔥"];
  const bsC=v=>{const n=parseFloat(v);if(!n)return P.muted;if(n<100)return P.a2;if(n<140)return P.a3;return P.a5;};
  const stC={"In Progress":P.a1,"Completed":P.a2,"Blocked":P.a5,"On Hold":P.a3,"Pending":P.a3,"Done":P.a2,"Idea":P.muted};
  const tyC={INC:P.a5,"Current Ticket":P.a1,"Dev Work":P.a4,Task:P.a3};
  const prC={P1:P.a5,P2:P.a3,P3:P.a1,P4:P.a2};
  const cur=monthPlan[monthIdx];

  const S={
    app:{background:P.bg,minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",color:P.text,paddingBottom:mob?72:0},
    out:{maxWidth:900,margin:"0 auto"},
    hdr:{background:"linear-gradient(135deg,#080C12 0%,#0D1628 60%,#080C12 100%)",borderBottom:`1px solid ${P.border}`,padding:mob?"14px 16px 12px":"22px 32px 16px",position:"relative",overflow:"hidden"},
    g1:{position:"absolute",top:-60,right:-40,width:200,height:200,background:`radial-gradient(circle,${P.a1}15 0%,transparent 70%)`,pointerEvents:"none"},
    g2:{position:"absolute",bottom:-40,left:40,width:150,height:150,background:`radial-gradient(circle,${P.a4}12 0%,transparent 70%)`,pointerEvents:"none"},
    badge:{display:"inline-flex",alignItems:"center",gap:5,background:`linear-gradient(135deg,${P.a2}22,${P.a1}15)`,color:P.a2,border:`1px solid ${P.a2}44`,borderRadius:20,padding:"3px 12px",fontSize:10,fontWeight:700,letterSpacing:"0.8px",marginBottom:8},
    h1:{fontSize:mob?20:26,fontWeight:800,margin:"0 0 4px",background:`linear-gradient(135deg,${P.text},${P.a1})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
    sub:{color:P.muted,fontSize:mob?11:12,margin:0},
    nav:{display:mob?"none":"flex",gap:2,padding:"6px 20px",background:P.card,borderBottom:`1px solid ${P.border}`,overflowX:"auto",position:"sticky",top:0,zIndex:100},
    nB:a=>({padding:"8px 12px",borderRadius:8,border:"none",background:a?`linear-gradient(135deg,${P.a1}25,${P.a1}10)`:"transparent",color:a?P.a1:P.muted,fontWeight:a?700:400,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",borderBottom:a?`2px solid ${P.a1}`:"2px solid transparent"}),
    mNav:{display:mob?"flex":"none",position:"fixed",bottom:0,left:0,right:0,background:"rgba(14,20,32,0.96)",borderTop:`1px solid ${P.border}`,backdropFilter:"blur(16px)",zIndex:200,overflowX:"auto",height:64},
    mNB:a=>({flex:"0 0 auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"5px 11px",border:"none",background:a?`${P.a1}18`:"transparent",color:a?P.a1:P.muted,fontSize:9,fontWeight:a?700:500,cursor:"pointer",borderTop:a?`2px solid ${P.a1}`:"2px solid transparent",gap:3,minWidth:52}),
    sec:{padding:mob?"12px 12px 20px":"20px 32px 32px"},
    C:(ex={})=>({...gl(null),padding:mob?12:16,marginBottom:12,...ex}),
    CA:(c,ex={})=>({...gl(c),padding:mob?12:16,marginBottom:12,borderLeft:`3px solid ${c}`,...ex}),
    L:{fontSize:10,color:P.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8},
    h2:{fontSize:mob?15:17,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:8},
    chip:c=>({display:"inline-flex",alignItems:"center",background:`${c}18`,border:`1px solid ${c}40`,borderRadius:6,padding:"2px 8px",fontSize:10,color:c,fontWeight:700}),
    pill:(a,c)=>({padding:mob?"7px 14px":"6px 13px",borderRadius:20,border:`1px solid ${a?c:P.border}`,background:a?`linear-gradient(135deg,${c}25,${c}10)`:"transparent",color:a?c:P.muted,fontSize:mob?12:11,fontWeight:a?700:400,cursor:"pointer",whiteSpace:"nowrap"}),
    mB:(a,c)=>({padding:"7px 14px",borderRadius:8,border:`1px solid ${a?c:P.border}`,background:a?`linear-gradient(135deg,${c},${c}cc)`:"transparent",color:a?"#000":P.muted,fontSize:11,fontWeight:a?700:400,cursor:"pointer",whiteSpace:"nowrap",...(a?glow(c):{})}),
    ta:{width:"100%",background:P.card2,border:`1px solid ${P.border}`,borderRadius:10,padding:"11px 14px",color:P.text,fontSize:mob?14:13,resize:"vertical",outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
    inp:{width:"100%",background:P.card2,border:`1px solid ${P.border}`,borderRadius:10,padding:mob?"12px 14px":"10px 14px",color:P.text,fontSize:mob?14:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
    sel:{width:"100%",background:P.card2,border:`1px solid ${P.border}`,borderRadius:10,padding:mob?"12px 14px":"10px 14px",color:P.text,fontSize:mob?14:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"},
    btn:c=>({background:`linear-gradient(135deg,${c},${c}cc)`,color:"#000",border:"none",borderRadius:10,padding:mob?"12px 22px":"10px 20px",fontSize:mob?14:13,fontWeight:700,cursor:"pointer",...glow(c)}),
    li:last=>({display:"flex",gap:10,padding:"9px 0",borderBottom:last?"none":`1px solid ${P.border}20`,fontSize:13,color:P.sub,lineHeight:1.55}),
    ib:c=>({background:`${c}10`,border:`1px solid ${c}30`,borderLeft:`3px solid ${c}`,borderRadius:10,padding:"10px 14px",marginBottom:10}),
    sb:c=>({...gl(c),padding:"14px 10px",textAlign:"center",borderRadius:12}),
  };

  const navItems=[
    ["now","🔥","Now"],["jobs","💡","Jobs"],["radar","🎯","GovtRadar"],["monthly","📅","Plan"],["career","💼","Careers"],
    ["skills","🧠","Skills"],["learn","🎓","Learn"],["ugc","📋","UGC NET"],
    ["office","🖥️","Office"],["health","❤️","Health"],["journal","📓","Journal"],
    ["resume","📄","Resume"],["certs","🏅","Certs"],["govt","🏛️","Govt"],["buddy","🫂","Buddy"],["coach","🤖","Coach"],
  ];

  return (
    <div style={S.app}>
      <div style={S.out}>
        <div style={S.hdr}>
          <div style={S.g1}/><div style={S.g2}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={S.badge}>✦ LIFE COMMAND CENTRE · JUL 2026 – DEC 2026</div>
                <h1 style={S.h1}>Thamizh's Life Plan 🚀</h1>
                <p style={S.sub}>PhD SSN · CCDV-F Aug 31 · UGC NET Dec 2026 · TCS · Career · Health</p>
              </div>
              <button onClick={()=>{setShowAgent(true);runLifeAgent();}}
                style={{background:`linear-gradient(135deg,${P.a4},${P.a1})`,border:"none",borderRadius:12,padding:"10px 16px",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer",flexShrink:0,boxShadow:`0 4px 20px ${P.a4}44`,marginTop:4}}>
                {agentRunning?"⏳ Scanning...":"🤖 Life Agent"}
              </button>
            </div>
          </div>
        </div>
        <div style={S.nav}>{navItems.map(([id,em,lb])=><button key={id} style={S.nB(tab===id)} onClick={()=>setTab(id)}>{em} {lb}</button>)}</div>

        <div style={S.sec}>

          {/* NOW */}
          {tab==="now"&&<div>
            <div style={S.h2}>🔥 Today — August 14, 2026 (Friday) IST</div>

            {/* Live countdown for CCDV-F */}
            {(()=>{
              const days=Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24)));
              return(
                <div style={{...gl(P.a5),padding:14,marginBottom:14,borderRadius:12,border:`2px solid ${P.a5}66`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:800,color:P.a5}}>🚨 Claude CCDV-F Certification Deadline</div>
                      <div style={{fontSize:12,color:P.muted}}>August 31, 2026 — Study 30 min today or miss the window</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:36,fontWeight:900,color:P.a5,lineHeight:1}}>{days}</div>
                      <div style={{fontSize:10,color:P.muted}}>days left</div>
                    </div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:5,height:6,marginTop:10,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.max(5,100-Math.round((days/42)*100))}%`,background:`linear-gradient(90deg,${P.a5},${P.a3})`,borderRadius:5}}/>
                  </div>
                </div>
              );
            })()}

            {/* Today's IST Time Schedule */}
            <div style={{...S.CA(P.a1),marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:P.a1,marginBottom:10}}>⏰ Today's Plan — Friday Aug 14, 2026 (IST)</div>
              {[
                {time:"6:30 AM",task:"Wake up · Morning medicines (Glycomet GP BEFORE breakfast ⚠️)",status:"morning",c:P.a3},
                {time:"7:00 AM",task:"Breakfast (within 30 min of Glycomet GP) · All morning meds after eating",status:"morning",c:P.a3},
                {time:"7:30–8:00 AM",task:"📚 Claude CCDV-F Study — Read Anthropic API docs: Tool Use & Multi-turn",status:"urgent",c:P.a5},
                {time:"9:00 AM",task:"TCS Office — Check TCS emails, triage all INCidents, update ticket statuses",status:"work",c:P.a1},
                {time:"10:00–12:00",task:"TCS Deep Work — DataStage pipeline tasks, SQL queries, project work",status:"work",c:P.a1},
                {time:"12:30–1:00 PM",task:"Lunch break — Brown rice, sambar, curd · NO sugar in drinks",status:"health",c:P.a2},
                {time:"2:00–4:00 PM",task:"TCS afternoon session — office work, any client/team calls",status:"work",c:P.a1},
                {time:"4:30 PM",task:"Evening snack — peanuts/chana + green tea (no sugar) · Check any new govt job notifications",status:"health",c:P.a2},
                {time:"5:30–6:30 PM",task:"TCS wrap-up — EOD note, handover, update all ticket statuses",status:"work",c:P.a1},
                {time:"7:00–8:00 PM",task:"🐍 Python / 🗄️ SQL Practice — LeetCode 2 problems OR Databricks DEA course",status:"study",c:P.a3},
                {time:"8:00–9:00 PM",task:"📋 UGC NET — 20 MCQs DBMS/OS/DSA on GeeksForGeeks",status:"ugc",c:P.a2},
                {time:"9:00 PM",task:"Dinner (BEFORE night Glycomet GP ⚠️) · Night medicines after dinner",status:"health",c:P.a3},
                {time:"9:30–10:00 PM",task:"📓 Journal entry + tomorrow's to-do list · Check follow-up board",status:"reflect",c:P.a4},
                {time:"10:00 PM",task:"Wind down · No phone after this · Warm milk optional · Sleep by 10:30 PM",status:"rest",c:P.muted},
              ].map((slot,i,arr)=>{
                const colors={morning:P.a3,urgent:P.a5,work:P.a1,health:P.a2,study:P.a3,ugc:P.a2,reflect:P.a4,rest:P.muted};
                const c=colors[slot.status]||P.muted;
                return(
                  <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i===arr.length-1?"none":`1px solid ${P.border}20`,alignItems:"flex-start"}}>
                    <div style={{minWidth:90,fontSize:11,color:P.muted,fontWeight:600,flexShrink:0,paddingTop:2}}>{slot.time}</div>
                    <div style={{flex:1,fontSize:12,color:slot.status==="urgent"?P.a5:P.sub,lineHeight:1.4,fontWeight:slot.status==="urgent"?700:400}}>{slot.task}</div>
                    <div style={{width:6,height:6,borderRadius:"50%",background:c,flexShrink:0,marginTop:4}}/>
                  </div>
                );
              })}
            </div>

            {/* This week's non-negotiables */}
            <div style={S.C()}>
              <div style={S.L}>⚡ This Week's Non-Negotiables (Aug 11–17)</div>
              {[
                {icon:"🚨",label:"Claude CCDV-F — 30 min study DAILY. Topics: API, Prompt Eng, Tool Use, Safety",when:"Every day",color:P.a5},
                {icon:"🚀",label:"ISRO Scientist SC — Apply BEFORE August 17! 92 vacancies, CS stream. isro.gov.in",when:"⚠️ Deadline Aug 17",color:P.a5},
                {icon:"🗄️",label:"Databricks DEA course — 2 modules this weekend to stay on Sep exam track",when:"This weekend",color:P.a3},
                {icon:"📋",label:"UGC NET Dec 2026 — DBMS topics today, registration opens Sep 2026",when:"Daily 8–9 PM",color:P.a2},
                {icon:"🎓",label:"PhD — Log supervisor meeting details, add research tasks to PhD tab",when:"This week",color:P.a4},
                {icon:"💼",label:"Job switch — Apply 3+ Senior DE / AI-DE roles on Naukri this week",when:"3 applications",color:P.a1},
                {icon:"📓",label:"Write journal entry tonight — track mood, meds, study progress",when:"Tonight 9:30 PM",color:P.a4},
              ].map((a,i)=>(
                <div key={i} style={{...S.ib(a.color),display:"flex",alignItems:"flex-start",gap:12,marginBottom:8}}>
                  <span style={{fontSize:20,flexShrink:0}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:P.text,lineHeight:1.4}}>{a.label}</div>
                    <div style={{fontSize:10,color:a.color,marginTop:3,fontWeight:700}}>{a.when}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4 Resume Variants */}
            <div style={S.C()}>
              <div style={S.L}>📄 4 Resume Variants — Keep These Ready</div>
              {[
                {r:"Senior Data Engineer",f:"SQL, DataStage, Teradata, PySpark, Databricks (cert Sep 2026) — Apply NOW, 40-60% hike"},
                {r:"AI Data Engineer / GenAI Engineer",f:"LangChain, RAG, Gemini API, Python, GCP — Apply after Databricks cert + 1 RAG project"},
                {r:"Analytics Engineer",f:"SQL advanced, dbt, BigQuery, Python, Looker — less competitive, good hike"},
                {r:"Assistant Professor CSE/DS/AI",f:"M.Tech DS, PhD SSN ongoing (Jul 2026), UGC NET Dec 2026 — for walking professor slots"},
              ].map((r,i)=>(<div key={i} style={{...S.li(i===3),flexDirection:"column",gap:3}}><span style={{color:P.a1,fontWeight:700,fontSize:12}}>{r.r}</span><span style={{color:P.muted,fontSize:11}}>{r.f}</span></div>))}
            </div>
          </div>}

                    {tab==="radar"&&<div>
            <div style={S.h2}>🎯 Government Career Radar</div>
            <div style={{...S.ib(P.a5),marginBottom:10}}>
              <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>⚠️ ISRO Scientist/Engineer SC — Deadline TODAY August 17, 2026 (Last few hours!)</div>
              <div style={{fontSize:11,color:P.muted}}>92 vacancies. Computer Science stream available. GATE required. SC fee waived. Apply at isro.gov.in before midnight.</div>
            </div>
            <div style={{...S.ib(P.a3),marginBottom:14}}>
              <div style={{fontSize:11,color:P.a3,fontWeight:700,marginBottom:2}}>Profile: B.E ECE + M.Tech DS + PhD CS/GenAI (ongoing, SNU) + 4.5yr TCS DE experience + SC category</div>
              <div style={{fontSize:11,color:P.muted}}>Eligibility is calculated per actual notification. GATE required for many posts. Verify before applying.</div>
            </div>

            {/* Sub tabs */}
            <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
              {[["radar","📡 Radar Dashboard"],["scientist","🔬 Scientist/Research"],["ai","🤖 AI/Data/CS"],["defence","🛡️ Defence/Intel"],["tn","🏛️ Tamil Nadu"],["psu","🏢 PSU"],["academic","🎓 Academic"],["tracker","📋 Application Tracker"],["ask","💬 Eligibility Advisor"]].map(([id,lb])=>(
                <button key={id} style={S.pill(radarTab===id,P.a5)} onClick={()=>setRadarTab(id)}>{lb}</button>
              ))}
            </div>

            {/* RADAR DASHBOARD */}
            {radarTab==="radar"&&<div>
              {/* APPLY NOW */}
              <div style={{...S.CA(P.a5),marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:P.a5,marginBottom:10}}>🔥 APPLY NOW — Currently Open (August 2026)</div>
                {[
                  {id:"isro-sc-2026",org:"ISRO",post:"Scientist/Engineer SC",deadline:"Aug 17, 2026 🚨",phy:"GREEN — Medical only",phd:"B — Verify posting",score:78,deg:"B.E ECE ✅ (EC stream) | B.E CS ✅ (CS stream)",gate:"GATE CS/EC 2024/2025/2026 required",sal:"₹56,100/month (Level 10)",note:"SC fee waived ₹250. 92 vacancies. GATE required — check if you have valid score.",link:"isro.gov.in"},
                  {id:"tnpsc-cts-2026",org:"TNPSC",post:"Computer Programmer / Systems Manager (CTS Non-Interview)",deadline:"Aug 15, 2026 (Exam: Aug 16–Sep 9)",phy:"GREEN — No PET",phd:"A — Compatible",score:82,deg:"B.E CS/IT/ECE ✅ | MCA ✅ | M.Tech DS ✅",gate:"No GATE required",sal:"₹28,480–₹56,900 (State govt scale)",note:"Exam already started Aug 16. Check if you applied under Advt 04/2026. CTS interview posts (Advt 06/2026) notification expected Aug 31.",link:"tnpsc.gov.in"},
                ].map(job=>(
                  <div key={job.id} style={{background:P.card3,borderRadius:10,padding:"12px 14px",marginBottom:10,border:`1px solid ${P.a5}33`,borderLeft:`3px solid ${P.a5}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:6}}>
                      <div style={{fontSize:13,fontWeight:700,color:P.text}}>{job.org} — {job.post}</div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{...S.chip(P.a5),fontSize:10}}>Score: {job.score}/100</span>
                        <span style={{...S.chip(job.score>=75?P.a2:job.score>=60?P.a3:P.muted),fontSize:10}}>{job.score>=90?"🔥 MUST APPLY":job.score>=75?"🟢 HIGH PRIORITY":job.score>=60?"🟡 BACKUP":"⚪ LOW"}</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:P.a5,fontWeight:700,marginBottom:6}}>📅 Deadline: {job.deadline}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6,fontSize:11}}>
                      <div style={{color:P.muted}}>Degree: <span style={{color:P.sub}}>{job.deg}</span></div>
                      <div style={{color:P.muted}}>GATE: <span style={{color:job.gate.includes("required")?P.a3:P.a2}}>{job.gate}</span></div>
                      <div style={{color:P.muted}}>Physical: <span style={{color:P.a2}}>{job.phy}</span></div>
                      <div style={{color:P.muted}}>PhD: <span style={{color:P.a2}}>{job.phd}</span></div>
                      <div style={{color:P.muted}}>Salary: <span style={{color:P.sub}}>{job.sal}</span></div>
                    </div>
                    <div style={{fontSize:11,color:P.muted,marginBottom:8,lineHeight:1.5,background:`${P.bg}88`,padding:"6px 8px",borderRadius:6}}>{job.note}</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      <a href={`https://www.${job.link}`} target="_blank" rel="noreferrer" style={{...S.chip(P.a1),textDecoration:"none",cursor:"pointer"}}>🔗 {job.link}</a>
                      <select value={appStatus[job.id]||"🔴 Not Researched"} onChange={e=>saveAppStatus(job.id,e.target.value)} style={{...S.sel,flex:1,padding:"4px 8px",fontSize:11}}>
                        {["🔴 Not Researched","🔵 Upcoming","🟢 Applications Open","🟡 Applied","🟣 Exam Scheduled","🟠 Interview Scheduled","🔷 Result Pending","🟢 Selected","⚫ Not Selected","⚪ Closed"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* UPCOMING 90 DAYS */}
              <div style={{...S.CA(P.a2),marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:P.a2,marginBottom:10}}>🟢 UPCOMING — Next 90 Days (EXPECTED/CONFIRMED)</div>
                {[
                  {org:"DRDO",post:"Scientist B (CS/ECE/AI disciplines)",when:"Sep–Oct 2026 (EXPECTED)",type:"EXPECTED",note:"DRDO regularly recruits Scientist B via GATE score through RAC. Advt 156 via GATE was April 2026. Next Scientist B cycle expected Q3/Q4 2026. Watch rac.gov.in",gate:"GATE CS/EC required",score:85,match:"🎯 HIGH — CS/ECE + M.Tech + PhD research aligns perfectly with DRDO AI labs"},
                  {org:"NIC (Next cycle)",post:"Scientist B / Scientific Technical Assistant A",when:"Sep–Dec 2026 (EXPECTED)",type:"EXPECTED",note:"NIC Scientist B 2026 (243 posts, Advt NIC/SCB/2026/1) closed April 24. Shortlist was cancelled/revised — still in process. Next full cycle expected. Also: NIC STA-A recruitment (376 posts) expected. Watch nic.gov.in",gate:"GATE CS/EC/DA required",score:88,match:"🎯 HIGHEST FIT — Data Science & AI discipline (50 posts) matches M.Tech DS + PhD GenAI + TCS experience perfectly"},
                  {org:"TNPSC CTS Interview Posts",post:"Technical Officer / Scientific Officer",when:"Notification Aug 31, 2026 (CONFIRMED from planner)",type:"CONFIRMED from planner",note:"TNPSC Annual Planner 2026 confirms interview posts notification on Aug 31, 2026. Exam Nov 14, 2026. CS/ECE/IT candidates eligible for several posts.",gate:"No GATE required",score:80,match:"✅ Good match — Tamil Nadu domicile + SC advantage + no GATE needed"},
                  {org:"C-DAC",post:"Project Engineer / Senior Project Engineer (AI/ML, Data Science)",when:"Sep–Oct 2026 (EXPECTED — JIT cycle)",type:"EXPECTED",note:"C-DAC JIT June 2026 (951 posts, Advt CORP/JIT/02/2026) closed June 20. Next JIT cycle expected Sep–Oct 2026. Senior PE requires 4+ years experience — you qualify. C-DAC Chennai centre available.",gate:"No GATE required",score:83,match:"🎯 HIGH — 4.5yr experience qualifies for Senior PE. AI/ML + Data Science domains. C-DAC Chennai available."},
                  {org:"SSC CGL 2026",post:"Assistant Section Officer / Technical posts",when:"Sep–Oct 2026 exam (EXPECTED)",type:"EXPECTED",note:"SSC CGL notification expected Aug–Sep 2026. While primarily administrative, check technical posts including Statistical Investigator, Inspector (IT), and specialist technical posts under CGL.",gate:"No GATE",score:55,match:"⚪ Moderate — Administrative posts are backup option. Check specific technical vacancies."},
                  {org:"NIELIT",post:"Scientist B / Technical Assistant",when:"Late 2026 (EXPECTED)",type:"EXPECTED",note:"NIELIT (National Institute of Electronics & IT, MeitY) conducts separate scientist and TA recruitment. Previous cycle had 402 posts. New cycle expected late 2026. Written exam + interview format (unlike NIC which uses GATE only).",gate:"Written exam — No GATE",score:82,match:"✅ Good — No GATE needed. Computer Science, Electronics, IT disciplines eligible."},
                ].map((job,i)=>(
                  <div key={i} style={{background:P.card3,borderRadius:10,padding:"11px 13px",marginBottom:8,border:`1px solid ${P.border}`,borderLeft:`3px solid ${job.score>=80?P.a2:job.score>=60?P.a3:P.muted}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:5}}>
                      <div style={{fontSize:12,fontWeight:700,color:P.text}}>{job.org} — {job.post}</div>
                      <div style={{display:"flex",gap:4}}>
                        <span style={S.chip(job.type.includes("CONFIRMED")?P.a2:P.a3)}>{job.type}</span>
                        <span style={S.chip(job.score>=80?P.a2:P.a3)}>{job.score}/100</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:P.a1,marginBottom:4}}>📅 {job.when}</div>
                    <div style={{fontSize:11,color:P.muted,marginBottom:4,lineHeight:1.5}}>{job.note}</div>
                    <div style={{fontSize:11,color:job.gate.includes("required")?P.a3:P.a2,marginBottom:4}}>GATE: {job.gate}</div>
                    <div style={{fontSize:11,color:P.a2,fontWeight:600}}>{job.match}</div>
                  </div>
                ))}
              </div>

              {/* TOP 5 BEST FIT */}
              <div style={{...S.CA(P.a1),marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:800,color:P.a1,marginBottom:10}}>🏆 TOP MATCHES FOR YOUR PROFILE</div>
                {[
                  {rank:1,org:"NIC Scientist B",role:"Data Science & AI discipline",score:88,why:"M.Tech DS + PhD GenAI + TCS experience = perfect match for 50 DS&AI posts",gate:"GATE DA/CS needed",action:"Watch nic.gov.in for revised shortlist / next cycle"},
                  {rank:2,org:"C-DAC Senior Project Engineer",role:"AI/ML or Data Science",score:83,why:"4.5yr experience qualifies you directly. No GATE. C-DAC Chennai available. PhD-compatible contractual posting.",gate:"No GATE",action:"Watch careers.cdac.in for Sep-Oct JIT cycle"},
                  {rank:3,org:"DRDO Scientist B/C",role:"Computer Science / AI labs",score:82,why:"PhD in GenAI + CS background + defence AI research = high alignment. Scientist C needs 3yr experience (you have 4.5yr).",gate:"GATE CS needed for Sci B; experience for Sci C",action:"Watch rac.gov.in — Sci B via GATE; Sci C lateral"},
                  {rank:4,org:"TNPSC CTS — Computer Programmer",role:"Tamil Nadu Govt Technical",score:80,why:"No GATE. SC advantage. Tamil Nadu domicile. PhD-compatible desk role. B.E ECE/CS eligible.",gate:"No GATE",action:"CTS Interview posts notification Aug 31 — watch tnpsc.gov.in"},
                  {rank:5,org:"NIELIT Scientist B",role:"CS/IT/Electronics",score:79,why:"No GATE required (written exam instead). MeitY organisation. Good salary. PhD-compatible.",gate:"Written exam only",action:"Watch nielit.gov.in for next recruitment cycle"},
                ].map(job=>(
                  <div key={job.rank} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:job.rank===5?"none":`1px solid ${P.border}20`,alignItems:"flex-start"}}>
                    <div style={{background:P.a1,color:"#000",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0,marginTop:2}}>{job.rank}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:P.text,marginBottom:2}}>{job.org} — {job.role}</div>
                      <div style={{fontSize:11,color:P.muted,marginBottom:2}}>{job.why}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <span style={S.chip(P.a1)}>{job.score}/100</span>
                        <span style={S.chip(job.gate.includes("No GATE")?P.a2:P.a3)}>{job.gate}</span>
                      </div>
                      <div style={{fontSize:11,color:P.a3,marginTop:4}}>→ {job.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* SCIENTIST / RESEARCH TAB */}
            {radarTab==="scientist"&&<div>
              <div style={{...S.ib(P.a4),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>🔬 Scientist & Research Roles — Track 1 (DRDO) + Track 4 (ISRO) + CSIR/DST</div>
              </div>
              {[
                {org:"DRDO RAC — Scientist C (Lateral)",advt:"Advt 157 (CLOSED June 19, 2026)",status:"⚪ Closed",score:82,elig:{deg:"B.E CS/ECE ✅ (First class, 60%+)",exp:"3yr post-qualification needed ✅ (you have 4.5yr)",age:"Up to 35 (SC: +5 = 40 ✅)",gate:"No GATE for lateral Sci C",phys:"GREEN",phd:"B — verify service rules for external PhD"},overall:"POTENTIALLY ELIGIBLE",note:"Advt 157 had 33 posts (Sci C/D/E). All posts were Unreserved — SC category quota does NOT apply to Scientist C and above at DRDO. This is important. GATE not required for lateral Sci C. 3yr experience required — you qualify with 4.5yr. Watch rac.gov.in for Advt 158.",track:"Defence/Research"},
                {org:"DRDO RAC — Scientist B (via GATE)",advt:"Advt 156 (GATE-based, ongoing process)",status:"🔷 Result/Selection in progress",score:85,elig:{deg:"B.E CS/ECE ✅ (First class)",exp:"No experience required (fresh + experienced eligible)",age:"Up to 28 (SC: +5 = 33 ✅)",gate:"GATE CS or EC required — CRITICAL",phys:"GREEN",phd:"B — verify"},overall:"POTENTIALLY ELIGIBLE — GATE score is critical",note:"DRDO Sci B via GATE is the main entry route. Advt 156 process was underway. New Sci B recruitment expected. PRIMARY blocker: Do you have a valid GATE 2024/2025/2026 CS or EC score? If yes — HIGH PRIORITY. If no — prepare for GATE 2027.",track:"Defence/Research"},
                {org:"ISRO Scientist/Engineer SC",advt:"ICRB 2026 — Deadline Aug 17, 2026",status:"🟢 CLOSING TODAY",score:78,elig:{deg:"B.E ECE ✅ (EC stream) | B.E CS ✅ (CS stream)",exp:"Fresher to experienced (GATE-based shortlisting)",age:"Up to 28 (SC: +5 = 33 ✅)",gate:"GATE EC/CS 2024/2025/2026 required",phys:"GREEN — Medical + interview",phd:"B — Verify ISRO rules on external PhD"},overall:"POTENTIALLY ELIGIBLE — GATE required",note:"92 vacancies. CS stream: GATE CS. EC stream: GATE EC. 50% GATE + 50% interview for merit. No separate written exam. SC fee waived. Multiple centres including VSSC (Thiruvananthapuram, near TN).",track:"Space/Research"},
                {org:"CSIR Laboratories — Project Scientist/RA",advt:"Various rolling notifications",status:"🔵 Monitor continuously",score:75,elig:{deg:"M.Tech DS ✅ | PhD CS (ongoing) ✅ (for Project Scientist)",exp:"Varies by position",age:"Varies — typically 35–45",gate:"No GATE — merit/interview based",phys:"GREEN",phd:"A — Project Scientist posts typically allow external PhD continuation"},overall:"POTENTIALLY ELIGIBLE",note:"CSIR labs (CEERI, CMC, CDRI, etc.) recruit Project Scientists and RAs for AI/Data/CS. Contractual initially. PhD ongoing is often acceptable. Good research experience for your CV. Watch csir.res.in and individual lab websites.",track:"Research"},
                {org:"DST/DBT Funded Projects — JRF/SRF/RA",advt:"Rolling basis, various IITs/research labs",status:"🔵 Ongoing opportunities",score:70,elig:{deg:"M.Tech DS ✅ | PhD ongoing ✅",exp:"Research experience preferred",age:"Typically up to 28-35",gate:"NET/GATE preferred for JRF",phys:"GREEN",phd:"A — Explicitly designed for PhD scholars"},overall:"ELIGIBLE for SRF/RA positions",note:"Post-M.Tech with ongoing PhD: eligible for SRF or Research Associate positions at IITs/NITs working on AI/healthcare/data projects. Search on DST portals, IIT research labs, and academia job portals (academicjobs.in, naturalsciences.in).",track:"Research"},
              ].map((job,i)=>(
                <div key={i} style={{...S.C(),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:700,color:P.text}}>{job.org}</div>
                    <div style={{display:"flex",gap:4}}><span style={S.chip(job.score>=80?P.a2:job.score>=70?P.a3:P.muted)}>{job.score}/100</span><span style={S.chip(job.status.includes("CLOSING")?P.a5:job.status.includes("Closed")?P.muted:job.status.includes("Result")?P.a4:P.a2)}>{job.status}</span></div>
                  </div>
                  <div style={{fontSize:11,color:P.muted,marginBottom:8}}>Advt: {job.advt}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8,fontSize:11}}>
                    <div style={{color:P.muted}}>Degree: <span style={{color:P.sub}}>{job.elig.deg}</span></div>
                    <div style={{color:P.muted}}>Experience: <span style={{color:P.sub}}>{job.elig.exp}</span></div>
                    <div style={{color:P.muted}}>Age: <span style={{color:P.sub}}>{job.elig.age}</span></div>
                    <div style={{color:P.muted}}>GATE: <span style={{color:job.elig.gate.includes("required")?P.a3:P.a2}}>{job.elig.gate}</span></div>
                    <div style={{color:P.muted}}>Physical: <span style={{color:P.a2}}>{job.elig.phys}</span></div>
                    <div style={{color:P.muted}}>PhD Compat: <span style={{color:P.a2}}>{job.elig.phd}</span></div>
                  </div>
                  <div style={{...S.ib(P.a4),marginBottom:6}}><div style={{fontSize:11,color:P.a4,fontWeight:600,marginBottom:2}}>Overall Eligibility: {job.overall}</div></div>
                  <div style={{fontSize:11,color:P.muted,lineHeight:1.55}}>{job.note}</div>
                </div>
              ))}
            </div>}

            {/* AI/DATA/CS TAB */}
            {radarTab==="ai"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>🤖 AI / Data Science / Computer Science Roles — Track 2</div>
              </div>
              {[
                {org:"NIC Scientist B — Data Science & AI",score:88,status:"🔷 Revised shortlist pending",note:"Advt NIC/SCB/2026/1 (243 posts). 3 disciplines: CS&IT (168), EC (25), DS&AI (50). You fit DS&AI perfectly (M.Tech DS + PhD GenAI + TCS). GATE DA (Data Science & AI) paper is the qualifying exam for DS&AI discipline. Application closed April 24. Revised shortlist pending. Watch nic.gov.in",gate:"GATE DA (Data Science & AI) for DS discipline",elig:"✅ M.Tech DS + TCS experience + GATE DA needed"},
                {org:"NIC Scientific/Technical Assistant A",score:82,status:"🔵 Expected 2026",note:"NIC also recruits STA-A (376 posts in previous cycle). Group B role. Lower competition than Scientist B. CS/IT/EC disciplines. GATE-based shortlisting. Entry-level but stable central govt job.",gate:"GATE CS/EC/DA",elig:"✅ B.E ECE + experience qualifies"},
                {org:"C-DAC — AI/ML Senior Project Engineer",score:83,status:"🔵 Next JIT Sep-Oct 2026",note:"C-DAC JIT June 2026 (closed June 20) had explicit AI/ML domain posts. Senior PE requires 4+ years IT/CS experience — you qualify with 4.5yr. Consolidated salary ₹60,000–₹90,000/month approx. C-DAC Chennai/Pune/Bengaluru centres available. Contractual 3 years, renewable. Good for PhD continuation.",gate:"No GATE required",elig:"✅ ELIGIBLE — 4.5yr experience qualifies for Senior PE"},
                {org:"MeitY Project Roles (via implementing agencies)",score:72,status:"🔵 Rolling basis",note:"MeitY funds AI/data projects through C-DAC, STPI, NIC, CERT-In. Project-based roles for AI researchers, data scientists, and software engineers. Contractual. Good stepping stone.",gate:"No GATE",elig:"✅ M.Tech DS + TCS experience"},
                {org:"CERT-In (Cybersecurity) — Technical roles",score:68,status:"🔵 Watch for notifications",note:"Indian Computer Emergency Response Team under MeitY. Technical analyst, SOC, and research roles. CS/IT background required. Growing organisation with AI-cybersecurity crossover.",gate:"No GATE typically",elig:"✅ CS/IT background qualifies — check specific posts"},
                {org:"AI4Bharat / Government AI Projects",score:65,status:"🔵 Ongoing",note:"Multiple government AI initiatives (National AI Mission, IndiaAI) are creating project-based positions. IIT Madras, C-DAC, and MeitY implement these. Your PhD in GenAI + Tamil language focus makes you competitive.",gate:"No GATE",elig:"✅ PhD + GenAI research = strong fit"},
              ].map((job,i)=>(
                <div key={i} style={{background:P.card3,borderRadius:10,padding:"11px 13px",marginBottom:8,borderLeft:`3px solid ${job.score>=80?P.a1:P.a3}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5,marginBottom:5}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.text}}>{job.org}</div>
                    <div style={{display:"flex",gap:4}}><span style={S.chip(job.score>=80?P.a2:P.a3)}>{job.score}/100</span><span style={S.chip(P.a1)}>{job.status}</span></div>
                  </div>
                  <div style={{fontSize:11,color:job.gate.includes("No GATE")?P.a2:P.a3,marginBottom:4,fontWeight:600}}>GATE: {job.gate}</div>
                  <div style={{fontSize:11,color:P.a2,marginBottom:6}}>Eligibility: {job.elig}</div>
                  <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{job.note}</div>
                </div>
              ))}
            </div>}

            {/* DEFENCE/INTEL TAB */}
            {radarTab==="defence"&&<div>
              <div style={{...S.ib(P.a5),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>🛡️ Defence & Intelligence — Civilian/Technical roles only (No combat/PET roles)</div>
                <div style={{fontSize:11,color:P.muted}}>All roles below are desk/technical/civilian. Physical classification included for each.</div>
              </div>
              {[
                {org:"Navy Civilians — Chargeman / Technical Assistant",score:65,phys:"🟡 YELLOW — Medical + basic fitness, no PET",note:"Indian Navy civilian technical posts for ECE/CS graduates. Chargeman (Group C), Scientific Assistant (Group B). Ministry of Defence civilian recruitment. Periodic notifications. Watch joinindiannavy.gov.in/careers",gate:"No GATE",elig:"✅ B.E ECE eligible for electronics/technical posts",phd:"B — Verify naval civilian service rules for external PhD"},
                {org:"Army Civilians — Technical Officer (MES/DRDO labs)",score:68,phys:"🟡 YELLOW — Medical standard only",note:"Military Engineering Services (MES) recruits Engineers for construction/tech roles. DRDO lab-attached civilian technical posts also available. Check mes.gov.in and individual DRDO establishment websites.",gate:"GATE may be required for some",elig:"⚠️ UNCERTAIN — check discipline-specific eligibility",phd:"B — Verify"},
                {org:"Air Force Civilians — AFCAT Technical / Civilian IT",score:60,phys:"🟡 YELLOW — Medical standard",note:"IAF civilians in IT/tech roles. AFCAT is uniformed (avoid). Civilian IT Officer posts are periodic. Watch careerindianairforce.nic.in for civilian technical vacancies.",gate:"No GATE for civilian",elig:"✅ CS/IT background eligible for civilian tech posts",phd:"B — Verify"},
                {org:"IB ACIO Technical",score:55,phys:"🟡 YELLOW — Mixed desk+field",note:"Intelligence Bureau ACIO (Assistant Central Intelligence Officer) Technical stream. CS/IT/ECE eligible. Written exam + interview. Some field component — label: MIXED desk+field. Not pure desk.",gate:"No GATE",elig:"✅ B.E ECE/CS eligible",phd:"C — IB service likely incompatible with external PhD — VERIFY"},
                {org:"NTRO — Technical positions",score:62,phys:"GREEN — Technical/research desk",note:"National Technical Research Organisation recruits CS/ECE/IT professionals for technical intelligence roles. Secretive organisation — few public notifications. Watch official gazette. High job security, good salary. Security clearance required.",gate:"No GATE publicly stated",elig:"⚠️ UNCERTAIN — Limited public information. B.E ECE/CS likely eligible",phd:"C — Security clearance + service rules may conflict with external PhD. Must verify."},
              ].map((job,i)=>(
                <div key={i} style={{...S.C(),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5,marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.text}}>{job.org}</div>
                    <span style={S.chip(job.score>=70?P.a2:job.score>=55?P.a3:P.muted)}>{job.score}/100</span>
                  </div>
                  <div style={{fontSize:11,color:job.phys.includes("GREEN")?P.a2:P.a3,fontWeight:600,marginBottom:4}}>{job.phys}</div>
                  <div style={{fontSize:11,color:job.gate.includes("No GATE")?P.a2:P.a3,marginBottom:4}}>GATE: {job.gate} | PhD: {job.phd}</div>
                  <div style={{fontSize:11,color:P.a2,marginBottom:4}}>{job.elig}</div>
                  <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{job.note}</div>
                </div>
              ))}
            </div>}

            {/* TN GOVT TAB */}
            {radarTab==="tn"&&<div>
              <div style={{...S.ib(P.a2),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>🏛️ Tamil Nadu Government — Domicile + SC advantage + No GATE for most</div>
              </div>
              {[
                {org:"TNPSC CTS — Computer Programmer",score:82,advt:"Advt 04/2026 (Non-interview) + Advt 06/2026 expected Aug 31",status:"🟣 Exam underway (Aug 16 – Sep 9)",note:"CTS Non-Interview 2026: Computer Programmer, Systems Manager included. Exam from Aug 16. If you missed this cycle, watch for CTS Interview posts (notification Aug 31, exam Nov 14, 2026). B.E CS/IT/ECE + MCA/M.Tech eligible.",gate:"No GATE",elig:"✅ B.E ECE + M.Tech DS eligible",phys:"GREEN",phd:"A — State govt typically allows external PhD with NOC"},
                {org:"TNPSC CTS Interview Posts — Technical Officer",score:80,advt:"Advt 06/2026 — notification Aug 31, 2026 (CONFIRMED from planner)",status:"🔵 Notification expected Aug 31",note:"Technical officer, scientific officer posts under various TN departments. Interview posts have higher salary bands and seniority. Tamil Nadu domicile + SC gives significant advantage.",gate:"No GATE",elig:"✅ B.E ECE + M.Tech DS eligible",phys:"GREEN",phd:"A — Verify NOC requirement"},
                {org:"TNPSC Group 1 — Deputy Collector/ACS",score:45,advt:"Group 1 notification Jun 2026, exam Sep 2026",status:"🟣 Exam Sep 6, 2026",note:"HIGH COMPETITION. Administrative, not technical. Engineering graduates eligible but this is IAS-equivalent preparation. Consider only if genuinely interested in administration. LOW PRIORITY for technical profile.",gate:"No GATE",elig:"✅ Any degree eligible, but not technical role",phys:"GREEN",phd:"C — Full-time district administration incompatible with PhD"},
                {org:"Tamil Nadu e-Governance Agency (TNeGA)",score:72,advt:"Project/contractual basis",status:"🔵 Monitor website",note:"TNeGA (State IT agency) recruits project-based IT and data professionals. Roles in digital governance, data analytics, e-services. Contract-based initially. Visit tnega.tn.gov.in.",gate:"No GATE",elig:"✅ CS/IT/Data background",phys:"GREEN",phd:"A — Project roles flexible"},
                {org:"TANGEDCO / TNEB",score:55,advt:"Periodic AE/JE recruitment",status:"🔵 Watch tangedco.gov.in",note:"Tamil Nadu Generation and Distribution Corporation. Assistant Engineer (Electrical/Electronics) posts. B.E ECE eligible for Electronics AE. Not directly related to data/AI work — LOW PRIORITY for your career trajectory unless stability is primary concern.",gate:"No GATE typically",elig:"✅ B.E ECE eligible for Electronics AE",phys:"YELLOW — some field inspection",phd:"B — Verify"},
              ].map((job,i)=>(
                <div key={i} style={{...S.C(),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5,marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.text}}>{job.org}</div>
                    <div style={{display:"flex",gap:4}}><span style={S.chip(job.score>=75?P.a2:job.score>=55?P.a3:P.muted)}>{job.score}/100</span><span style={S.chip(job.status.includes("CLOSING")||job.status.includes("underway")?P.a5:job.status.includes("expected")||job.status.includes("Exam")?P.a3:P.a1)}>{job.status}</span></div>
                  </div>
                  <div style={{fontSize:11,color:P.muted,marginBottom:4}}>Advt: {job.advt}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:5,fontSize:11}}>
                    <span style={{color:job.gate.includes("No GATE")?P.a2:P.a3}}>{job.gate}</span>
                    <span style={{color:job.phys.includes("GREEN")?P.a2:P.a3}}>Physical: {job.phys}</span>
                    <span style={{color:P.a2}}>PhD: {job.phd}</span>
                  </div>
                  <div style={{fontSize:11,color:P.a2,marginBottom:4}}>{job.elig}</div>
                  <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{job.note}</div>
                </div>
              ))}
            </div>}

            {/* PSU TAB */}
            {radarTab==="psu"&&<div>
              <div style={{...S.ib(P.a3),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:3}}>🏢 PSU Technical Roles — Track 7 (GATE-based mostly)</div>
                <div style={{fontSize:11,color:P.muted}}>Most PSUs use GATE score for screening. Valid GATE score is a CRITICAL requirement for premium PSUs.</div>
              </div>
              {[
                {org:"BEL (Bharat Electronics Limited)",score:75,gate:"GATE CS/EC recommended",posts:"Engineer (CS/ECE) — Data/AI/IT roles growing",note:"BEL recruits Engineers through GATE and direct exam. Chennai unit available. Electronics + CS background useful. Growing AI/cybersecurity division. Annual cycle typically Q1-Q2.",elig:"✅ B.E ECE + M.Tech DS",phys:"GREEN"},
                {org:"HAL (Hindustan Aeronautics)",score:68,gate:"GATE CS/EC",posts:"IT Engineer, Software Engineer",note:"HAL IT roles for systems, ERP, AI/data. ECE + CS background eligible. Salary: ₹40,000–₹1,40,000 (IDA scale). Annual cycle.",elig:"✅ B.E ECE eligible",phys:"GREEN — desk role"},
                {org:"ECIL (Electronics Corporation of India)",score:72,gate:"Written exam (some direct, some GATE)",posts:"Technical Officer / Scientist — CS/ECE/IT",note:"ECIL frequently recruits CS/ECE/IT professionals. Technical Officer posts include data, IT, embedded, AI roles. No GATE for some posts (direct written exam).",elig:"✅ B.E ECE + M.Tech eligible",phys:"GREEN"},
                {org:"NTPC / Power Grid / ONGC",score:58,gate:"GATE required",posts:"Executive Trainee (CS/IT/ECE)",note:"Large PSUs primarily recruit via GATE for Executive Trainee. Work is operational/engineering — not aligned with AI/data research. LOW PRIORITY for your profile unless stability is primary goal.",elig:"✅ B.E ECE eligible via GATE EC",phys:"YELLOW — some field"},
                {org:"RailTel Corporation",score:70,gate:"GATE or direct exam",posts:"Manager (IT/CS), Executive (IT)",note:"RailTel is the telecom arm of Indian Railways. IT, cybersecurity, and data roles. National footprint. Stable government PSU. Watch railtelindia.com for notifications.",elig:"✅ CS/ECE/IT background",phys:"GREEN"},
              ].map((job,i)=>(
                <div key={i} style={{background:P.card3,borderRadius:10,padding:"11px 13px",marginBottom:8,borderLeft:`3px solid ${job.score>=70?P.a3:P.muted}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5,marginBottom:5}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.text}}>{job.org}</div>
                    <span style={S.chip(job.score>=70?P.a3:P.muted)}>{job.score}/100</span>
                  </div>
                  <div style={{fontSize:11,color:P.a1,marginBottom:3}}>Posts: {job.posts}</div>
                  <div style={{fontSize:11,color:job.gate.includes("GATE")?P.a3:P.a2,marginBottom:3}}>GATE: {job.gate} | Physical: <span style={{color:P.a2}}>{job.phys}</span></div>
                  <div style={{fontSize:11,color:P.a2,marginBottom:4}}>{job.elig}</div>
                  <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{job.note}</div>
                </div>
              ))}
            </div>}

            {/* ACADEMIC TAB */}
            {radarTab==="academic"&&<div>
              <div style={{...S.ib(P.a4),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>🎓 Academic / Faculty Track — Track 5 (PhD + NET + Publications)</div>
                <div style={{fontSize:11,color:P.muted}}>PhD is key differentiator. UGC NET CS December 2026 is the immediate priority for academic track eligibility.</div>
              </div>
              {[
                {org:"Government Engineering Colleges (TN) — Asst Professor CSE/DS/AI",score:78,status:"UGC NET Dec 2026 first",note:"Tamil Nadu government engineering colleges recruit Assistant Professors through direct recruitment or TNPSC. B.E + M.Tech + UGC NET (or PhD) required. PhD ongoing = strong differentiator. Subject: Computer Science. UGC NET CS December 2026 is your pathway. Clear NET → apply for Asst Prof in 2027.",req:"UGC NET CS or PhD (ongoing qualifies at some institutions)"},
                {org:"Walking / Visiting Professor — Private Colleges",score:72,status:"🟢 Can start NOW",note:"SSN, VIT, SRM, Panimalar, Jeppiaar — contact HoD CSE/IT/DS directly. Your M.Tech DS + PhD ongoing + TCS experience = strong profile. Weekend slots. Extra income + academic experience for resume. Paid per session or per month.",req:"M.Tech DS + TCS experience (no NET needed for visiting)"},
                {org:"Anna University / Government Universities — Research Positions",score:70,status:"🔵 Rolling basis",note:"Research associate, project scientist positions funded by AICTE, DST, DBT. PhD ongoing = eligible. Contact departments directly. AI/ML/data projects at CSE, ECE departments.",req:"M.Tech DS + PhD ongoing"},
                {org:"IIT/NIT — JRF/SRF/Research Associate",score:65,status:"🔵 Rolling basis",note:"IIT Madras, IIT Bombay, NITs have ongoing funded projects in AI, GenAI, healthcare AI — exactly your research area. SRF requires 2yr post-M.Tech experience + NET/GATE. Excellent for research career. Contact faculty directly with PhD proposal.",req:"GATE or NET + M.Tech DS + PhD ongoing"},
              ].map((job,i)=>(
                <div key={i} style={{...S.C(),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5,marginBottom:5}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.text}}>{job.org}</div>
                    <span style={S.chip(job.score>=75?P.a4:P.muted)}>{job.score}/100</span>
                  </div>
                  <div style={{fontSize:11,color:P.a4,fontWeight:600,marginBottom:5}}>Status: {job.status}</div>
                  <div style={{fontSize:11,color:P.muted,marginBottom:5}}>Requirement: {job.req}</div>
                  <div style={{fontSize:11,color:P.muted,lineHeight:1.5}}>{job.note}</div>
                </div>
              ))}
              <div style={{...S.ib(P.a5)}}>
                <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:5}}>⚠️ CRITICAL — UGC NET CS December 2026</div>
                {["UGC NET CS is the gateway to government academic positions in India","Qualifying NET = eligible for Asst Professor + JRF fellowship","SC cutoff approximately 56% — aim 65%+ for safe margin","Registration opens September 2026 — set phone reminder NOW","Your UGC NET prep (DBMS, OS, DSA, Networks, TOC) is already underway ✅","Passing NET + completing PhD = strongest possible academic profile in India"].map((p,i,arr)=>(
                  <div key={i} style={{...S.li(i===arr.length-1),fontSize:11}}><span style={{color:P.a5}}>›</span><span>{p}</span></div>
                ))}
              </div>
            </div>}

            {/* APPLICATION TRACKER */}
            {radarTab==="tracker"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>📋 Application Status Tracker — All Government Opportunities</div>
                <div style={{fontSize:11,color:P.muted}}>Update status for each opportunity. Data saved automatically.</div>
              </div>
              {[
                {id:"isro-sc-2026",org:"ISRO Scientist/Engineer SC",deadline:"Aug 17, 2026",priority:"🔥 MUST APPLY"},
                {id:"tnpsc-cts-ni-2026",org:"TNPSC CTS Non-Interview (Computer Programmer)",deadline:"Exam Aug 16–Sep 9",priority:"🟢 HIGH"},
                {id:"tnpsc-cts-int-2026",org:"TNPSC CTS Interview Posts",deadline:"Notif Aug 31, Exam Nov 14",priority:"🟢 HIGH"},
                {id:"nic-sci-b-2026",org:"NIC Scientist B (DS&AI discipline)",deadline:"Closed Apr 24, watch revised list",priority:"🟢 HIGH"},
                {id:"cdac-jit-next",org:"C-DAC JIT Sep-Oct 2026 (Senior PE — AI/ML)",deadline:"Expected Sep-Oct 2026",priority:"🟢 HIGH"},
                {id:"drdo-sci-b-next",org:"DRDO Scientist B via GATE (next cycle)",deadline:"Expected Sep-Oct 2026",priority:"🟢 HIGH"},
                {id:"drdo-sci-c-next",org:"DRDO Scientist C Lateral (next advt)",deadline:"Watch rac.gov.in",priority:"🟡 GOOD"},
                {id:"nielit-next",org:"NIELIT Scientist B (next cycle)",deadline:"Expected late 2026",priority:"🟡 GOOD"},
                {id:"ugc-net-dec-2026",org:"UGC NET CS December 2026",deadline:"Dec 2026 (Reg: Sep 2026)",priority:"🟢 HIGH — Academic gateway"},
                {id:"csir-project",org:"CSIR Project Scientist / RA (various labs)",deadline:"Rolling",priority:"🟡 GOOD"},
              ].map(job=>(
                <div key={job.id} style={{display:"flex",gap:8,padding:"8px 0",borderBottom:`1px solid ${P.border}20`,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontSize:11,fontWeight:700,color:P.text}}>{job.org}</div>
                    <div style={{fontSize:10,color:P.muted}}>Deadline: {job.deadline}</div>
                    <div style={{fontSize:10,color:P.a1}}>{job.priority}</div>
                  </div>
                  <select value={appStatus[job.id]||"🔴 Not Researched"} onChange={e=>saveAppStatus(job.id,e.target.value)} style={{...S.sel,width:"auto",minWidth:160,padding:"5px 8px",fontSize:10}}>
                    {["🔴 Not Researched","🔵 Upcoming","🟢 Applications Open","🟡 Applied","🟣 Exam Scheduled","🟠 Interview Scheduled","🔷 Result Pending","🟢 Selected","⚫ Not Selected","⚪ Closed"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>}

            {/* ELIGIBILITY ADVISOR */}
            {radarTab==="ask"&&<div>
              <div style={S.h2}>💬 Government Career Eligibility Advisor</div>
              <div style={{...S.ib(P.a5),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>Ask anything about your government job eligibility</div>
                <div style={{fontSize:11,color:P.muted}}>AI knows your profile: B.E ECE + M.Tech DS + PhD CS/GenAI (SNU) + 4.5yr TCS DE + SC category. Will be honest about GATE requirements and eligibility gaps.</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {["Am I eligible for NIC Scientist B Data Science & AI discipline?",
                  "What GATE paper do I need for DRDO Scientist B in Computer Science?",
                  "Is my 4.5 years TCS experience counted for DRDO Scientist C lateral recruitment?",
                  "Can I continue my SNU PhD if I join ISRO as Scientist?",
                  "What is the age limit for DRDO Scientist B with SC category relaxation?",
                  "Am I eligible for C-DAC Senior Project Engineer with 4.5 years experience?",
                  "What is the selection process for NIC Scientist B 2026?",
                  "How does SC reservation work for Scientist posts in central government?",
                  "Can I apply for TNPSC CTS Computer Programmer with B.E ECE?",
                  "What should I prepare for DRDO Scientist B interview?",
                ].map(q=>(
                  <button key={q} onClick={()=>setRadarAiQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>
                ))}
              </div>
              <textarea style={{...S.ta,minHeight:70,marginBottom:10}} placeholder="Ask about eligibility, GATE requirements, age limits, SC reservation, posting compatibility with PhD..." value={radarAiQ} onChange={e=>setRadarAiQ(e.target.value)}/>
              <button style={{...S.btn(radarAiLoad?P.muted:P.a5),opacity:radarAiLoad?0.7:1,width:"100%",marginBottom:14}} onClick={askRadarAI} disabled={radarAiLoad}>
                {radarAiLoad?"⏳ Checking eligibility...":"💬 Check Eligibility"}
              </button>
              {radarAiA&&<div style={{...S.CA(P.a5)}}><div style={{fontSize:11,color:P.a5,fontWeight:700,marginBottom:8}}>Eligibility Advisor says:</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{radarAiA}</div></div>}
            </div>}
          </div>}



                    {tab==="jobs"&&<div>
            <div style={S.h2}>💡 Job Opportunities — Live August 2026</div>
            <div style={{...S.ib(P.a5),marginBottom:14}}>
              <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>🚨 ISRO Scientist SC — Apply by August 17, 2026 (3 days left!)</div>
              <div style={{fontSize:12,color:P.muted}}>92 vacancies across CS, Electronics, and other disciplines. SC category — application fee WAIVED. Salary ₹56,100/month. isro.gov.in</div>
            </div>

            {/* Sub tabs */}
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[["govt","🏛️ Govt/Central"],["private","💼 Private Tech"],["finder","🤖 AI Job Finder"]].map(([id,lb])=>(
                <button key={id} style={S.pill(jobsTab===id,P.a4)} onClick={()=>setJobsTab(id)}>{lb}</button>
              ))}
            </div>

            {/* GOVT TAB */}
            {jobsTab==="govt"&&<div>
              <div style={{...S.ib(P.a2),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>✅ SC category advantage: 5-year age relaxation + fee waiver + reservation quota</div>
                <div style={{fontSize:12,color:P.muted}}>Your profile (B.E ECE + M.Tech DS + 4.3yr TCS + PhD ongoing) is highly competitive for Group A central govt tech roles.</div>
              </div>

              {[
                {
                  org:"🚀 ISRO Scientist/Engineer SC",
                  status:"🚨 APPLY NOW — Deadline August 17, 2026",
                  statusColor:P.a5,
                  urgent:true,
                  details:[
                    "92 vacancies — Computer Science stream available",
                    "Qualification: B.E/B.Tech with 65%+ marks + Valid GATE score (GATE CS)",
                    "Age: Max 28 years (SC relaxation +5 years = 33 years for you ✅)",
                    "Salary: ₹56,100/month (Pay Level 10, 7th CPC) + DA + HRA + medical",
                    "Selection: GATE score shortlisting (1:7 ratio) + Technical Interview",
                    "SC candidates: Application fee WAIVED (₹250 fee exempt)",
                    "Fee payment deadline: August 19, 2026 (even if main deadline is Aug 17)",
                  ],
                  action:"Apply NOW at isro.gov.in → Careers → ICRB Scientist SC 2026",
                  link:"isro.gov.in",
                  match:"⚠️ GATE CS score needed — check if your score qualifies. Strong match on education and SC quota.",
                  color:P.a5,
                },
                {
                  org:"💻 NIC Scientist B",
                  status:"Closed (April 24, 2026) — Watch for next cycle",
                  statusColor:P.muted,
                  details:[
                    "243 vacancies in Computer Science & IT (168 posts) and Data Science & AI (50 posts)",
                    "Qualification: B.E/B.Tech or M.Tech in CS/IT/ECE + Valid GATE score",
                    "Salary: ₹56,100–₹1,77,500 (Pay Level 10) — Group A Gazetted officer",
                    "Selection: GATE score + Personal Interview (no separate written exam)",
                    "Data Science & AI discipline directly matches your M.Tech + PhD profile",
                    "50 DS&AI vacancies — least competition among the 3 disciplines",
                  ],
                  action:"Last date was April 24, 2026. Watch nic.in for next notification expected late 2026.",
                  link:"nic.gov.in",
                  match:"🎯 Perfect match: M.Tech DS + PhD GenAI + TCS experience. High priority for next NIC cycle.",
                  color:P.a1,
                },
                {
                  org:"🖥️ C-DAC Project Engineer / Senior Project Engineer",
                  status:"JIT June 2026 cycle closed — Next cycle expected Sep–Oct 2026",
                  statusColor:P.a3,
                  details:[
                    "951 vacancies in JIT June 2026 cycle across 11 C-DAC centres",
                    "Roles: AI/ML, Full Stack, Cybersecurity, Software Development",
                    "Senior Project Engineer (4+ yrs exp): ₹8.49–14 LPA CTC",
                    "Your profile: 4.3yr TCS + ETL/SQL/Python = Senior Project Engineer eligible",
                    "C-DAC Chennai centre available — stays in Chennai ✅",
                    "No application fee for any category",
                    "Contractual (3 years, project-based) — good for PhD compatibility",
                  ],
                  action:"Next JIT cycle expected Sep–Oct 2026. Set alert at careers.cdac.in",
                  link:"careers.cdac.in",
                  match:"🎯 Strong match: 4.3yr experience qualifies for Senior PE. AI/ML + Data Science domains match perfectly.",
                  color:P.a4,
                },
                {
                  org:"🛡️ DRDO CEPTAM",
                  status:"CEPTAM 11 Tier 2 result expected — CEPTAM 12 watch for 2026-27",
                  statusColor:P.muted,
                  details:[
                    "CEPTAM 11: 764 vacancies (STA-B + Technician A) — Tier 2 exam was June 15, 2026",
                    "STA-B Computer Science: Diploma or B.Sc in CS/IT eligible",
                    "CEPTAM 12 expected: 1,000–3,000+ vacancies typical",
                    "Age: 18–28 years (SC relaxation +5 years = 33 years ✅)",
                    "Salary: ₹35,400–₹1,12,400 (Pay Level 6, 7th CPC)",
                    "Selection: Tier I CBT (general aptitude) + Tier II (subject specific)",
                    "Syllabus overlaps with UGC NET CS — prep is shared ✅",
                  ],
                  action:"Monitor ceptam.drdo.gov.in for CEPTAM 12 notification. Expected late 2026 / early 2027.",
                  link:"drdo.gov.in",
                  match:"✅ Good match: B.E ECE + M.Tech DS. UGC NET prep directly useful for CEPTAM Tier II.",
                  color:P.a3,
                },
                {
                  org:"🏛️ TNPSC Group 1/2 Technical Posts",
                  status:"Check tnpsc.gov.in for current notifications",
                  statusColor:P.a2,
                  details:[
                    "Technical cadre posts: Assistant Engineer, Junior Scientific Officer, etc.",
                    "Tamil Nadu state quota — SC reservation applies",
                    "Combined Engineering Services Exam (CESE) for tech posts",
                    "Age: generally up to 30-32 years for tech posts (check each notification)",
                    "Salary: ₹36,400–₹1,15,700 state government pay scale",
                    "Based in Tamil Nadu — no relocation needed ✅",
                  ],
                  action:"Register at tnpscexams.in. Set up job alerts for Computer Science and IT technical posts.",
                  link:"tnpsc.gov.in",
                  match:"✅ Tamil Nadu domicile advantage. SC state quota. Stays in Chennai/TN.",
                  color:P.a2,
                },
                {
                  org:"🏢 BEL / HAL / ECIL — PSU Engineer",
                  status:"Annual recruitment cycle — typically Q2-Q3 each year",
                  statusColor:P.muted,
                  details:[
                    "BEL (Bharat Electronics Limited): Engineer roles in CS/IT/Electronics",
                    "HAL (Hindustan Aeronautics): IT System Admin and software roles",
                    "ECIL (Electronics Corporation): CS/IT project roles",
                    "Recruitment typically via GATE score (for direct entry) or own exam",
                    "Salary: ₹40,000–₹1,40,000 (IDA pay scale, PSU)",
                    "Permanent government job with pension benefits",
                    "SC reservation applies across all PSUs",
                  ],
                  action:"Watch bel-india.in, hal-india.in, ecil.co.in for annual notifications. GATE CS score helps.",
                  link:"bel-india.in",
                  match:"✅ B.E ECE background helps for HAL/BEL. M.Tech DS + TCS experience = competitive profile.",
                  color:P.a2,
                },
              ].map((job,i)=>(
                <div key={i} style={{...S.CA(job.color),marginBottom:12,...(job.urgent?{boxShadow:`0 0 20px ${job.color}33`}:{})}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    <div style={{fontSize:15,fontWeight:800,color:job.urgent?job.color:P.text}}>{job.org}</div>
                    <span style={{...S.chip(job.statusColor),fontSize:10,maxWidth:220,textAlign:"right"}}>{job.status}</span>
                  </div>
                  {job.details.map((d,j,arr)=>(
                    <div key={j} style={{...S.li(j===arr.length-1),fontSize:12}}>
                      <span style={{color:job.color,fontWeight:700,flexShrink:0}}>›</span><span>{d}</span>
                    </div>
                  ))}
                  <div style={{...S.ib(P.a2),marginTop:10,marginBottom:8}}>
                    <div style={{fontSize:11,color:P.a2,fontWeight:700,marginBottom:2}}>🎯 Profile Match</div>
                    <div style={{fontSize:12,color:P.sub}}>{job.match}</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                    <div style={{fontSize:12,color:job.color,fontWeight:600}}>→ {job.action}</div>
                    <a href={`https://www.${job.link}`} target="_blank" rel="noreferrer" style={{...S.chip(job.color),textDecoration:"none",cursor:"pointer"}}>🔗 {job.link}</a>
                  </div>
                </div>
              ))}
            </div>}

            {/* PRIVATE TECH TAB */}
            {jobsTab==="private"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>Target: 40–60% salary hike from TCS current CTC</div>
                <div style={{fontSize:12,color:P.muted}}>Apply Tier 1 roles immediately (zero reskilling). Move to Tier 2 after Databricks cert in Sep 2026. Target AI-DE after first RAG project.</div>
              </div>
              {[
                {tier:"Tier 1 — Apply This Week (Zero Reskilling Needed)",color:P.a5,roles:[
                  {company:"Cognizant / Capgemini / DXC Technology",role:"Senior ETL Developer / DataStage Specialist",salary:"₹10–18 LPA",skills:"DataStage + Teradata + SQL — you already have this",apply:"Naukri.com search: 'DataStage Senior' Chennai/Bangalore"},
                  {company:"IBM India / Mphasis / HCL Technologies",role:"Senior DataStage Developer / Data Integration Lead",salary:"₹12–22 LPA",skills:"IBM DataStage + Unix Shell + ServiceNow — direct match",apply:"LinkedIn Easy Apply + Naukri.com"},
                  {company:"Infosys BPM / Wipro",role:"Senior SQL Developer / DB Lead",salary:"₹10–16 LPA",skills:"Teradata SQL + stored procedures + ETL — your strongest skill",apply:"Infosys careers portal + Wipro NextHire"},
                ]},
                {tier:"Tier 2 — After Databricks Cert (Sep 2026)",color:P.a3,roles:[
                  {company:"Zoho / Freshworks",role:"Data Engineer / Senior Data Engineer",salary:"₹15–28 LPA",skills:"Python + SQL + Databricks cert — apply in Oct 2026",apply:"careers.zoho.com / freshworks.com/careers"},
                  {company:"Razorpay / Flipkart / Meesho",role:"Data Engineer — Analytics Platform",salary:"₹18–35 LPA",skills:"PySpark + Databricks + SQL + Python — strong after cert",apply:"LinkedIn + company careers page"},
                  {company:"Amazon India / PayPay / Urban Company",role:"Data Engineer II / Senior DE",salary:"₹20–40 LPA",skills:"SQL + cloud + Python — match after your upskilling",apply:"Amazon.jobs + LinkedIn Easy Apply"},
                ]},
                {tier:"Tier 3 — AI-DE Roles (After RAG Project + GCP cert, Nov 2026)",color:P.a4,roles:[
                  {company:"Sarvam AI / Krutrim / AI startups",role:"AI Data Engineer / GenAI Engineer",salary:"₹25–50 LPA",skills:"LangChain + RAG + Python + GCP — after 1 deployed project",apply:"LinkedIn + angel.co + startup direct email"},
                  {company:"Google India / Microsoft India",role:"Senior Data Engineer / AI Platform Engineer",salary:"₹30–60 LPA",skills:"GCP DE cert + GenAI + strong SQL + PhD research — strong profile",apply:"careers.google.com + careers.microsoft.com"},
                  {company:"CRED / PhonePe / Swiggy",role:"AI Data Engineer / Analytics Engineer",salary:"₹22–45 LPA",skills:"dbt + Python + GenAI — high demand in fintech/consumer tech",apply:"LinkedIn + referral through network"},
                ]},
              ].map((tier,ti)=>(
                <div key={ti} style={{...S.CA(tier.color),marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:800,color:tier.color,marginBottom:12}}>{tier.tier}</div>
                  {tier.roles.map((r,ri,rarr)=>(
                    <div key={ri} style={{background:`${P.bg}88`,borderRadius:9,padding:"10px 12px",marginBottom:ri===rarr.length-1?0:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:4,marginBottom:4}}>
                        <div style={{fontSize:13,fontWeight:700,color:P.text}}>{r.company}</div>
                        <span style={S.chip(P.a2)}>{r.salary}</span>
                      </div>
                      <div style={{fontSize:12,color:tier.color,fontWeight:600,marginBottom:3}}>{r.role}</div>
                      <div style={{fontSize:11,color:P.muted,marginBottom:4}}>{r.skills}</div>
                      <div style={{fontSize:11,color:P.a1}}>→ {r.apply}</div>
                    </div>
                  ))}
                </div>
              ))}

              <div style={{...S.ib(P.a3)}}>
                <div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:6}}>💡 Application strategy this week</div>
                <div style={{fontSize:12,color:P.muted,lineHeight:1.6}}>Apply to 3 Tier 1 roles today using your existing resume — zero preparation needed. These give immediate 40-60% hike. While TCS counter-offer may come, having an offer in hand is leverage. Don't wait for Databricks cert before applying Tier 1 — that's leaving money on the table.</div>
              </div>
            </div>}

            {/* AI JOB FINDER TAB */}
            {jobsTab==="finder"&&<div>
              <div style={S.h2}>🤖 AI Job Advisor</div>
              <div style={{...S.ib(P.a4),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>Ask anything about jobs matching your profile</div>
                <div style={{fontSize:12,color:P.muted}}>The AI knows your full TCS profile, SC category, PhD, certs, salary targets, and August 2026 context.</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {[
                  "ISRO Scientist SC deadline is Aug 17 — should I apply today? What do I need?",
                  "How do I negotiate a 50% hike when switching from TCS?",
                  "Which is better right now — ISRO Scientist or NIC Scientist B for my profile?",
                  "What is the exact GATE CS score I need for ISRO shortlisting?",
                  "Should I apply to private companies now or wait for Databricks cert in Sep?",
                  "What walking professor salary can I expect with my profile at SSN/VIT?",
                  "How do I write a cold LinkedIn message to a Zoho DE recruiter?",
                  "C-DAC Chennai next JIT cycle — am I eligible for Senior Project Engineer?",
                ].map(q=>(
                  <button key={q} onClick={()=>setJobAiQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>
                ))}
              </div>
              <textarea style={{...S.ta,minHeight:70,marginBottom:10}} placeholder="Ask about any specific job, application strategy, salary negotiation, eligibility check..." value={jobAiQ} onChange={e=>setJobAiQ(e.target.value)}/>
              <button style={{...S.btn(jobAiLoad?P.muted:P.a4),opacity:jobAiLoad?0.7:1,width:"100%",marginBottom:14}} onClick={askJobAI} disabled={jobAiLoad}>
                {jobAiLoad?"⏳ Researching...":"🤖 Get Job Advice"}
              </button>
              {jobAiA&&<div style={{...S.CA(P.a4)}}><div style={{fontSize:11,color:P.a4,fontWeight:700,marginBottom:8}}>Job Advisor says:</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{jobAiA}</div></div>}
            </div>}
          </div>}

                    {tab==="monthly"&&<div>
            <div style={S.h2}>📅 Jul–Dec 2026 Monthly Plan</div>
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
              {monthPlan.map((m,i)=><button key={i} style={S.mB(monthIdx===i,m.color)} onClick={()=>setMonth(i)}>{m.month.slice(0,3)}</button>)}
            </div>
            <div style={{...S.ib(cur.color),fontSize:13,color:cur.color,fontWeight:700,marginBottom:14}}>🎯 {cur.month} — {cur.theme}</div>
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
              {pillars.map(p=><button key={p.id} style={S.pill(pillar===p.id,p.color)} onClick={()=>setPillar(p.id)}>{p.emoji} {p.label}</button>)}
            </div>
            <div style={S.C()}>
              <div style={S.L}>{pillars.find(p=>p.id===pillar)?.emoji} {pillars.find(p=>p.id===pillar)?.label}</div>
              {(cur.items[pillar]||[]).map((item,i,arr)=>(
                <div key={i} style={S.li(i===arr.length-1)}><span style={{color:pillars.find(p=>p.id===pillar)?.color,flexShrink:0,fontWeight:700}}>›</span><span>{item}</span></div>
              ))}
            </div>
            <div style={S.C()}>
              <div style={{fontSize:14,fontWeight:700,color:P.text,marginBottom:10}}>⏰ Weekly Routine (every week)</div>
              <div style={{...S.ib(P.a1),marginBottom:12}}><div style={{fontSize:12,color:P.a1,fontWeight:600}}>⚡ 2 hrs evenings × 5 days + weekend sessions = 60+ hrs/month of compounding progress</div></div>
              {weeklyTemplate.map((w,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:i===6?"none":`1px solid ${P.border}20`}}>
                  <span style={{minWidth:32,fontSize:12,fontWeight:800,color:w.type==="weekend"?P.a3:P.a1,paddingTop:3}}>{w.day}</span>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                    {w.blocks.map((b,j)=>(<div key={j} style={{background:`${b.color}12`,border:`1px solid ${b.color}28`,borderRadius:8,padding:"5px 10px",fontSize:12,color:b.color}}><span style={{color:P.muted,marginRight:8,fontSize:11}}>{b.time}</span>{b.task}</div>))}
                  </div>
                </div>
              ))}
            </div>
          </div>}

          {/* CAREER */}
          {tab==="career"&&<div>
            <div style={S.h2}>💼 Career Roles – 2026 Deep Analysis</div>
            <div style={{...S.ib(P.a1),marginBottom:14}}>
              <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>Your profile: 4.3yr TCS DE · SQL/DataStage/Teradata expert · M.Tech DS · PhD SSN GenAI started · SC category</div>
              <div style={{fontSize:12,color:P.muted}}>6 viable career paths. AI-DE has highest ROI. Senior ETL available immediately.</div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
              {careerRoles.map((r,i)=><button key={i} style={S.pill(careerIdx===i,r.color)} onClick={()=>setCareer(i)}>{i+1}. {r.role.split(" ").slice(0,3).join(" ")}</button>)}
            </div>
            {(()=>{const r=careerRoles[careerIdx]; return (
              <div style={{...S.CA(r.color)}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:8}}><div style={{fontSize:15,fontWeight:800,color:r.color}}>{r.role}</div><span style={S.chip(r.color)}>{r.timeline}</span></div>
                <div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:10}}>{r.level}</div>
                <div style={{fontSize:12,color:P.muted,background:`${P.bg}88`,borderRadius:8,padding:"8px 12px",marginBottom:14,lineHeight:1.6}}>{r.why}</div>
                <div style={{fontSize:13,fontWeight:700,color:P.text,marginBottom:4}}>💰 Salary Range (India 2026)</div>
                <div style={{fontSize:16,color:r.color,fontWeight:800,marginBottom:14}}>{r.salary}</div>
                <div style={S.L}>Skills to build</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{r.skills.map((s,j)=><span key={j} style={{background:`${P.bg}88`,border:`1px solid ${P.border}`,borderRadius:6,padding:"4px 10px",fontSize:12,color:P.sub}}>{s}</span>)}</div>
                <div style={S.L}>Target companies</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{r.companies.map((c,j)=><span key={j} style={S.chip(r.color)}>{c}</span>)}</div>
              </div>
            );})()}
          </div>}

          {/* SKILLS */}
          {tab==="skills"&&<div>
            <div style={S.h2}>🧠 Learn From Basics – Full Roadmap</div>
            <div style={{...S.ib(P.a2),marginBottom:14}}><div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>Mostly FREE. Learn in this order: Python → SQL → GenAI → Cloud</div><div style={{fontSize:12,color:P.muted}}>All 4 tracks run parallel across your weekly schedule. Python and SQL are immediate focus from July.</div></div>
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
              {skillRoadmap.map((t,i)=><button key={i} style={S.pill(skillIdx===i,t.color)} onClick={()=>setSkill(i)}>{t.icon} {t.name.split("–")[0].trim()}</button>)}
            </div>
            {(()=>{const t=skillRoadmap[skillIdx]; return (
              <div>
                <div style={{...S.CA(t.color),marginBottom:14}}><div style={{fontSize:15,fontWeight:800,color:t.color,marginBottom:4}}>{t.icon} {t.name}</div><div style={{fontSize:12,color:P.a3,fontWeight:600}}>{t.priority}</div></div>
                {t.phases.map((ph,i)=>(<div key={i} style={{...S.C(),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6,marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:t.color}}>{ph.phase}</div>
                    <span style={S.chip(ph.free?P.a2:P.a3)}>{ph.free?"🆓 Free":"💰 Paid cheap"}</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{ph.topics.map((tp,j)=><span key={j} style={{background:`${P.bg}88`,border:`1px solid ${P.border}`,borderRadius:6,padding:"3px 9px",fontSize:12,color:P.sub}}>{tp}</span>)}</div>
                  <div style={{...S.ib(t.color),marginBottom:0}}><div style={{fontSize:11,color:t.color,fontWeight:700,marginBottom:2}}>📚 Resource</div><div style={{fontSize:12,color:P.muted,lineHeight:1.5}}>{ph.resource}</div></div>
                </div>))}
                <div style={{...S.CA(t.color)}}><div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:10}}>🏗️ Portfolio Projects</div>{t.projects.map((p,i,arr)=>(<div key={i} style={S.li(i===arr.length-1)}><span style={{color:t.color,fontWeight:800,flexShrink:0}}>P{i+1}</span><span>{p}</span></div>))}</div>
              </div>
            );})()}
          </div>}

          {/* UGC NET */}
          {tab==="ugc"&&<div>
            <div style={S.h2}>📋 UGC NET CS — December 2026</div>
            <div style={{...S.ib(P.a2),marginBottom:14}}>
              <div style={{fontSize:13,color:P.a2,fontWeight:800,marginBottom:4}}>🎯 Exam: December 2026 · SC cutoff ~56% = ~84/150 · Your target: 100+/150</div>
              <div style={{fontSize:12,color:P.muted}}>Registration: September–October 2026 window · Watch ugcnet.nta.ac.in · Set calendar reminder NOW</div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[["schedule","📅 Schedule"],["p2","📚 Paper 2"],["p1","📝 Paper 1"],["res","🔗 Resources"]].map(([id,lb])=><button key={id} style={S.pill(ugcView===id,P.a2)} onClick={()=>setUgcView(id)}>{lb}</button>)}
            </div>
            {ugcView==="schedule"&&<div>
              {ugcSchedule.map((s,i)=>(<div key={i} style={{...S.CA(P.a2),marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:6}}><div style={{fontSize:14,fontWeight:700,color:P.text}}>{s.month}</div><span style={S.chip(P.a2)}>{s.focus}</span></div>
                <div style={{fontSize:12,color:P.muted,marginBottom:4}}>{s.daily}</div>
                <div style={{fontSize:11,color:P.a2}}>📚 {s.resource}</div>
              </div>))}
              <div style={{...S.ib(P.a4)}}><div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:4}}>⚡ The daily habit that wins UGC NET</div><div style={{fontSize:12,color:P.muted,lineHeight:1.6}}>8:00–9:00 PM every night without exception. 20 MCQs = 20 minutes. Review wrong answers = 20 minutes. Note weak topic = 10 minutes. 6 months × 30 days × 20 MCQs = 3,600 problems solved. That is how SC candidates clear it.</div></div>
              <div style={{...S.ib(P.a5),marginTop:10}}><div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:4}}>⚠️ Registration Alert</div><div style={{fontSize:12,color:P.muted}}>UGC NET Dec 2026 registration window typically opens September–October. Missing it means waiting until June 2027. Set a phone reminder for September 1st to check ugcnet.nta.ac.in daily.</div></div>
            </div>}
            {ugcView==="p2"&&ugcPaper2.map((u,i)=>(<div key={i} style={{...S.CA(P.a2),marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:8}}><div style={{fontSize:14,fontWeight:700,color:P.text}}>{u.unit}</div><span style={S.chip(P.a2)}>{u.weight}</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{u.topics.map((tp,j)=><span key={j} style={{background:`${P.bg}88`,border:`1px solid ${P.border}`,borderRadius:6,padding:"3px 9px",fontSize:12,color:P.sub}}>{tp}</span>)}</div>
            </div>))}
            {ugcView==="p1"&&<div>
              <div style={{...S.ib(P.a3),marginBottom:14}}><div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:3}}>Paper 1: 50 marks · 50 questions · General Teaching & Research Aptitude</div><div style={{fontSize:12,color:P.muted}}>Do not neglect Paper 1. Aim 35+/50. SC cutoff for Paper 1 alone can disqualify you.</div></div>
              {ugcPaper1.map((u,i)=>(<div key={i} style={{...S.C(),marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:6}}><div style={{fontSize:13,fontWeight:700,color:P.text}}>{u.unit}</div><span style={S.chip(P.a3)}>{u.weight}</span></div><div style={{fontSize:12,color:P.muted,lineHeight:1.5}}>{u.tips}</div></div>))}
            </div>}
            {ugcView==="res"&&[
              {name:"GeeksForGeeks Practice",url:"practice.geeksforgeeks.org",type:"Topic-wise MCQs + solutions",free:true},
              {name:"GATE Overflow",url:"gateoverflow.in",type:"Questions + community discussion",free:true},
              {name:"Abdul Bari Algorithms",url:"YouTube",type:"Best DSA video lectures on YouTube",free:true},
              {name:"Ravindrababu Ravula",url:"YouTube",type:"GATE/NET CN, DBMS, OS lectures",free:true},
              {name:"Neso Academy",url:"YouTube",type:"Digital Electronics, TOC, Networks",free:true},
              {name:"Testbook UGC NET CS",url:"testbook.com",type:"Full mock tests with analytics",free:false},
              {name:"Adda247 UGC NET",url:"adda247.com",type:"Previous year papers Dec 2022 – Jun 2026",free:false},
              {name:"NTA Official",url:"ugcnet.nta.ac.in",type:"Registration + syllabus + sample papers",free:true},
            ].map((r,i)=>(<div key={i} style={{...S.C(),marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:4}}><div style={{fontSize:13,fontWeight:700,color:P.text}}>{r.name}</div><span style={S.chip(r.free?P.a2:P.a3)}>{r.free?"🆓 Free":"💰 Paid"}</span></div><div style={{fontSize:12,color:P.muted}}>{r.type}</div><div style={{fontSize:11,color:P.a1,marginTop:3}}>{r.url}</div></div>))}
          </div>}

          {/* OFFICE */}
          {tab==="learn"&&<div>
            <div style={S.h2}>🎓 Learn & Practice Hub</div>
            <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",flexWrap:"wrap"}}>
              {[["dashboard","📊 Dashboard"],["ugc","📋 UGC NET"],["python","🐍 Python"],["sql","🗄️ SQL"],["genai","🤖 GenAI"],["flashcards","🃏 Flashcards"],["switch","💼 Job Switch"]].map(([id,lb])=>(
                <button key={id} style={S.pill(learnTab===id,P.a2)} onClick={()=>setLearnTab(id)}>{lb}</button>
              ))}
            </div>

            {learnTab==="dashboard"&&<div>
              <div style={{...S.ib(P.a2),marginBottom:14}}>
                <div style={{fontSize:13,color:P.a2,fontWeight:700,marginBottom:3}}>Your Learning Dashboard — July to December 2026</div>
                <div style={{fontSize:12,color:P.muted}}>Tap any topic chip to mark done. Progress saves automatically. Green = done.</div>
              </div>
              {[
                {track:"ugc-dbms",label:"UGC NET — DBMS",color:P.a2,items:["ER model & EER","Normalisation 1NF-BCNF","SQL JOINs subqueries triggers","Transactions ACID 2PL","Indexing B+ tree hashing","Concurrency control","Query optimisation","Relational algebra"]},
                {track:"ugc-os",label:"UGC NET — OS",color:P.a2,items:["Process scheduling FCFS SJF RR","Deadlock Banker algorithm","Paging segmentation","Virtual memory TLB","File systems disk scheduling","Semaphores mutex","IPC mechanisms"]},
                {track:"ugc-dsa",label:"UGC NET — DSA",color:P.a2,items:["Trees BST AVL B-tree Heap","Graphs BFS DFS Dijkstra","Sorting complexity all","Dynamic Programming","Greedy algorithms","Hashing techniques","P vs NP complexity"]},
                {track:"ugc-cn",label:"UGC NET — Networks",color:P.a2,items:["OSI 7 layers protocols","TCP handshake flow control","IP subnetting CIDR VLSM","DNS HTTP SMTP DHCP","Routing RIP OSPF BGP","Network security basics"]},
                {track:"ugc-toc",label:"UGC NET — TOC",color:P.a3,items:["DFA NFA epsilon-NFA","Regular expressions grammars","CFG PDA CFL","Turing Machines","Decidability halting problem"]},
                {track:"ugc-prog",label:"UGC NET — Programming",color:P.a3,items:["C pointers memory arrays","OOP inheritance polymorphism","Java exceptions generics","Python iterators generators","Software testing types","SDLC models Agile Scrum"]},
                {track:"python",label:"Python Learning",color:P.a1,items:["Variables loops functions","Lists dicts tuples sets","File IO CSV JSON Excel","Pandas read filter groupby merge","NumPy arrays operations","Error handling try except","REST APIs with requests","PySpark basics Databricks"]},
                {track:"sql",label:"SQL Mastery",color:P.a2,items:["Advanced JOINs subqueries","CTEs WITH clause","Window functions RANK LEAD LAG","Recursive CTEs","Query execution plans","dbt models and tests","BigQuery partitioning clustering"]},
                {track:"genai",label:"GenAI & LangChain",color:P.a4,items:["LLM fundamentals tokens","Prompt engineering techniques","LangChain chains memory","RAG pipeline architecture","ChromaDB FAISS vector stores","FastAPI for LLM apps","LangChain Agents and tools"]},
              ].map(track=>{
                const done=Object.keys(learnProgress[track.track]||{}).length;
                const pct=Math.round((done/track.items.length)*100);
                return (
                  <div key={track.track} style={{...S.C(),marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:13,fontWeight:700,color:track.color}}>{track.label}</div>
                      <span style={S.chip(pct===100?P.a2:track.color)}>{done}/{track.items.length} · {pct}%</span>
                    </div>
                    <div style={{background:`${P.bg}88`,borderRadius:6,height:6,marginBottom:10,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${track.color},${track.color}aa)`,borderRadius:6}}/>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {track.items.map((item,i)=>{
                        const isDone=!!(learnProgress[track.track]||{})[i];
                        return (
                          <div key={i} onClick={()=>isDone?unmarkDone(track.track,i):markDone(track.track,i)}
                            style={{fontSize:11,padding:"3px 9px",borderRadius:6,cursor:"pointer",
                              background:isDone?`${P.a2}20`:`${P.bg}88`,
                              border:`1px solid ${isDone?P.a2:P.border}`,
                              color:isDone?P.a2:P.muted,
                              textDecoration:isDone?"line-through":"none"}}>
                            {isDone?"✓ ":""}{item}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>}

            {(learnTab==="ugc"||learnTab==="python"||learnTab==="sql"||learnTab==="genai")&&<div>
              {(()=>{
                const configs={
                  ugc:{color:P.a2,label:"UGC NET CS Trainer — December 2026",desc:"AI-generated MCQs at UGC NET difficulty. Pick topic, get question, think, reveal answer.",topics:["DBMS","Operating Systems","DSA & Algorithms","Computer Networks","Theory of Computation","Programming C Java Python","Software Engineering","Paper 1 Teaching & Research Aptitude"]},
                  python:{color:P.a1,label:"Python Trainer — Data Engineering focus",desc:"Practice questions from basics to PySpark. Tailored to your DE background.",topics:["Week 1-2 Absolute Basics","Intermediate Python","Data Python Pandas NumPy","PySpark and DE Python","AI Python LangChain RAG"]},
                  sql:{color:P.a2,label:"SQL Trainer — Senior DE interview level",desc:"Advanced SQL patterns. You know Teradata SQL — this trains modern DE interview skills.",topics:["Window Functions RANK LEAD LAG","CTEs and Recursive SQL","Performance and Indexes","Data Modeling and dbt","BigQuery SQL","Senior DE Interview Problems"]},
                  genai:{color:P.a4,label:"GenAI Trainer — AI-DE interview level",desc:"LLM, LangChain, RAG, Agents. Relevant for your PhD and AI-DE job target.",topics:["LLM Fundamentals and Tokenization","Prompt Engineering","LangChain Concepts and Code","RAG Architecture","Vector Databases","LangChain Agents and Tools","MLOps and Deployment"]},
                };
                const cfg=configs[learnTab];
                const prefixMap={ugc:"ugc",python:"py",sql:"sql",genai:"ai"};
                const px=prefixMap[learnTab];
                return (
                  <div>
                    <div style={{...S.ib(cfg.color),marginBottom:14}}>
                      <div style={{fontSize:13,color:cfg.color,fontWeight:700,marginBottom:3}}>{cfg.label}</div>
                      <div style={{fontSize:12,color:P.muted}}>{cfg.desc}</div>
                    </div>
                    <div style={S.C()}>
                      <div style={S.L}>Select Topic</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                        {cfg.topics.map(t=>(
                          <button key={t} style={S.pill(quizTopic===px+t,cfg.color)} onClick={()=>{setQuizTopic(px+t);setQuizQ(null);setQuizAns("");setQuizFeedback(null);}}>{t}</button>
                        ))}
                      </div>
                      <button style={{...S.btn(quizLoad?P.muted:cfg.color),width:"100%",opacity:quizLoad?0.7:1,marginBottom:12}}
                        onClick={async()=>{
                          if(!quizTopic.startsWith(px)){alert("Please select a topic first.");return;}
                          setQuizLoad(true);setQuizQ(null);setQuizAns("");setQuizFeedback(null);
                          const topic=quizTopic.slice(px.length);
                          const contextMap={
                            ugc:"UGC NET CS exam difficulty. Candidate is a TCS Data Engineer preparing for December 2026 UGC NET.",
                            python:"Practical Python for Data Engineering. Candidate knows SQL and ETL but is new to Python. Focus on real DE use cases.",
                            sql:"Senior Data Engineer interview. Candidate is expert in Teradata SQL. Challenge them with modern patterns: window functions, dbt, BigQuery.",
                            genai:"AI Data Engineer interview 2026 India. Candidate is pursuing PhD in GenAI at SSN. Include LangChain and RAG code snippets."
                          };
                          const prompt=[
                            "Generate ONE high-quality MCQ for topic: "+topic,
                            "Context: "+contextMap[learnTab],
                            "Make it educational, practical, and at the right difficulty.",
                            "Include code snippets where relevant (use plain text, no markdown inside JSON strings).",
                            "Return ONLY valid JSON, no markdown backticks, no text outside JSON:",
                            '{"question":"<question text, use \\n for line breaks in code>","options":{"A":"<option A>","B":"<option B>","C":"<option C>","D":"<option D>"},"correct":"<A or B or C or D>","explanation":"<thorough 3-4 sentence explanation of why correct and why others wrong>","tip":"<1 practical memory tip or interview shortcut>"}'
                          ].join("\n");
                          try{
                            const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:700,messages:[{role:"user",content:prompt}]})});
                            const d=await r.json();
                            const raw=d.content?.map(b=>b.text||"").join("")||"{}";
                            const si=raw.indexOf("{");const ei=raw.lastIndexOf("}");
                            setQuizQ(JSON.parse(si>=0&&ei>=0?raw.slice(si,ei+1):"{}"));
                          }catch(_){setQuizQ({question:"Connection error. Please check internet and try again.",options:{A:"—",B:"—",C:"—",D:"—"},correct:"A",explanation:"",tip:""});}
                          setQuizLoad(false);
                        }}
                        disabled={quizLoad}>
                        {quizLoad?"⏳ Generating question...":"📝 Get New Question"}
                      </button>

                      {quizQ&&quizQ.question&&<div style={{...S.CA(cfg.color)}}>
                        <pre style={{fontSize:13,fontWeight:600,color:P.text,marginBottom:16,lineHeight:1.65,whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{quizQ.question}</pre>
                        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                          {Object.entries(quizQ.options||{}).map(([k,v])=>{
                            const isSel=quizAns===k;
                            const isOK=quizFeedback&&k===quizQ.correct;
                            const isBad=quizFeedback&&isSel&&k!==quizQ.correct;
                            return (
                              <div key={k} onClick={()=>{if(!quizFeedback)setQuizAns(k);}}
                                style={{padding:"11px 14px",borderRadius:10,cursor:quizFeedback?"default":"pointer",
                                  background:isOK?`${P.a2}25`:isBad?`${P.a5}25`:isSel?`${cfg.color}20`:`${P.bg}88`,
                                  border:`1px solid ${isOK?P.a2:isBad?P.a5:isSel?cfg.color:P.border}`,
                                  fontSize:13,color:isOK?P.a2:isBad?P.a5:P.sub,
                                  fontWeight:isOK||isSel?600:400,transition:"all 0.15s",lineHeight:1.5}}>
                                <span style={{fontWeight:800,marginRight:8}}>{k}.</span>{v}
                                {isOK&&<span style={{marginLeft:8}}>✅</span>}
                                {isBad&&<span style={{marginLeft:8}}>❌</span>}
                              </div>
                            );
                          })}
                        </div>
                        {quizAns&&!quizFeedback&&(
                          <button style={{...S.btn(P.a3),width:"100%",marginBottom:10}} onClick={()=>setQuizFeedback(true)}>
                            Submit Answer
                          </button>
                        )}
                        {quizFeedback&&<div>
                          <div style={{...S.ib(quizAns===quizQ.correct?P.a2:P.a5),marginBottom:10}}>
                            <div style={{fontSize:14,fontWeight:700,color:quizAns===quizQ.correct?P.a2:P.a5,marginBottom:8}}>
                              {quizAns===quizQ.correct?"✅ Correct! Well done.":"❌ Incorrect — Correct answer: "+quizQ.correct}
                            </div>
                            {quizQ.explanation&&<div style={{fontSize:12,color:P.sub,lineHeight:1.7,marginBottom:8}}>{quizQ.explanation}</div>}
                            {quizQ.tip&&<div style={{fontSize:12,color:P.a3,fontWeight:600}}>💡 Tip: {quizQ.tip}</div>}
                          </div>
                          <button style={{...S.btn(cfg.color),width:"100%"}}
                            onClick={()=>{setQuizQ(null);setQuizAns("");setQuizFeedback(null);}}>
                            Next Question →
                          </button>
                        </div>}
                      </div>}
                    </div>
                  </div>
                );
              })()}
            </div>}

            {learnTab==="flashcards"&&<div>
              <div style={{...S.ib(P.a3),marginBottom:14}}>
                <div style={{fontSize:13,color:P.a3,fontWeight:700,marginBottom:3}}>AI Flashcards — quick concept revision</div>
                <div style={{fontSize:12,color:P.muted}}>Tap a topic, get a card, think, then tap to flip and see the full answer.</div>
              </div>
              <div style={S.C()}>
                <div style={S.L}>Topic</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                  {["DBMS Concepts","OS Concepts","DSA Patterns","Network Protocols","Python Concepts","SQL Window Functions","LangChain and RAG","DataStage Best Practices","GCP Services","Databricks and Spark"].map(t=>(
                    <button key={t} style={S.pill(quizTopic==="fc-"+t,P.a3)} onClick={()=>setQuizTopic("fc-"+t)}>{t}</button>
                  ))}
                </div>
                <button style={{...S.btn(flashLoad?P.muted:P.a3),width:"100%",opacity:flashLoad?0.7:1,marginBottom:12}}
                  onClick={async()=>{
                    setFlashLoad(true);setFlashcard(null);setFlashFlipped(false);
                    const topic=quizTopic.replace("fc-","");
                    const prompt=[
                      "Generate ONE flashcard for topic: "+topic,
                      "Front: a key concept, term, algorithm, or question. Short — 1-2 lines max.",
                      "Back: thorough explanation with formula, example, or step-by-step — 3-5 sentences.",
                      "Target: Data Engineer or UGC NET CS exam level.",
                      "Return ONLY valid JSON, no markdown:",
                      '{"front":"<term or short question>","back":"<full explanation with example>","category":"<subcategory of topic>","difficulty":"<Easy|Medium|Hard>"}'
                    ].join("\n");
                    try{
                      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:400,messages:[{role:"user",content:prompt}]})});
                      const d=await r.json();
                      const raw=d.content?.map(b=>b.text||"").join("")||"{}";
                      const si=raw.indexOf("{");const ei=raw.lastIndexOf("}");
                      setFlashcard(JSON.parse(si>=0&&ei>=0?raw.slice(si,ei+1):"{}"));
                    }catch(_){setFlashcard({front:"Connection error",back:"Please check internet and try again.",category:"—",difficulty:"—"});}
                    setFlashLoad(false);
                  }}
                  disabled={flashLoad}>
                  {flashLoad?"⏳ Generating flashcard...":"🃏 Get Flashcard"}
                </button>
                {flashcard&&<div>
                  <div onClick={()=>setFlashFlipped(f=>!f)}
                    style={{...gl(flashFlipped?P.a2:P.a3),padding:28,textAlign:"center",cursor:"pointer",minHeight:170,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginBottom:10,transition:"all 0.2s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",width:"100%",marginBottom:14}}>
                      <span style={S.chip(P.a3)}>{flashcard.category||"—"}</span>
                      <span style={S.chip(flashcard.difficulty==="Hard"?P.a5:flashcard.difficulty==="Medium"?P.a3:P.a2)}>{flashcard.difficulty||"—"}</span>
                    </div>
                    {!flashFlipped
                      ?<div><div style={{fontSize:12,color:P.muted,marginBottom:10}}>CONCEPT — tap to reveal answer</div><div style={{fontSize:16,fontWeight:700,color:P.text,lineHeight:1.5}}>{flashcard.front}</div></div>
                      :<div><div style={{fontSize:12,color:P.a2,marginBottom:10,fontWeight:700}}>✅ ANSWER</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,textAlign:"left"}}>{flashcard.back}</div></div>
                    }
                    <div style={{fontSize:10,color:P.muted,marginTop:16}}>Tap to {flashFlipped?"hide":"show"} answer</div>
                  </div>
                  <button style={{...S.btn(P.a3),width:"100%"}} onClick={()=>{setFlashcard(null);setFlashFlipped(false);}}>Next Flashcard →</button>
                </div>}
              </div>
            </div>}

            {learnTab==="switch"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:14}}>
                <div style={{fontSize:13,color:P.a1,fontWeight:700,marginBottom:3}}>Job Switch Guide — your personalised 2026 transition roadmap</div>
                <div style={{fontSize:12,color:P.muted}}>Real advice for switching from TCS to Senior DE, AI-DE, or Analytics Engineer. No generic tips.</div>
              </div>
              {[
                {title:"📍 Where you are now (July 2026)",color:P.a1,items:[
                  "4.3 years TCS Data Engineer — solid enterprise foundation, not a fresher by any measure",
                  "Expert in SQL (Teradata), IBM DataStage ETL, Unix shell scripting, ServiceNow ITSM",
                  "PhD started at SSN in GenAI — extremely rare differentiator. Very few DE candidates have this.",
                  "Learning Python, PySpark, LangChain, GCP in parallel — you are on the right path",
                  "Databricks DEA exam in Sep–Oct 2026 — this will add immediate resume credibility",
                ]},
                {title:"🎯 The fastest path to a 40-60% salary hike",color:P.a2,items:[
                  "TODAY: Update resume for Senior ETL Developer / Senior DE roles. Apply to 5+ on Naukri this week. Zero reskilling needed for this path. Cognizant, Capgemini, DXC, HCL are actively hiring.",
                  "Month 1 (July): Apply Senior DE roles daily. Get Python basics done (Automate the Boring Stuff, free). Target: 2-3 interview calls by end of July.",
                  "Month 2 (August): Databricks course 80% done + 1 Python project built. Apply Zoho, Freshworks, Razorpay. Target: at least 1 offer received.",
                  "Month 3 (September): GIVE DATABRICKS EXAM. Build 1 RAG project. Now target AI-DE roles on top of Senior DE. Target salary: Rs 15-30 LPA.",
                  "Month 4-6 (Oct-Dec): GCP cert + UGC NET exam. At this point you have certs, PhD, projects — Senior DE at Rs 25+ LPA or AI-DE at Rs 30+ LPA is realistic.",
                ]},
                {title:"💡 Your actual skill gaps and how to close each one",color:P.a3,items:[
                  "Gap 1 — Python: You are at zero. Close it in 8 weeks: Week 1-2 = Automate the Boring Stuff (free). Week 3-4 = Kaggle Python free course. Month 2 = Pandas + build 1 real project. 1 hour/day.",
                  "Gap 2 — Cloud (GCP/AWS): GCP free tier gives Rs 22,000 free credits. Cloud Skills Boost has free hands-on labs. 2-3 weeks of daily practice closes this gap to job-ready level.",
                  "Gap 3 — Modern DE stack (Airflow, Kafka, dbt): NOT needed before switching. Get the job first. Learn on the job. Do not delay your switch waiting for these.",
                  "Gap 4 — AI/GenAI: Your PhD gives you the theory base. You just need 1 working RAG project (ChatPDF, NL-to-SQL, or ETL monitor). Build one in October using LangChain + ChromaDB.",
                  "NOT a gap — SQL, ETL, data pipelines, enterprise delivery: these are your strongest assets. More experience than 80% of DE candidates. Emphasise them loudly.",
                ]},
                {title:"🏢 Where to apply and in what order",color:P.a4,items:[
                  "Tier 1 — Apply immediately (no extra skills needed): Cognizant, Capgemini, DXC Technology, Mphasis, HCL, Infosys BPM. Roles: Senior ETL Developer, Senior DataStage Developer. Hike: 40-60%.",
                  "Tier 2 — Apply after Python basics + Databricks (Month 2): Zoho, Freshworks, TCS Digital (internal transfer), Accenture Analytics, PayPay, Meesho, Amazon India. Roles: Data Engineer, Senior DE.",
                  "Tier 3 — Apply after Databricks cert + 1 project (Month 3-4): Razorpay, Flipkart, Swiggy, Zerodha, Groww. Roles: Senior DE, Analytics Engineer. Salary: Rs 20-30 LPA.",
                  "Tier 4 — Apply after LangChain project + GCP cert (Month 4-6): Google India, Microsoft India, Sarvam AI, Krutrim, CRED, PhonePe. Roles: AI Data Engineer, GenAI Engineer. Salary: Rs 30-50 LPA.",
                  "How to apply: LinkedIn Easy Apply for speed. Naukri for Indian companies. Company career pages for better shortlist rate. Send 1-2 personalized InMails to DE team leads per week.",
                ]},
                {title:"📞 Interview answers — what to say",color:P.a5,items:[
                  "Opening pitch (30 seconds): I am a Data Engineer with 4.3 years at TCS, expert in SQL, DataStage ETL, and Teradata. I recently started my PhD in Generative AI at SSN College of Engineering while upskilling in Python, PySpark, and LangChain. I am targeting modern cloud-native DE and AI-DE roles.",
                  "Why leaving TCS: I want to work with cloud-native and AI-powered data systems that align with my PhD research in GenAI. TCS has given me excellent enterprise foundations and I want to apply them in a more modern tech stack.",
                  "On Python skills (honest answer when fresh): I started learning Python systematically 2 months ago with a focus on data engineering use cases. I have completed Pandas and NumPy and built an ETL automation script. I am actively building more projects. My SQL and DataStage background means I understand data deeply — Python is just a new tool.",
                  "Your biggest selling point to emphasise: PhD in GenAI at SSN plus 4+ years enterprise ETL experience is a rare combination. Nobody else in the room has both. Mention this in every interview.",
                  "Salary negotiation: Research current market on LinkedIn Salary Insights and Glassdoor for your target role in Chennai and Bangalore. Know your number before the call. Say: Based on my research and experience level I am targeting X to Y LPA. Never give a number first. Never accept the first offer.",
                ]},
              ].map((s,i)=>(
                <div key={i} style={{...S.CA(s.color),marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:s.color,marginBottom:10}}>{s.title}</div>
                  {s.items.map((item,j,arr)=>(
                    <div key={j} style={S.li(j===arr.length-1)}>
                      <span style={{color:s.color,fontWeight:700,flexShrink:0}}>›</span>
                      <span style={{fontSize:12,lineHeight:1.6}}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={S.C()}>
                <div style={{fontSize:13,fontWeight:700,color:P.a1,marginBottom:10}}>🤖 Ask the Job Switch Advisor</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {["How do I negotiate salary when switching from TCS?","What to say when asked why I am leaving TCS?","How do I explain Python skills when I just started learning?","What projects should I build to get an AI-DE job?","Should I wait for Databricks cert before applying?","How to write a cold message to a recruiter on LinkedIn?","How to handle a counter-offer from TCS?","What is a realistic salary target for my profile in 2026?"].map(q=>(
                    <button key={q} onClick={()=>setSwitchGuideQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>
                  ))}
                </div>
                <textarea style={{...S.ta,minHeight:65,marginBottom:10}}
                  placeholder="Ask anything about switching jobs — salary negotiation, interview answers, which companies to target, how to position your skills, handling offers..."
                  value={switchGuideQ} onChange={e=>setSwitchGuideQ(e.target.value)}/>
                <button style={{...S.btn(switchGuideLoad?P.muted:P.a1),opacity:switchGuideLoad?0.7:1,width:"100%"}}
                  onClick={async()=>{
                    if(!switchGuideQ.trim())return;
                    setSwitchGuideLoad(true);setSwitchGuideA("");
                    const sys=[
                      "You are an expert career counsellor specialising in tech career transitions in India 2026.",
                      "Client: Thamizamudhan K, 27, Chennai. Data Engineer at TCS 4.3 years.",
                      "Expert skills: SQL Teradata advanced, IBM DataStage ETL enterprise-scale, Unix Shell scripting, ServiceNow ITSM.",
                      "Learning in 2026: Python (beginner-intermediate), PySpark, LangChain, GCP BigQuery Dataflow.",
                      "Education: B.E ECE, M.Tech Data Science, PhD CSE GenAI at SSN College of Engineering (started July 2026 part-time).",
                      "Certs in progress: Databricks DEA (Sep 2026), GCP Professional DE (Nov 2026), Google Gemini Enterprise Dev (2026).",
                      "Goal: Switch to Senior DE or AI-DE with 40-60% salary hike by end of 2026.",
                      "Also: UGC NET CS December 2026, DRDO/ISRO/NIC govt roles consideration.",
                      "SC category. Chennai based. Open to Bangalore remote hybrid.",
                      "Give specific, practical, actionable advice. Be direct and honest. Name actual companies and numbers. No generic motivational content."
                    ].join(" ");
                    try{
                      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:900,system:sys,messages:[{role:"user",content:switchGuideQ}]})});
                      const d=await r.json();
                      setSwitchGuideA(d.content?.map(b=>b.text||"").join("")||"No response.");
                    }catch(_){setSwitchGuideA("Connection error. Please try again.");}
                    setSwitchGuideLoad(false);
                  }}
                  disabled={switchGuideLoad}>
                  {switchGuideLoad?"⏳ Getting advice...":"💼 Get Job Switch Advice"}
                </button>
                {switchGuideA&&<div style={{...S.CA(P.a1),marginTop:10}}>
                  <div style={{fontSize:11,color:P.a1,fontWeight:700,marginBottom:8}}>Career Advisor says:</div>
                  <div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{switchGuideA}</div>
                </div>}
              </div>
            </div>}
          </div>}



          {/* ══ PhD PLANNER ══ */}
          {tab==="phd"&&<div>
            <div style={S.h2}>🎓 PhD Research Planner</div>

            {/* Info bar */}
            <div style={{...S.ib(P.a4),marginBottom:12}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                <div><div style={{fontSize:10,color:P.muted,fontWeight:700}}>SUPERVISOR</div><div style={{fontSize:12,color:P.a4,fontWeight:700}}>Dr. K.D. Badri Narayanan</div></div>
                <div><div style={{fontSize:10,color:P.muted,fontWeight:700}}>UNIVERSITY</div><div style={{fontSize:12,color:P.sub}}>Shiv Nadar University (SNU), Chennai</div></div>
                <div><div style={{fontSize:10,color:P.muted,fontWeight:700}}>RESEARCH</div><div style={{fontSize:12,color:P.sub}}>Human-Centered Multimodal XAI + Wearables for Special Kids</div></div>
                <div><div style={{fontSize:10,color:P.muted,fontWeight:700}}>MODE</div><div style={{fontSize:12,color:P.sub}}>Part-time · Started July 2026 · 4-year plan</div></div>
              </div>
            </div>

            {/* Sub tabs */}
            <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
              {[["overview","📊 Overview"],["meetings","📋 MOM Log"],["tasks","✅ Tasks"],
                ["lit","📚 Literature"],["courses","🎓 Coursework"],["timeline","📅 Timeline"],["ask","🤖 Advisor"]].map(([id,lb])=>(
                <button key={id} style={S.pill(phdTab===id,P.a4)} onClick={()=>setPhdTab(id)}>{lb}</button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {phdTab==="overview"&&(()=>{
              const done=phdTasks.filter(t=>t.status==="Done").length;
              const inprog=phdTasks.filter(t=>t.status==="In Progress").length;
              const overdue=phdTasks.filter(t=>t.status!=="Done"&&t.due&&t.due<todayKey()).length;
              const total=phdTasks.length;
              const lastMtg=phdMeetings.sort((a,b)=>b.date.localeCompare(a.date))[0];
              const nextMtg=phdMeetings.filter(m=>m.nextDate&&m.nextDate>=todayKey()).sort((a,b)=>a.nextDate.localeCompare(b.nextDate))[0];
              return(<div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                  {[{l:"Total",v:total,c:P.a4},{l:"Done ✅",v:done,c:P.a2},{l:"Active 🔵",v:inprog,c:P.a1},{l:"Overdue ⚠️",v:overdue,c:P.a5}].map((s,i)=>(
                    <div key={i} style={S.sb(s.c)}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:P.muted,marginTop:2}}>{s.l}</div></div>
                  ))}
                </div>

                {overdue>0&&<div style={{...S.ib(P.a5),marginBottom:12}}>
                  <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:6}}>⚠️ {overdue} overdue — tap Tasks tab to replan</div>
                  {phdTasks.filter(t=>t.status!=="Done"&&t.due&&t.due<todayKey()).map(t=>(
                    <div key={t.id} style={{fontSize:11,color:P.sub,marginBottom:3,display:"flex",justifyContent:"space-between"}}>
                      <span>• {t.title}</span><span style={{color:P.a5,fontSize:10}}>was due {t.due}</span>
                    </div>
                  ))}
                </div>}

                <div style={S.C()}>
                  <div style={S.L}>Supervisor Meetings</div>
                  {nextMtg?<div style={{...S.ib(P.a2),marginBottom:8}}><div style={{fontSize:12,color:P.a2,fontWeight:700}}>📅 Next meeting: {nextMtg.nextDate}</div><div style={{fontSize:11,color:P.muted,marginTop:3}}>Action items: {nextMtg.actions?.substring(0,100)||"None noted"}</div></div>:<div style={{fontSize:12,color:P.muted,marginBottom:8}}>No upcoming meeting date set — log one in MOM tab</div>}
                  {lastMtg&&<div style={{fontSize:11,color:P.muted}}>Last meeting: {lastMtg.date} — {lastMtg.instructions?.substring(0,80)}...</div>}
                </div>

                <div style={S.C()}>
                  <div style={S.L}>Progress by Category</div>
                  {["Literature","Writing","Experiments","Publication","Coursework","Supervisor Meeting","Dataset"].map(cat=>{
                    const ct=phdTasks.filter(t=>t.category===cat);
                    if(!ct.length) return null;
                    const cd=ct.filter(t=>t.status==="Done").length;
                    const pct=Math.round((cd/ct.length)*100);
                    const cc={"Literature":P.a2,"Writing":P.a1,"Experiments":P.a3,"Publication":P.a4,"Coursework":P.a5,"Supervisor Meeting":P.a4,"Dataset":P.a3}[cat]||P.muted;
                    return(<div key={cat} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,color:P.sub}}>{cat}</span>
                        <span style={{fontSize:10,color:P.muted}}>{cd}/{ct.length} · {pct}%</span>
                      </div>
                      <div style={{background:`${P.bg}88`,borderRadius:4,height:5,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:cc,borderRadius:4}}/>
                      </div>
                    </div>);
                  })}
                </div>

                <div style={{...S.CA(P.a4)}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a4,marginBottom:8}}>🔬 Research Quick Reference</div>
                  {[
                    ["Theme","Human-Centered Multimodal Explainable AI with Wearable Sensors for Special Needs Children"],
                    ["Target Group","Children with Autism, ADHD, Cerebral Palsy, non-verbal conditions"],
                    ["Modalities","Wearables (HRV, accel, temp) + Vision (facial emotion) + Speech (cry, emotion) + Context"],
                    ["Core Problem","Personalized distress prediction BEFORE it occurs + XAI caregiver recommendations"],
                    ["Key Novelty","Individual behavioral baseline + Predictive (not reactive) + Explainable + Privacy-preserving"],
                    ["Minimal Dataset","DREAMER (wearable) + AffectNet subset (facial) + 20-30 caregiver logs"],
                    ["Target Journals","IEEE TNSRE (Q1) · AI in Medicine (Q1) · Computers in Human Behavior"],
                  ].map(([k,v],i,arr)=>(
                    <div key={i} style={{...S.li(i===arr.length-1),fontSize:12}}>
                      <span style={{color:P.a4,fontWeight:700,flexShrink:0,minWidth:100}}>{k}</span>
                      <span style={{color:P.sub}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>);
            })()}

            {/* ── MOM LOG ── */}
            {phdTab==="meetings"&&<div>
              <div style={{...S.ib(P.a4),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:2}}>📋 Minutes of Meeting (MOM) — Every supervisor meeting logged here</div>
                <div style={{fontSize:11,color:P.muted}}>Log the meeting immediately after it happens. This builds your research paper trail.</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:12,color:P.sub}}>{phdMeetings.length} meeting{phdMeetings.length!==1?"s":""} logged</div>
                <button style={{...S.btn(P.a4),padding:"7px 14px",fontSize:11}} onClick={()=>setShowPhdM(!showPhdM)}>{showPhdM?"✕ Cancel":"+ Log MOM"}</button>
              </div>

              {showPhdM&&<div style={{...S.C(),marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><div style={S.L}>Meeting Date</div><input type="date" style={S.inp} value={phdMForm.date} onChange={e=>setPhdMForm({...phdMForm,date:e.target.value})}/></div>
                  <div><div style={S.L}>Type</div><select style={S.sel} value={phdMForm.type} onChange={e=>setPhdMForm({...phdMForm,type:e.target.value})}><option>In-Person</option><option>Online/Teams</option><option>Email</option><option>Phone</option></select></div>
                </div>
                <div style={{marginBottom:8}}><div style={S.L}>📌 Key Instructions / Decisions from Supervisor</div>
                  <textarea style={{...S.ta,minHeight:80}} placeholder={"What did Dr. K.D. Badri Narayanan say?\nWhat decisions were made?\nWhat feedback was given on your work?"} value={phdMForm.instructions} onChange={e=>setPhdMForm({...phdMForm,instructions:e.target.value})}/></div>
                <div style={{marginBottom:8}}><div style={S.L}>✅ Your Action Items (What YOU must do before next meeting)</div>
                  <textarea style={{...S.ta,minHeight:65}} placeholder={"e.g. Read 5 papers on RAG systems\nPrepare keyword list (15-20)\nNarrow problem statements to 2-3"} value={phdMForm.actions} onChange={e=>setPhdMForm({...phdMForm,actions:e.target.value})}/></div>
                <div style={{marginBottom:12}}><div style={S.L}>📅 Next Meeting Date (set by supervisor)</div>
                  <input type="date" style={S.inp} value={phdMForm.nextDate} onChange={e=>setPhdMForm({...phdMForm,nextDate:e.target.value})}/></div>
                <div style={{display:"flex",gap:8}}>
                  <button style={{...S.btn(P.a4),flex:1}} onClick={addPhdMeeting}>💾 Save MOM</button>
                  <button style={{background:"transparent",border:`1px solid ${P.border}`,borderRadius:10,padding:"10px 16px",color:P.muted,fontSize:12,cursor:"pointer"}} onClick={()=>setShowPhdM(false)}>Cancel</button>
                </div>
              </div>}

              {phdMeetings.length===0&&!showPhdM&&<div style={{textAlign:"center",padding:"30px 0"}}>
                <div style={{fontSize:32,marginBottom:8}}>📋</div>
                <div style={{fontSize:13,color:P.muted,marginBottom:4}}>No meetings logged yet</div>
                <div style={{fontSize:11,color:P.muted}}>Log your first meeting with Dr. K.D. Badri Narayanan</div>
              </div>}

              {[...phdMeetings].sort((a,b)=>b.date.localeCompare(a.date)).map((m,i)=>(
                <div key={m.id} style={{...S.CA(P.a4),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
                    <div style={{fontSize:14,fontWeight:800,color:P.a4}}>
                      {i===0?"🟢 Latest — ":""}{m.date}
                    </div>
                    <span style={S.chip(P.a3)}>{m.type}</span>
                  </div>
                  {m.instructions&&<div style={{marginBottom:10}}>
                    <div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:"0.5px",marginBottom:5}}>📌 INSTRUCTIONS FROM SUPERVISOR</div>
                    <div style={{fontSize:12,color:P.sub,lineHeight:1.65,background:`${P.bg}88`,padding:"10px 12px",borderRadius:8,borderLeft:`3px solid ${P.a4}`}}>{m.instructions}</div>
                  </div>}
                  {m.actions&&<div style={{marginBottom:8}}>
                    <div style={{fontSize:10,color:P.muted,fontWeight:700,letterSpacing:"0.5px",marginBottom:5}}>✅ YOUR ACTION ITEMS</div>
                    <div style={{fontSize:12,color:P.sub,lineHeight:1.6}}>{m.actions.split("\n").map((line,li)=>(<div key={li} style={{display:"flex",gap:6,marginBottom:3}}><span style={{color:P.a2}}>›</span><span>{line}</span></div>))}</div>
                  </div>}
                  {m.nextDate&&<div style={{...S.ib(P.a2)}}><span style={{fontSize:12,color:P.a2,fontWeight:700}}>📅 Next meeting: {m.nextDate}</span></div>}
                </div>
              ))}
            </div>}

            {/* ── RESEARCH TASKS ── */}
            {phdTab==="tasks"&&<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:13,fontWeight:700,color:P.a4}}>✅ Research Tasks</div>
                <button style={{...S.btn(P.a4),padding:"7px 14px",fontSize:11}} onClick={()=>setShowPhdT(!showPhdT)}>{showPhdT?"✕":"+ Add Task"}</button>
              </div>
              {showPhdT&&<div style={{...S.C(),marginBottom:12}}>
                <div style={{marginBottom:8}}><div style={S.L}>Task</div><input style={S.inp} placeholder="e.g. Read 5 papers on multimodal distress detection" value={phdTForm.title} onChange={e=>setPhdTForm({...phdTForm,title:e.target.value})}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><div style={S.L}>Category</div>
                    <select style={S.sel} value={phdTForm.category} onChange={e=>setPhdTForm({...phdTForm,category:e.target.value})}>
                      <option>Literature</option><option>Writing</option><option>Experiments</option>
                      <option>Publication</option><option>Coursework</option><option>Supervisor Meeting</option>
                      <option>Dataset</option><option>Other</option>
                    </select>
                  </div>
                  <div><div style={S.L}>Due Date</div><input type="date" style={S.inp} value={phdTForm.due} onChange={e=>setPhdTForm({...phdTForm,due:e.target.value})}/></div>
                </div>
                <div style={{marginBottom:8}}><div style={S.L}>Chapter / Context</div><input style={S.inp} placeholder="e.g. Chapter 1, Paper 1, Supervisor prep" value={phdTForm.chapter} onChange={e=>setPhdTForm({...phdTForm,chapter:e.target.value})}/></div>
                <div style={{marginBottom:12}}><div style={S.L}>Notes</div><textarea style={{...S.ta,minHeight:50}} placeholder="Any extra notes..." value={phdTForm.notes} onChange={e=>setPhdTForm({...phdTForm,notes:e.target.value})}/></div>
                <button style={S.btn(P.a4)} onClick={addPhdTask}>Add Task</button>
              </div>}
              {(()=>{
                const overdue=phdTasks.filter(t=>t.status!=="Done"&&t.due&&t.due<todayKey());
                const active=phdTasks.filter(t=>t.status!=="Done"&&(!t.due||t.due>=todayKey()));
                const done=phdTasks.filter(t=>t.status==="Done");
                const catC={"Literature":P.a2,"Writing":P.a1,"Experiments":P.a3,"Publication":P.a4,"Coursework":P.a5,"Supervisor Meeting":P.a4,"Dataset":P.a3,"Other":P.muted};
                const renderT=t=>{
                  const isOD=t.due&&t.due<todayKey()&&t.status!=="Done";
                  return(<div key={t.id} style={{background:P.card3,borderRadius:10,padding:"11px 13px",marginBottom:7,border:`1px solid ${isOD?P.a5+"66":P.border}`,borderLeft:`3px solid ${catC[t.category]||P.muted}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:700,color:isOD?P.a5:P.text,textDecoration:t.status==="Done"?"line-through":"none",marginBottom:4}}>{t.title}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          <span style={S.chip(catC[t.category]||P.muted)}>{t.category}</span>
                          {t.chapter&&<span style={{fontSize:10,color:P.muted,padding:"2px 6px",background:`${P.bg}88`,borderRadius:4}}>{t.chapter}</span>}
                          {t.due&&<span style={{fontSize:10,color:isOD?P.a5:P.muted,fontWeight:isOD?700:400}}>{isOD?"⚠️ Was due ":"📅 "}{t.due}</span>}
                        </div>
                      </div>
                      <button onClick={()=>delPhdTask(t.id)} style={{background:"transparent",border:"none",color:P.muted,fontSize:14,cursor:"pointer",padding:"0 4px"}}>✕</button>
                    </div>
                    {t.notes&&<div style={{fontSize:11,color:P.muted,marginBottom:7,lineHeight:1.4}}>{t.notes}</div>}
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:isOD?8:0}}>
                      {["Pending","In Progress","Done"].map(s=>(
                        <button key={s} onClick={()=>updPhdTask(t.id,"status",s)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${t.status===s?P.a4:P.border}`,background:t.status===s?`${P.a4}20`:"transparent",color:t.status===s?P.a4:P.muted,fontSize:10,cursor:"pointer",fontWeight:t.status===s?700:400}}>{s}</button>
                      ))}
                    </div>
                    {isOD&&<div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
                      <span style={{fontSize:10,color:P.a5,fontWeight:600,flexShrink:0}}>Replan:</span>
                      <input type="date" style={{...S.inp,padding:"5px 8px",fontSize:11,flex:1}} onChange={e=>{if(e.target.value)updPhdTask(t.id,"due",e.target.value);}}/>
                    </div>}
                  </div>);
                };
                return(<div>
                  {overdue.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:11,color:P.a5,fontWeight:700,marginBottom:8}}>⚠️ Overdue — Replan ({overdue.length})</div>{overdue.map(renderT)}</div>}
                  {active.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:11,color:P.a1,fontWeight:700,marginBottom:8}}>🔵 Active ({active.length})</div>{active.map(renderT)}</div>}
                  {done.length>0&&<div><div style={{fontSize:11,color:P.a2,fontWeight:700,marginBottom:8}}>✅ Done ({done.length})</div>{done.map(renderT)}</div>}
                  {!phdTasks.length&&!showPhdT&&<div style={{textAlign:"center",padding:"30px 0",color:P.muted,fontSize:12}}>No tasks yet. Add tasks from supervisor instructions.</div>}
                </div>);
              })()}
            </div>}

            {/* ── LITERATURE SURVEY ── */}
            {phdTab==="lit"&&<div>
              <div style={S.h2}>📚 Literature Survey Tracker</div>
              <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                {[["survey","📖 Reading Plan"],["gaps","🔍 Research Gaps"],["keywords","🏷️ Keywords"]].map(([id,lb])=>(
                  <button key={id} style={S.pill(phdLitTab===id,P.a2)} onClick={()=>setPhdLitTab(id)}>{lb}</button>
                ))}
              </div>

              {phdLitTab==="survey"&&<div>
                <div style={{...S.ib(P.a2),marginBottom:12}}>
                  <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>Target: 50+ papers reviewed by December 2026 for Chapter 2</div>
                  <div style={{fontSize:11,color:P.muted}}>Read 2 papers/week minimum. Annotate key findings. Track gaps. Each paper = 30 min reading + 10 min notes.</div>
                </div>
                {[
                  {category:"Multimodal Healthcare AI — MUST READ FIRST",color:P.a1,papers:[
                    {title:"Multimodal Sentiment Analysis and Emotion Recognition: A Survey",author:"Poria et al. (2017)",where:"ArXiv 1805.00119 | IEEE Access",why:"Foundation survey — understand multimodal fusion basics"},
                    {title:"A Survey on Deep Learning for Multimodal Data Fusion",author:"Baltrusaitis et al. (2019)",where:"IEEE TPAMI",why:"Core paper on fusion strategies: early, late, hybrid"},
                    {title:"Towards Multimodal Depression Recognition",author:"Yang et al. (2022)",where:"ICASSP 2022 | Google Scholar",why:"Closest to your research — multimodal for mental health"},
                    {title:"Detecting Autism from Facial Expression: A Multimodal Deep Learning Study",author:"Thabtah et al. (2019)",where:"IEEE Access — open access",why:"Direct domain relevance — autism + AI"},
                  ]},
                  {category:"Explainable AI (XAI) for Healthcare",color:P.a4,papers:[
                    {title:"Explainable AI in Healthcare: A Review",author:"Tjoa & Guan (2021)",where:"IEEE Trans. Neural Networks — Q1",why:"Core XAI healthcare survey — shapes your Chapter 2 XAI section"},
                    {title:"SHAP: A Unified Approach to Interpreting Model Predictions",author:"Lundberg & Lee (2017)",where:"NeurIPS 2017",why:"SHAP method you'll use for caregiver explanations"},
                    {title:"Grad-CAM: Visual Explanations from Deep Networks",author:"Selvaraju et al. (2019)",where:"IJCV | Google Scholar",why:"Visual XAI for your computer vision module"},
                  ]},
                  {category:"Wearable Sensing for Special Needs",color:P.a3,papers:[
                    {title:"Physiological Wearables for Autism Detection: A Review",author:"Various (2020-2024)",where:"Search Google Scholar: 'wearable autism HRV detection'",why:"Maps the wearable landscape for your domain"},
                    {title:"Heart Rate Variability as a Biomarker of Stress in Children with ASD",author:"Various (2021)",where:"Journal of Autism and Developmental Disorders",why:"Validates HRV as a distress predictor for your PS-1"},
                    {title:"DREAMER: A Database for Emotion Recognition",author:"Katsigiannis & Ramzan (2018)",where:"IEEE JBHI — open access",why:"Your minimal dataset — must read the data paper"},
                  ]},
                  {category:"Privacy & Federated Learning for Healthcare",color:P.a5,papers:[
                    {title:"Federated Learning for Healthcare: A Systematic Review",author:"Rieke et al. (2020)",where:"npj Digital Medicine — Nature",why:"Foundation for your privacy-preserving module (PS-5)"},
                    {title:"Personalized Federated Learning with Theoretical Guarantees",author:"Fallah et al. (2020)",where:"NeurIPS 2020 | ArXiv 2002.07948",why:"Personalisation + federated — your core innovation"},
                  ]},
                ].map((section,si)=>(
                  <div key={si} style={{...S.CA(section.color),marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:section.color,marginBottom:10}}>{section.category}</div>
                    {section.papers.map((p,pi,parr)=>(
                      <div key={pi} style={{background:`${P.bg}88`,borderRadius:8,padding:"9px 11px",marginBottom:pi===parr.length-1?0:6}}>
                        <div style={{fontSize:12,fontWeight:700,color:P.text,marginBottom:2}}>{p.title}</div>
                        <div style={{fontSize:11,color:P.muted,marginBottom:2}}>{p.author} · {p.where}</div>
                        <div style={{fontSize:11,color:section.color}}>Why: {p.why}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>}

              {phdLitTab==="gaps"&&<div>
                <div style={{...S.ib(P.a5),marginBottom:12}}>
                  <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>These gaps = your research contribution. Know them by heart for supervisor meetings.</div>
                </div>
                {[
                  {gap:"RG-1",area:"Single modality",text:"Most existing systems use ONLY ONE sensor type. No unified system fuses wearable + vision + speech + context for child health monitoring.",contribution:"Your multi-modal fusion framework"},
                  {gap:"RG-2",area:"Generic AI models",text:"AI trained on population averages fails for individual children with unique behavioral patterns. No personalized baseline per child.",contribution:"Your individual behavioral baseline learning"},
                  {gap:"RG-3",area:"Reactive not predictive",text:"Systems detect distress AFTER it occurs. No system predicts meltdown/anxiety 5-15 min BEFORE onset using precursor signals.",contribution:"Your predictive distress detection model"},
                  {gap:"RG-4",area:"No XAI for caregivers",text:"Systems generate binary alerts but no explanation of WHY or WHAT intervention. Caregivers cannot trust black-box AI.",contribution:"Your XAI module with natural language caregiver recommendations"},
                  {gap:"RG-5",area:"No longitudinal learning",text:"Systems analyze snapshots only. No system learns how a child's behavior EVOLVES over months and years.",contribution:"Your behavior trajectory modeling (later PhD phases)"},
                  {gap:"RG-6",area:"Privacy vulnerabilities",text:"Sensitive child healthcare data uploaded to cloud without federated learning or edge AI privacy protection.",contribution:"Your privacy-preserving federated architecture"},
                  {gap:"RG-7",area:"Small datasets",text:"No data augmentation strategy exists specific to child healthcare AI for rare/small datasets.",contribution:"Your minimal dataset approach + synthetic augmentation"},
                ].map((g,i,arr)=>(
                  <div key={i} style={{background:P.card3,borderRadius:10,padding:"11px 13px",marginBottom:7,borderLeft:`3px solid ${P.a5}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{fontSize:12,fontWeight:700,color:P.a5}}>{g.gap}: {g.area}</span>
                    </div>
                    <div style={{fontSize:12,color:P.sub,marginBottom:6,lineHeight:1.5}}>{g.text}</div>
                    <div style={{fontSize:11,color:P.a2,fontWeight:600}}>→ Your contribution: {g.contribution}</div>
                  </div>
                ))}
              </div>}

              {phdLitTab==="keywords"&&<div>
                <div style={{...S.ib(P.a2),marginBottom:12}}>
                  <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>25 Core Research Keywords — use for Google Scholar alerts, paper searches, and IEEE indexing</div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {["Multimodal AI","Human-Centered AI","Special Care Children","Autism Spectrum Disorder","ADHD","Cerebral Palsy","Behaviour Analysis","Caregiver Decision Support","Explainable AI (XAI)","SHAP","Wearable Sensors","Heart Rate Variability","Accelerometer","Computer Vision","Facial Emotion Recognition","Speech Emotion Recognition","Sensor Fusion","Distress Prediction","Personalised AI","Individual Baseline Learning","Edge AI","Federated Learning","Continual Learning","Healthcare AI","Longitudinal Behaviour Monitoring"].map((kw,i)=>(
                    <span key={i} style={{...S.chip(P.a2),fontSize:11,padding:"5px 10px"}}>{kw}</span>
                  ))}
                </div>
                <div style={{...S.ib(P.a3),marginTop:14}}>
                  <div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:4}}>💡 Set Google Scholar Alerts for these combinations</div>
                  {["multimodal wearable autism distress prediction","explainable AI caregiver decision support children","federated learning healthcare wearable privacy","personalised AI children special needs","HRV distress prediction autism wearable"].map((q,i)=>(
                    <div key={i} style={{fontSize:11,color:P.sub,marginBottom:4,display:"flex",gap:6}}>
                      <span style={{color:P.a3}}>→</span>
                      <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer" style={{color:P.a1,textDecoration:"none"}}>{q}</a>
                    </div>
                  ))}
                </div>
              </div>}
            </div>}

            {/* ── COURSEWORK ── */}
            {phdTab==="courses"&&<div>
              <div style={S.h2}>🎓 PhD Coursework Tracker</div>
              <div style={{...S.ib(P.a1),marginBottom:12}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>SNU PhD requirement: 4 courses / 12 credits · Complete before Comprehensive Exam</div>
                <div style={{fontSize:11,color:P.muted}}>Part-time schedule: 1-2 courses per semester. Balance with TCS work — weekends and evenings only.</div>
              </div>
              {[
                {course:"Research Methodology & Technical Writing",credits:3,status:"Likely Semester 1",color:P.a1,tips:["Learn literature review techniques","Academic writing style and structure","Research design principles","How to write IEEE/ACM format papers"],schedule:"Typically Sat/Sun sessions at SNU campus"},
                {course:"Machine Learning & Deep Learning (Core)",credits:3,status:"Likely Semester 1-2",color:P.a2,tips:["CNNs, RNNs, Transformers — directly relevant","Time series analysis for wearable data","Multi-task learning frameworks","Self-supervised learning basics"],schedule:"Can substitute with audit if you have M.Tech ML background"},
                {course:"Multimodal AI / Computer Vision (Elective)",credits:3,status:"Likely Semester 2",color:P.a4,tips:["Vision Transformers (ViT)","Attention mechanisms for fusion","Cross-modal representation learning","Directly feeds your research Chapter 3"],schedule:"Prioritize this — most relevant to your thesis"},
                {course:"Healthcare AI / Biomedical Signal Processing (Elective)",credits:3,status:"Likely Semester 2-3",color:P.a3,tips:["EEG/ECG signal processing","Clinical decision support systems","Physiological feature extraction","Directly maps to your wearable module"],schedule:"Highly recommended — validates your domain knowledge for reviewers"},
              ].map((c,i)=>(
                <div key={i} style={{...S.CA(c.color),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:700,color:c.color}}>{c.course}</div>
                    <div style={{display:"flex",gap:5}}>
                      <span style={S.chip(c.color)}>{c.credits} credits</span>
                      <span style={S.chip(P.a3)}>{c.status}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:P.muted,marginBottom:8}}>📅 {c.schedule}</div>
                  <div style={{fontSize:11,color:P.muted,fontWeight:700,marginBottom:5}}>What you'll gain:</div>
                  {c.tips.map((t,ti,tarr)=>(<div key={ti} style={{...S.li(ti===tarr.length-1),fontSize:11}}><span style={{color:c.color}}>›</span><span>{t}</span></div>))}
                </div>
              ))}
              <div style={{...S.ib(P.a5)}}>
                <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:4}}>⚠️ Important SNU Part-time PhD Rules</div>
                {["Minimum 3 years, maximum 6 years for part-time PhD","Doctoral Committee (DC) forms within ~3 weeks of registration — attend this","4 courses / 12 credits required before Comprehensive Exam","CGPA threshold required — check SNU PhD regulations","Minimum 2 Scopus/SCI publications required before synopsis submission","Residence requirement at SNU — clarify with Dr. K.D. Badri Narayanan"].map((r,i,arr)=>(
                  <div key={i} style={{...S.li(i===arr.length-1),fontSize:11}}><span style={{color:P.a5,fontWeight:700}}>›</span><span>{r}</span></div>
                ))}
              </div>
            </div>}

            {/* ── TIMELINE ── */}
            {phdTab==="timeline"&&<div>
              <div style={{...S.ib(P.a4),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>4-Year Stress-Free Timeline — as instructed by Dr. K.D. Badri Narayanan</div>
                <div style={{fontSize:11,color:P.muted}}>Every month has a deliverable. No backlog builds. Research proceeds steadily alongside TCS work.</div>
              </div>
              {[
                {phase:"Phase 1: Foundation",period:"Jul–Dec 2026",color:P.a1,items:[
                  "Jul 2026 ✅: First supervisor meeting — ideology, keywords, PS (DONE)",
                  "Aug 2026: CCDV-F cert (Aug 31) + PhD coursework Sem 1 begins + Read 15+ papers",
                  "Sep 2026: Finalise 1-2 core problem statements with supervisor + 30+ papers reviewed",
                  "Oct 2026: Chapter 1 Introduction draft submitted + UGC NET registration + dataset identified",
                  "Nov 2026: Chapter 2 Literature Survey 50% complete + baseline experiments started",
                  "Dec 2026: UGC NET exam + Chapter 2 complete + Year 1 review at SNU",
                ]},
                {phase:"Phase 2: Methodology",period:"Jan–Jun 2027",color:P.a2,items:[
                  "Jan 2027: Core methodology design — multimodal fusion architecture document",
                  "Feb 2027: Prototype model on DREAMER + AffectNet minimal dataset",
                  "Mar 2027: Full experiments — personalized baseline per child + ablation study",
                  "Apr 2027: XAI module (SHAP + attention) for caregiver recommendation layer",
                  "May 2027: Chapter 3 Methodology complete + 1st conference abstract submitted",
                  "Jun 2027: Annual PhD review at SNU + Chapters 1-3 revised with supervisor feedback",
                ]},
                {phase:"Phase 3: Experimentation & Publications",period:"Jul–Dec 2027",color:P.a3,items:[
                  "Jul 2027: Privacy-preserving module (federated learning) prototype",
                  "Aug 2027: Chapter 4 Experiments & Results first draft",
                  "Sep 2027: 1st Scopus journal paper submitted (IEEE TNSRE or AI in Medicine)",
                  "Oct 2027: Mid-PhD comprehensive review at SNU",
                  "Nov 2027: Chapter 5 outline + LLM caregiver assistant module design",
                  "Dec 2027: 2nd journal paper submitted + all Chapters 1-4 revised",
                ]},
                {phase:"Phase 4: Advanced Research",period:"Jan–Jun 2028",color:P.a4,items:[
                  "Jan-Feb 2028: LLM + RAG caregiver assistant fully built and evaluated",
                  "Mar-Apr 2028: Digital Twin prototype + longitudinal behavior modeling",
                  "May-Jun 2028: Chapter 5-6 complete + international conference paper submitted",
                ]},
                {phase:"Phase 5: Thesis Writing",period:"Jul–Dec 2028",color:P.a5,items:[
                  "Jul-Sep 2028: Full thesis draft Chapters 1-7 submitted to supervisor",
                  "Oct-Dec 2028: All revisions done + 3rd journal paper + synopsis prepared",
                ]},
                {phase:"Phase 6: Submission & Viva",period:"Jan–Dec 2029",color:P.a2,items:[
                  "Jan-Apr 2029: Mock viva + final thesis formatted + submitted to SNU",
                  "May-Jun 2029: External examiner review + open defense preparation",
                  "Jul-Dec 2029: PhD VIVA VOCE + corrections + DEGREE AWARDED 🎓",
                ]},
              ].map((ph,i)=>(
                <div key={i} style={{...S.CA(ph.color),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:800,color:ph.color}}>{ph.phase}</div>
                    <span style={S.chip(ph.color)}>{ph.period}</span>
                  </div>
                  {ph.items.map((item,j,arr)=>(
                    <div key={j} style={{...S.li(j===arr.length-1),fontSize:12}}>
                      <span style={{color:ph.color,fontWeight:700,flexShrink:0}}>›</span><span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>}

            {/* ── PhD ADVISOR AI ── */}
            {phdTab==="ask"&&<div>
              <div style={S.h2}>🤖 PhD Research Advisor</div>
              <div style={{...S.ib(P.a4),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>Ask about research, supervisor prep, writing, papers — knows your full context</div>
                <div style={{fontSize:11,color:P.muted}}>Context loaded: SNU PhD, Dr. K.D. Badri Narayanan, Human-Centered XAI + Wearables, your meeting history, tasks</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                {["How to prepare for my next supervisor meeting at SNU?",
                  "Write a 500-word introduction for Chapter 1 of my PhD thesis",
                  "What are the top 5 papers I must read for multimodal wearable AI?",
                  "Explain the difference between early fusion and late fusion for my research",
                  "How do I implement SHAP for XAI explanations in my model?",
                  "What is the DREAMER dataset and how do I use it for distress prediction?",
                  "Help me write my research gap statement for the supervisor meeting",
                  "How to balance TCS work + PhD + certs + UGC NET without burning out?",
                ].map(q=>(
                  <button key={q} onClick={()=>setPhdAiQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>
                ))}
              </div>
              <textarea style={{...S.ta,minHeight:70,marginBottom:10}} placeholder="Ask about your research, writing Chapter 1, what papers to read, supervisor meeting prep..." value={phdAiQ} onChange={e=>setPhdAiQ(e.target.value)}/>
              <button style={{...S.btn(phdAiLoad?P.muted:P.a4),opacity:phdAiLoad?0.7:1,width:"100%",marginBottom:14}} onClick={askPhdAI} disabled={phdAiLoad}>
                {phdAiLoad?"⏳ Thinking...":"🎓 Ask PhD Advisor"}
              </button>
              {phdAiA&&<div style={{...S.CA(P.a4)}}><div style={{fontSize:11,color:P.a4,fontWeight:700,marginBottom:8}}>PhD Advisor says:</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{phdAiA}</div></div>}
            </div>}
          </div>}

                    {tab==="office"&&<div>
            <div style={S.h2}>🖥️ Office Command Centre</div>

            {/* Overdue banner - shown if any persistent pending is overdue */}
            {(()=>{
              const overdue=allPending.filter(p=>p.status!=="Done"&&p.due&&p.due<todayKey());
              if(!overdue.length) return null;
              return(
                <div style={{...S.ib(P.a5),marginBottom:12}}>
                  <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:6}}>⚠️ {overdue.length} overdue follow-up{overdue.length>1?"s":""} need your attention</div>
                  {overdue.slice(0,3).map(p=>(
                    <div key={p.id} style={{fontSize:11,color:P.sub,marginBottom:3,display:"flex",justifyContent:"space-between"}}>
                      <span>• {p.desc}</span>
                      <span style={{color:P.a5,fontWeight:600}}>Due {p.due}</span>
                    </div>
                  ))}
                  {overdue.length>3&&<div style={{fontSize:11,color:P.muted}}>{overdue.length-3} more below ↓</div>}
                </div>
              );
            })()}

            {/* Office sub-tabs */}
            <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
              {[["daily","📅 Daily Tracker"],["followup","🔄 Follow-Up Board"],["ideas","🚀 Dev Ideas"]].map(([id,lb])=>(
                <button key={id} style={S.pill(offDay===id,P.a1)} onClick={()=>setOffDay(id)}>{lb}</button>
              ))}
            </div>

            {/* ── DAILY TRACKER ── */}
            {offDay!=="followup"&&offDay!=="ideas"&&(()=>{
              const d7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});
              const selDay=d7.includes(offDay)?offDay:todayKey();
              return(<div>
                {/* Day strip */}
                <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto"}}>
                  {d7.map(d=>{const od=offData[d];const isSel=d===selDay;const isT=d===todayKey();return(
                    <div key={d} onClick={()=>switchOff(d)} style={{minWidth:56,...gl(isSel?P.a1:null),borderRadius:10,padding:"7px 4px",textAlign:"center",cursor:"pointer",flexShrink:0,border:`1px solid ${isSel?P.a1:P.border}`}}>
                      <div style={{fontSize:10,color:isSel?P.a1:P.muted,fontWeight:700}}>{fmtDate(d).slice(0,3)}</div>
                      <div style={{fontSize:11,color:isT?P.a2:P.sub,fontWeight:isT?700:400,margin:"2px 0"}}>{fmtDate(d).slice(4,9)}</div>
                      {(od?.tickets?.length||0)>0&&<div style={{fontSize:10,color:P.a3,fontWeight:700}}>{od.tickets.length}t</div>}
                    </div>
                  );})}
                </div>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:12}}>{fmtDate(selDay)} {selDay===todayKey()?"(Today)":""}</div>

                {/* Stats */}
                {(tickets.length>0||pending.length>0)&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                  {[{l:"Tickets",v:tickets.length,c:P.a5},{l:"Done",v:tickets.filter(t=>t.status==="Completed").length,c:P.a2},{l:"Blocked",v:tickets.filter(t=>t.status==="Blocked").length,c:P.a5},{l:"Open",v:pending.filter(p=>p.status!=="Done").length,c:P.a3}].map((s,i)=>(
                    <div key={i} style={S.sb(s.c)}><div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:P.muted,marginTop:2}}>{s.l}</div></div>
                  ))}
                </div>}

                {/* Tickets */}
                <div style={{...S.CA(P.a5),marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:14,fontWeight:700,color:P.a5}}>🎫 Tickets & INC</div>
                    <button style={{...S.btn(P.a5),padding:"6px 14px",fontSize:11}} onClick={()=>setShowTF(!showTF)}>{showTF?"✕":"+ Add"}</button>
                  </div>
                  {showTF&&<div style={{background:P.card3,borderRadius:10,padding:14,marginBottom:12,border:`1px solid ${P.border}`}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><div style={S.L}>Type</div><select style={S.sel} value={tF.type} onChange={e=>setTF({...tF,type:e.target.value})}><option>INC</option><option>Current Ticket</option><option>Dev Work</option><option>Task</option></select></div>
                      <div><div style={S.L}>Ticket No.</div><input style={S.inp} placeholder="INC0012345" value={tF.no} onChange={e=>setTF({...tF,no:e.target.value})}/></div>
                    </div>
                    <div style={{marginBottom:8}}><div style={S.L}>Description</div><input style={S.inp} placeholder="Brief description" value={tF.desc} onChange={e=>setTF({...tF,desc:e.target.value})}/></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><div style={S.L}>Priority</div><select style={S.sel} value={tF.pri} onChange={e=>setTF({...tF,pri:e.target.value})}><option>P1</option><option>P2</option><option>P3</option><option>P4</option></select></div>
                      <div><div style={S.L}>Status</div><select style={S.sel} value={tF.status} onChange={e=>setTF({...tF,status:e.target.value})}><option>In Progress</option><option>Blocked</option><option>On Hold</option><option>Completed</option></select></div>
                    </div>
                    <div style={{marginBottom:12}}><div style={S.L}>Notes</div><textarea style={{...S.ta,minHeight:55}} value={tF.notes} onChange={e=>setTF({...tF,notes:e.target.value})} placeholder="Steps taken, blockers, next steps..."/></div>
                    <button style={S.btn(P.a5)} onClick={addTicket}>Add Ticket</button>
                  </div>}
                  {tickets.length===0&&!showTF&&<div style={{textAlign:"center",padding:"16px 0",color:P.muted,fontSize:12}}>No tickets for this day.</div>}
                  {tickets.map(t=>(
                    <div key={t.id} style={{background:P.card3,borderRadius:10,padding:"11px 13px",marginBottom:8,border:`1px solid ${P.border}`,borderLeft:`3px solid ${tyC[t.type]||P.a1}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={S.chip(tyC[t.type]||P.a1)}>{t.type}</span>{t.no&&<span style={{fontSize:11,color:P.muted,fontFamily:"monospace"}}>{t.no}</span>}<span style={S.chip(prC[t.pri]||P.muted)}>{t.pri}</span></div>
                        <button onClick={()=>delT(t.id)} style={{background:"transparent",border:"none",color:P.muted,fontSize:16,cursor:"pointer",padding:"0 4px"}}>✕</button>
                      </div>
                      <div style={{fontSize:13,color:P.text,marginBottom:6,fontWeight:600}}>{t.desc}</div>
                      {t.notes&&<div style={{fontSize:12,color:P.muted,marginBottom:8,lineHeight:1.4}}>{t.notes}</div>}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {["In Progress","Blocked","On Hold","Completed"].map(s=>(
                          <button key={s} onClick={()=>updT(t.id,s)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${t.status===s?(stC[s]||P.a1):P.border}`,background:t.status===s?`${stC[s]||P.a1}20`:"transparent",color:t.status===s?(stC[s]||P.a1):P.muted,fontSize:10,cursor:"pointer",fontWeight:t.status===s?700:400}}>{s}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* EOD Note */}
                <div style={S.C()}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>📝 EOD Note / Handover</div>
                  <textarea style={{...S.ta,minHeight:70,marginBottom:12}} placeholder="What did you complete today? What is pending tomorrow? Any handover notes?" value={offNote} onChange={e=>setOffNote(e.target.value)}/>
                  <button style={S.btn(offSaved?P.a2:P.a1)} onClick={saveOffNote}>{offSaved?"✅ Saved!":"💾 Save EOD Note"}</button>
                </div>
              </div>);
            })()}

            {/* ── FOLLOW-UP BOARD (persistent cross-day) ── */}
            {offDay==="followup"&&<div>
              <div style={{...S.ib(P.a3),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:3}}>🔄 Persistent Follow-Up Board</div>
                <div style={{fontSize:12,color:P.muted}}>Items here stay visible EVERY DAY until marked Done. Overdue items auto-highlight and prompt replanning. Add follow-up notes anytime.</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {(()=>{
                    const overdue=allPending.filter(p=>p.status!=="Done"&&p.due&&p.due<todayKey()).length;
                    const active=allPending.filter(p=>p.status!=="Done"&&(!p.due||p.due>=todayKey())).length;
                    const done=allPending.filter(p=>p.status==="Done").length;
                    return([
                      {l:`⚠️ Overdue (${overdue})`,c:P.a5},
                      {l:`🔵 Active (${active})`,c:P.a1},
                      {l:`✅ Done (${done})`,c:P.a2},
                    ].map((s,i)=><span key={i} style={{...S.chip(s.c),fontSize:11,padding:"4px 10px"}}>{s.l}</span>));
                  })()}
                </div>
                <button style={{...S.btn(P.a3),padding:"6px 14px",fontSize:11}} onClick={()=>setShowApF(!showApF)}>{showApF?"✕":"+ Add Follow-Up"}</button>
              </div>

              {showApF&&<div style={{...S.C(),marginBottom:14}}>
                <div style={{marginBottom:8}}><div style={S.L}>Work Item / Follow-Up</div><input style={S.inp} placeholder="e.g. Follow up with team lead on INC00123 resolution, Submit timesheet approval..." value={apForm.desc} onChange={e=>setApForm({...apForm,desc:e.target.value})}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div><div style={S.L}>Category</div>
                    <select style={S.sel} value={apForm.category} onChange={e=>setApForm({...apForm,category:e.target.value})}>
                      <option>Office</option><option>TCS Project</option><option>INC Follow-Up</option><option>Change Request</option><option>Approval Pending</option><option>Client Communication</option><option>Documentation</option><option>Learning</option><option>PhD</option>
                    </select>
                  </div>
                  <div><div style={S.L}>Target Date</div><input type="date" style={S.inp} value={apForm.due} onChange={e=>setApForm({...apForm,due:e.target.value})}/></div>
                </div>
                <button style={S.btn(P.a3)} onClick={addPersistentPending}>Add to Follow-Up Board</button>
              </div>}

              {allPending.length===0&&!showApF&&<div style={{textAlign:"center",padding:"40px 0",color:P.muted,fontSize:13}}>No follow-ups tracked yet. Add items here to track them across every day until done.</div>}

              {(()=>{
                const catCol={"Office":P.a1,"TCS Project":P.a4,"INC Follow-Up":P.a5,"Change Request":P.a3,"Approval Pending":P.a3,"Client Communication":P.a2,"Documentation":P.muted,"Learning":P.a2,"PhD":P.a4};
                const overdue=allPending.filter(p=>p.status!=="Done"&&p.due&&p.due<todayKey());
                const active=allPending.filter(p=>p.status!=="Done"&&(!p.due||p.due>=todayKey()));
                const done=allPending.filter(p=>p.status==="Done");
                const renderItem=(item)=>{
                  const isOverdue=item.due&&item.due<todayKey()&&item.status!=="Done";
                  const daysSince=Math.floor((new Date()-new Date(item.updatedDate||item.addedDate))/(1000*60*60*24));
                  return(
                    <div key={item.id} style={{...gl(isOverdue?P.a5:null),padding:"12px 14px",marginBottom:10,borderRadius:12,border:`1px solid ${isOverdue?P.a5+"55":P.border}`,borderLeft:`4px solid ${isOverdue?P.a5:(catCol[item.category]||P.a1)}`}}>
                      {/* Header row */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:isOverdue?P.a5:P.text,marginBottom:4}}>{item.desc}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            <span style={S.chip(catCol[item.category]||P.a1)}>{item.category}</span>
                            {item.due&&<span style={{fontSize:10,color:isOverdue?P.a5:P.muted,fontWeight:isOverdue?700:400,padding:"2px 7px",background:`${isOverdue?P.a5:P.muted}15`,borderRadius:4}}>
                              {isOverdue?"⚠️ Overdue: ":"📅 "}{item.due}
                            </span>}
                            {item.snoozed&&<span style={S.chip(P.a3)}>Rescheduled</span>}
                            <span style={{fontSize:10,color:P.muted,padding:"2px 7px"}}>Added {item.addedDate}</span>
                          </div>
                        </div>
                        <button onClick={()=>delPersistentPending(item.id)} style={{background:"transparent",border:"none",color:P.muted,fontSize:14,cursor:"pointer",padding:"0 4px",flexShrink:0}}>✕</button>
                      </div>

                      {/* Status buttons */}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                        {["Pending","In Progress","Blocked","Done"].map(s=>{
                          const sc={"Pending":P.a3,"In Progress":P.a1,"Blocked":P.a5,"Done":P.a2}[s]||P.muted;
                          return(<button key={s} onClick={()=>updPendingStatus(item.id,s)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${item.status===s?sc:P.border}`,background:item.status===s?`${sc}20`:"transparent",color:item.status===s?sc:P.muted,fontSize:11,cursor:"pointer",fontWeight:item.status===s?700:400}}>{s}</button>);
                        })}
                      </div>

                      {/* Overdue replan */}
                      {isOverdue&&<div style={{...S.ib(P.a5),marginBottom:8}}>
                        <div style={{fontSize:11,color:P.a5,fontWeight:700,marginBottom:6}}>⚠️ This item is overdue. Replan it:</div>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                          <input type="date" style={{...S.inp,flex:1,padding:"8px 10px",fontSize:12}} onChange={e=>{if(e.target.value)snoozePending(item.id,e.target.value);}}/>
                          <span style={{fontSize:11,color:P.muted,flexShrink:0}}>Set new target date</span>
                        </div>
                      </div>}

                      {/* Follow-up history */}
                      {item.followUps&&item.followUps.length>0&&<div style={{marginBottom:8}}>
                        <div style={{fontSize:10,color:P.muted,fontWeight:700,marginBottom:4}}>FOLLOW-UP HISTORY ({item.followUps.length})</div>
                        {item.followUps.map((fu,i)=>(
                          <div key={i} style={{fontSize:11,color:P.sub,padding:"4px 8px",background:`${P.bg}88`,borderRadius:5,marginBottom:3,display:"flex",gap:8}}>
                            <span style={{color:P.muted,flexShrink:0}}>{fu.date}</span>
                            <span>{fu.note}</span>
                          </div>
                        ))}
                      </div>}

                      {/* Add follow-up note */}
                      {followUpId===item.id?(
                        <div style={{display:"flex",gap:6,alignItems:"center"}}>
                          <input style={{...S.inp,flex:1,padding:"8px 10px",fontSize:12}} placeholder="What happened? What was discussed? Next step..." value={followUpNote} onChange={e=>setFollowUpNote(e.target.value)} autoFocus/>
                          <button style={{...S.btn(P.a2),padding:"8px 14px",fontSize:11,flexShrink:0}} onClick={()=>addFollowUp(item.id)}>Save</button>
                          <button style={{background:"transparent",border:`1px solid ${P.border}`,borderRadius:8,padding:"8px 10px",color:P.muted,fontSize:11,cursor:"pointer",flexShrink:0}} onClick={()=>{setFollowUpId(null);setFollowUpNote("");}}>✕</button>
                        </div>
                      ):(
                        <button onClick={()=>{setFollowUpId(item.id);setFollowUpNote("");}} style={{background:`${P.a1}12`,border:`1px solid ${P.a1}30`,borderRadius:7,padding:"5px 12px",color:P.a1,fontSize:11,cursor:"pointer",fontWeight:600}}>+ Add Follow-Up Note</button>
                      )}

                      {/* Staleness warning */}
                      {daysSince>=3&&item.status!=="Done"&&<div style={{fontSize:10,color:P.muted,marginTop:8,fontStyle:"italic"}}>⏱ Last updated {daysSince} days ago — needs a follow-up note</div>}
                    </div>
                  );
                };
                return(<div>
                  {overdue.length>0&&<div style={{marginBottom:16}}>
                    <div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:10}}>⚠️ Overdue — Replan Required ({overdue.length})</div>
                    {overdue.map(renderItem)}
                  </div>}
                  {active.length>0&&<div style={{marginBottom:16}}>
                    <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:10}}>🔵 Active Follow-Ups ({active.length})</div>
                    {active.map(renderItem)}
                  </div>}
                  {done.length>0&&<div>
                    <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:10}}>✅ Completed ({done.length})</div>
                    {done.map(renderItem)}
                  </div>}
                </div>);
              })()}
            </div>}

            {/* ── DEV IDEAS ── */}
            {offDay==="ideas"&&<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:P.a4}}>🚀 Dev Improvement Ideas</div>
                  <div style={{fontSize:11,color:P.muted,marginTop:2}}>Ideas to automate, improve or upskill your TCS DE work</div>
                </div>
                <button style={{...S.btn(P.a4),padding:"6px 14px",fontSize:11}} onClick={()=>setShowDF(!showDF)}>{showDF?"✕":"+ Add"}</button>
              </div>
              {showDF&&<div style={{...S.C(),marginBottom:12}}>
                <div style={{marginBottom:8}}><div style={S.L}>Idea</div><textarea style={{...S.ta,minHeight:55}} value={dF.idea} onChange={e=>setDF({...dF,idea:e.target.value})} placeholder="Automate INC status report using Python, Build SQL template library, Use GenAI for DataStage documentation..."/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div><div style={S.L}>Category</div><select style={S.sel} value={dF.cat} onChange={e=>setDF({...dF,cat:e.target.value})}><option>Automation</option><option>Skill Building</option><option>Process Improvement</option><option>Tool/Script</option><option>Documentation</option><option>AI/GenAI</option></select></div>
                  <div><div style={S.L}>Status</div><select style={S.sel} value={dF.status} onChange={e=>setDF({...dF,status:e.target.value})}><option>Idea</option><option>Planning</option><option>In Progress</option><option>Done</option></select></div>
                </div>
                <button style={S.btn(P.a4)} onClick={addIdea}>Add Idea</button>
              </div>}
              {ideas.length===0&&!showDF&&(
                <div>
                  <div style={{textAlign:"center",padding:"12px 0 8px",color:P.muted,fontSize:12}}>No ideas yet. Quick-add from suggestions below:</div>
                  {["Automate daily INC status report using Python + email","Build a reusable SQL query template library in GitHub","Write a shell script to monitor ETL job failures","Use GenAI to auto-document DataStage job mappings","Build a Python dashboard for TCS ticket analytics"].map((idea,i,arr)=>(
                    <div key={i} onClick={()=>{setDF({idea,cat:"Automation",status:"Idea"});setShowDF(true);}} style={{fontSize:12,color:P.muted,padding:"7px 0",cursor:"pointer",borderBottom:i===arr.length-1?"none":`1px solid ${P.border}22`,display:"flex",gap:8}}>
                      <span style={{color:P.a4}}>+</span>{idea}
                    </div>
                  ))}
                </div>
              )}
              {ideas.map(d=>(<div key={d.id} style={{background:P.card3,borderRadius:9,padding:"10px 12px",marginBottom:6,border:`1px solid ${P.border}`}}><div style={{display:"flex",gap:5,marginBottom:5}}><span style={S.chip(P.a4)}>{d.cat}</span><span style={S.chip(stC[d.status]||P.muted)}>{d.status}</span></div><div style={{fontSize:13,color:P.sub,lineHeight:1.4}}>{d.idea}</div></div>))}
            </div>}
          </div>}

                    {/* HEALTH – PIN GATED */}
          {tab==="health"&&<PinGate label="Health & Wellness" color={P.a2} icon="❤️" storeKey="health">
            <div>
              <div style={{...S.ib(P.a2),display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
                <span style={{fontSize:18}}>🔒</span>
                <div><div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:2}}>PIN-protected · Stored only on this device</div><div style={{fontSize:11,color:P.muted}}>Your health data is completely private.</div></div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",flexWrap:"wrap"}}>
                {[["today","📋 Today"],["diet","🥗 Diet"],["exercise","🚶 Exercise"],["meds","💊 Meds"],["log","📈 Log"],["ask","🤖 Ask"]].map(([id,lb])=><button key={id} style={S.pill(hTab===id,P.a2)} onClick={()=>setHTab(id)}>{lb}</button>)}
              </div>

              {hTab==="today"&&<div>
                <div style={{display:"flex",gap:5,marginBottom:14,overflowX:"auto"}}>
                  {Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);}).map(d=>{
                    const e=healthLog[d];const isSel=d===hDay;
                    return <div key={d} onClick={()=>switchH(d)} style={{minWidth:54,...gl(isSel?P.a2:null),borderRadius:10,padding:"7px 4px",textAlign:"center",cursor:"pointer",flexShrink:0,border:`1px solid ${isSel?P.a2:P.border}`}}>
                      <div style={{fontSize:10,color:isSel?P.a2:P.muted,fontWeight:700}}>{fmtDate(d).slice(0,3)}</div>
                      <div style={{fontSize:14,margin:"2px 0"}}>{e?.mood?mE[+e.mood]:"·"}</div>
                      {e?.bs&&<div style={{fontSize:9,color:bsC(e.bs),fontWeight:700}}>{e.bs}</div>}
                    </div>;
                  })}
                </div>
                <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:14}}>{fmtDate(hDay)} {hDay===todayKey()?"(Today)":""}</div>
                <div style={{...S.CA(P.a4),marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:P.a4,marginBottom:12}}>💊 Medicines today?</div>
                  <div style={{display:"flex",gap:10}}>
                    {[["morning","☀️ Morning"],["night","🌙 Night"]].map(([key,lb])=>(
                      <div key={key} onClick={()=>setHForm(f=>({...f,meds:{...f.meds,[key]:!f.meds[key]}}))} style={{flex:1,...gl(hForm.meds[key]?P.a2:null),borderRadius:10,padding:"14px 10px",textAlign:"center",cursor:"pointer",border:`1px solid ${hForm.meds[key]?P.a2:P.border}`}}>
                        <div style={{fontSize:26}}>{hForm.meds[key]?"✅":"⬜"}</div>
                        <div style={{fontSize:12,color:hForm.meds[key]?P.a2:P.muted,marginTop:6,fontWeight:hForm.meds[key]?700:400}}>{lb}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div style={S.C()}><div style={S.L}>⚖️ Weight (kg)</div><input style={S.inp} type="number" placeholder="140" value={hForm.weight} onChange={e=>setHForm(f=>({...f,weight:e.target.value}))}/>{hForm.weight&&<div style={{fontSize:11,color:P.muted,marginTop:5}}>BMI: {(+hForm.weight/(1.84*1.84)).toFixed(1)}</div>}</div>
                  <div style={S.C()}><div style={S.L}>🩸 Blood Sugar (mg/dL)</div><input style={S.inp} type="number" placeholder="197" value={hForm.bs} onChange={e=>setHForm(f=>({...f,bs:e.target.value}))}/>{hForm.bs&&<div style={{fontSize:11,color:bsC(hForm.bs),marginTop:5,fontWeight:700}}>{+hForm.bs<100?"✅ Normal":+hForm.bs<140?"⚠️ OK":"🔴 High"}</div>}</div>
                </div>
                <div style={{...S.C(),marginBottom:12}}>
                  <div style={S.L}>💧 Water: {hForm.water} glasses (target 8)</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"6px 0"}}>{[0,1,2,3,4,5,6,7,8].map(n=><div key={n} onClick={()=>setHForm(f=>({...f,water:String(n)}))} style={{fontSize:22,cursor:"pointer",opacity:+hForm.water>=n?1:0.2}}>💧</div>)}</div>
                </div>
                <div style={{...S.C(),marginBottom:12}}>
                  <div style={S.L}>Mood today?</div>
                  <div style={{display:"flex",gap:8}}>{["1","2","3","4","5"].map(m=><button key={m} onClick={()=>setHForm(f=>({...f,mood:m}))} style={{fontSize:26,...gl(hForm.mood===m?P.a2:null),border:`1px solid ${hForm.mood===m?P.a2:P.border}`,borderRadius:10,padding:"6px 10px",cursor:"pointer"}}>{mE[+m]}</button>)}</div>
                </div>
                <div style={{...S.C(),marginBottom:12}}><div style={S.L}>📝 Note (optional)</div><textarea style={{...S.ta,minHeight:70}} placeholder="What did you eat? How do you feel? Any symptoms? No judgment here." value={hForm.note} onChange={e=>setHForm(f=>({...f,note:e.target.value}))}/></div>
                <button style={S.btn(P.a2)} onClick={saveHealth}>{hSaved?"✅ Saved!":"💾 Save Today"}</button>
                <div style={{...S.ib(P.a5),marginTop:14}}><div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>⚠️ Glycomet GP reminder</div><div style={{fontSize:12,color:P.muted}}>Never skip a meal after taking Glycomet GP. Glimepiride causes dangerous hypoglycemia without food. Eat within 30 minutes of taking it — every dose, morning and night.</div></div>
              </div>}

              {hTab==="diet"&&<div>
                <div style={{...S.ib(P.a2),marginBottom:14}}><div style={{fontSize:13,color:P.a2,fontWeight:700,marginBottom:4}}>🥗 South Indian Diet Plan</div><div style={{fontSize:12,color:P.muted}}>Built around your diabetes and medicines. No crash diets. No food bans. Sustainable changes only.</div></div>
                {dietPlan.map((m,i)=><div key={i} style={{...S.CA(P.a2),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,fontWeight:700,color:P.text}}>{m.emoji} {m.meal}</div><span style={S.chip(P.a3)}>{m.time}</span></div>
                  {m.items.map((item,j)=><div key={j} style={{fontSize:13,color:P.sub,padding:"3px 0",display:"flex",gap:8}}><span style={{color:P.a2,fontWeight:700,flexShrink:0}}>›</span>{item}</div>)}
                  <div style={{fontSize:11,color:P.muted,background:`${P.bg}88`,borderRadius:7,padding:"6px 10px",marginTop:8}}>💡 {m.why}</div>
                </div>)}
                <div style={{...S.CA(P.a5)}}><div style={{fontSize:13,fontWeight:700,color:P.a5,marginBottom:10}}>🚫 Reduce (not ban) these</div>{[["White rice in excess","Switch to brown rice or reduce portion by one-third"],["Sugar in tea or coffee","Try half, then work toward zero"],["Deep fried snacks daily","Limit to 2-3 times per week"],["Sweet pongal, halwa, payasam","Keep for special occasions"],["Soft drinks and packaged juices","Replace with buttermilk or lemon water"]].map(([f,a],i,arr)=><div key={i} style={{...S.li(i===arr.length-1),flexDirection:"column",gap:2}}><span style={{color:P.a5,fontWeight:600}}>{f}</span><span style={{color:P.muted,fontSize:12}}>→ {a}</span></div>)}</div>
              </div>}

              {hTab==="exercise"&&<div>
                <div style={{...S.ib(P.a3),marginBottom:14}}><div style={{fontSize:13,color:P.a3,fontWeight:700,marginBottom:4}}>🚶 Your Gentle Exercise Plan</div><div style={{fontSize:12,color:P.muted}}>You called yourself lazy — totally valid. This plan starts so small it barely counts as exercise. No gym. No pressure. Just move a little more than yesterday.</div></div>
                {exercisePlan.map((e,i)=><div key={i} style={{...S.CA(P.a3),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:6}}><div style={{fontSize:13,fontWeight:700,color:P.a3}}>{e.day}</div><span style={S.chip(P.a2)}>{e.level}</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:P.text,marginBottom:2}}>{e.activity}</div>
                  <div style={{fontSize:12,color:P.muted,marginBottom:8}}>Duration: {e.duration}</div>
                  <div style={{fontSize:12,color:P.sub,background:`${P.bg}88`,borderRadius:7,padding:"7px 10px"}}>{e.tip}</div>
                </div>)}
                <div style={{...S.ib(P.a4)}}><div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:4}}>🧠 Bipolar I note</div><div style={{fontSize:12,color:P.muted,lineHeight:1.6}}>Energy varies day to day. On bad days: cancel the walk, do 2 min stretching on your bed. That still counts. Mental health always comes first.</div></div>
              </div>}

              {hTab==="meds"&&<div>
                <div style={{...S.ib(P.a5),marginBottom:14}}><div style={{fontSize:12,color:P.a5,fontWeight:700,marginBottom:3}}>⚠️ Always eat before Glycomet GP — every dose</div><div style={{fontSize:12,color:P.muted}}>Glimepiride causes dangerous hypoglycemia without food. Eat within 30 minutes of each dose.</div></div>
                {medicines.map((slot,i)=><div key={i} style={{...S.CA(slot.color),marginBottom:12}}><div style={{fontSize:14,fontWeight:700,color:slot.color,marginBottom:12}}>{slot.time}</div>{slot.meds.map((med,j,arr)=><div key={j} style={{...S.li(j===arr.length-1),alignItems:"center"}}><span style={{color:slot.color,flexShrink:0}}>💊</span><span style={{fontSize:13}}>{med}</span></div>)}</div>)}
              </div>}

              {hTab==="log"&&<div>
                <div style={S.h2}>📈 Health Log</div>
                {Object.keys(healthLog).length===0?<div style={{textAlign:"center",padding:"40px 0",color:P.muted,fontSize:13}}>No entries yet. Start from the Today tab.</div>:
                Object.entries(healthLog).sort((a,b)=>b[0].localeCompare(a[0])).map(([k,e])=>(
                  <div key={k} onClick={()=>{switchH(k);setHTab("today");}} style={{...S.C(),cursor:"pointer",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{color:P.a2,fontSize:12,fontWeight:700}}>{fmtDate(k)}</span><span style={{fontSize:20}}>{e.mood?mE[+e.mood]:"·"}</span></div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {e.weight&&<span style={S.chip(P.a1)}>⚖️ {e.weight}kg</span>}
                      {e.bs&&<span style={S.chip(bsC(e.bs))}>🩸 {e.bs}</span>}
                      {e.water&&<span style={S.chip(P.a4)}>💧 {e.water}gl</span>}
                      {e.meds?.morning&&<span style={S.chip(P.a2)}>☀️✓</span>}
                      {e.meds?.night&&<span style={S.chip(P.a4)}>🌙✓</span>}
                    </div>
                    {e.note&&<div style={{fontSize:12,color:P.muted,marginTop:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.note}</div>}
                  </div>
                ))}
              </div>}

              {hTab==="ask"&&<div>
                <div style={S.h2}>🤖 Health Coach</div>
                <div style={{...S.ib(P.a2),marginBottom:14}}><div style={{fontSize:12,color:P.a2,fontWeight:600,marginBottom:3}}>Judgment-free zone. Ask anything.</div><div style={{fontSize:12,color:P.muted}}>Your full medical profile is loaded. No question is too personal.</div></div>
                <div style={{marginBottom:14}}>
                  <div style={S.L}>Quick questions</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {["What to eat on a bad mental health day?","I ate lots of sweets — what now?","Can I eat rice daily with diabetes?","Best South Indian breakfast for blood sugar?","I skipped my walk — am I failing?","What happens if blood sugar drops too low?","I don't feel like eating but need Glycomet GP — what do I do?"].map((q,i)=><button key={i} onClick={()=>setHAiQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>)}
                  </div>
                </div>
                <textarea style={{...S.ta,minHeight:70,marginBottom:10}} placeholder="Ask about food, medicines, mood, exercise..." value={hAiQ} onChange={e=>setHAiQ(e.target.value)}/>
                <button style={{...S.btn(hAiLoad?P.muted:P.a2),marginBottom:14,opacity:hAiLoad?0.7:1}} onClick={askH} disabled={hAiLoad}>{hAiLoad?"⏳ Thinking...":"💬 Ask Health Coach"}</button>
                {hAiA&&<div style={{...S.CA(P.a2)}}><div style={{fontSize:11,color:P.a2,fontWeight:700,marginBottom:10}}>Health Coach says:</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{hAiA}</div></div>}
              </div>}
            </div>
          </PinGate>}

          {/* JOURNAL – PIN GATED */}
          {tab==="journal"&&<PinGate label="Personal Journal" color={P.a1} icon="📓" storeKey="journal">
            <div>
              <div style={S.h2}>📓 Daily Journal</div>
              <div style={{display:"flex",gap:5,marginBottom:16,overflowX:"auto"}}>
                {last7.map(d=>{const e=entries[d];const isT=d===todayKey();const isSel=d===selDay;return(
                  <div key={d} onClick={()=>setSelDay(d)} style={{minWidth:54,...gl(isSel?P.a1:null),borderRadius:10,padding:"7px 4px",textAlign:"center",cursor:"pointer",flexShrink:0,border:`1px solid ${isSel?P.a1:P.border}`}}>
                    <div style={{fontSize:10,color:isSel?P.a1:P.muted,fontWeight:700}}>{fmtDate(d).slice(0,3)}</div>
                    <div style={{fontSize:14,margin:"2px 0"}}>{e?.mood?mE[+e.mood]:(isT?"📝":"·")}</div>
                    {e?.note&&<div style={{width:5,height:5,background:P.a2,borderRadius:"50%",margin:"0 auto"}}/>}
                  </div>
                );})}
              </div>
              <div style={{...S.CA(P.a1)}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:14}}>{fmtDate(selDay)} {selDay===todayKey()?"(Today)":""}</div>
                <div style={S.L}>How was your day?</div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>{["1","2","3","4","5"].map(m=><button key={m} onClick={()=>setDMood(m)} style={{fontSize:24,...gl(dMood===m?P.a1:null),border:`1px solid ${dMood===m?P.a1:P.border}`,borderRadius:10,padding:"5px 10px",cursor:"pointer"}}>{mE[+m]}</button>)}</div>
                <div style={S.L}>Today's note</div>
                <textarea style={{...S.ta,minHeight:100,marginBottom:14}} placeholder="What did you study? What went well? PhD progress, TCS work, job hunt, anything..." value={dNote} onChange={e=>setDNote(e.target.value)}/>
                <div style={S.L}>🔔 Tomorrow's reminder</div>
                <input style={{...S.inp,marginBottom:16}} placeholder="e.g. Submit PhD assignment, apply to 3 roles, LeetCode 2 problems..." value={dRem} onChange={e=>setDRem(e.target.value)}/>
                <button style={S.btn(jSaved?P.a2:P.a1)} onClick={saveJournal}>{jSaved?"✅ Saved!":"💾 Save Entry"}</button>
              </div>
              {(()=>{const y=new Date();y.setDate(y.getDate()-1);const yk=y.toISOString().slice(0,10);const ye=entries[yk];if(!ye?.reminder)return null;return(
                <div style={{...S.ib(P.a3),marginTop:4}}><div style={{fontSize:11,color:P.a3,fontWeight:700,marginBottom:3}}>🔔 Yesterday's reminder for today</div><div style={{fontSize:13,color:P.sub}}>{ye.reminder}</div></div>
              );})()}
              {Object.keys(entries).length>0&&<div style={{...S.C(),marginTop:4}}>
                <div style={S.L}>Recent entries</div>
                {Object.entries(entries).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,5).map(([k,e])=>(
                  <div key={k} onClick={()=>setSelDay(k)} style={{...S.li(false),cursor:"pointer",flexDirection:"column",gap:3}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:P.a1,fontSize:12,fontWeight:700}}>{fmtDate(k)}</span><span style={{fontSize:16}}>{e.mood?mE[+e.mood]:""}</span></div>
                    {e.note&&<div style={{fontSize:12,color:P.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"95%"}}>{e.note}</div>}
                    {e.reminder&&<div style={{fontSize:11,color:P.a3}}>🔔 {e.reminder}</div>}
                  </div>
                ))}
              </div>}
            </div>
          </PinGate>}

          {/* CERTS */}
          {tab==="certs"&&<div>
            <div style={S.h2}>🏅 Certification Roadmap 2026</div>

            {/* CLAUDE CERT URGENT BANNER */}
            {(()=>{
              const days=Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24)));
              const pct=Math.round((1-(days/42))*100);
              return(
                <div style={{...gl(P.a5),padding:16,marginBottom:14,borderRadius:14,border:`2px solid ${P.a5}88`,...glow(P.a5)}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:28}}>🚨</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:P.a5}}>Claude Certified Developer Foundations (CCDV-F)</div>
                      <div style={{fontSize:12,color:P.muted,marginTop:2}}>Anthropic Official Certification — Deadline August 31, 2026</div>
                    </div>
                    <div style={{textAlign:"center",minWidth:60}}>
                      <div style={{fontSize:32,fontWeight:900,color:days<=14?P.a5:days<=30?P.a3:P.a2,lineHeight:1}}>{days}</div>
                      <div style={{fontSize:10,color:P.muted}}>days left</div>
                    </div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.06)",borderRadius:6,height:8,marginBottom:10,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:`linear-gradient(90deg,${P.a5},${P.a3})`,borderRadius:6,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {[["📚 Study Now","claude.ai/docs"],["🔧 API Docs","docs.anthropic.com"],["🎯 Prompt Guide","anthropic.com/research"],["💡 Practice","console.anthropic.com"]].map(([lb,url])=>(
                      <a key={lb} href={`https://${url}`} target="_blank" rel="noreferrer" style={{...S.btn(P.a5),padding:"6px 12px",fontSize:11,textDecoration:"none",display:"inline-block"}}>{lb}</a>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Cert sub-tabs */}
            <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
              {[["roadmap","📅 Roadmap"],["claude","🤖 Claude CCDV-F"],["study","📚 Study Coach"]].map(([id,lb])=>(
                <button key={id} style={S.pill(certTab===id,P.a3)} onClick={()=>setCertTab(id)}>{lb}</button>
              ))}
            </div>

            {/* ROADMAP TAB */}
            {certTab==="roadmap"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>Your cert stack: CCDV-F → Databricks DEA → Gemini → GCP → AWS → dbt</div>
                <div style={{fontSize:12,color:P.muted}}>Each cert adds ₹3–10 LPA to market value. CCDV-F is the most urgent — deadline Aug 31.</div>
              </div>
              {certList.map((c,i)=>{
                const days = c.cert.includes("CCDV-F") ? Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24))) : null;
                return(
                  <div key={i} style={{...S.CA(c.color),marginBottom:10,...(c.urgent?glow(c.color):{})}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6,marginBottom:6}}>
                      <div style={{flex:1}}>
                        <span style={{fontWeight:700,fontSize:14,color:c.urgent?c.color:P.text}}>{c.urgent?"🚨 ":""}{c.cert}</span>
                        {days!==null&&<span style={{marginLeft:8,...S.chip(days<=14?P.a5:days<=30?P.a3:P.a2),fontSize:10}}>{days}d left</span>}
                      </div>
                      <span style={S.chip(c.color)}>{c.when}</span>
                    </div>
                    <div style={{fontSize:12,color:c.color,marginBottom:6,fontWeight:600}}>{c.status}</div>
                    <div style={{fontSize:12,color:P.muted,lineHeight:1.55}}>{c.tip}</div>
                  </div>
                );
              })}
            </div>}

            {/* CLAUDE CCDV-F STUDY GUIDE */}
            {certTab==="claude"&&<div>
              <div style={{...S.ib(P.a5),marginBottom:14}}>
                <div style={{fontSize:13,color:P.a5,fontWeight:800,marginBottom:4}}>🚨 Claude CCDV-F — Complete Study Guide</div>
                <div style={{fontSize:12,color:P.muted}}>Deadline: August 31, 2026. Study 30 min/day. Topics below cover everything tested.</div>
              </div>

              {[
                {topic:"1. Claude Models & Capabilities",color:P.a1,items:[
                  "Claude 3 family: Haiku (fast/cheap), Sonnet (balanced), Opus (most capable)",
                  "Context windows: Haiku 200K, Sonnet 200K, Opus 200K tokens",
                  "Multimodal: Claude can process images, PDFs, documents alongside text",
                  "Claude's constitution: helpful, harmless, honest — the three H's",
                  "When to use which model: Haiku for simple tasks, Sonnet for most use cases, Opus for complex reasoning",
                ]},
                {topic:"2. Anthropic API Fundamentals",color:P.a2,items:[
                  "API endpoint: POST https://api.anthropic.com/v1/messages",
                  "Required headers: x-api-key, anthropic-version, content-type",
                  "Message structure: role (user/assistant), content (string or array)",
                  "System prompts: set behaviour, persona, constraints before conversation",
                  "Max tokens: controls response length (not input length)",
                  "Temperature: 0=deterministic, 1=creative. Default 1.0",
                  "Streaming: stream:true for real-time token-by-token output",
                ]},
                {topic:"3. Prompt Engineering",color:P.a3,items:[
                  "Be specific and clear — Claude follows instructions literally",
                  "System prompt vs user prompt — system sets context, user gives task",
                  "Chain of thought: ask Claude to 'think step by step' for reasoning tasks",
                  "Few-shot prompting: provide 2-3 examples before the actual request",
                  "Role assignment: 'You are an expert in X' improves domain-specific output",
                  "Output formatting: specify JSON, markdown, bullet points explicitly",
                  "XML tags: use <instructions>, <context>, <output> for structure",
                ]},
                {topic:"4. Tool Use (Function Calling)",color:P.a4,items:[
                  "Define tools as JSON schema with name, description, input_schema",
                  "Claude decides when to call tools based on the conversation",
                  "Tool result must be returned to Claude in next message",
                  "Multiple tools can be defined — Claude picks the right one",
                  "Use for: web search, calculators, databases, APIs, code execution",
                  "Stop reason: 'tool_use' means Claude wants to call a function",
                ]},
                {topic:"5. Safety & Responsible AI",color:P.a5,items:[
                  "Constitutional AI: Claude trained to be helpful, harmless, honest",
                  "Refusal patterns: Claude may refuse harmful, illegal, or unethical requests",
                  "Content policy: no CSAM, no weapons of mass destruction, no illegal activity",
                  "Jailbreaking: attempting to bypass safety is against ToS and will be rejected",
                  "Privacy: don't send PII unnecessarily; Claude doesn't store conversations",
                  "Rate limits: understand token/request limits for production systems",
                ]},
                {topic:"6. Multi-turn Conversations",color:P.a2,items:[
                  "Pass full message history in messages array for context continuity",
                  "Alternating user/assistant turns — must start with user",
                  "Claude has no memory between separate API calls — you manage history",
                  "Summarisation strategy: compress old turns to save context window",
                  "System prompt persists across all turns of a conversation",
                  "Assistant prefill: pre-fill Claude's response to guide format",
                ]},
                {topic:"7. Vision & Document Processing",color:P.a1,items:[
                  "Send images as base64 or URL in content array",
                  "Image types: JPEG, PNG, GIF, WebP supported",
                  "PDF support: send as base64 with media_type application/pdf",
                  "Vision use cases: document parsing, chart analysis, UI feedback, OCR",
                  "Max image size: 5MB per image",
                  "Multiple images: supported in single request",
                ]},
                {topic:"8. Production Best Practices",color:P.a3,items:[
                  "Error handling: handle rate limits (429), server errors (5xx), timeouts",
                  "Retry logic with exponential backoff for reliability",
                  "Prompt caching: use cache_control for frequently used system prompts",
                  "Batch API: for large-scale async processing at 50% cost discount",
                  "Cost optimisation: use Haiku for simple tasks, reserve Sonnet/Opus for complex",
                  "Evaluation: test prompts on diverse inputs before production",
                ]},
              ].map((section,i)=>(
                <div key={i} style={{...S.CA(section.color),marginBottom:10}}>
                  <div style={{fontSize:13,fontWeight:700,color:section.color,marginBottom:10}}>{section.topic}</div>
                  {section.items.map((item,j,arr)=>(
                    <div key={j} style={{...S.li(j===arr.length-1),fontSize:12}}>
                      <span style={{color:section.color,fontWeight:700,flexShrink:0}}>›</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Study schedule */}
              <div style={{...S.ib(P.a2),marginTop:4}}>
                <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:8}}>📅 30-day Study Plan (Start Today!)</div>
                {[
                  ["Week 1 (Days 1-7)","Read Anthropic docs: Models, API basics, Messages API. Build a simple chatbot using the API. Test streaming."],
                  ["Week 2 (Days 8-14)","Study prompt engineering deeply. Practice few-shot, CoT, XML tags. Build a tool-use example. Study vision API."],
                  ["Week 3 (Days 15-21)","Focus on safety, multi-turn conversations, production practices. Study batch API and caching. Practice exam questions."],
                  ["Week 4 (Days 22-30)","Full revision of all 8 topics. Take practice tests. Use the Study Coach below for weak areas. Book exam slot."],
                ].map(([w,t],i,arr)=>(
                  <div key={i} style={{...S.li(i===arr.length-1),flexDirection:"column",gap:3}}>
                    <span style={{color:P.a2,fontWeight:700,fontSize:12}}>{w}</span>
                    <span style={{fontSize:12,color:P.muted}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>}

            {/* AI STUDY COACH */}
            {certTab==="study"&&<div>
              <div style={S.h2}>📚 Claude CCDV-F Study Coach</div>
              <div style={{...S.ib(P.a4),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>Ask anything about the Claude certification</div>
                <div style={{fontSize:12,color:P.muted}}>Powered by Claude itself — the best way to learn Claude is to use Claude.</div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {["Explain tool use with a code example","What is the difference between system prompt and user prompt?","How does prompt caching work and when should I use it?","What are Claude's safety guidelines I need to know for the exam?","Explain multi-turn conversation structure with an example","What is constitutional AI and how does it affect Claude's behaviour?","How do I send an image to Claude in the API?","What are the token limits for each Claude model?"].map(q=>(
                  <button key={q} onClick={()=>setCertStudyQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>
                ))}
              </div>
              <textarea style={{...S.ta,minHeight:70,marginBottom:10}} placeholder="Ask any question about Claude, the API, prompt engineering, tool use, safety..." value={certStudyQ} onChange={e=>setCertStudyQ(e.target.value)}/>
              <button style={{...S.btn(certStudyLoad?P.muted:P.a5),opacity:certStudyLoad?0.7:1,width:"100%",marginBottom:14,...(certStudyLoad?{}:glow(P.a5))}} onClick={askCertStudy} disabled={certStudyLoad}>
                {certStudyLoad?"⏳ Thinking...":"🤖 Ask Claude (your study coach)"}
              </button>
              {certStudyA&&<div style={{...S.CA(P.a4)}}><div style={{fontSize:11,color:P.a4,fontWeight:700,marginBottom:10}}>Study Coach says:</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{certStudyA}</div></div>}
            </div>}
          </div>}

                    {tab==="govt"&&<div>
            <div style={S.h2}>🏛️ Government Tech Jobs 2026</div>
            <div style={{...S.ib(P.a2),marginBottom:14}}>
              <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>Your eligibility: B.E ECE + M.Tech DS + 4.3yr exp + PhD SSN ongoing = strong govt profile</div>
              <div style={{fontSize:12,color:P.muted}}>SC reservation gives major advantage. UGC NET prep overlaps heavily with DRDO/ISRO/NIC exam syllabus — double benefit.</div>
            </div>
            {govtJobs.map((g,i)=><div key={i} style={{...S.CA(g.color)}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:20}}>{g.icon}</span><span style={{fontWeight:700,fontSize:15,color:P.text}}>{g.org}</span></div>
              <div style={{fontSize:12,color:P.sub,marginBottom:3}}><span style={{color:P.muted}}>Role: </span>{g.role}</div>
              <div style={{fontSize:12,color:P.sub,marginBottom:5}}><span style={{color:P.muted}}>Physical: </span>{g.physical}</div>
              <div style={{fontSize:12,color:g.color,fontWeight:600}}>{g.timing}</div>
            </div>)}
            <div style={S.C()}>
              <div style={{fontSize:13,fontWeight:700,color:P.text,marginBottom:10}}>📋 Strategy for Govt Roles</div>
              {["Register on ALL portals now (drdo.gov.in, isro.gov.in, nic.in, cdac.in) — set email alerts","Your UGC NET Dec 2026 prep (DBMS, OS, Networks, DSA) overlaps 70%+ with DRDO/ISRO/NIC exam syllabus","SC reservation: 15% reservation + 5 years age relaxation in most central govt orgs","PhD in progress at SSN is a strong differentiator for Scientist-grade posts","Keep a tracker: org, post, notification date, exam date, application status","BEL/HAL/ECIL 2027 recruitment — start preparing now in parallel"].map((tip,i,arr)=>(
                <div key={i} style={S.li(i===arr.length-1)}><span style={{color:P.a2,fontWeight:700,flexShrink:0}}>›</span><span style={{fontSize:13}}>{tip}</span></div>
              ))}
            </div>
          </div>}

          {/* COACH */}
          {tab==="buddy"&&<div>
            <div style={S.h2}>🫂 Advice Buddy — Your Personal Life Coach</div>
            <div style={{...S.ib(P.a4),marginBottom:14}}>
              <div style={{fontSize:13,color:P.a4,fontWeight:800,marginBottom:4}}>Hi Thamizh 👋 I know everything about your life right now.</div>
              <div style={{fontSize:12,color:P.muted,lineHeight:1.6}}>TCS work · PhD at SNU · CCDV-F cert (17 days!) · UGC NET Dec · Health · Job switch · ISRO deadline Aug 17. Ask me anything — I'll give you honest, warm, practical advice.</div>
            </div>

            {/* Situation summary */}
            {(()=>{
              const days=Math.max(0,Math.ceil((new Date("2026-08-31")-new Date())/(1000*60*60*24)));
              const odPending=allPending.filter(p=>p.status!=="Done"&&p.due&&p.due<todayKey()).length;
              const odPhd=phdTasks.filter(t=>t.status!=="Done"&&t.due&&t.due<todayKey()).length;
              return(
                <div style={{...S.CA(P.a1),marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a1,marginBottom:10}}>📊 Your Current Situation (August 14, 2026)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {[
                      {l:"CCDV-F Deadline",v:`${days} days`,c:days<=14?P.a5:P.a3},
                      {l:"ISRO Deadline",v:"Aug 17 ⚠️",c:P.a5},
                      {l:"Overdue Follow-ups",v:odPending,c:odPending>0?P.a5:P.a2},
                      {l:"Overdue PhD Tasks",v:odPhd,c:odPhd>0?P.a5:P.a2},
                      {l:"PhD Meetings Logged",v:phdMeetings.length,c:phdMeetings.length>0?P.a2:P.a3},
                      {l:"UGC NET",v:"Dec 2026",c:P.a2},
                    ].map((s,i)=>(
                      <div key={i} style={{background:`${P.bg}88`,borderRadius:8,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color:P.muted}}>{s.l}</span>
                        <span style={{fontSize:12,fontWeight:700,color:s.c}}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Pre-loaded situation questions */}
            <div style={{...S.C(),marginBottom:12}}>
              <div style={S.L}>🎯 What's on your mind? Tap a question or type your own</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                {[
                  "I'm overwhelmed with TCS + PhD + certs + UGC NET. Help me prioritise today.",
                  "Should I apply to ISRO Scientist SC before Aug 17 or focus on CCDV-F cert?",
                  "How do I study for CCDV-F cert in just 17 days while working full time at TCS?",
                  "I had a bad day and don't feel like doing anything. What should I do?",
                  "How do I manage my health (Bipolar, Diabetes) while doing a PhD part-time?",
                  "I haven't logged my medicines for 2 days. I'm slipping. What should I do?",
                  "My PhD supervisor wants 15-20 keywords and 7-10 problem statements. Where do I start?",
                  "Is it realistic to clear UGC NET Dec 2026 while working full-time?",
                  "How do I stop procrastinating on job applications?",
                  "Am I taking on too much right now? Be honest with me.",
                  "How should I structure my evening 7-9 PM for maximum impact?",
                  "I feel guilty not spending enough time on PhD. How do I deal with this?",
                ].map(q=>(
                  <button key={q} onClick={()=>setAdviceQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"7px 12px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left",lineHeight:1.4}}>{q}</button>
                ))}
              </div>
              <textarea style={{...S.ta,minHeight:80,marginBottom:10}}
                placeholder={"Tell me what's on your mind...\n\nI know you're managing TCS + SNU PhD + CCDV-F cert (17 days!) + Databricks + UGC NET + ISRO application + health + job switch. What do you need help thinking through right now?"}
                value={adviceQ} onChange={e=>setAdviceQ(e.target.value)}/>
              <button style={{...S.btn(adviceLoad?P.muted:P.a4),opacity:adviceLoad?0.7:1,width:"100%",...(adviceLoad?{}:{boxShadow:`0 4px 20px ${P.a4}44`})}}
                onClick={askAdviceBuddy} disabled={adviceLoad}>
                {adviceLoad?"⏳ Thinking about this for you...":"🫂 Get Advice"}
              </button>
            </div>

            {adviceA&&<div style={{...S.CA(P.a4),marginBottom:12}}>
              <div style={{fontSize:11,color:P.a4,fontWeight:700,marginBottom:8}}>🫂 Advice Buddy says:</div>
              <div style={{fontSize:13,color:P.sub,lineHeight:1.75,whiteSpace:"pre-wrap"}}>{adviceA}</div>
            </div>}

            {/* Daily energy management */}
            <div style={{...S.CA(P.a2),marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:P.a2,marginBottom:10}}>💡 Managing Everything — Thamizh's Framework</div>
              {[
                {title:"🌅 Morning Rule (non-negotiable)",desc:"Take all morning medicines within 30 min of waking. Eat first, THEN Glycomet GP. This is your health foundation — everything else depends on it."},
                {title:"⚡ The 2-Hour Evening Block",desc:"7-9 PM is your power window. Mon/Wed/Fri = Python or UGC NET. Tue/Thu = Databricks or GenAI. Fri = PhD writing. Sat morning = deep work. This 2-hour commitment = 60 hrs/month of compounding progress."},
                {title:"🎓 PhD — 1 task per day minimum",desc:"Even on TCS heavy days, do ONE PhD task: read 1 paper abstract, write 2 sentences in your chapter draft, or log a supervisor note. Consistency beats intensity for part-time PhD."},
                {title:"📋 UGC NET — 20 MCQs every evening",desc:"20 MCQs takes 20 minutes. Do it before dinner every day. Sunday = 1 full mock test (2 hours). This rhythm over 4 months = Dec 2026 cleared. SC cutoff is just 56% — you can do this."},
                {title:"🚨 CCDV-F RIGHT NOW",desc:"30 minutes every morning before TCS work. Start with API fundamentals today. 17 days × 30 min = 8.5 hours of study. That's enough to clear a developer foundations cert. Read: docs.anthropic.com every morning."},
                {title:"❤️ Health = Priority 0",desc:"Bipolar I means some days you'll have low energy. Never feel guilty on those days. A bad day of doing nothing is better than burning out for a week. Log your mood and meds daily — data helps you see patterns."},
                {title:"🔄 Weekly Reset (Sunday 3-5 PM)",desc:"Review everything: what got done, what slipped, what to replan. Update PhD tasks, office follow-ups, cert progress. 2 hours of planning saves 10 hours of confusion during the week."},
              ].map((item,i,arr)=>(
                <div key={i} style={{...S.li(i===arr.length-1),flexDirection:"column",gap:4,paddingBottom:10}}>
                  <span style={{color:P.a2,fontWeight:700,fontSize:12}}>{item.title}</span>
                  <span style={{fontSize:12,color:P.muted,lineHeight:1.55}}>{item.desc}</span>
                </div>
              ))}
            </div>

            {/* Weekly schedule for everything */}
            <div style={S.C()}>
              <div style={S.L}>📅 This Week's Balanced Schedule (Aug 14–17)</div>
              {[
                {day:"Fri Aug 14 (Today)",tasks:["7:30 AM: 30 min CCDV-F — API fundamentals + tool use","9 AM: TCS work (check INCs, DataStage tasks)","7-8 PM: Databricks DEA course — 1 module","8-9 PM: UGC NET — 20 DBMS MCQs","9:30 PM: Log today in journal + tomorrow plan"]},
                {day:"Sat Aug 15 (Weekend Deep Work)",tasks:["8 AM: 1 hour CCDV-F — Prompt engineering + safety topics","9 AM-12 PM: PhD — Read 2 papers on multimodal wearable AI + notes","2-4 PM: Databricks DEA — 2 modules (catch up)","4 PM: Check ISRO application status + submit if not done"]},
                {day:"Sun Aug 16 (UGC NET + Review)",tasks:["9-11 AM: UGC NET full timed mock — Paper 1 + Paper 2","11-12 PM: Mock analysis — every wrong answer reviewed","3-4 PM: PhD — Log any research ideas, update task list","4-5 PM: Weekly review — update office follow-ups, PhD tasks, cert progress"]},
                {day:"Mon Aug 17 (ISRO DEADLINE)",tasks:["ISRO Scientist SC final deadline — submit before midnight if applying","7:30 AM: 30 min CCDV-F — Multi-turn conversations + vision API","Evening: UGC NET — 20 OS MCQs (scheduling algorithms)"]},
              ].map((d,i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a1,marginBottom:6}}>{d.day}</div>
                  {d.tasks.map((t,ti)=>(<div key={ti} style={{fontSize:11,color:P.sub,marginBottom:3,paddingLeft:8,display:"flex",gap:6}}><span style={{color:P.a1}}>›</span><span>{t}</span></div>))}
                </div>
              ))}
            </div>
          </div>}

                    {tab==="coach"&&<div>
            <div style={S.h2}>🤖 AI Career Coach</div>
            <div style={{...S.ib(P.a4),marginBottom:16}}>
              <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:4}}>Ask anything about your 2026 plan</div>
              <div style={{fontSize:12,color:P.muted}}>Context: TCS 4.3yr DE · PhD SSN GenAI just started · Python learner · UGC NET Dec 2026 · Databricks cert · SC category · July 2026</div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={S.L}>Quick questions</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {["Give me a 30-day Python plan from absolute zero","SQL topics that matter most for Senior DE interviews?","How do I build a RAG portfolio project step by step?","Best strategy to clear UGC NET CS Dec 2026 as SC?","How to balance PhD + TCS + job hunt + UGC NET simultaneously?","Which Chennai companies hire AI Data Engineers in 2026?","How to write a cold LinkedIn message to a recruiter?","Explain LangChain from basics with a simple real example"].map((q,i)=><button key={i} onClick={()=>setCQ(q)} style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>{q}</button>)}
              </div>
            </div>
            <div style={S.L}>Your question</div>
            <textarea style={{...S.ta,minHeight:80,marginBottom:10}} placeholder="Ask about Python, SQL, GenAI, PhD, UGC NET, salary negotiation, job applications..." value={cQ} onChange={e=>setCQ(e.target.value)}/>
            <button style={{...S.btn(cLoad?P.muted:P.a4),marginBottom:16,opacity:cLoad?0.7:1}} onClick={askC} disabled={cLoad}>{cLoad?"⏳ Thinking...":"🤖 Ask AI Coach"}</button>
            {cA&&<div style={{...S.CA(P.a4)}}><div style={{fontSize:11,color:P.a4,fontWeight:700,marginBottom:10}}>AI Coach says:</div><div style={{fontSize:13,color:P.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{cA}</div></div>}
          </div>}

          {/* ══ RESUME + ATS ══ */}

          {/* ══ LEARN CENTRE ══ */}
          {tab==="learn"&&<div>
            <div style={S.h2}>🎓 Learn Centre — Skill Trainer & Job Switch Guide</div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {[["trainer","🧑‍🏫 AI Trainer"],["quiz","📝 UGC NET Quiz"],["switch","💼 Job Switch Guide"]].map(([id,lb])=>(
                <button key={id} style={S.pill(learnTab===id,P.a4)} onClick={()=>setLearnTab(id)}>{lb}</button>
              ))}
            </div>

            {/* ── AI TRAINER ── */}
            {learnTab==="trainer"&&<div>
              <div style={{...S.ib(P.a4),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:3}}>Personal AI tutor — explains any topic from basics, gives examples, answers follow-ups</div>
                <div style={{fontSize:12,color:P.muted}}>Select a topic or type your own question. The AI knows your background (TCS DE, 4.3yr, learning Python/SQL/GenAI) and explains at the right level.</div>
              </div>

              <div style={S.C()}>
                <div style={S.L}>Quick topic buttons</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                  {[
                    ["Python Basics",P.a1],["Pandas & NumPy",P.a1],["PySpark",P.a1],
                    ["SQL Window Functions",P.a2],["SQL CTEs & Subqueries",P.a2],["dbt Basics",P.a2],
                    ["LangChain from Zero",P.a4],["What is RAG?",P.a4],["Vector Databases",P.a4],
                    ["GCP BigQuery",P.a3],["AWS Glue",P.a3],["Databricks Delta Lake",P.a3],
                    ["DBMS Normalisation",P.a2],["OS Process Scheduling",P.a2],["Graph Algorithms",P.a2],
                    ["What is Docker?",P.a5],["FastAPI Basics",P.a5],["MLflow Explained",P.a5],
                  ].map(([topic,col])=>(
                    <button key={topic} onClick={()=>{setLearnTopic(topic);setLearnQ("Teach me "+topic+" from basics. I am a Data Engineer with 4.3yr TCS experience in SQL/DataStage/Teradata. I am learning Python and GenAI. Give me a clear explanation with a simple practical example I can run.");setLearnA("");}}
                      style={{...S.chip(col),cursor:"pointer",padding:"6px 12px",fontSize:11}}>
                      {topic}
                    </button>
                  ))}
                </div>

                <div style={S.L}>Or ask your own question</div>
                <textarea style={{...S.ta,minHeight:80,marginBottom:12}}
                  placeholder={"Examples:\n• Explain PySpark DataFrames with a working code example\n• What is the difference between RANK() and DENSE_RANK() in SQL?\n• How does RAG work — explain like I'm a beginner\n• What is a Medallion architecture and when do I use it?\n• Explain the difference between Airflow and Prefect"}
                  value={learnQ} onChange={e=>setLearnQ(e.target.value)}/>

                <button style={{...S.btn(learnLoad?P.muted:P.a4),opacity:learnLoad?0.7:1,width:"100%",fontSize:14}}
                  onClick={async()=>{
                    if(!learnQ.trim())return;
                    setLearnLoad(true); setLearnA("");
                    const sys = [
                      "You are an expert tutor for Thamizamudhan K, a Data Engineer at TCS with 4.3 years experience.",
                      "Background: Expert in SQL (Teradata), IBM DataStage ETL, Unix/Shell, ServiceNow.",
                      "Currently learning: Python (beginner-intermediate), PySpark, LangChain, GCP, Databricks.",
                      "PhD in Computer Science / GenAI at SSN College of Engineering (started July 2026).",
                      "Teaching style required:",
                      "1. Start with a simple 1-2 sentence definition",
                      "2. Explain WHY it matters for his specific career (DE/AI-DE/GenAI)",
                      "3. Give a clear analogy or real-world comparison",
                      "4. Show a working code example (Python/SQL preferred) with comments",
                      "5. End with 2-3 practice exercises he can try himself",
                      "6. Mention how this topic connects to his UGC NET CS syllabus if relevant",
                      "Be encouraging, practical, and concise. Use examples from data engineering context."
                    ].join("\n");
                    try {
                      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1500,system:sys,messages:[{role:"user",content:learnQ}]})});
                      const data = await res.json();
                      setLearnA(data.content?.map(b=>b.text||"").join("")||"Error. Try again.");
                    } catch(_){ setLearnA("Connection error. Please try again."); }
                    setLearnLoad(false);
                  }}
                  disabled={learnLoad}>
                  {learnLoad?"⏳ Preparing explanation...":"🎓 Teach Me This"}
                </button>
              </div>

              {learnA&&<div style={{...S.CA(P.a4),marginTop:4}}>
                <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:10}}>🎓 Explanation: {learnTopic||"Your question"}</div>
                <div style={{fontSize:13,color:P.sub,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{learnA}</div>
                <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
                  <button onClick={()=>setLearnQ("Give me 5 practice problems on this topic with solutions: "+learnTopic)} style={{...S.btn(P.a3),padding:"7px 14px",fontSize:11}}>📝 Practice Problems</button>
                  <button onClick={()=>setLearnQ("Give me a real-world project idea using "+learnTopic+" that I can add to my GitHub portfolio as a Data Engineer")} style={{...S.btn(P.a2),padding:"7px 14px",fontSize:11}}>🏗️ Project Idea</button>
                  <button onClick={()=>setLearnQ("What are the UGC NET CS exam questions typically asked about "+learnTopic+"? Give me 5 MCQ style questions with answers")} style={{...S.btn(P.a2),padding:"7px 14px",fontSize:11}}>📋 UGC NET MCQs</button>
                </div>
              </div>}
            </div>}

            {/* ── UGC NET QUIZ ── */}
            {learnTab==="quiz"&&<div>
              <div style={{...S.ib(P.a2),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>AI-generated MCQ quiz — fresh questions every session, just like the real UGC NET</div>
                <div style={{fontSize:12,color:P.muted}}>Select a unit, generate 5 MCQs, answer them one by one, get score and explanations. Target: 4/5 or 5/5 before exam.</div>
              </div>

              {!quizLoad&&quizQs.length===0&&<div style={S.C()}>
                <div style={S.L}>Select UGC NET CS unit</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                  {["DBMS","Operating Systems","DSA & Algorithms","Theory of Computation","Computer Networks","Programming (C/Java/Python)","Software Engineering","Paper 1 — Teaching Aptitude","Paper 1 — Research Methodology","Paper 1 — Logical Reasoning","Paper 1 — Data Interpretation","Paper 1 — ICT"].map(t=>(
                    <button key={t} onClick={()=>setQuizTopic(t)}
                      style={{...S.pill(quizTopic===t,P.a2),fontSize:11}}>
                      {t}
                    </button>
                  ))}
                </div>
                <div style={{...S.ib(P.a3),marginBottom:14}}>
                  <div style={{fontSize:11,color:P.a3,fontWeight:700,marginBottom:2}}>📊 Your Dec 2026 target: SC cutoff ~56% = 84/150 · Aim for 100+/150</div>
                  <div style={{fontSize:11,color:P.muted}}>Selected unit: <b style={{color:P.a2}}>{quizTopic}</b></div>
                </div>
                <button style={{...S.btn(P.a2),width:"100%",fontSize:14}}
                  onClick={async()=>{
                    setQuizLoad(true); setQuizQs([]); setQuizIdx(0); setQuizAns(null); setQuizScore(0); setQuizDone(false);
                    const prompt = [
                      "Generate exactly 5 UGC NET CS exam-style MCQ questions on the topic: " + quizTopic,
                      "Requirements:",
                      "- Style: exactly like UGC NET December 2026 paper",
                      "- Difficulty: mix of easy (2), medium (2), hard (1)",
                      "- 4 options each (A, B, C, D)",
                      "- One correct answer only",
                      "- Include a brief explanation for the correct answer",
                      "Return ONLY valid JSON, no markdown, no backticks:",
                      '[{"q":"Question text","options":["A. option1","B. option2","C. option3","D. option4"],"correct":"A","explanation":"Why A is correct..."},...]'
                    ].join("\n");
                    try {
                      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1200,messages:[{role:"user",content:prompt}]})});
                      const data = await res.json();
                      const raw = data.content?.map(b=>b.text||"").join("")||"[]";
                      const s=raw.indexOf("["); const e=raw.lastIndexOf("]");
                      const qs = s>=0&&e>=0 ? JSON.parse(raw.slice(s,e+1)) : [];
                      setQuizQs(qs);
                    } catch(_){ alert("Error generating quiz. Please try again."); }
                    setQuizLoad(false);
                  }}>
                  🎲 Generate 5 MCQs — {quizTopic}
                </button>
              </div>}

              {quizLoad&&<div style={{textAlign:"center",padding:40,color:P.a2,fontSize:13}}>⏳ Generating {quizTopic} MCQs...</div>}

              {quizQs.length>0&&!quizDone&&(()=>{
                const q = quizQs[quizIdx];
                if(!q) return null;
                return (
                  <div>
                    <div style={{...S.CA(P.a2),marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <span style={{...S.chip(P.a2),fontSize:11}}>Q {quizIdx+1} of {quizQs.length}</span>
                        <span style={{...S.chip(P.a1),fontSize:11}}>Score: {quizScore}/{quizIdx}</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{background:"rgba(255,255,255,0.08)",borderRadius:4,height:6,marginBottom:14,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(quizIdx/quizQs.length)*100}%`,background:P.a2,borderRadius:4}}/>
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:P.text,lineHeight:1.6,marginBottom:16}}>{q.q}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {(q.options||[]).map((opt,i)=>{
                          const letter = opt.charAt(0);
                          const isCorrect = letter===q.correct;
                          const isSelected = quizAns===letter;
                          let bg = "transparent"; let border = P.border; let col = P.sub;
                          if(quizAns){
                            if(isCorrect){bg=`${P.a2}20`;border=P.a2;col=P.a2;}
                            else if(isSelected){bg=`${P.a5}20`;border=P.a5;col=P.a5;}
                          } else if(isSelected){bg=`${P.a1}20`;border=P.a1;col=P.a1;}
                          return (
                            <button key={i} onClick={()=>{ if(quizAns)return; setQuizAns(letter); if(letter===q.correct)setQuizScore(s=>s+1); }}
                              style={{padding:"11px 14px",borderRadius:10,border:`1px solid ${border}`,background:bg,color:col,fontSize:13,textAlign:"left",cursor:quizAns?"default":"pointer",transition:"all 0.2s",fontWeight:isSelected||isCorrect&&quizAns?700:400}}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizAns&&<div style={{marginTop:14,padding:"10px 14px",background:`${P.bg}88`,borderRadius:8,borderLeft:`3px solid ${quizAns===q.correct?P.a2:P.a5}`}}>
                        <div style={{fontSize:12,color:quizAns===q.correct?P.a2:P.a5,fontWeight:700,marginBottom:4}}>{quizAns===q.correct?"✅ Correct!":"❌ Incorrect — correct answer is "+q.correct}</div>
                        <div style={{fontSize:12,color:P.muted,lineHeight:1.5}}>{q.explanation}</div>
                      </div>}
                      {quizAns&&<button onClick={()=>{
                        if(quizIdx+1>=quizQs.length){setQuizDone(true);}
                        else{setQuizIdx(i=>i+1);setQuizAns(null);}
                      }} style={{...S.btn(P.a2),width:"100%",marginTop:12,fontSize:13}}>
                        {quizIdx+1>=quizQs.length?"🏁 See Results":"Next Question →"}
                      </button>}
                    </div>
                  </div>
                );
              })()}

              {quizDone&&<div>
                {(()=>{
                  const pct=Math.round((quizScore/quizQs.length)*100);
                  const col=pct>=80?P.a2:pct>=60?P.a3:P.a5;
                  return (
                    <div style={{...gl(col),padding:24,borderRadius:14,textAlign:"center",marginBottom:12}}>
                      <div style={{fontSize:56,fontWeight:900,color:col}}>{quizScore}/{quizQs.length}</div>
                      <div style={{fontSize:18,fontWeight:700,color:P.text,marginTop:4}}>{pct}% — {pct>=80?"Excellent!":pct>=60?"Good — keep going":"Need more practice"}</div>
                      <div style={{fontSize:12,color:P.muted,marginTop:6}}>
                        {pct>=80?"You're on track for UGC NET Dec 2026 for this unit":pct>=60?"Review wrong answers and retry this unit":"Spend 30 min more on this unit before retrying"}
                      </div>
                      <div style={{marginTop:14,background:"rgba(255,255,255,0.08)",borderRadius:6,height:10,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:6}}/>
                      </div>
                    </div>
                  );
                })()}
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>{setQuizQs([]);setQuizIdx(0);setQuizAns(null);setQuizScore(0);setQuizDone(false);}} style={{...S.btn(P.a2),flex:1,fontSize:13}}>🔄 New Quiz — Same Topic</button>
                  <button onClick={()=>{setQuizQs([]);setQuizIdx(0);setQuizAns(null);setQuizScore(0);setQuizDone(false);setQuizTopic("DBMS");}} style={{...S.btn(P.a3),flex:1,fontSize:13}}>📋 Change Topic</button>
                </div>
                {/* Review wrong answers */}
                <div style={{...S.C(),marginTop:12}}>
                  <div style={S.L}>Review all questions</div>
                  {quizQs.map((q,i)=>(
                    <div key={i} style={{padding:"10px 0",borderBottom:i===quizQs.length-1?"none":`1px solid ${P.border}20`}}>
                      <div style={{fontSize:12,color:P.sub,marginBottom:6,lineHeight:1.5}}><b style={{color:P.a1}}>Q{i+1}:</b> {q.q}</div>
                      <div style={{fontSize:11,color:P.a2,marginBottom:3}}>✅ Answer: {q.correct} — {(q.options||[]).find(o=>o.startsWith(q.correct))||""}</div>
                      <div style={{fontSize:11,color:P.muted,lineHeight:1.4}}>{q.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>}
            </div>}

            {/* ── JOB SWITCH GUIDE ── */}
            {learnTab==="switch"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>Your personal job switch coach — specific, honest advice for your situation</div>
                <div style={{fontSize:12,color:P.muted}}>Ask anything about your career transition: salary negotiation, interview prep, LinkedIn, applications, what to learn next, which companies to target.</div>
              </div>

              {/* Pre-set scenarios */}
              <div style={S.C()}>
                <div style={S.L}>Common questions — tap to load</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                  {[
                    "How do I negotiate a 50% salary hike when moving from TCS?",
                    "What should my LinkedIn headline and About section say for AI DE roles?",
                    "How do I explain my DataStage experience for modern cloud DE interviews?",
                    "What is a realistic salary for a Senior DE with 4.3yr experience in Chennai 2026?",
                    "How do I get interview calls from Zoho, Freshworks, and product companies?",
                    "Should I wait for Databricks cert before applying or apply now?",
                    "How do I write a cold email to a recruiter on LinkedIn that actually works?",
                    "What is the interview process at Google India for a Data Engineer?",
                    "How to answer 'Why are you leaving TCS?' in an interview professionally?",
                    "Which skills should I build first to switch to AI Data Engineer in 6 months?",
                    "How to build a portfolio that stands out when I have no public projects?",
                    "Is it better to target startups or MNCs at my level for a first switch?",
                  ].map((q,i)=>(
                    <button key={i} onClick={()=>setSwitchQ(q)}
                      style={{background:P.card3,border:`1px solid ${P.border}`,borderRadius:7,padding:"6px 11px",color:P.sub,fontSize:11,cursor:"pointer",textAlign:"left"}}>
                      {q}
                    </button>
                  ))}
                </div>

                <div style={S.L}>Your question</div>
                <textarea style={{...S.ta,minHeight:80,marginBottom:12}}
                  placeholder={"Ask anything about your job switch journey:\n• Which roles should I apply for right now with my current skills?\n• How do I prepare for a system design interview for DE roles?\n• What salary should I expect and how do I negotiate?\n• How to stand out when applying to 100+ candidates per role?"}
                  value={switchQ} onChange={e=>setSwitchQ(e.target.value)}/>

                <button style={{...S.btn(switchLoad?P.muted:P.a1),opacity:switchLoad?0.7:1,width:"100%",fontSize:14}}
                  onClick={async()=>{
                    if(!switchQ.trim())return;
                    setSwitchLoad(true); setSwitchA("");
                    const sys = [
                      "You are an expert career coach and technical recruiter specialising in the Indian tech job market (2026).",
                      "Your client: Thamizamudhan K, 27, Chennai.",
                      "Current: TCS Data Engineer, 4.3 years. SC category.",
                      "Skills: SQL expert (Teradata), IBM DataStage ETL expert, Unix/Shell, ServiceNow. Learning Python, PySpark, LangChain, GCP, Databricks.",
                      "Education: B.E ECE, M.Tech Data Science (completed), PhD CS GenAI at SSN (July 2026, ongoing, part-time).",
                      "Certs in progress: Databricks DEA (Sep 2026), GCP Professional DE (Nov 2026), Google Gemini Enterprise Dev.",
                      "UGC NET CS appearing December 2026. Considering academia as parallel career.",
                      "Goals: Switch to Senior DE or AI Data Engineer role with 40-60% hike, or secure Asst Professor position post-UGC NET.",
                      "Personality: Self-aware, realistic, working hard on multiple tracks simultaneously.",
                      "Give SPECIFIC, HONEST, ACTIONABLE advice tailored to this exact profile.",
                      "Include: realistic salary numbers (2026 Indian market), specific company names, specific steps, specific timelines.",
                      "Don't be generic. Reference his actual skills and situation. Be a trusted mentor, not a cheerleader.",
                    ].join("\n");
                    try {
                      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1200,system:sys,messages:[{role:"user",content:switchQ}]})});
                      const data = await res.json();
                      setSwitchA(data.content?.map(b=>b.text||"").join("")||"Error. Try again.");
                    } catch(_){ setSwitchA("Connection error. Please try again."); }
                    setSwitchLoad(false);
                  }}
                  disabled={switchLoad}>
                  {switchLoad?"⏳ Getting advice...":"💼 Get Career Advice"}
                </button>
              </div>

              {switchA&&<div style={{...S.CA(P.a1),marginTop:4}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:10}}>💼 Career Coach says:</div>
                <div style={{fontSize:13,color:P.sub,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{switchA}</div>
                <div style={{display:"flex",gap:8,marginTop:14,flexWrap:"wrap"}}>
                  <button onClick={()=>setSwitchQ("Based on that advice, what are the 3 most important things I should do THIS WEEK specifically?")} style={{...S.btn(P.a3),padding:"7px 14px",fontSize:11}}>📅 This Week's Actions</button>
                  <button onClick={()=>setSwitchQ("Give me a word-for-word script for the LinkedIn cold message I should send to a recruiter at that company")} style={{...S.btn(P.a4),padding:"7px 14px",fontSize:11}}>✉️ Write the Message</button>
                </div>
              </div>}

              {/* Quick reference cards */}
              <div style={{marginTop:14}}>
                <div style={S.L}>Quick Reference — 2026 Market Reality</div>
                {[
                  {title:"💰 Salary ranges for your profile (Chennai/Bangalore 2026)",color:P.a2,items:["Senior ETL/DataStage Dev: ₹10–22 LPA (apply NOW — zero reskilling)","Senior Data Engineer (PySpark+Cloud): ₹15–35 LPA (3 months away with Databricks cert)","AI Data Engineer (LangChain+RAG): ₹20–50 LPA (5-6 months away)","Analytics Engineer (SQL+dbt): ₹12–28 LPA (2-3 months away)","Asst Professor (private college): ₹6–14 LPA (post-UGC NET Dec 2026)"]},
                  {title:"🎯 Top companies hiring in Chennai/remote for your stack (2026)",color:P.a1,items:["Zoho — Data Engineers, strong SQL culture, Chennai HQ","Freshworks — Analytics/Data team, Chennai, good for DE transition","Razorpay — Data platform team, good pay, remote-friendly","Sarvam AI / Krutrim — GenAI startups, high growth, best for AI-DE pivot","IBM India — DataStage roles (immediate, no reskilling), multiple cities","Capgemini / Mphasis / DXC — ETL heavy, 50%+ hike from TCS easy"]},
                  {title:"📋 Interview stages for Senior DE roles (what to prepare)",color:P.a3,items:["Round 1: Online test — SQL (LeetCode Medium), Python basics, DSA basics","Round 2: Technical interview — SQL deep dive, ETL design, system design basics","Round 3: Technical + project — explain your DataStage pipelines, performance tuning","Round 4: Manager/HR — behavioural, salary negotiation, notice period","Tip: Your DataStage experience is RARE — mention scale (50K+ transactions, 15+ pipelines)"]},
                  {title:"⚡ What to do this week (priority order)",color:P.a5,items:["1. Update resume — Senior DE variant — apply to IBM/Capgemini/DXC THIS WEEK (zero reskilling, 40% hike)","2. Apply 5 roles/day on Naukri with keyword: DataStage, ETL, Teradata","3. Update LinkedIn headline: Data Engineer | IBM DataStage Expert | SQL | TCS 4.3yr | Databricks (in progress)","4. Set job alert on LinkedIn: 'Senior Data Engineer Chennai' and 'ETL Developer Chennai'","5. Resume Databricks DEA course — 1 hour tonight — exam in 8 weeks"]},
                ].map((card,i)=>(
                  <div key={i} style={{...S.CA(card.color),marginBottom:10}}>
                    <div style={{fontSize:13,fontWeight:700,color:card.color,marginBottom:10}}>{card.title}</div>
                    {card.items.map((item,j,arr)=><div key={j} style={S.li(j===arr.length-1)}><span style={{color:card.color,fontWeight:700,flexShrink:0}}>›</span><span style={{fontSize:12,lineHeight:1.5}}>{item}</span></div>)}
                  </div>
                ))}
              </div>
            </div>}
          </div>}


          {tab==="resume"&&<div>
            <div style={S.h2}>📄 Premium Resume Generator & ATS Checker</div>
            <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
              {[["builder","✨ Resume Builder"],["ats","🎯 ATS Checker"],["memory","☁️ Data Guide"]].map(([id,lb])=>(
                <button key={id} style={S.pill(resumeTab===id,P.a1)} onClick={()=>setResumeTab(id)}>{lb}</button>
              ))}
            </div>

            {resumeTab==="builder"&&<div>
              <div style={{...S.ib(P.a1),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a1,fontWeight:700,marginBottom:3}}>Premium AI resume — your real TCS experience, PhD, all skills pre-loaded</div>
                <div style={{fontSize:12,color:P.muted}}>Select role + paste job description → AI generates a tailored, ATS-optimised resume matching that exact JD.</div>
              </div>
              <div style={S.C()}>
                <div style={S.L}>Step 1 — Target role</div>
                <select style={{...S.sel,marginBottom:12}} value={rVariant} onChange={e=>setRVariant(e.target.value)}>
                  <option>Senior Data Engineer</option>
                  <option>AI Data Engineer / GenAI Engineer</option>
                  <option>Analytics Engineer</option>
                  <option>Assistant Professor CSE / DS / AI</option>
                  <option>Senior ETL Developer (DataStage)</option>
                  <option>MLOps Engineer</option>
                  <option>Data Architect</option>
                </select>
                <div style={S.L}>Step 2 — Paste job description (recommended for tailored output)</div>
                <textarea style={{...S.ta,minHeight:120,marginBottom:12}}
                  placeholder="Paste the full job description here. The AI will tailor keywords, summary, and skills to match this JD for maximum ATS score."
                  value={jd} onChange={e=>setJd(e.target.value)}/>
                <div style={S.L}>Step 3 — Extra achievements or info (optional)</div>
                <textarea style={{...S.ta,minHeight:70,marginBottom:14}}
                  placeholder={"Examples:\n• Led migration of 12 DataStage jobs to cloud, reducing runtime by 35%\n• Mentored 2 junior engineers on SQL optimisation\n• Published abstract at SSN GenAI workshop 2026"}
                  value={rExtra} onChange={e=>setRExtra(e.target.value)}/>
                <button style={{...S.btn(rLoad?P.muted:P.a1),opacity:rLoad?0.7:1,width:"100%",fontSize:14}}
                  onClick={async()=>{
                    setRLoad(true); setRResult("");
                    const jdPart = jd.trim() ? "JOB DESCRIPTION TO TAILOR FOR:\n" + jd.trim() : "";
                    const extraPart = rExtra.trim() ? "ADDITIONAL ACHIEVEMENTS:\n" + rExtra.trim() : "";
                    const prompt = ["You are an expert resume writer for the Indian tech market (2026). Create a PREMIUM ATS-optimised resume.",
                      "TARGET ROLE: " + rVariant,
                      jdPart,
                      "CANDIDATE FULL PROFILE:",
                      "Name: Thamizamudhan K | Chennai, Tamil Nadu | thamiz.k@email.com | +91-XXXXXXXXXX | linkedin.com/in/thamizamudhan",
                      "",
                      "EDUCATION:",
                      "• PhD in Computer Science (Generative AI / LLMs) — SSN College of Engineering, Chennai (July 2026 – ongoing, part-time)",
                      "• M.Tech in Data Science — [University], Chennai (completed)",
                      "• B.E in Electronics & Communication Engineering — [University] (completed)",
                      "",
                      "WORK EXPERIENCE — TCS (Tata Consultancy Services), Chennai",
                      "Title: Data Engineer | Duration: 4.3 years (current)",
                      "• Designed and developed IBM DataStage ETL pipelines for large-scale enterprise data migration projects",
                      "• Wrote advanced Teradata SQL including complex JOINs, window functions, stored procedures, performance tuning reducing query time by ~40%",
                      "• Automated daily and weekly data reconciliation reports using Unix shell scripts saving ~3 hours/week across the team",
                      "• Managed and resolved 200+ ServiceNow incidents and change requests ensuring 99.5% data platform uptime",
                      "• Maintained 15+ ETL pipelines processing 50,000+ daily transactions with zero data loss SLA",
                      "• Collaborated with business analysts, DBAs, and downstream teams for on-time data delivery",
                      "• Participated in Teradata-to-cloud migration assessment and technical documentation",
                      "• Mentored junior team members on DataStage best practices and SQL optimisation techniques",
                      "",
                      "TECHNICAL SKILLS:",
                      "Expert: SQL (Teradata/PostgreSQL/BigQuery), IBM DataStage ETL, Unix/Shell scripting, ServiceNow ITSM",
                      "Intermediate/Learning: Python (Pandas/NumPy/PySpark), LangChain, RAG pipelines, GCP (BigQuery/Dataflow/Cloud Storage), Databricks",
                      "Building: ChromaDB/FAISS, dbt, Docker, FastAPI, MLflow",
                      "",
                      "CERTIFICATIONS IN PROGRESS (2026):",
                      "• Databricks Certified Data Engineer Associate (exam target: Sep–Oct 2026)",
                      "• Google Gemini Enterprise Developer — TCS Talent Pool (2026)",
                      "• GCP Professional Data Engineer (target: Nov 2026)",
                      "",
                      "ACADEMIC/RESEARCH:",
                      "• PhD research area: Generative AI, Large Language Models, Retrieval-Augmented Generation (RAG)",
                      "• UGC NET Computer Science — appearing December 2026",
                      extraPart,
                      "",
                      "RESUME INSTRUCTIONS:",
                      "1. Format with === SECTION NAME === headers, bullet points with •",
                      "2. Professional Summary: 3-4 powerful lines tailored to " + rVariant + (jd.trim() ? " AND the pasted JD keywords" : ""),
                      "3. Use strong action verbs: Engineered, Architected, Optimised, Automated, Delivered, Designed, Led, Reduced",
                      "4. TCS bullets: 5-6 points with quantified achievements (use the numbers provided)",
                      "5. Skills: grouped by category, ATS-parseable format",
                      "6. Projects section: 2-3 projects (include planned portfolio projects as in-progress)",
                      jd.trim() ? "7. CRITICAL: Extract ALL technical keywords from the JD and weave them naturally into summary, skills, and experience sections" : "7. Use top industry keywords for " + rVariant + " in Indian 2026 market",
                      "8. Include PhD prominently — it is a strong differentiator",
                      "9. Write complete professional content — no placeholder text",
                      "10. Generate the complete premium resume now:"
                    ].filter(Boolean).join("\n");
                    try {
                      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2500,messages:[{role:"user",content:prompt}]})});
                      const data = await res.json();
                      setRResult(data.content?.map(b=>b.text||"").join("")||"Error generating. Please try again.");
                    } catch(_){ setRResult("Connection error. Please try again."); }
                    setRLoad(false);
                  }}
                  disabled={rLoad}>
                  {rLoad?"⏳ Generating premium resume...":"✨ Generate Premium Resume"}
                </button>
              </div>

              {rResult&&<div>
                <div style={{...S.CA(P.a1),marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <div style={{fontSize:13,fontWeight:700,color:P.a1}}>📄 {rVariant} Resume — Thamizamudhan K</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      <button onClick={()=>{
                        if(navigator.clipboard){navigator.clipboard.writeText(rResult).then(()=>alert("Copied! Paste into Google Docs or Word.")).catch(()=>{const el=document.createElement("textarea");el.value=rResult;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);alert("Copied!");});}
                        else{const el=document.createElement("textarea");el.value=rResult;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);alert("Copied!");}
                      }} style={{...S.btn(P.a2),padding:"7px 16px",fontSize:11}}>📋 Copy All</button>
                      <button onClick={()=>{
                        const w=window.open("","_blank");
                        if(w){w.document.write('<html><head><title>Resume - Thamizamudhan K</title><style>body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:20px 40px;line-height:1.7;color:#1a1a1a;font-size:14px}pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px}@media print{body{margin:0;padding:20px}}</style></head><body><pre>'+rResult+'</pre></body></html>');w.document.close();setTimeout(()=>w.print(),600);}
                      }} style={{...S.btn(P.a3),padding:"7px 16px",fontSize:11}}>🖨️ Print / PDF</button>
                    </div>
                  </div>
                  <pre style={{fontSize:12,color:P.sub,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"'Courier New',monospace",margin:0,background:`${P.bg}88`,padding:16,borderRadius:8,overflowX:"auto"}}>{rResult}</pre>
                </div>
                <div style={{...S.ib(P.a3)}}>
                  <div style={{fontSize:12,color:P.a3,fontWeight:700,marginBottom:6}}>💡 After generating — next steps</div>
                  {["Copy → paste into Google Docs → apply a clean single-column template (no tables, no graphics, no text boxes)",
                    "Replace placeholder email, phone number, LinkedIn URL with your actual details",
                    "Review all numbers and achievements — edit any estimates to match your real experience exactly",
                    "Save as PDF — filename: Thamizamudhan_K_"+rVariant.replace(/\//g,"").replace(/ +/g,"_")+"_Resume_2026.pdf",
                    "Switch to ATS Checker tab — paste the same JD to verify your score is 80+ before applying",
                  ].map((t,i,arr)=><div key={i} style={S.li(i===arr.length-1)}><span style={{color:P.a3,fontWeight:700,flexShrink:0}}>{i+1}.</span><span style={{fontSize:12}}>{t}</span></div>)}
                </div>
              </div>}
            </div>}

            {resumeTab==="ats"&&<div>
              <div style={{...S.ib(P.a2),marginBottom:14}}>
                <div style={{fontSize:12,color:P.a2,fontWeight:700,marginBottom:3}}>🎯 Accurate ATS analysis — keyword match, score breakdown, specific fixes</div>
                <div style={{fontSize:12,color:P.muted}}>Paste any job description. AI compares it against your real profile and returns a precise score with actionable improvements.</div>
              </div>
              <div style={S.C()}>
                <div style={S.L}>Resume variant being checked</div>
                <select style={{...S.sel,marginBottom:12}} value={rVariant} onChange={e=>setRVariant(e.target.value)}>
                  <option>Senior Data Engineer</option>
                  <option>AI Data Engineer / GenAI Engineer</option>
                  <option>Analytics Engineer</option>
                  <option>Assistant Professor CSE / DS / AI</option>
                  <option>Senior ETL Developer (DataStage)</option>
                  <option>MLOps Engineer</option>
                </select>
                <div style={S.L}>Paste full job description</div>
                <textarea style={{...S.ta,minHeight:180,marginBottom:12}}
                  placeholder={"Paste the COMPLETE job description — title, responsibilities, required skills, qualifications, nice-to-have.\n\nMore complete = more accurate analysis.\nTip: copy everything from the job posting."}
                  value={jd} onChange={e=>setJd(e.target.value)}/>
                <button style={{...S.btn(atsLoad?P.muted:P.a2),opacity:atsLoad?0.7:1,width:"100%",fontSize:14}}
                  onClick={async()=>{
                    if(!jd.trim()){alert("Please paste a job description first.");return;}
                    setAtsLoad(true); setAtsResult(null);
                    const lines = [
                      "You are a senior ATS expert and technical recruiter with 10+ years in the Indian tech market. Perform DETAILED, ACCURATE, STRICT ATS analysis. Do NOT inflate scores.",
                      "CANDIDATE: Thamizamudhan K | Chennai | 4.3yr TCS Data Engineer | " + rVariant + " resume",
                      "EXPERT SKILLS: SQL advanced (Teradata/PostgreSQL/BigQuery/window functions/CTEs), IBM DataStage ETL (pipeline design/parallel jobs/enterprise scale), Unix/Shell scripting (automation/bash/cron), ServiceNow ITSM",
                      "INTERMEDIATE/LEARNING 2026: Python (Pandas/NumPy/PySpark), LangChain/RAG/ChromaDB, GCP (BigQuery/Dataflow/Cloud Storage/Pub-Sub), Databricks (Spark/Delta Lake), dbt, Docker, FastAPI, MLflow",
                      "EXPERIENCE: 4.3yr TCS — ETL pipelines, 50K+ daily transactions, 15+ pipelines, 200+ incidents resolved, cross-functional delivery",
                      "EDUCATION: PhD CS GenAI (SSN 2025-ongoing), M.Tech Data Science (completed), B.E ECE (completed)",
                      "CERTS IN PROGRESS: Databricks DEA (Sep 2026), GCP Professional DE (Nov 2026), Google Gemini Enterprise Dev (2026)",
                      "JOB DESCRIPTION:\n" + jd,
                      "Return ONLY valid JSON, no markdown, no backticks, no text outside JSON:",
                      '{"score":<0-100 be strict>,"grade":"<A+|A|B+|B|C+|C|D>","verdict":"<one sharp sentence>","apply_recommendation":"<Definitely Apply|Apply with Cover Letter|Apply After Upskilling|Not a Good Fit Yet>","experience_match":"<Excellent|Strong|Moderate|Weak>","education_match":"<Excellent|Strong|Moderate|Weak>","skills_match_percent":<0-100>,"matched_keywords":["list","of","matched","keywords"],"missing_critical":["list","of","must-have","missing"],"missing_nice":["list","of","nice-to-have","missing"],"strengths":["3-5 specific strengths"],"gaps":["3-5 specific gaps"],"resume_fixes":["4-6 specific resume text changes — be very specific"],"quick_wins":["3-4 immediate score boosters"],"cover_letter_angle":"one sentence strongest angle","upskill_priority":["ranked 1-3 skills to learn"]}'
                    ];
                    const prompt = lines.join("\n");
                    try {
                      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
                      const data = await res.json();
                      const raw = data.content?.map(b=>b.text||"").join("")||"{}";
                      const s = raw.indexOf("{"); const e2 = raw.lastIndexOf("}");
                      const clean = s>=0&&e2>=0 ? raw.slice(s,e2+1) : "{}";
                      try{ setAtsResult(JSON.parse(clean)); }
                      catch(_){ setAtsResult({score:0,grade:"?",verdict:"Parse error — please try again",apply_recommendation:"N/A",experience_match:"—",education_match:"—",skills_match_percent:0,matched_keywords:[],missing_critical:[],missing_nice:[],strengths:[],gaps:[],resume_fixes:[],quick_wins:[],cover_letter_angle:"",upskill_priority:[]}); }
                    } catch(_){ alert("Connection error. Please try again."); }
                    setAtsLoad(false);
                  }}
                  disabled={atsLoad}>
                  {atsLoad?"⏳ Running ATS analysis...":"🎯 Run ATS Analysis"}
                </button>
              </div>

              {atsResult&&<div>
                {(()=>{
                  const sc=atsResult.score||0;
                  const col=sc>=80?P.a2:sc>=65?P.a3:sc>=50?P.a1:P.a5;
                  return (
                    <div style={{...gl(col),padding:24,marginBottom:12,borderRadius:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
                        <div style={{textAlign:"center",minWidth:110}}>
                          <div style={{fontSize:66,fontWeight:900,color:col,lineHeight:1}}>{sc}</div>
                          <div style={{fontSize:22,fontWeight:700,color:col}}>/100</div>
                          <div style={{fontSize:20,fontWeight:800,color:P.text,marginTop:4}}>Grade {atsResult.grade}</div>
                        </div>
                        <div style={{flex:1,minWidth:180}}>
                          <div style={{fontSize:14,fontWeight:700,color:P.text,marginBottom:8}}>{atsResult.verdict}</div>
                          <div style={{...S.chip(col),fontSize:12,padding:"5px 12px",marginBottom:12,display:"inline-flex"}}>{atsResult.apply_recommendation}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                            {[["Experience",atsResult.experience_match],["Education",atsResult.education_match],["Skills",`${atsResult.skills_match_percent||0}%`]].map(([l,v])=>(
                              <div key={l} style={{background:`${P.bg}88`,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                                <div style={{fontSize:10,color:P.muted}}>{l}</div>
                                <div style={{fontSize:13,fontWeight:700,color:col,marginTop:2}}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{marginTop:14,background:"rgba(255,255,255,0.08)",borderRadius:6,height:10,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${sc}%`,background:`linear-gradient(90deg,${col},${col}aa)`,borderRadius:6}}/>
                      </div>
                    </div>
                  );
                })()}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div style={{...S.CA(P.a2)}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.a2,marginBottom:8}}>✅ Matched ({(atsResult.matched_keywords||[]).length})</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {(atsResult.matched_keywords||[]).map((k,i)=><span key={i} style={{...S.chip(P.a2),fontSize:10}}>{k}</span>)}
                    </div>
                  </div>
                  <div style={{...S.CA(P.a5)}}>
                    <div style={{fontSize:12,fontWeight:700,color:P.a5,marginBottom:8}}>❌ Missing Critical ({(atsResult.missing_critical||[]).length})</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {(atsResult.missing_critical||[]).map((k,i)=><span key={i} style={{...S.chip(P.a5),fontSize:10}}>{k}</span>)}
                    </div>
                  </div>
                </div>

                {(atsResult.missing_nice||[]).length>0&&<div style={{...S.CA(P.a3),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a3,marginBottom:8}}>⚠️ Nice-to-Have Missing ({(atsResult.missing_nice||[]).length})</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {(atsResult.missing_nice||[]).map((k,i)=><span key={i} style={{...S.chip(P.a3),fontSize:10}}>{k}</span>)}
                  </div>
                </div>}

                <div style={{...S.CA(P.a1),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a1,marginBottom:8}}>💪 Your Strengths for This Role</div>
                  {(atsResult.strengths||[]).map((s,i,arr)=><div key={i} style={S.li(i===arr.length-1)}><span style={{color:P.a2,fontWeight:700,flexShrink:0}}>✓</span><span style={{fontSize:12,lineHeight:1.5}}>{s}</span></div>)}
                </div>

                <div style={{...S.CA(P.a5),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a5,marginBottom:8}}>🔍 Gaps to Address</div>
                  {(atsResult.gaps||[]).map((g,i,arr)=><div key={i} style={S.li(i===arr.length-1)}><span style={{color:P.a5,fontWeight:700,flexShrink:0}}>→</span><span style={{fontSize:12,lineHeight:1.5}}>{g}</span></div>)}
                </div>

                <div style={{...S.CA(P.a4),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a4,marginBottom:8}}>🔧 Specific Resume Fixes (before applying)</div>
                  {(atsResult.resume_fixes||[]).map((f,i,arr)=><div key={i} style={S.li(i===arr.length-1)}><span style={{background:P.a4,color:"#000",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</span><span style={{fontSize:12,lineHeight:1.5}}>{f}</span></div>)}
                </div>

                <div style={{...S.CA(P.a2),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a2,marginBottom:8}}>⚡ Quick Wins — immediate score boosters</div>
                  {(atsResult.quick_wins||[]).map((q,i,arr)=><div key={i} style={S.li(i===arr.length-1)}><span style={{color:P.a2,fontWeight:700,flexShrink:0}}>★</span><span style={{fontSize:12,lineHeight:1.5}}>{q}</span></div>)}
                </div>

                {atsResult.cover_letter_angle&&<div style={{...S.CA(P.a3),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a3,marginBottom:6}}>✉️ Cover Letter Angle</div>
                  <div style={{fontSize:12,color:P.sub,lineHeight:1.6}}>{atsResult.cover_letter_angle}</div>
                </div>}

                {(atsResult.upskill_priority||[]).length>0&&<div style={{...S.CA(P.a1),marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:P.a1,marginBottom:8}}>📚 Upskill Priority for This Role</div>
                  {(atsResult.upskill_priority||[]).map((u,i,arr)=><div key={i} style={S.li(i===arr.length-1)}><span style={{color:P.a1,fontWeight:800,flexShrink:0}}>#{i+1}</span><span style={{fontSize:12,lineHeight:1.5}}>{u}</span></div>)}
                </div>}

                <div style={{...S.ib(P.a4)}}>
                  <div style={{fontSize:12,color:P.a4,fontWeight:700,marginBottom:4}}>💡 Pro tip</div>
                  <div style={{fontSize:12,color:P.muted,lineHeight:1.6}}>Score below 70? Go to Resume Builder → paste this same JD → regenerate. The AI will tailor your resume keywords specifically to this JD. Then re-run ATS check. Target 80+ before applying.</div>
                </div>
              </div>}
            </div>}

            {resumeTab==="memory"&&<div>
              <div style={S.h2}>☁️ Data Storage & Cross-Device Guide</div>
              <div style={{...S.ib(P.a5),marginBottom:14}}>
                <div style={{fontSize:13,color:P.a5,fontWeight:700,marginBottom:4}}>⚠️ Data does NOT sync across devices automatically</div>
                <div style={{fontSize:12,color:P.muted}}>Journal, health log, and office tracker are stored locally on this device only. A different phone or laptop will show empty data.</div>
              </div>
              {[
                {title:"📱 What is stored where",color:P.a1,items:["Journal entries → localStorage (persists across browser sessions on same device)","Health daily log → localStorage (same device only)","Office tracker → localStorage (same device only)","PIN for Health & Journal → sessionStorage (clears when tab closes — by design for security)","Resume & ATS results → in-memory only (generate fresh each time, not persisted)"]},
                {title:"🔄 How to use on multiple devices",color:P.a2,items:["Option 1 (Recommended): Pick ONE primary device for daily logging (phone). Use any device for career/skills/resume tabs.","Option 2: Deploy to Vercel (free) + add Supabase database (free 500MB) for full cross-device sync. Ask Claude to build this.","Option 3: Export data periodically — copy Journal text to Google Keep or WhatsApp Saved Messages as backup.","Option 4: Use this app in Claude.ai on each device — storage persists per device in the artifact context."]},
                {title:"🚀 Deploy as standalone app (step by step)",color:P.a3,items:["Step 1: Download life-command-centre.jsx from this chat","Step 2: npm create vite@latest mylife -- --template react","Step 3: Replace src/App.jsx with the downloaded file","Step 4: npm install && npm run dev — test locally","Step 5: Push to GitHub, connect to Vercel.com (free), auto-deploys","Step 6: Your Vercel URL works on any device, same app everywhere","Step 7 (sync): supabase.com free tier, create tables, ask Claude to add Supabase API calls"]},
                {title:"🔁 How updates from Claude work",color:P.a4,items:["Describe changes to Claude here, get updated .jsx file","Replace App.jsx on Vercel, auto-redeploys in 30 seconds","Your stored data (journal/health/office) is untouched — lives in storage, not the code","All chat history here is preserved — full context for every future update","PIN resets each browser session: correct security behaviour — your data is always safe"]},
              ].map((s,i)=>(
                <div key={i} style={{...S.CA(s.color),marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700,color:s.color,marginBottom:10}}>{s.title}</div>
                  {s.items.map((item,j,arr)=><div key={j} style={S.li(j===arr.length-1)}><span style={{color:s.color,fontWeight:700,flexShrink:0}}>›</span><span style={{fontSize:12,lineHeight:1.55}}>{item}</span></div>)}
                </div>
              ))}
            </div>}
          </div>}



        </div>

        <div style={{padding:"14px 16px 28px",borderTop:`1px solid ${P.border}22`,textAlign:"center"}}>
          <div style={{fontSize:10,color:P.muted}}>Thamizh's Life Command Centre · Jul–Dec 2026 · PhD SSN Started 🎓 · UGC NET Dec 2026 · PIN-protected tabs · All data on-device · Tell Claude to update anytime</div>
        </div>
      </div>

      <div style={S.mNav}>
        {navItems.map(([id,em,lb])=><button key={id} style={S.mNB(tab===id)} onClick={()=>setTab(id)}><span style={{fontSize:20}}>{em}</span><span>{lb}</span></button>)}
      

      {/* ── AI LIFE AGENT MODAL ── */}
      {showAgent&&<div onClick={e=>{if(e.target===e.currentTarget)setShowAgent(false);}} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(8,12,18,0.92)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(8px)"}}>
        <div style={{background:P.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:900,maxHeight:"85vh",overflowY:"auto",padding:20,border:`1px solid ${P.a4}44`,boxShadow:`0 -8px 40px ${P.a4}33`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:P.a4}}>🤖 AI Life Agent</div>
              <div style={{fontSize:11,color:P.muted,marginTop:2}}>Scans all sections · Detects issues · Makes smart recommendations</div>
            </div>
            <button onClick={()=>setShowAgent(false)} style={{background:`${P.a5}18`,border:`1px solid ${P.a5}44`,borderRadius:8,padding:"6px 12px",color:P.a5,fontSize:12,cursor:"pointer",fontWeight:700}}>✕ Close</button>
          </div>
          {agentLog.length>0&&<div style={{background:P.card2,borderRadius:10,padding:12,marginBottom:14,border:`1px solid ${P.border}`,fontFamily:"monospace"}}>
            <div style={{fontSize:10,color:P.muted,fontWeight:700,marginBottom:8,letterSpacing:"1px"}}>AGENT SCAN LOG</div>
            {agentLog.map((l,i)=>(
              <div key={i} style={{fontSize:12,color:P.sub,marginBottom:4,display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{flexShrink:0}}>{l.icon}</span>
                <span style={{flex:1,lineHeight:1.4}}>{l.msg}</span>
                <span style={{color:P.muted,fontSize:10,flexShrink:0}}>{l.ts}</span>
              </div>
            ))}
            {agentRunning&&<div style={{display:"flex",gap:6,alignItems:"center",marginTop:6}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:P.a2}}/>
              <span style={{fontSize:11,color:P.a2}}>Analysing...</span>
            </div>}
          </div>}
          {agentSuggestions.length>0&&<div>
            <div style={{fontSize:13,fontWeight:700,color:P.text,marginBottom:10}}>⚡ Smart Recommendations</div>
            {[...agentSuggestions].sort((a,b)=>a.priority-b.priority).map((s,i)=>{
              const uc={high:P.a5,medium:P.a3,low:P.a2}[s.urgency]||P.muted;
              return(
                <div key={i} style={{background:P.card3,borderRadius:12,padding:"12px 14px",marginBottom:8,border:`1px solid ${uc}33`,borderLeft:`3px solid ${uc}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <span style={{fontSize:20}}>{s.icon}</span>
                      <span style={{fontSize:13,fontWeight:700,color:P.text}}>{s.title}</span>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <span style={{...S.chip(uc),fontSize:10,textTransform:"capitalize"}}>{s.urgency}</span>
                      {s.tab&&<button onClick={()=>{setTab(s.tab);setShowAgent(false);}} style={{background:`${P.a1}18`,border:`1px solid ${P.a1}44`,borderRadius:7,padding:"4px 10px",color:P.a1,fontSize:10,cursor:"pointer",fontWeight:700}}>Go →</button>}
                    </div>
                  </div>
                  <div style={{fontSize:12,color:P.sub,lineHeight:1.55,paddingLeft:28}}>{s.action}</div>
                </div>
              );
            })}
          </div>}
          {!agentRunning&&agentSuggestions.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:P.muted,fontSize:13}}>Tap Run Agent to scan all your sections and get recommendations.</div>}
          <button onClick={runLifeAgent} disabled={agentRunning} style={{...S.btn(agentRunning?P.muted:P.a4),width:"100%",marginTop:14,opacity:agentRunning?0.6:1}}>
            {agentRunning?"⏳ Agent Running...":"🔄 Run Agent Again"}
          </button>
        </div>
      </div>}
</div>
    </div>
  );
}
