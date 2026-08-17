import { Edge, Node } from "@xyflow/react";

export interface ColumnDefinition {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyRef?: string;
  isNullable?: boolean;
}

export interface TableNodeData extends Record<string, unknown> {
  tableName: string;
  schema?: string;
  rowCount: number;
  columns: ColumnDefinition[];
  description?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  userPrompt: string;
  generatedSql: string;
  status: "SUCCESS" | "BLOCKED" | "MUTATION_APPROVED" | "FAILED";
  durationMs: number;
  rowsAffected?: number;
  model: string;
  targetTable?: string;
  clientDevice?: string;
}

export interface QueryPreset {
  id: string;
  title: string;
  prompt: string;
  isMutation?: boolean;
  category: "Analytical" | "Reporting" | "Mutation / DDL" | "GraphQL";
}

// Initial Schema Visualizer Nodes
export const initialTables: Node<TableNodeData>[] = [
  {
    id: "users",
    type: "tableNode",
    position: { x: 50, y: 80 },
    data: {
      tableName: "users",
      schema: "public",
      rowCount: 14250,
      description: "User profiles & authentication records",
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true },
        { name: "username", type: "varchar(50)", isNullable: false },
        { name: "email", type: "varchar(255)", isNullable: false },
        { name: "role", type: "varchar(20)", isNullable: false },
        { name: "rating_score", type: "int4", isNullable: false },
        { name: "last_login", type: "timestamptz", isNullable: true },
        { name: "created_at", type: "timestamptz", isNullable: false },
      ],
    },
  },
  {
    id: "contests",
    type: "tableNode",
    position: { x: 420, y: 50 },
    data: {
      tableName: "contests",
      schema: "public",
      rowCount: 85,
      description: "Competitive programming and weekly tournaments",
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true },
        { name: "title", type: "varchar(200)", isNullable: false },
        { name: "start_time", type: "timestamptz", isNullable: false },
        { name: "end_time", type: "timestamptz", isNullable: false },
        { name: "status", type: "varchar(24)", isNullable: false },
        { name: "max_participants", type: "int4", isNullable: true },
        { name: "created_at", type: "timestamptz", isNullable: false },
      ],
    },
  },
  {
    id: "quizzes",
    type: "tableNode",
    position: { x: 800, y: 80 },
    data: {
      tableName: "quizzes",
      schema: "public",
      rowCount: 340,
      description: "Interactive assessment modules & skill challenges",
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true },
        { name: "contest_id", type: "uuid", isForeignKey: true, foreignKeyRef: "contests.id" },
        { name: "title", type: "text", isNullable: false },
        { name: "time_limit_sec", type: "int4", isNullable: false },
        { name: "pass_percentage", type: "numeric(5,2)", isNullable: false },
        { name: "is_active", type: "bool", isNullable: false },
        { name: "created_at", type: "timestamptz", isNullable: false },
      ],
    },
  },
  {
    id: "problems",
    type: "tableNode",
    position: { x: 780, y: 460 },
    data: {
      tableName: "problems",
      schema: "public",
      rowCount: 1250,
      description: "Algorithmic and schema problem sets",
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true },
        { name: "quiz_id", type: "uuid", isForeignKey: true, foreignKeyRef: "quizzes.id" },
        { name: "title", type: "text", isNullable: false },
        { name: "difficulty", type: "varchar(16)", isNullable: false },
        { name: "points", type: "int4", isNullable: false },
        { name: "statement", type: "text", isNullable: false },
        { name: "test_cases_count", type: "int4", isNullable: false },
      ],
    },
  },
  {
    id: "submissions",
    type: "tableNode",
    position: { x: 380, y: 460 },
    data: {
      tableName: "submissions",
      schema: "public",
      rowCount: 98400,
      description: "Execution telemetry and evaluation outcomes",
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true },
        { name: "user_id", type: "uuid", isForeignKey: true, foreignKeyRef: "users.id" },
        { name: "problem_id", type: "uuid", isForeignKey: true, foreignKeyRef: "problems.id" },
        { name: "status", type: "varchar(32)", isNullable: false },
        { name: "score_awarded", type: "int4", isNullable: false },
        { name: "execution_time_ms", type: "int4", isNullable: false },
        { name: "memory_kb", type: "int4", isNullable: false },
        { name: "submitted_at", type: "timestamptz", isNullable: false },
      ],
    },
  },
  {
    id: "tags",
    type: "tableNode",
    position: { x: 1180, y: 460 },
    data: {
      tableName: "tags",
      schema: "public",
      rowCount: 64,
      description: "Category taxonomies & difficulty tags",
      columns: [
        { name: "id", type: "uuid", isPrimaryKey: true },
        { name: "problem_id", type: "uuid", isForeignKey: true, foreignKeyRef: "problems.id" },
        { name: "name", type: "varchar(60)", isNullable: false },
        { name: "slug", type: "varchar(60)", isNullable: false },
      ],
    },
  },
];

// Initial Edges representing Foreign Key links with Supabase emerald & warm stone styling
export const initialEdges: Edge[] = [
  {
    id: "e-quizzes-contests",
    source: "contests",
    target: "quizzes",
    sourceHandle: "contests-id",
    targetHandle: "quizzes-contest_id",
    animated: true,
    style: { stroke: "#3ecf8e", strokeWidth: 2 },
    label: "1 : N (contest_id)",
    labelStyle: { fill: "#a8a29e", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#1c1917", fillOpacity: 0.95 },
    labelBgPadding: [8, 4] as [number, number],
  },
  {
    id: "e-problems-quizzes",
    source: "quizzes",
    target: "problems",
    sourceHandle: "quizzes-id",
    targetHandle: "problems-quiz_id",
    animated: true,
    style: { stroke: "#a78bfa", strokeWidth: 2 },
    label: "1 : N (quiz_id)",
    labelStyle: { fill: "#a8a29e", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#1c1917", fillOpacity: 0.95 },
    labelBgPadding: [8, 4] as [number, number],
  },
  {
    id: "e-submissions-users",
    source: "users",
    target: "submissions",
    sourceHandle: "users-id",
    targetHandle: "submissions-user_id",
    animated: true,
    style: { stroke: "#3ecf8e", strokeWidth: 2 },
    label: "1 : N (user_id)",
    labelStyle: { fill: "#a8a29e", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#1c1917", fillOpacity: 0.95 },
    labelBgPadding: [8, 4] as [number, number],
  },
  {
    id: "e-submissions-problems",
    source: "problems",
    target: "submissions",
    sourceHandle: "problems-id",
    targetHandle: "submissions-problem_id",
    animated: true,
    style: { stroke: "#fb7185", strokeWidth: 2 },
    label: "1 : N (problem_id)",
    labelStyle: { fill: "#a8a29e", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#1c1917", fillOpacity: 0.95 },
    labelBgPadding: [8, 4] as [number, number],
  },
  {
    id: "e-tags-problems",
    source: "problems",
    target: "tags",
    sourceHandle: "problems-id",
    targetHandle: "tags-problem_id",
    animated: false,
    style: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "4 4" },
    label: "1 : N (problem_id)",
    labelStyle: { fill: "#a8a29e", fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: "#1c1917", fillOpacity: 0.95 },
    labelBgPadding: [8, 4] as [number, number],
  },
];

// Query presets for quick exploration
export const samplePresets: QueryPreset[] = [
  {
    id: "preset-1",
    title: "🏆 Top 5 Contest Performers",
    prompt: "Find the top 5 users who scored the highest points across weekly quizzes with their average submission execution time and total solved problems.",
    category: "Analytical",
  },
  {
    id: "preset-2",
    title: "⚡ Fast Submissions Breakdown",
    prompt: "List recent quiz submissions that finished under 150ms execution time, including user handle, problem title, and status.",
    category: "Reporting",
  },
  {
    id: "preset-3",
    title: "📊 Active Quizzes with Difficulty Stats",
    prompt: "Show all active quizzes along with the count of easy, medium, and hard problems linked to each.",
    category: "Analytical",
  },
  {
    id: "preset-4",
    title: "🕸️ GraphQL User Deep Query",
    prompt: "Generate a GraphQL query for fetching user profile with their 5 latest submissions, solved problems, and contest rankings.",
    category: "GraphQL",
  },
  {
    id: "preset-5",
    title: "🚨 DDL/Mutation: Purge Inactive Users",
    prompt: "DELETE FROM users WHERE last_login < NOW() - INTERVAL '180 days' AND role = 'guest';",
    isMutation: true,
    category: "Mutation / DDL",
  },
  {
    id: "preset-6",
    title: "⚠️ DDL: Drop Problem Table",
    prompt: "DROP TABLE problems CASCADE;",
    isMutation: true,
    category: "Mutation / DDL",
  },
];

// Initial mock Audit Logs
export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: "LOG-94812",
    timestamp: "2026-08-17 16:42:18 UTC",
    ipAddress: "192.168.1.104",
    userPrompt: "Find the top 5 users who scored highest in weekly quizzes with their average submission execution time",
    generatedSql: `SELECT u.id, u.username, u.email, SUM(s.score_awarded) AS total_score, ROUND(AVG(s.execution_time_ms), 2) AS avg_runtime_ms\nFROM users u\nJOIN submissions s ON u.id = s.user_id\nWHERE s.status = 'ACCEPTED'\nGROUP BY u.id, u.username, u.email\nORDER BY total_score DESC\nLIMIT 5;`,
    status: "SUCCESS",
    durationMs: 42,
    rowsAffected: 5,
    model: "GPT-4o (schema-tuned)",
    clientDevice: "Chrome 128 / macOS Sequoia",
  },
  {
    id: "LOG-94811",
    timestamp: "2026-08-17 16:38:05 UTC",
    ipAddress: "10.0.4.21",
    userPrompt: "DROP TABLE problems CASCADE;",
    generatedSql: `DROP TABLE problems CASCADE;`,
    status: "BLOCKED",
    durationMs: 12,
    rowsAffected: 0,
    model: "Claude 3.5 Sonnet",
    targetTable: "problems",
    clientDevice: "Firefox 130 / Windows 11",
  },
  {
    id: "LOG-94810",
    timestamp: "2026-08-17 16:31:50 UTC",
    ipAddress: "172.16.0.45",
    userPrompt: "UPDATE users SET role = 'admin' WHERE username = 'elena_dev';",
    generatedSql: `UPDATE users SET role = 'admin' WHERE username = 'elena_dev';`,
    status: "MUTATION_APPROVED",
    durationMs: 65,
    rowsAffected: 1,
    model: "GPT-4o (schema-tuned)",
    targetTable: "users",
    clientDevice: "Arc 1.62 / macOS Sonoma",
  },
  {
    id: "LOG-94809",
    timestamp: "2026-08-17 16:15:22 UTC",
    ipAddress: "192.168.1.104",
    userPrompt: "List all active quizzes with problem count and pass percentage above 70%",
    generatedSql: `SELECT q.id, q.title, q.pass_percentage, COUNT(p.id) AS total_problems\nFROM quizzes q\nLEFT JOIN problems p ON q.id = p.quiz_id\nWHERE q.is_active = true AND q.pass_percentage >= 70.0\nGROUP BY q.id, q.title, q.pass_percentage\nORDER BY q.pass_percentage DESC;`,
    status: "SUCCESS",
    durationMs: 38,
    rowsAffected: 12,
    model: "GPT-4o (schema-tuned)",
    clientDevice: "Chrome 128 / macOS Sequoia",
  },
  {
    id: "LOG-94808",
    timestamp: "2026-08-17 15:58:11 UTC",
    ipAddress: "192.168.1.140",
    userPrompt: "Fetch submissions with runtime under 100ms for Graph algorithms",
    generatedSql: `SELECT s.id, u.username, p.title AS problem, s.execution_time_ms, s.memory_kb\nFROM submissions s\nJOIN users u ON s.user_id = u.id\nJOIN problems p ON s.problem_id = p.id\nJOIN tags t ON p.id = t.problem_id\nWHERE s.execution_time_ms < 100 AND t.slug = 'graph-algorithms'\nORDER BY s.execution_time_ms ASC\nLIMIT 20;`,
    status: "SUCCESS",
    durationMs: 51,
    rowsAffected: 18,
    model: "Claude 3.5 Sonnet",
    clientDevice: "Safari 17.5 / iPadOS 17",
  },
];

// Helper to detect SQL mutations
export function detectMutation(input: string): {
  isMutation: boolean;
  mutationType?: string;
  targetTable?: string;
  riskLevel: "LOW" | "HIGH" | "CRITICAL";
} {
  const normalized = input.toUpperCase().trim();
  
  if (normalized.startsWith("DROP") || normalized.includes("DROP TABLE") || normalized.includes("DROP DATABASE")) {
    const match = input.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
    return {
      isMutation: true,
      mutationType: "DROP TABLE (DDL Destructive)",
      targetTable: match ? match[1] : "problems",
      riskLevel: "CRITICAL",
    };
  }

  if (normalized.startsWith("DELETE") || normalized.includes("DELETE FROM") || normalized.startsWith("TRUNCATE")) {
    const match = input.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
    return {
      isMutation: true,
      mutationType: "DELETE (DML Mutation)",
      targetTable: match ? match[1] : "users",
      riskLevel: "CRITICAL",
    };
  }

  if (normalized.startsWith("ALTER") || normalized.includes("ALTER TABLE")) {
    const match = input.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)/i);
    return {
      isMutation: true,
      mutationType: "ALTER TABLE (Schema Mutation)",
      targetTable: match ? match[1] : "quizzes",
      riskLevel: "HIGH",
    };
  }

  if (normalized.startsWith("UPDATE") || normalized.includes("UPDATE ")) {
    const match = input.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    return {
      isMutation: true,
      mutationType: "UPDATE (DML Mutation)",
      targetTable: match ? match[1] : "users",
      riskLevel: "HIGH",
    };
  }

  if (normalized.startsWith("INSERT") || normalized.includes("INSERT INTO")) {
    const match = input.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
    return {
      isMutation: true,
      mutationType: "INSERT (DML Mutation)",
      targetTable: match ? match[1] : "submissions",
      riskLevel: "HIGH",
    };
  }

  return {
    isMutation: false,
    riskLevel: "LOW",
  };
}

// Generate realistic mock query results based on prompt
export function generateMockResult(prompt: string, format: "sql" | "graphql" = "sql") {
  const lower = prompt.toLowerCase();

  if (format === "graphql" || lower.includes("graphql")) {
    const gqlQuery = `query GetUserProfileAndSubmissions($userId: UUID!, $limit: Int = 5) {
  user(id: $userId) {
    id
    username
    email
    ratingScore
    lastLogin
    submissions(limit: $limit, orderBy: { submittedAt: DESC }) {
      id
      status
      scoreAwarded
      executionTimeMs
      problem {
        id
        title
        difficulty
        points
        quiz {
          id
          title
        }
      }
    }
    contestRankings {
      contestId
      rank
      totalScore
    }
  }
}`;
    return {
      sql: `-- GraphQL equivalent represented for inspection\n` + gqlQuery,
      graphql: gqlQuery,
      isGraphQL: true,
      columns: ["id", "username", "ratingScore", "submissionsCount", "topContestRank"],
      records: [
        { id: "usr_99a82b", username: "alex_chen", ratingScore: 2480, submissionsCount: 42, topContestRank: "#1 (Global)" },
        { id: "usr_44f10c", username: "elena_rostova", ratingScore: 2390, submissionsCount: 38, topContestRank: "#2 (Regional)" },
        { id: "usr_77e31d", username: "marcus_v", ratingScore: 2210, submissionsCount: 29, topContestRank: "#4 (Weekly)" },
      ],
      executionTime: 28,
      tokens: 342,
      cost: "$0.0014",
    };
  }

  if (lower.includes("delete") || lower.includes("drop") || lower.includes("update") || lower.includes("purge")) {
    if (lower.includes("delete") || lower.includes("purge")) {
      return {
        sql: `DELETE FROM users \nWHERE last_login < NOW() - INTERVAL '180 days' \n  AND role = 'guest'\nRETURNING id, username, email, last_login;`,
        columns: ["id", "username", "email", "last_login", "status"],
        records: [
          { id: "usr_00912", username: "test_bot_1", email: "bot1@tempmail.io", last_login: "2025-11-04 09:12:00", status: "DELETED" },
          { id: "usr_00913", username: "anon_guest42", email: "guest42@null.org", last_login: "2025-10-18 14:22:11", status: "DELETED" },
          { id: "usr_00918", username: "crawler_tmp", email: "crawler@scrap.cc", last_login: "2025-09-02 21:00:43", status: "DELETED" },
        ],
        executionTime: 45,
        tokens: 180,
        cost: "$0.0007",
      };
    }
    if (lower.includes("drop")) {
      return {
        sql: `DROP TABLE problems CASCADE;`,
        columns: ["status", "table_dropped", "cascaded_constraints"],
        records: [
          { status: "EXECUTED", table_dropped: "problems", cascaded_constraints: "fk_submissions_problem_id, fk_tags_problem_id" },
        ],
        executionTime: 18,
        tokens: 95,
        cost: "$0.0003",
      };
    }
  }

  if (lower.includes("fast") || lower.includes("runtime") || lower.includes("100") || lower.includes("150ms")) {
    return {
      sql: `SELECT \n  s.id AS submission_id,\n  u.username AS author,\n  p.title AS problem_title,\n  p.difficulty,\n  s.execution_time_ms,\n  s.memory_kb,\n  s.status,\n  s.submitted_at\nFROM submissions s\nJOIN users u ON s.user_id = u.id\nJOIN problems p ON s.problem_id = p.id\nWHERE s.execution_time_ms < 150 \n  AND s.status = 'ACCEPTED'\nORDER BY s.execution_time_ms ASC\nLIMIT 10;`,
      columns: ["submission_id", "author", "problem_title", "difficulty", "execution_time_ms", "memory_kb", "status", "submitted_at"],
      records: [
        { submission_id: "sub_109a", author: "alex_chen", problem_title: "Two Sum Fast Lookup", difficulty: "EASY", execution_time_ms: 12, memory_kb: 4096, status: "ACCEPTED", submitted_at: "2026-08-17 14:20:01" },
        { submission_id: "sub_109b", author: "elena_rostova", problem_title: "LRU Cache Memory Opt", difficulty: "MEDIUM", execution_time_ms: 24, memory_kb: 8192, status: "ACCEPTED", submitted_at: "2026-08-17 14:22:15" },
        { submission_id: "sub_109c", author: "marcus_v", problem_title: "Bitwise Trie Match", difficulty: "HARD", execution_time_ms: 41, memory_kb: 6144, status: "ACCEPTED", submitted_at: "2026-08-17 14:28:44" },
        { submission_id: "sub_109d", author: "sophia_k", problem_title: "QuickSelect Kth Element", difficulty: "MEDIUM", execution_time_ms: 48, memory_kb: 5120, status: "ACCEPTED", submitted_at: "2026-08-17 14:31:02" },
        { submission_id: "sub_109e", author: "dev_siddharth", problem_title: "Shortest Path BFS", difficulty: "MEDIUM", execution_time_ms: 62, memory_kb: 7168, status: "ACCEPTED", submitted_at: "2026-08-17 14:40:19" },
        { submission_id: "sub_109f", author: "hannah_code", problem_title: "Dynamic Fibonacci Matrix", difficulty: "HARD", execution_time_ms: 78, memory_kb: 9216, status: "ACCEPTED", submitted_at: "2026-08-17 14:45:30" },
        { submission_id: "sub_109g", author: "liam_t", problem_title: "Valid Parentheses Stack", difficulty: "EASY", execution_time_ms: 85, memory_kb: 3072, status: "ACCEPTED", submitted_at: "2026-08-17 14:50:11" },
      ],
      executionTime: 36,
      tokens: 290,
      cost: "$0.0011",
    };
  }

  if (lower.includes("active quizzes") || lower.includes("difficulty stats") || lower.includes("breakdown")) {
    return {
      sql: `SELECT \n  q.id AS quiz_id,\n  q.title AS quiz_title,\n  q.pass_percentage,\n  COUNT(CASE WHEN p.difficulty = 'EASY' THEN 1 END) AS easy_count,\n  COUNT(CASE WHEN p.difficulty = 'MEDIUM' THEN 1 END) AS medium_count,\n  COUNT(CASE WHEN p.difficulty = 'HARD' THEN 1 END) AS hard_count,\n  COUNT(p.id) AS total_problems,\n  q.is_active\nFROM quizzes q\nLEFT JOIN problems p ON q.id = p.quiz_id\nWHERE q.is_active = true\nGROUP BY q.id, q.title, q.pass_percentage, q.is_active\nORDER BY total_problems DESC;`,
      columns: ["quiz_id", "quiz_title", "pass_percentage", "easy_count", "medium_count", "hard_count", "total_problems", "is_active"],
      records: [
        { quiz_id: "qz_01", quiz_title: "Algorithms Mastery Sprint #4", pass_percentage: "78.50%", easy_count: 3, medium_count: 5, hard_count: 2, total_problems: 10, is_active: true },
        { quiz_id: "qz_02", quiz_title: "SQL & Relational Algebra Cup", pass_percentage: "84.20%", easy_count: 4, medium_count: 4, hard_count: 1, total_problems: 9, is_active: true },
        { quiz_id: "qz_03", quiz_title: "Dynamic Programming Deep Dive", pass_percentage: "62.10%", easy_count: 1, medium_count: 4, hard_count: 5, total_problems: 10, is_active: true },
        { quiz_id: "qz_04", quiz_title: "Graph Theory & Trees Challenge", pass_percentage: "71.00%", easy_count: 2, medium_count: 6, hard_count: 3, total_problems: 11, is_active: true },
        { quiz_id: "qz_05", quiz_title: "Concurrency & OS Primitives", pass_percentage: "65.40%", easy_count: 2, medium_count: 3, hard_count: 2, total_problems: 7, is_active: true },
      ],
      executionTime: 44,
      tokens: 310,
      cost: "$0.0012",
    };
  }

  // Default Top performers query
  return {
    sql: `SELECT \n  u.id AS user_id,\n  u.username,\n  u.email,\n  u.role,\n  COUNT(DISTINCT s.problem_id) AS problems_solved,\n  SUM(s.score_awarded) AS total_score,\n  ROUND(AVG(s.execution_time_ms), 2) AS avg_runtime_ms\nFROM users u\nJOIN submissions s ON u.id = s.user_id\nJOIN problems p ON s.problem_id = p.id\nWHERE s.status = 'ACCEPTED'\nGROUP BY u.id, u.username, u.email, u.role\nORDER BY total_score DESC, avg_runtime_ms ASC\nLIMIT 5;`,
    columns: ["user_id", "username", "email", "role", "problems_solved", "total_score", "avg_runtime_ms"],
    records: [
      { user_id: "usr_99a82b", username: "alex_chen", email: "alex.chen@cyber.dev", role: "contender", problems_solved: 48, total_score: 4800, avg_runtime_ms: 24.5 },
      { user_id: "usr_44f10c", username: "elena_rostova", email: "elena.r@deepmath.org", role: "master", problems_solved: 46, total_score: 4650, avg_runtime_ms: 31.2 },
      { user_id: "usr_77e31d", username: "marcus_v", email: "m.vance@quantum.ai", role: "master", problems_solved: 42, total_score: 4200, avg_runtime_ms: 28.8 },
      { user_id: "usr_12c98a", username: "sophia_k", email: "sophia.k@matrix.io", role: "contender", problems_solved: 39, total_score: 3950, avg_runtime_ms: 45.1 },
      { user_id: "usr_88d33e", username: "dev_siddharth", email: "sid.sharma@byteflow.net", role: "pro", problems_solved: 37, total_score: 3700, avg_runtime_ms: 38.6 },
    ],
    executionTime: 32,
    tokens: 285,
    cost: "$0.0011",
  };
}
