import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { MongoClient, ObjectId } from "mongodb";
import mysql from "mysql2/promise";
import { parsePostgresConfig } from "@/lib/dbValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Strips markdown code blocks, query comments, and trailing semicolons.
 */
function normalizeQuery(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim();

  // Strip markdown code fences (e.g. ```sql ... ``` or ```json ... ```)
  clean = clean.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, "");
  clean = clean.replace(/\n?\s*```\s*$/i, "");
  clean = clean.trim();

  return clean;
}

/**
 * Evaluates JavaScript/BSON query objects safely (handles ISODate, ObjectId, NumberLong, RegExp).
 */
function safeEvalBson(codeStr: string): any {
  if (!codeStr || !codeStr.trim()) return {};
  const trimmed = codeStr.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    try {
      const sandboxFn = new Function(
        "ObjectId",
        "ISODate",
        "NumberInt",
        "NumberLong",
        "RegExp",
        `return (${trimmed});`
      );
      return sandboxFn(
        (id: string) => {
          try {
            return new ObjectId(id);
          } catch {
            return id;
          }
        },
        (d: string) => new Date(d),
        (n: number) => Number(n),
        (n: number) => Number(n),
        (pattern: string, flags: string) => new RegExp(pattern, flags)
      );
    } catch (e) {
      console.warn("BSON evaluation fallback warning:", e);
      return {};
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sql,
      dbType = "PostgreSQL",
      connectionUri = "",
      connectionMode = "uri",
      host = "",
      port = "",
      databaseName = "",
      username = "",
      password = "",
      ssl = true,
      supabaseUrl = "",
      supabaseAnonKey = "",
      supabaseServiceKey = "",
      mongoAuthSource = "admin",
    } = body;

    const cleanQuery = normalizeQuery(sql);
    if (!cleanQuery) {
      return NextResponse.json(
        { success: false, message: "No executable query provided." },
        { status: 400 }
      );
    }

    const startTime = performance.now();

    // =========================================================================
    // 1. MONGODB ATLAS / NOSQL NATIVE EXECUTION
    // =========================================================================
    const isMongo =
      dbType === "MongoDB" ||
      cleanQuery.startsWith("db.") ||
      connectionUri.startsWith("mongodb://") ||
      connectionUri.startsWith("mongodb+srv://");

    if (isMongo) {
      const uri = connectionUri || "";
      if (!uri) {
        return NextResponse.json(
          { success: false, message: "Missing MongoDB Connection URI in database settings." },
          { status: 400 }
        );
      }

      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        authSource: mongoAuthSource || "admin",
      });

      await client.connect();
      try {
        let resolvedDbName = databaseName;
        const uriMatch = uri.match(/mongodb(?:\+srv)?:\/\/[^\/]+\/([^?]+)/);
        if (uriMatch && uriMatch[1]) {
          resolvedDbName = uriMatch[1].split("?")[0].trim();
        }

        const db =
          resolvedDbName && resolvedDbName !== "admin"
            ? client.db(resolvedDbName)
            : client.db();

        // 1.1 db.collection.find(...) or db.getCollection("collection").find(...)
        const findRegex = /(?:db\.getCollection\(["']([^"']+)["']\)|db\.([a-zA-Z0-9_\-]+))\.find\(([\s\S]*?)\)(?:\.sort\(([\s\S]*?)\))?(?:\.skip\((\d+)\))?(?:\.limit\((\d+)\))?/i;
        const findMatch = cleanQuery.match(findRegex);

        if (findMatch) {
          const collName = findMatch[1] || findMatch[2];
          const rawFilter = findMatch[3]?.trim();
          const rawSort = findMatch[4]?.trim();
          const skipVal = findMatch[5] ? parseInt(findMatch[5], 10) : 0;
          const limitVal = findMatch[6] ? parseInt(findMatch[6], 10) : 50;

          // Split filter vs projection if two args: find(filter, projection)
          let filterObj: any = {};
          let projectObj: any = undefined;

          if (rawFilter && rawFilter !== "{}") {
            if (rawFilter.includes("},{") || rawFilter.includes("}, {")) {
              const splitIdx = rawFilter.indexOf("},") + 1;
              const filterPart = rawFilter.substring(0, splitIdx).trim();
              const projPart = rawFilter.substring(splitIdx + 1).trim();
              filterObj = safeEvalBson(filterPart);
              projectObj = safeEvalBson(projPart);
            } else {
              filterObj = safeEvalBson(rawFilter);
            }
          }

          let cursor = db.collection(collName).find(filterObj);
          if (projectObj && Object.keys(projectObj).length > 0) {
            cursor = cursor.project(projectObj);
          }
          if (rawSort) {
            const sortObj = safeEvalBson(rawSort);
            if (Object.keys(sortObj).length > 0) {
              cursor = cursor.sort(sortObj);
            }
          }
          if (skipVal > 0) {
            cursor = cursor.skip(skipVal);
          }
          cursor = cursor.limit(limitVal);

          const docs = (await cursor.toArray()).map((d) => JSON.parse(JSON.stringify(d, (k, v) => (typeof v === "bigint" ? v.toString() : v))));
          const columns = docs.length > 0 ? Object.keys(docs[0]) : [];
          const latencyMs = Math.round(performance.now() - startTime);

          return NextResponse.json({
            success: true,
            records: docs,
            columns,
            rowCount: docs.length,
            executionTime: latencyMs,
          });
        }

        // 1.2 db.collection.aggregate([...])
        const aggRegex = /(?:db\.getCollection\(["']([^"']+)["']\)|db\.([a-zA-Z0-9_\-]+))\.aggregate\(\s*(\[[\s\S]*?\])\s*\)/i;
        const aggMatch = cleanQuery.match(aggRegex);

        if (aggMatch) {
          const collName = aggMatch[1] || aggMatch[2];
          const rawPipeline = aggMatch[3]?.trim() || "[]";
          const pipeline = safeEvalBson(rawPipeline);
          const pipelineArr = Array.isArray(pipeline) ? pipeline : [];

          const rawDocs = await db.collection(collName).aggregate(pipelineArr).toArray();
          const docs = rawDocs.map((d) => JSON.parse(JSON.stringify(d, (k, v) => (typeof v === "bigint" ? v.toString() : v))));
          const columns = docs.length > 0 ? Object.keys(docs[0]) : [];
          const latencyMs = Math.round(performance.now() - startTime);

          return NextResponse.json({
            success: true,
            records: docs,
            columns,
            rowCount: docs.length,
            executionTime: latencyMs,
          });
        }

        // 1.3 db.collection.countDocuments(...) or db.collection.count(...)
        const countRegex = /(?:db\.getCollection\(["']([^"']+)["']\)|db\.([a-zA-Z0-9_\-]+))\.(?:countDocuments|count)\(([\s\S]*?)\)/i;
        const countMatch = cleanQuery.match(countRegex);
        if (countMatch) {
          const collName = countMatch[1] || countMatch[2];
          const filter = safeEvalBson(countMatch[3]?.trim() || "{}");
          const totalCount = await db.collection(collName).countDocuments(filter);
          return NextResponse.json({
            success: true,
            records: [{ count: totalCount }],
            columns: ["count"],
            rowCount: 1,
            executionTime: Math.round(performance.now() - startTime),
          });
        }

        // 1.4 db.collection.findOne(...)
        const findOneRegex = /(?:db\.getCollection\(["']([^"']+)["']\)|db\.([a-zA-Z0-9_\-]+))\.findOne\(([\s\S]*?)\)/i;
        const findOneMatch = cleanQuery.match(findOneRegex);
        if (findOneMatch) {
          const collName = findOneMatch[1] || findOneMatch[2];
          const filter = safeEvalBson(findOneMatch[3]?.trim() || "{}");
          const rawDoc = await db.collection(collName).findOne(filter);
          const doc = rawDoc ? JSON.parse(JSON.stringify(rawDoc, (k, v) => (typeof v === "bigint" ? v.toString() : v))) : null;
          const records = doc ? [doc] : [];
          const columns = doc ? Object.keys(doc) : [];
          return NextResponse.json({
            success: true,
            records,
            columns,
            rowCount: records.length,
            executionTime: Math.round(performance.now() - startTime),
          });
        }

        // 1.5 Generic collection fallback e.g. db.users or db.collection.distinct(...)
        if (cleanQuery.startsWith("db.")) {
          const parts = cleanQuery.replace("db.", "").split(".");
          const collName = parts[0].split("(")[0].replace(/['"\[\]]/g, "").trim();
          if (collName) {
            const rawDocs = await db.collection(collName).find({}).limit(50).toArray();
            const docs = rawDocs.map((d) => JSON.parse(JSON.stringify(d, (k, v) => (typeof v === "bigint" ? v.toString() : v))));
            const columns = docs.length > 0 ? Object.keys(docs[0]) : [];
            return NextResponse.json({
              success: true,
              records: docs,
              columns,
              rowCount: docs.length,
              executionTime: Math.round(performance.now() - startTime),
            });
          }
        }

        // 1.6 If user explicitly asked for list of collections
        if (/show\s+collections|db\.getCollectionNames\(\)|db\.listCollections\(\)/i.test(cleanQuery)) {
          const collections = await db.listCollections().toArray();
          return NextResponse.json({
            success: true,
            records: collections.map((c) => ({ collection: c.name, type: c.type || "collection" })),
            columns: ["collection", "type"],
            rowCount: collections.length,
            executionTime: Math.round(performance.now() - startTime),
          });
        }

        throw new Error(`Unsupported or unparseable MongoDB query syntax: ${cleanQuery}`);
      } finally {
        await client.close().catch(() => {});
      }
    }

    // =========================================================================
    // 2. SUPABASE (POSTGREST API / DIRECT POOLER)
    // =========================================================================
    const isSupabase = dbType === "Supabase";
    const hasSupabaseApi = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

    // If connectionUri is provided for Supabase, prioritize full PostgreSQL query via pg driver below
    if (isSupabase && (connectionMode === "apikey" || (!connectionUri && hasSupabaseApi))) {
      if (hasSupabaseApi) {
        // Robust Supabase URL normalization
        let cleanUrl = (supabaseUrl || "").trim();
        const dashMatch = cleanUrl.match(/(?:dashboard\/project|project)\/([a-z0-9_-]+)/i);
        if (dashMatch && dashMatch[1]) {
          cleanUrl = `https://${dashMatch[1]}.supabase.co`;
        }
        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
          cleanUrl = `https://${cleanUrl}`;
        }
        if (!cleanUrl.includes(".") && !cleanUrl.includes("://localhost")) {
          cleanUrl = `https://${cleanUrl.replace(/^https?:\/\//, "")}.supabase.co`;
        }
        cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

        const key = (supabaseServiceKey || supabaseAnonKey || "").trim().replace(/^['"]|['"]$/g, "");

        // Extract table name from SQL (handles "public"."users", public.users, "users", users, Leaderboard)
        let targetTable = "";
        const fromMatch = cleanQuery.match(/FROM\s+(?:["`']?public["`']?\.)?["`']?([a-zA-Z0-9_\-]+)["`']?/i);
        if (fromMatch && fromMatch[1]) {
          targetTable = fromMatch[1].replace(/["`']/g, "").trim();
        }

        const limitMatch = cleanQuery.match(/LIMIT\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;

        // Parse SELECT columns
        let selectParam = "*";
        const selectMatch = cleanQuery.match(/SELECT\s+(.*?)\s+FROM/i);
        if (selectMatch && selectMatch[1] && !selectMatch[1].includes("*")) {
          const rawCols = selectMatch[1]
            .split(",")
            .map((c) => c.replace(/["`']/g, "").trim())
            .filter(Boolean);
          if (rawCols.length > 0) {
            selectParam = rawCols.join(",");
          }
        }

        const candidateTables = [
          targetTable,
          targetTable.toLowerCase(),
          targetTable.toUpperCase(),
          `${targetTable.toLowerCase()}s`,
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        let finalData: any = null;
        let lastErrorMsg = "";

        for (const tbl of candidateTables) {
          let reqUrl = `${cleanUrl}/rest/v1/${encodeURIComponent(tbl)}?select=${encodeURIComponent(selectParam)}`;

          // Parse WHERE filters
          const whereMatch = cleanQuery.match(/WHERE\s+([\s\S]*?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+GROUP\s+BY|\s*$)/i);
          if (whereMatch && whereMatch[1]) {
            const conditions = whereMatch[1].split(/\s+AND\s+/i);
            for (const cond of conditions) {
              const eqMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s*=\s*['"]?([^'"]+)['"]?$/i);
              const gteMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s*>=\s*['"]?([^'"]+)['"]?$/i);
              const lteMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s*<=\s*['"]?([^'"]+)['"]?$/i);
              const gtMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s*>\s*['"]?([^'"]+)['"]?$/i);
              const ltMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s*<\s*['"]?([^'"]+)['"]?$/i);
              const neqMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s*(?:!=|<>)\s*['"]?([^'"]+)['"]?$/i);
              const isNullMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s+IS\s+NULL$/i);
              const isNotNullMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s+IS\s+NOT\s+NULL$/i);
              const ilikeMatch = cond.trim().match(/^["`']?([a-zA-Z0-9_]+)["`']?\s+(?:ILIKE|LIKE)\s+['"]?([^'"]+)['"]?$/i);

              if (eqMatch) reqUrl += `&${encodeURIComponent(eqMatch[1])}=eq.${encodeURIComponent(eqMatch[2].trim())}`;
              else if (gteMatch) reqUrl += `&${encodeURIComponent(gteMatch[1])}=gte.${encodeURIComponent(gteMatch[2].trim())}`;
              else if (lteMatch) reqUrl += `&${encodeURIComponent(lteMatch[1])}=lte.${encodeURIComponent(lteMatch[2].trim())}`;
              else if (gtMatch) reqUrl += `&${encodeURIComponent(gtMatch[1])}=gt.${encodeURIComponent(gtMatch[2].trim())}`;
              else if (ltMatch) reqUrl += `&${encodeURIComponent(ltMatch[1])}=lt.${encodeURIComponent(ltMatch[2].trim())}`;
              else if (neqMatch) reqUrl += `&${encodeURIComponent(neqMatch[1])}=neq.${encodeURIComponent(neqMatch[2].trim())}`;
              else if (isNullMatch) reqUrl += `&${encodeURIComponent(isNullMatch[1])}=is.null`;
              else if (isNotNullMatch) reqUrl += `&${encodeURIComponent(isNotNullMatch[1])}=not.is.null`;
              else if (ilikeMatch) reqUrl += `&${encodeURIComponent(ilikeMatch[1])}=ilike.${encodeURIComponent(ilikeMatch[2].trim())}`;
            }
          }

          // Parse ORDER BY
          const orderMatch = cleanQuery.match(/ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?/i);
          if (orderMatch) {
            const orderCol = orderMatch[1];
            const orderDir = orderMatch[2]?.toLowerCase() === "desc" ? "desc" : "asc";
            reqUrl += `&order=${orderCol}.${orderDir}`;
          }

          // Add LIMIT
          reqUrl += `&limit=${limit}`;

          try {
            const res = await fetch(reqUrl, {
              method: "GET",
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                Accept: "application/json",
              },
              signal: AbortSignal.timeout(10000),
            });

            if (res.ok) {
              const rawData = await res.json();
              finalData = Array.isArray(rawData) ? rawData : [rawData];
              break; // Successfully fetched
            } else {
              const errText = await res.text();
              lastErrorMsg = `HTTP ${res.status}: ${errText}`;
              if (res.status !== 404) {
                break;
              }
            }
          } catch (fetchErr: any) {
            lastErrorMsg = fetchErr?.message || "Network request failed";
            break;
          }
        }

        if (finalData !== null) {
          const records = finalData;
          const columns =
            records.length > 0 && typeof records[0] === "object"
              ? Object.keys(records[0])
              : [];

          return NextResponse.json({
            success: true,
            records,
            columns,
            rowCount: records.length,
            executionTime: Math.round(performance.now() - startTime),
          });
        }

        return NextResponse.json(
          {
            success: false,
            message: `Supabase PostgREST Execution Error: ${lastErrorMsg || `Table "${targetTable}" not found in project.`}`,
          },
          { status: 422 }
        );
      }
    }

    // =========================================================================
    // 3. MYSQL 8.0 NATIVE DRIVER
    // =========================================================================
    if (dbType === "MySQL") {
      const mysqlConfig: any = {
        host: host || "127.0.0.1",
        port: port ? Number(port) : 3306,
        user: username || "root",
        password: password || "",
        database: databaseName || undefined,
        connectTimeout: 10000,
        ssl: ssl ? { rejectUnauthorized: false } : undefined,
      };

      const conn = connectionUri
        ? await mysql.createConnection(connectionUri)
        : await mysql.createConnection(mysqlConfig);

      try {
        const [rows, fields] = await conn.query(cleanQuery);
        const records = Array.isArray(rows) ? (rows as any[]) : [{ result: rows }];
        const columns = fields
          ? fields.map((f: any) => f.name)
          : records.length > 0 && typeof records[0] === "object"
          ? Object.keys(records[0])
          : [];

        return NextResponse.json({
          success: true,
          records,
          columns,
          rowCount: records.length,
          executionTime: Math.round(performance.now() - startTime),
        });
      } finally {
        await conn.end().catch(() => {});
      }
    }

    // =========================================================================
    // 4. POSTGRESQL / NEON / SUPABASE / COCKROACHDB NATIVE DRIVER (PG)
    // =========================================================================
    // Guard against empty / unconfigured connections
    if (
      !connectionUri &&
      (!host || host === "127.0.0.1" || host === "localhost") &&
      !username &&
      !password &&
      !hasSupabaseApi
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active database credentials configured. Please open Database Settings (⚙️) to connect to your database.",
          error: "NO_CONNECTION_CONFIG",
        },
        { status: 400 }
      );
    }

    let pgConfig: any;
    if (connectionUri) {
      pgConfig = parsePostgresConfig(connectionUri);
    } else {
      pgConfig = {
        host: host || "127.0.0.1",
        port: port ? Number(port) : 5432,
        database: databaseName || "postgres",
        user: username || "postgres",
        password: password || "",
        ssl: ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 12000,
        statement_timeout: 15000,
      };
    }

    let client = new Client(pgConfig);
    try {
      await client.connect();
    } catch (connErr: any) {
      // Automatic SSL auto-fallback if local PostgreSQL doesn't support SSL
      if (
        pgConfig.ssl &&
        (connErr?.message?.includes("does not support SSL") ||
          connErr?.message?.includes("SSL is not enabled") ||
          connErr?.code === "ECONNREFUSED")
      ) {
        console.warn("PostgreSQL SSL connection rejected. Retrying without SSL...");
        pgConfig.ssl = false;
        client = new Client(pgConfig);
        await client.connect();
      } else {
        throw connErr;
      }
    }

    try {
      const result = await client.query(cleanQuery);
      const records = result.rows || [];
      const columns = result.fields
        ? result.fields.map((f: any) => f.name)
        : records.length > 0 && typeof records[0] === "object"
        ? Object.keys(records[0])
        : [];
      const latencyMs = Math.round(performance.now() - startTime);

      return NextResponse.json({
        success: true,
        records,
        columns,
        rowCount: result.rowCount ?? records.length,
        executionTime: latencyMs,
      });
    } finally {
      await client.end().catch(() => {});
    }
  } catch (error: any) {
    console.error("Native database query execution error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Database query execution failed.",
        error: error?.code || "EXECUTION_ERROR",
        details: error?.stack,
      },
      { status: 500 }
    );
  }
}
