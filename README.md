<div align="center">

# ⚡ SchemaAI

### Intelligent Natural Language to SQL & GraphQL Query Platform
A modern developer workbench featuring AI-assisted query generation, interactive relational schema exploration with React Flow, and strict security mutation guardrails — designed with a sleek Supabase-inspired warm-dark aesthetic.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.0-ff0072?style=for-the-badge&logo=react)](https://reactflow.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00c7b7?style=for-the-badge&logo=netlify)](https://www.netlify.com/)
[![Render](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render)](https://render.com/)

[**Explore Features**](#-features) • [**Local Installation Guide**](#-step-by-step-local-setup-guide) • [**Deploy to Render & Netlify**](#-production-deployment-guide)

</div>

---

## 🌟 Overview

**SchemaAI** bridges the gap between natural language prompts and high-performance database queries. Built on Next.js 16+ App Router and FastAPI, it provides a unified developer cockpit to inspect database entity-relationship graphs, convert plain English into optimized SQL, MongoDB, or GraphQL queries, inspect execution telemetry, and safeguard production databases with zero-trust mutation guardrails.

---

## 🚀 Features

### 1. ⚡ Query Studio (`/`)
- **Zero-Page-Scroll Viewport**: Strictly fitted to `100vh` without full-page scrollbars.
- **Split Code & Data Panes**:
  - **SQL / MongoDB / GraphQL Editor**: Syntax-highlighted code editor with line numbering, copy button, dialect toggles, and live telemetry micro-badges (Latency, Tokens, Cost, AST Safety).
  - **Spreadsheet Data Grid**: In-table quick search, sticky blurred headers, column sort indicators, and one-click export to **CSV** and **JSON**.
- **Docked Natural Language Command Bar**: Voice dictation, custom AI Model selector, connected database indicator, and preset suggestion pills.

### 2. 🕸️ Interactive Schema Explorer (`/schema`)
- **Graph Visualizer**: Built with `@xyflow/react` over a warm dot-grid canvas.
- **Table Node Cards**: Detailed cards showing schema namespaces, row counts, data types (`uuid`, `int4`, `timestamptz`, etc.), Primary Key (`PK`), and Foreign Key (`FK`) link indicators.
- **Bezier Relationship Edges**: Animated relationship lines connecting foreign key dependencies across tables.
- **Controls & Inspector**: Zoom, pan, search filter, layout reset, minimap, and selected node details panel.

### 3. 🛡️ Strict Mutation Guard Interception
- **Dangerous Operation Interceptor**: Automatically blocks unprivileged `DELETE`, `DROP`, `UPDATE`, and `ALTER` statements before database execution.
- **Security Escalation Modal**: Displays origin Client IP, User Device, Target Table, and SQL diff with dual **Deny (Block & Log)** or **Grant Privilege & Execute** actions.

### 4. 📜 Audit & Telemetry Logs (`/logs`)
- **Immutable Audit Trail**: Cryptographically logs every prompt, executed SQL, execution status (`SUCCESS`, `BLOCKED`, `MUTATION_APPROVED`), latency, and client metadata.
- **KPI Metrics Dashboard**: Overview cards tracking total query executions, blocked write attempts, and approved escalations.
- **Search & Filter**: Segmented status filters and click-to-inspect audit modal.

### 5. ⚙️ Configuration & Connection Portal (`/settings`)
- Tabbed configuration for **Database Connection** (PostgreSQL, Supabase, MySQL, MongoDB Atlas, Neon, CockroachDB, SQLite), **AI Model Engine** (Google Gemini, OpenAI GPT-4o, Anthropic Claude, NVIDIA NIM, DeepSeek, Ollama), **Mutation Guard Rails**, and **PgBouncer Connection Pooling**.
- Integrated **Test Connection Handshake** with roundtrip latency telemetry.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16+ (App Router)](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Backend API**: [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/), [LangChain / LangGraph](https://www.langchain.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Graph Engine**: [@xyflow/react (React Flow)](https://reactflow.dev/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/)
- **Package Manager**: [pnpm](https://pnpm.io/)

---

## 📦 Step-by-Step Local Setup Guide

Follow these instructions to clone, install, and run **SchemaAI** on your local machine.

### Step 1: Install Prerequisites

Ensure you have **Node.js (v18.17+ or v20+)**, **pnpm**, and **Python (v3.10+)** installed on your system.

```bash
# Enable pnpm via Corepack
corepack enable
corepack prepare pnpm@latest --activate

# Verify versions
node -v
pnpm -v
python --version
```

---

### Step 2: Clone the Repository

```bash
git clone https://github.com/PrateekSingh2/SchemaAI.git
cd SchemaAI
```

---

### Step 3: Install Dependencies

#### 1. Frontend Dependencies:
```bash
pnpm install
```

#### 2. Backend Dependencies:
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

---

### Step 4: Run Development Servers

Run both the frontend and backend in separate terminals:

#### Terminal 1 — Next.js Frontend (Port `3000`):
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Terminal 2 — FastAPI Python Backend (Port `8000`):
```bash
pnpm backend
# or
python -m uvicorn main:app --app-dir backend --reload --port 8000
```
The backend API docs are live at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

## 🌐 Production Deployment Guide

Deploying **SchemaAI** is split into two lightweight services:
1. **Backend** on [Render](https://render.com) (FastAPI Python API)
2. **Frontend** on [Netlify](https://netlify.com) (Next.js Application)

---

### Part 1: Deploy Backend to Render

1. Go to [render.com](https://render.com) and log in.
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `SchemaAI`.
4. Fill in the service configuration:
   - **Name**: `schemaai-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. Click **Create Web Service**.
6. Once deployed, note your service URL (e.g. `https://schema-ai-vsfi.onrender.com`).
   - Visiting the root URL (`/`) will display a JSON status check confirming it is online.
   - Interactive Swagger API docs are accessible at `/docs`.

---

### Part 2: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com) and log in.
2. Click **Add new site** > **Import an existing project** > **GitHub**.
3. Select your `SchemaAI` repository.
4. Set the build parameters:
   - **Base directory**: *(Leave empty)*
   - **Build command**: `pnpm build`
   - **Publish directory**: `.next`
5. Under **Environment variables**, add the following keys:

   | Variable Name | Value / Description |
   | :--- | :--- |
   | `NEXT_PUBLIC_BACKEND_URL` | Your Render URL (e.g., `https://schema-ai-vsfi.onrender.com`) |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client API Key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| Firebase Messaging Sender ID |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web App ID |

6. Click **Deploy SchemaAI**.

---

### Part 3: Firebase Auth Domain Whitelisting

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your project > **Authentication** > **Settings** > **Authorized domains**.
3. Add your Netlify domain (e.g. `schemaai.netlify.app` or custom domain).

---

## 🧭 Project File Structure

```text
SchemaAI/
├── backend/                        # Python FastAPI AI Agent Backend
│   ├── agent.py                    # LangGraph / LangChain NL-to-SQL synthesizer
│   ├── main.py                     # FastAPI REST server, health check & CORS setup
│   └── requirements.txt            # Python dependencies (FastAPI, LangChain, PyMongo, etc.)
├── netlify/
│   └── functions/
│       └── test-database-connection.ts # Edge serverless database test handler
├── netlify.toml                    # Netlify build & serverless configuration
├── package.json                    # Frontend scripts & dependencies
├── pnpm-lock.yaml                  # pnpm dependency lockfile
├── tsconfig.json                   # TypeScript configuration
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── database/
│   │   │       ├── connect/route.ts # Direct database handshake API
│   │   │       └── execute/route.ts # Query execution & mutation guard API
│   │   ├── login/page.tsx          # Firebase authentication portal
│   │   ├── logs/page.tsx           # Audit logs & telemetry view
│   │   ├── schema/page.tsx         # Interactive React Flow schema explorer
│   │   ├── settings/page.tsx       # Database & AI model configuration page
│   │   ├── layout.tsx              # Root application layout
│   │   ├── page.tsx                # Query Studio (Natural language SQL cockpit)
│   │   └── globals.css             # Tailwind CSS v4 & theme variables
│   ├── components/
│   │   ├── AuditLogs/
│   │   │   └── LogsView.tsx        # Searchable audit & telemetry logs
│   │   ├── QueryStudio/
│   │   │   ├── ChatHistoryPanel.tsx # Conversation history & session switcher
│   │   │   ├── DatabaseRequiredModal.tsx # Connection onboarding warning modal
│   │   │   ├── OutputResultsModal.tsx # Fullscreen tabular dataset modal
│   │   │   ├── OutputSummaryBox.tsx   # Inline query summary & result count
│   │   │   ├── PromptInput.tsx        # Natural language prompt command bar & model selector
│   │   │   ├── RecordsTable.tsx       # Tabular data grid with CSV/JSON export
│   │   │   └── SqlOutput.tsx          # Syntax-highlighted SQL/GraphQL code pane
│   │   ├── SchemaExplorer/
│   │   │   ├── DocumentNode.tsx    # MongoDB document schema card
│   │   │   ├── SchemaCanvas.tsx    # React Flow canvas with pan/zoom controls
│   │   │   └── TableNode.tsx       # Relational table card with PK/FK indicators
│   │   ├── MutationWarningModal.tsx # Zero-trust mutation guard security modal
│   │   ├── SettingsModal.tsx       # Quick settings drawer modal
│   │   └── Topbar.tsx              # Header navigation bar
│   ├── context/
│   │   └── AuthContext.tsx         # Firebase auth & session provider
│   └── lib/
│       ├── chatService.ts          # AI query generator & Firestore chat persistence
│       ├── dbValidation.ts         # Multi-database driver connection validator
│       ├── firebase.ts             # Firebase client initialization
│       ├── mockData.ts             # Default mock schemas & fallback datasets
│       ├── schemaCatalog.ts        # Dynamic schema introspection catalog
│       └── utils.ts                # Styling utilities & BACKEND_URL helper
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/PrateekSingh2">Prateek Singh</a> and <a href="https://github.com/shivanshmax-Monster">Shivansh Sahu</a>.</sub>
</div>
