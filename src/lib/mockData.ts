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

// Schema Visualizer Nodes & Edges (Empty by default; populated when database is connected)
export const initialTables: Node<TableNodeData>[] = [];
export const initialEdges: Edge[] = [];

// Query presets
export const samplePresets: QueryPreset[] = [];

// Audit Logs (Empty by default; populated when queries are executed)
export const initialAuditLogs: AuditLogEntry[] = [];

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
