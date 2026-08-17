<div align="center">

# ⚡ SchemaAI

### Intelligent Natural Language to SQL & GraphQL Query Platform
A modern developer workbench featuring AI-assisted query generation, interactive relational schema exploration with React Flow, and strict security mutation guardrails — designed with a sleek Supabase-inspired warm-dark aesthetic.

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.0-ff0072?style=for-the-badge&logo=react)](https://reactflow.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-11.0+-f69220?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00c7b7?style=for-the-badge&logo=netlify)](https://www.netlify.com/)

[**Explore Live Demo**](#-getting-started) • [**Features**](#-features) • [**Installation Guide**](#-step-by-step-setup-guide) • [**Deploy to Netlify**](#-deployment)

</div>

---

## 🌟 Overview

**SchemaAI** bridges the gap between natural language prompts and high-performance database queries. Built on Next.js 14+ App Router, it provides a unified developer cockpit to inspect database entity-relationship graphs, convert plain English into optimized SQL or GraphQL queries, inspect execution telemetry, and safeguard production databases with cryptographic mutation interception.

---

## 🚀 Features

### 1. ⚡ Query Studio (`/`)
- **Zero-Page-Scroll Viewport**: Strictly fitted to `100vh` without full-page scrollbars.
- **Split Code & Data Panes**:
  - **SQL / GraphQL Editor**: Syntax-highlighted code editor with line numbering, copy button, dialect toggles, and live telemetry micro-badges (Latency, Tokens, Cost, AST Safety).
  - **Spreadsheet Data Grid**: In-table quick search, sticky blurred headers, column sort indicators, and one-click export to **CSV** and **JSON**.
- **Docked Natural Language Command Bar**: Preset suggestion pills for Analytics, Performance queries, GraphQL schemas, and destructive Mutation testing with `⌘/Ctrl + Enter` execution shortcut.

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
- Dedicated portal with tabbed configuration for **Database Connection** (PostgreSQL, Supabase, MySQL, Neon, CockroachDB, SQLite), **AI Model Engine** (OpenAI GPT-4o, Claude 3.5 Sonnet), **Mutation Guard Rails**, and **PgBouncer Connection Pooling**.
- Integrated **Test Connection Handshake** with roundtrip latency telemetry.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16+ (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Graph Engine**: [@xyflow/react (React Flow)](https://reactflow.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Theme**: Supabase-inspired warm dark/brown palette (`#121110`, `#171412`, `#1c1917`) with emerald `#3ecf8e` accents and glassmorphism.

---

## 📦 Step-by-Step Setup Guide

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

Install all required packages using `pnpm`:

```bash
pnpm install
```

---

### Step 4: Run the Development Server

Start the local Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

### Step 5: Build for Production

To test the production build locally:

```bash
# Build the application with Next.js Turbopack
pnpm build

# Start the production server
pnpm start
```

---

## 🧭 Project File Structure

```text
SchemaAI/
├── netlify.toml               # Netlify deployment configuration
├── package.json               # Project dependencies and scripts
├── pnpm-lock.yaml             # pnpm lockfile
├── tsconfig.json              # TypeScript configuration
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root application layout & font styling
│   │   ├── globals.css        # Supabase dark theme tokens & glassmorphism
│   │   ├── page.tsx           # Query Studio (Fixed Viewport, Root page)
│   │   ├── schema/
│   │   │   └── page.tsx       # Schema Explorer dedicated route
│   │   ├── logs/
│   │   │   └── page.tsx       # Audit Logs dedicated route
│   │   └── settings/
│   │       └── page.tsx       # Project Configuration portal route
│   ├── components/
│   │   ├── Topbar.tsx         # Header navigation bar with route links
│   │   ├── SettingsModal.tsx  # Quick database settings modal
│   │   ├── MutationWarningModal.tsx # Security mutation escalation popup
│   │   ├── SchemaExplorer/
│   │   │   ├── SchemaCanvas.tsx     # React Flow interactive graph canvas
│   │   │   └── TableNode.tsx        # Custom database table card node
│   │   ├── QueryStudio/
│   │   │   ├── PromptInput.tsx      # Natural language prompt command bar
│   │   │   ├── SqlOutput.tsx        # SQL/GraphQL syntax-highlighted editor
│   │   │   └── RecordsTable.tsx     # Spreadsheet results data grid
│   │   └── AuditLogs/
│   │       └── LogsView.tsx         # Searchable audit log telemetry view
│   └── lib/
│       ├── mockData.ts        # Database schemas, edges, query engine & logs
│       └── utils.ts           # ClassName merger utility (tailwind-merge / clsx)
```

---

## 🌐 Deployment

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

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m "feat: add amazing feature"`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a **Pull Request**.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/PrateekSingh2">Prateek Singh</a> <a href="https://github.com/shivanshmax-Monster">Shivansh Sahu</a>.</sub>
</div>
