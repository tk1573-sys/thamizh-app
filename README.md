# Thamizh's Life Command Centre

A personal, mobile-first **Life + Career + PhD + Certification Command Centre** built with React/Vite and deployed as a Progressive Web App (PWA).

The application is designed around one principle: **daily progress should remain useful after the browser is closed**. Work, learning, certifications, PhD research, coursework, applications, journal entries and selected health/office information can be retained locally and mirrored into the unified `life-memory-v2` progress model. The app also provides an optional encrypted cross-device cloud-sync flow through a private Vercel Blob store.

> **Important:** this is a personal productivity and tracking application. Government vacancies, certification requirements and recruitment dates change. The app provides official-source links and guidance, but every application must be verified against the current official notification.

---

## What this application does

### 1. Life Command Centre

The main application contains 18 functional areas:

| Area | Purpose |
|---|---|
| **Now** | Daily command centre and current priorities |
| **Jobs** | Career/application tracking |
| **Radar** | Government, research and opportunity watch |
| **Monthly** | Monthly goals and progress |
| **Career** | Career direction and role planning |
| **Skills** | Skill-gap and capability tracking |
| **Learn** | Courses, study plans and learning missions |
| **UGC NET** | Computer Science & Applications preparation |
| **PhD** | Overall PhD planning and research roadmap |
| **SNU Research** | Research work connected to the canonical PhD research hub |
| **Office** | TCS work, follow-ups and professional progress |
| **Health** | Private health tracking with PIN gate |
| **Journal** | Private journal/history with PIN gate |
| **Resume** | Resume and career-readiness tracking |
| **Certs** | Certification preparation and progress |
| **Govt** | Government/research/teaching recruitment hub |
| **Buddy** | AI life/task assistance |
| **Coach** | Daily career coach, planner and skill roadmap |

---

# Memory and progress protection

## Unified long-term memory

The application maintains a unified browser-side memory record named:

```text
life-memory-v2
```

The unified memory is used to keep progress coherent between the major areas instead of creating isolated progress records.

### Mirrored areas

- Office progress
- Health history/progress entered by the user
- Journal entries and daily plans
- Certification progress
- Career Coach completion
- Learning progress
- PhD/research progress
- SNU research context
- Career/application context

The VCRS audit specifically checks that Office, Health and Journal are mirrored into the unified memory model.

### Health and Journal protection

Health and Journal have PIN gates. Their PIN state is session-oriented, and their application data is handled separately from AI prompts.

Private medical details are deliberately **not embedded into the Gemini/AI system prompts**.

The application should not be treated as a medical record system or as a substitute for professional medical care.

---

# Cross-device cloud memory

The application supports an encrypted sync workflow:

```text
Device A
   ↓
Encrypted snapshot
   ↓
Private Vercel Blob
   ↓
Device B
   ↓
Same passphrase
   ↓
Restore progress
```

The sync API is:

```text
/api/sync
```

The server uses `@vercel/blob` with a **private** store and explicit store selection. The client encrypts the snapshot before sending it to the sync API.

### User workflow

1. Open the live application.
2. Create a private cloud passphrase of 10+ characters.
3. Choose **Save / Sync**.
4. Use **Copy Device Link**.
5. Open the link on another device.
6. Enter the same passphrase.
7. Choose **Restore**.

The passphrase is not supplied by Vercel and should not be shared with other people.

If the passphrase is lost, the encrypted cloud snapshot cannot be recovered through a replacement passphrase.

### Important mobile note

**Do not download the webpage as a static HTML file.**

The application depends on JavaScript, API routes, cloud sync and the PWA service worker. A downloaded HTML copy is not equivalent to the live application.

For a phone:

- Android Chrome → **Add to Home screen / Install app**
- iPhone Safari → **Share → Add to Home Screen**

The application registers the PWA service worker and is configured for automatic PWA updates.

---

# Career Coach

The Career Coach is a separate mobile-safe career layer designed for daily execution.

## Daily task system

The default daily rotation includes:

1. **Daily Core** — SQL/Python + production-style ETL work
2. **Certification** — current certification priority
3. **PhD Coursework** — one syllabus module + notes
4. **Research** — paper/Mendeley/dataset/supervisor action
5. **Career** — application/resume/GitHub/interview action
6. **UGC NET** — CS topic + MCQs
7. **Journal** — completed work, blocker and tomorrow's Top 3

Daily completion is stored and mirrored into `life-memory-v2`.

## Learning planner

The Coach contains a staged modern Data Engineering planner:

### Week 1 — Foundation

- Advanced SQL
- Python ETL
- Git
- Production-style pipeline
- SnowPro weak areas

### Week 2 — Modern Data Engineering

- Spark/PySpark
- Delta Lake
- Unity Catalog
- Lakeflow
- Bronze → Silver → Gold pipeline

### Week 3 — Cloud Data Engineering

- AWS S3
- Glue
- Athena
- Redshift
- IAM
- CloudWatch

### Week 4 — Engineering maturity

- dbt
- Data quality
- Orchestration
- CI/CD
- Docker
- Infrastructure as Code basics

### Ongoing — GenAI edge

- RAG
- Databricks GenAI
- Bedrock
- Evaluation
- Agents
- MCP
- Production GenAI patterns

The intent is to build one coherent Data Engineering profile rather than collect unrelated tools.

---

# PhD coursework inside Learn / Coach

The learning system includes the four coursework subjects currently tracked for the PhD:

## CS8015 — Deep Learning for Computer Vision

Modules:

1. Visual Features and Matching
2. Neural Networks Overview
3. Convolutional Neural Networks
4. Recurrent Neural Networks
5. Deep Generative Models

## CS8044 — Biomedical Signal Processing

Modules:

1. Biomedical Signal Origin and Dynamics
2. Event Detection
3. Waveform Analysis
4. Frequency-Domain Analysis
5. Modelling of Biomedical Systems

## CS8051 — Generative AI with Large Language Models

Modules:

1. Foundations of Generative AI and LLMs
2. Transformer Models and Text Generation
3. Advanced Training and Computational Considerations
4. Model Fine-Tuning, Evaluation and Adaptation
5. Ethical Considerations, Human Alignment and Deployment

## UM8001 — Research Methodology

Modules:

1. Fundamentals of Research
2. Literature Survey
3. Data Collection and Analysis
4. Technical Writing and Presentation
5. Research Indicators

The coursework planner is intended to connect coursework with the PhD research workflow rather than treating subjects as isolated exam preparation.

---

# Certification Command Centre

The application tracks the current certification roadmap, preparation status, prerequisites and core skills.

## 1. AWS Certified Data Engineer – Associate (DEA-C01)

**Priority:** High

Core preparation:

- Advanced SQL
- Python
- ETL/ELT
- S3
- Glue
- Athena
- Redshift
- EMR
- Kinesis
- MWAA / orchestration
- IAM
- KMS
- Monitoring
- Data quality
- Governance
- Cost/performance
- Git
- IaC

The certification does not replace hands-on AWS experience. The goal is to build an AWS data pipeline while studying.

Official page:
https://aws.amazon.com/certification/certified-data-engineer-associate/

## 2. SnowPro Core (COF-C03)

**Priority:** High

Skills:

- Snowflake architecture
- Virtual warehouses
- SQL
- Loading/unloading
- Stages
- File formats
- Semi-structured data
- RBAC
- Time Travel
- Cloning
- Sharing
- Performance
- Cost optimization

Official page:
https://learn.snowflake.com/en/certifications/snowpro-core/

## 3. Databricks Certified Data Engineer Associate

**Priority:** High

Skills:

- Lakehouse architecture
- Delta Lake
- Unity Catalog
- SQL
- PySpark
- Batch/streaming ingestion
- Auto Loader
- Lakeflow
- Jobs
- Spark Declarative Pipelines
- Data modelling
- Governance
- Performance
- DevOps

Official page:
https://www.databricks.com/learn/certification/data-engineer-associate

## 4. Databricks Certified Generative AI Engineer Associate

Skills:

- LLM applications
- RAG
- Vector Search
- Model Serving
- MLflow
- Unity Catalog
- Evaluation
- Prompting
- Agents
- MCP
- Production security

Official page:
https://www.databricks.com/learn/certification/generative-ai-engineer-associate

## 5. AWS Certified Machine Learning Engineer – Associate (MLA-C02)

**Status:** Current beta/transition path to investigate.

Preparation areas:

- ML data preparation
- Traditional ML
- Foundation models
- SageMaker
- Bedrock
- Deployment
- Orchestration
- CI/CD
- Monitoring
- Security
- Agentic AI

Official page:
https://aws.amazon.com/certification/certified-machine-learning-engineer-associate/

## 6. AWS Certified Generative AI Developer – Professional

**Status:** Later target.

Preparation:

- Bedrock
- Foundation models
- RAG
- Agents
- Application architecture
- APIs
- IAM/security
- Networking
- Observability
- Deployment/IaC
- Cost optimization
- Production operations

Official page:
https://aws.amazon.com/certification/certified-generative-ai-developer-professional/

## 7. AWS Solutions Architect – Professional

**Status:** Later target.

Preparation:

- Multi-account AWS
- Networking
- Security
- Resilience
- Compute
- Storage
- Databases
- Migration
- Observability
- Cost optimization
- Well-Architected Framework
- IaC

Official page:
https://aws.amazon.com/certification/certified-solutions-architect-professional/

## 8. Claude certification roadmap

Tracked stages include:

- Claude Associate/Foundation-level preparation
- Claude Architect Foundations
- Claude Architect Professional

Core skills:

- LLM architecture
- Claude / Claude Code
- Prompt engineering
- Tool use
- Agents
- Context management
- Evaluation
- Safety
- Privacy
- Production integration

Official page:
https://www.anthropic.com/learn/certification

## 9. GitHub Copilot Certification

**Status: Completed.**

The application keeps it in the completed section so that the skill remains part of the professional profile.

---

# Modern Data Engineer roadmap

The application treats Modern Data Engineering as a progression rather than a list of disconnected certifications.

## Core skills

- Advanced SQL
- Python
- Unix/Bash
- Git
- ETL/ELT
- Data structures
- APIs
- File formats
- Debugging
- Testing
- Documentation

## Data architecture

- Dimensional modelling
- Star/snowflake schemas
- OLTP vs OLAP
- Partitioning
- Indexing
- CDC
- SCD
- Schema evolution
- Data lake
- Lakehouse
- Warehouse

## Cloud

AWS is the primary cloud path in the current roadmap:

- S3
- IAM
- VPC fundamentals
- Glue
- Athena
- Redshift
- EMR
- Lambda
- Step Functions/MWAA
- CloudWatch
- KMS
- Secrets Manager

## Lakehouse

- Databricks
- Spark/PySpark
- Delta Lake
- Unity Catalog
- Auto Loader
- Lakeflow
- Streaming
- Performance/cost tuning

## Warehouse

- Snowflake
- SQL
- Warehouses
- Stages
- File formats
- Semi-structured data
- RBAC
- Time Travel
- Cloning
- Sharing
- Performance/cost

## ELT / transformation

- dbt models
- Tests
- Documentation
- Snapshots
- Incremental models
- Lineage

## Orchestration and integration

- Airflow concepts
- Cloud orchestration
- Fivetran/connectors
- REST
- JDBC/ODBC
- Event-driven pipelines

## Streaming

- Kafka
- Partitions
- Consumer groups
- Offsets
- Schema Registry
- Spark Structured Streaming
- Kinesis

## Governance

- Data quality
- Profiling
- Lineage
- Catalogues
- RBAC
- PII handling
- Encryption
- Retention
- Auditability

## DevOps

- GitHub Actions
- CI/CD
- Docker
- Terraform / CloudFormation / CDK
- Environment separation
- Secrets
- Rollback
- Observability

## GenAI

- Embeddings
- Vector stores
- RAG
- Evaluation
- Agents
- MCP
- LLM APIs
- Prompt/context engineering
- Bedrock
- Databricks GenAI

## Production engineering

- SLAs/SLOs
- Idempotency
- Retries
- Backfills
- Incident response
- Cost optimization
- Monitoring
- Logging
- Alerting
- Capacity planning

---

# Government, teaching and research career hub

The application provides direct official-source links rather than relying on third-party vacancy lists.

## Central Government

- UPSC recruitment
- SSC
- National Career Service
- All-state employment portal directory

## Research / scientist / technical

- ISRO
- DRDO
- DRDO RAC
- CSIR
- C-DAC
- ANRF

## Teaching / academic

- UGC-NET / NTA
- Tamil Nadu TRB
- University academic recruitment

## Tamil Nadu

- TNPSC
- TNPSC Exam Dashboard
- Tamil Nadu recruitment portal
- Tamil Nadu Career Services

## Army / Navy technical roles

Technical IT/engineering officer entries are included as a watchlist.

The application explicitly **does not classify military technical roles as “no physical work.”** Military officer recruitment can involve:

- SSB
- medical standards
- fitness requirements
- military training
- service duties
- posting requirements

Exact eligibility must always be checked in the current official notification.

---

# PhD Research architecture

The PhD area is designed around a canonical research hub so that overall PhD planning and SNU Research do not become two disconnected systems.

The intended research direction includes:

- Generative AI
- Multimodal AI
- Healthcare analytics
- Wearable computing
- Human-centred AI
- Distress/behaviour detection
- Assisted-care scenarios
- Multimodal signals
- Privacy and responsible AI

The SNU Research area consumes the canonical PhD research context for research planning and advisor-oriented work.

Typical workflow:

```text
Research problem
      ↓
Literature survey
      ↓
Research gap
      ↓
Dataset / sensing requirements
      ↓
Methodology
      ↓
Experiment
      ↓
Evaluation
      ↓
Paper / thesis contribution
```

---

# AI features

The application contains AI-assisted workflows for:

- Life planning
- Career guidance
- PhD research assistance
- Study planning
- Certification preparation
- Government/research opportunity guidance
- Advice/Buddy workflows

AI calls are routed through the server-side Gemini API endpoint rather than embedding the API key in the React client.

The VCRS audit checks that `GEMINI_API_KEY` is not exposed in `src/App.jsx`.

The certification system also contains an **offline study path**, so certification preparation does not depend entirely on an AI API being available.

---

# Security and privacy design

Current protections include:

- Health PIN gate
- Journal PIN gate
- Private Vercel Blob sync
- Encrypted client-side sync snapshot
- No Gemini API key in client source
- Private health details excluded from AI system prompts
- API route separation
- PWA API navigation fallback protection
- No secret values committed to the repository

This is a personal application, not a certified security product. Users should still use strong credentials, protect their devices and avoid storing highly sensitive information unnecessarily.

---

# Testing and VCRS

The repository contains a static VCRS audit:

```text
scripts/vcrs.mjs
```

It checks important production-readiness conditions including:

### Functional checks

- All 18 tabs exist
- Navigation maps to all tabs
- Deep-link allowlist contains the tabs
- Health PIN gate exists
- Journal PIN gate exists
- Journal persistence exists
- Health persistence exists
- Office persistence exists
- Gemini proxy exists
- Required API handlers exist
- Certification data exists
- Certification modules exist
- Offline certification study path exists
- Unified memory exists
- Office/Health/Journal memory mirrors exist
- PhD/SNU research linkage exists
- Encrypted sync client exists
- Private Blob sync API exists

### Reliability checks

- PWA API navigation fallback is denied
- Production build runs smoke tests before Vite build
- Mobile viewport is hardened
- Service worker registration exists
- Mobile Career Coach exists

### Safety checks

- Obvious stale recruitment prompts are rejected
- Stale UGC registration claims are rejected
- Private medical details are not embedded in AI system prompts
- Gemini API keys are not exposed in client source

Run locally:

```bash
npm install
npm test
npm run build
```

`npm run build` runs the smoke tests before the Vite production build.

---

# Technology stack

- React 18
- Vite 5
- Vite PWA plugin
- JavaScript
- Vercel
- Vercel Blob
- `@vercel/blob`
- Gemini server-side API proxy
- GitHub Actions

Current package scripts:

```text
npm run dev       → local development
npm run test      → smoke tests
npm run build     → smoke tests + production Vite build
npm run preview   → preview production build locally
```

---

# Deployment

## GitHub → Vercel

The production flow is:

```text
GitHub main
   ↓
GitHub Actions
   ↓
Smoke tests
   ↓
VCRS static audit
   ↓
Vite production build
   ↓
Vercel deployment
   ↓
Production PWA
```

Vercel should be connected to this GitHub repository with the production branch set to `main`.

### After a patch

1. Push/merge to `main`.
2. Wait for GitHub Actions.
3. Confirm Build & Audit is green.
4. Wait for Vercel to show **Ready / Production**.
5. Open the live URL.
6. Test the changed feature.
7. On mobile, hard refresh or reinstall the PWA if an old service-worker cache is displayed.

Never declare a patch production-ready from GitHub commit status alone; the actual Vercel production deployment must also be checked.

---

# Mobile usage

The UI is designed for phone use, including:

- responsive Career Coach
- PWA installation
- safe viewport handling
- touch-friendly controls
- horizontally scrollable Coach navigation
- mobile-friendly cards
- service-worker updates

Recommended installation:

### Android

1. Open the production Vercel URL in Chrome.
2. Choose **Install app** or **Add to Home screen**.
3. Open the installed application.
4. Do not use a downloaded HTML copy.

### iPhone

1. Open the production URL in Safari.
2. Choose **Share**.
3. Choose **Add to Home Screen**.

---

# Current career philosophy implemented in the app

The Career Coach is intentionally structured around a small number of complementary tracks:

### Track A — Modern Data Engineering

Core career path:

```text
Existing DataStage/Teradata/SQL
        ↓
Modern SQL + Python
        ↓
Cloud
        ↓
Snowflake
        ↓
Databricks/Spark
        ↓
dbt + orchestration
        ↓
Streaming + governance
        ↓
Production data engineering
        ↓
GenAI-enabled data engineering
```

### Track B — PhD / Research

```text
PhD coursework
      ↓
Literature survey
      ↓
Research problem
      ↓
Experiments
      ↓
Publications
      ↓
Research profile
      ↓
Academic / research opportunities
```

### Track C — Teaching

```text
UGC NET CS
      ↓
Teaching eligibility / preparation
      ↓
TN TRB / university notifications
      ↓
Assistant Professor / academic roles
```

### Track D — Government technical/research

```text
Central + TN portals
      ↓
Technical / scientist / research notifications
      ↓
Eligibility check
      ↓
Application tracker
      ↓
Exam/interview preparation
```

The application keeps these tracks visible together so career decisions can be made using current evidence and personal progress rather than losing track of one path while pursuing another.

---

# Repository maintenance rules

When changing the application:

1. Inspect the current implementation first.
2. Make the smallest safe patch that satisfies the requirement.
3. Preserve existing tab IDs and navigation contracts.
4. Preserve `life-memory-v2` compatibility.
5. Keep Health/Journal protected.
6. Never put API secrets in client code.
7. Add or update VCRS checks when introducing a production-critical feature.
8. Run `npm test` and `npm run build` before calling a patch production-ready.
9. Verify the Vercel production deployment separately.
10. On mobile, test the installed PWA rather than a downloaded HTML file.

---

# Project status

This repository is an actively evolving personal command centre. Features are being added incrementally, and live government/certification information must always be verified against the linked official source.

The current architecture prioritises:

- durable progress
- cross-device continuity
- mobile usability
- career execution
- certification preparation
- PhD/research continuity
- production safety checks
- official-source navigation

---

## Repository

GitHub: https://github.com/tk1573-sys/thamizh-app

Production: https://thamizh-app.vercel.app
