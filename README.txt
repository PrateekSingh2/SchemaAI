<div align="center">

# âš¡ SchemaAI

### Intelligent Natural Language to SQL & GraphQL Query Platform
A modern developer workbench featuring AI-assisted query generation, interactive relational schema exploration with React Flow, and strict security mutation guardrails â€” designed with a sleek Supabase-inspired warm-dark aesthetic.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.0-ff0072?style=for-the-badge&logo=react)](https://reactflow.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-11.0+-f69220?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00c7b7?style=for-the-badge&logo=netlify)](https://www.netlify.com/)

[**Explore Live Demo**](#-getting-started) â€¢ [**Features**](#-features) â€¢ [**Installation Guide**](#-step-by-step-setup-guide) â€¢ [**Deploy to Netlify**](#-deployment)

</div>

---

## ðŸŒŸ Overview

**SchemaAI** bridges the gap between natural language prompts and high-performance database queries. Built on Next.js 14+ App Router, it provides a unified developer cockpit to inspect database entity-relationship graphs, convert plain English into optimized SQL or GraphQL queries, inspect execution telemetry, and safeguard production databases with cryptographic mutation interception.

---

## ðŸš€ Features

### 1. âš¡ Query Studio (`/`)
- **Zero-Page-Scroll Viewport**: Strictly fitted to `100vh` without full-page scrollbars.
- **Split Code & Data Panes**:
  - **SQL / GraphQL Editor**: Syntax-highlighted code editor with line numbering, copy button, dialect toggles, and live telemetry micro-badges (Latency, Tokens, Cost, AST Safety).
  - **Spreadsheet Data Grid**: In-table quick search, sticky blurred headers, column sort indicators, and one-click export to **CSV** and **JSON**.
- **Docked Natural Language Command Bar**: Preset suggestion pills for Analytics, Performance queries, GraphQL schemas, and destructive Mutation testing with `âŒ˜/Ctrl + Enter` execution shortcut.

### 2. ðŸ•¸ï¸ Interactive Schema Explorer (`/schema`)
- **Graph Visualizer**: Built with `@xyflow/react` over a warm dot-grid canvas.
- **Table Node Cards**: Detailed cards showing schema namespaces, row counts, data types (`uuid`, `int4`, `timestamptz`, etc.), Primary Key (`PK`), and Foreign Key (`FK`) link indicators.
- **Bezier Relationship Edges**: Animated relationship lines connecting foreign key dependencies across tables.
- **Controls & Inspector**: Zoom, pan, search filter, layout reset, minimap, and selected node details panel.

### 3. ðŸ›¡ï¸ Strict Mutation Guard Interception
- **Dangerous Operation Interceptor**: Automatically blocks unprivileged `DELETE`, `DROP`, `UPDATE`, and `ALTER` statements before database execution.
- **Security Escalation Modal**: Displays origin Client IP, User Device, Target Table, and SQL diff with dual **Deny (Block & Log)** or **Grant Privilege & Execute** actions.

### 4. ðŸ“œ Audit & Telemetry Logs (`/logs`)
- **Immutable Audit Trail**: Cryptographically logs every prompt, executed SQL, execution status (`SUCCESS`, `BLOCKED`, `MUTATION_APPROVED`), latency, and client metadata.
- **KPI Metrics Dashboard**: Overview cards tracking total query executions, blocked write attempts, and approved escalations.
- **Search & Filter**: Segmented status filters and click-to-inspect audit modal.

### 5. âš™ï¸ Configuration & Connection Portal (`/settings`)
- Dedicated portal with tabbed configuration for **Database Connection** (PostgreSQL, Supabase, MySQL, Neon, CockroachDB, SQLite), **AI Model Engine** (OpenAI GPT-4o, Claude 3.5 Sonnet), **Mutation Guard Rails**, and **PgBouncer Connection Pooling**.
- Integrated **Test Connection Handshake** with roundtrip latency telemetry.

---

## ðŸ› ï¸ Tech Stack

- **Framework**: [Next.js 16+ (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Graph Engine**: [@xyflow/react (React Flow)](https://reactflow.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Theme**: Supabase-inspired warm dark/brown palette (`#121110`, `#171412`, `#1c1917`) with emerald `#3ecf8e` accents and glassmorphism.

---

## ðŸ“¦ Step-by-Step Setup Guide

Follow these instructions to clone, install, and run **SchemaAI** on your local machine.

### Step 1: Install Prerequisites

Ensure you have **Node.js (v18.17+ or v20+)** and **pnpm** installed on your system.

#### Install Node.js:
- **Windows / macOS / Linux**: Download from [nodejs.org](https://nodejs.org/) (LTS version recommended).
- **macOS via Homebrew**:
  ```bash
  brew install node
  ```
- **Windows via Winget / Chocolatey**:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  # or
  choco install nodejs-lts
  ```

#### Install pnpm:
If you do not have `pnpm` installed, enable it via Node.js `corepack` or install globally via `npm`:
```bash
# Enable Corepack (recommended)
corepack enable
corepack prepare pnpm@latest --activate

# Or install via npm
npm install -g pnpm
```

Verify your installation:
```bash
node -v   # Should output v18.x, v20.x, or v22.x
pnpm -v   # Should output 9.x or 11.x
git --version
```

---

### Step 2: Clone or Fork the Repository

```bash
# Clone the repository
git clone https://github.com/PrateekSingh2/SchemaAI.git

# Navigate into the project folder
cd SchemaAI
```

---

### Step 3: Install Project Dependencies

1. **Frontend Dependencies** (Next.js)
Install all required packages using `pnpm`:

```bash
pnpm install
```

2. **Backend Dependencies** (Python/FastAPI)
Set up a Python virtual environment and install the backend requirements:

```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

### Step 4: Run the Development Servers

You can run both the frontend and backend concurrently or in separate terminals:

#### Option A: Running in Two Terminals (Recommended for Development)

1. **Terminal 1 â€” Next.js Frontend** (Port `3000`):
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

2. **Terminal 2 â€” FastAPI Python Backend** (Port `8000`):
   ```bash
   pnpm backend
   # Or directly with Python:
   python -m uvicorn main:app --app-dir backend --reload --port 8000
   ```
   The backend API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Step 5: Configure AI & Database Connections

1. Open [http://localhost:3000/settings](http://localhost:3000/settings) in your browser.
2. Choose your **AI Model Engine** (e.g., Google Gemini, OpenAI GPT-4o, Anthropic Claude, or NVIDIA NIM) and enter your API Key.
3. Choose your **Database Engine** (PostgreSQL, Supabase, MySQL, MongoDB Atlas, SQLite, Snowflake) and enter your connection credentials / URI.
4. Click **Test Handshake** to verify real-time connectivity.

---

### Step 6: Build for Production

To create an optimized production build:

```bash
# Build the Next.js application with Turbopack
pnpm build

# Start the production server
pnpm start
```

---

## ðŸ§­ Project File Structure

```text
SchemaAI/
â”œâ”€â”€ backend/                        # Python FastAPI AI Agent Backend
â”‚   â”œâ”€â”€ agent.py                    # LangGraph / LangChain NL-to-SQL synthesizer
â”‚   â”œâ”€â”€ main.py                     # FastAPI REST server & CORS setup
â”‚   â””â”€â”€ requirements.txt            # Python dependencies
â”œâ”€â”€ netlify/
â”‚   â””â”€â”€ functions/
â”‚       â””â”€â”€ test-database-connection.ts # Edge serverless database test handler
â”œâ”€â”€ netlify.toml                    # Netlify build & serverless configuration
â”œâ”€â”€ package.json                    # Frontend scripts & dependencies
â”œâ”€â”€ pnpm-lock.yaml                  # pnpm dependency lockfile
â”œâ”€â”€ tsconfig.json                   # TypeScript configuration
â”œâ”€â”€ WORKFLOW.txt                    # System architecture & workflow documentation
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ api/
â”‚   â”‚   â”‚   â””â”€â”€ database/
â”‚   â”‚   â”‚       â”œâ”€â”€ connect/route.ts # Direct database handshake API
â”‚   â”‚   â”‚       â””â”€â”€ execute/route.ts # Query execution & mutation guard API
â”‚   â”‚   â”œâ”€â”€ login/page.tsx          # Firebase authentication portal
â”‚   â”‚   â”œâ”€â”€ logs/page.tsx           # Audit logs & telemetry view
â”‚   â”‚   â”œâ”€â”€ schema/page.tsx         # Interactive React Flow schema explorer
â”‚   â”‚   â”œâ”€â”€ settings/page.tsx       # Database & AI model configuration page
â”‚   â”‚   â”œâ”€â”€ layout.tsx              # Root application layout
â”‚   â”‚   â”œâ”€â”€ page.tsx                # Query Studio (Single-page natural language SQL cockpit)
â”‚   â”‚   â””â”€â”€ globals.css             # Tailwind CSS v4 & theme variables
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ AuditLogs/
â”‚   â”‚   â”‚   â””â”€â”€ LogsView.tsx        # Searchable audit & telemetry logs
â”‚   â”‚   â”œâ”€â”€ QueryStudio/
â”‚   â”‚   â”‚   â”œâ”€â”€ ChatHistoryPanel.tsx # Conversation history & session switcher
â”‚   â”‚   â”‚   â”œâ”€â”€ DatabaseRequiredModal.tsx # Connection onboarding warning modal
â”‚   â”‚   â”‚   â”œâ”€â”€ OutputResultsModal.tsx # Fullscreen tabular dataset modal
â”‚   â”‚   â”‚   â”œâ”€â”€ OutputSummaryBox.tsx   # Inline query summary & result count
â”‚   â”‚   â”‚   â”œâ”€â”€ PromptInput.tsx        # Natural language prompt command bar
â”‚   â”‚   â”‚   â”œâ”€â”€ RecordsTable.tsx       # Virtualized tabular data grid with CSV/JSON export
â”‚   â”‚   â”‚   â””â”€â”€ SqlOutput.tsx          # Syntax-highlighted SQL/GraphQL code pane
â”‚   â”‚   â”œâ”€â”€ SchemaExplorer/
â”‚   â”‚   â”‚   â”œâ”€â”€ DocumentNode.tsx    # MongoDB document schema card
â”‚   â”‚   â”‚   â”œâ”€â”€ SchemaCanvas.tsx    # React Flow canvas with pan/zoom controls
â”‚   â”‚   â”‚   â””â”€â”€ TableNode.tsx       # Relational table card with PK/FK indicators
â”‚   â”‚   â”œâ”€â”€ MutationWarningModal.tsx # Zero-trust mutation guard security modal
â”‚   â”‚   â”œâ”€â”€ SettingsModal.tsx       # Quick settings drawer modal
â”‚   â”‚   â””â”€â”€ Topbar.tsx              # Header navigation bar
â”‚   â”œâ”€â”€ context/
â”‚   â”‚   â””â”€â”€ AuthContext.tsx         # Firebase auth & session provider
â”‚   â””â”€â”€ lib/
â”‚       â”œâ”€â”€ chatService.ts          # AI query generator & fallback handler
â”‚       â”œâ”€â”€ dbValidation.ts         # Multi-database driver connection validator
â”‚       â”œâ”€â”€ firebase.ts             # Firebase client initialization
â”‚       â”œâ”€â”€ mockData.ts             # Default mock schemas & fallback datasets
â”‚       â”œâ”€â”€ schemaCatalog.ts        # Dynamic schema introspection catalog
â”‚       â””â”€â”€ utils.ts                # Styling utilities & tailwind-merge helper
```

---

## ðŸŒ Deployment

### Deploy to Netlify (Recommended)

1. Fork or push this repository to your GitHub account.
2. Sign in to [Netlify](https://app.netlify.com/) and click **"Add new site" > "Import an existing project"**.
3. Select your repository: **`SchemaAI`**.
4. The deployment parameters will automatically be detected from `netlify.toml`:
   - **Base Directory**: `/` (Root)
   - **Build Command**: `pnpm build`
   - **Publish Directory**: `.next`
   - **Plugin**: `@netlify/plugin-nextjs`
5. Click **Deploy Site**.

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

---

## ðŸ¤ Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a **Pull Request**.

---

## ðŸ“„ License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with â¤ï¸ by <a href="https://github.com/PrateekSingh2">Prateek Singh</a> <a href="https://github.com/shivanshmax-Monster">Shivansh Sahu</a>.</sub>
</div>
