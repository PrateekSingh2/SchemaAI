import { validateDatabaseConnection, DatabaseConnectionPayload } from "../../src/lib/dbValidation";

/**
 * Netlify Serverless Function Handler
 * POST /.netlify/functions/test-database-connection
 */
export const handler = async (event: any, context: any) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: "Method Not Allowed. Use POST." }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}") as DatabaseConnectionPayload;

    if (!payload || !payload.dbType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: "Missing database engine type in request body.",
        }),
      };
    }

    const result = await validateDatabaseConnection(payload);

    return {
      statusCode: result.success ? 200 : 422,
      headers,
      body: JSON.stringify(result),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "Internal Serverless Function Error",
        details: err?.message || String(err),
      }),
    };
  }
};
