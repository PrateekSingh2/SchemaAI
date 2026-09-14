import { NextRequest, NextResponse } from "next/server";
import { validateDatabaseConnection, DatabaseConnectionPayload } from "@/lib/dbValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/database/connect
 * Serverless edge endpoint to validate connection parameters,
 * perform handshake verification, and introspect database schema.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DatabaseConnectionPayload;

    if (!body || !body.dbType) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing database engine type or invalid payload format.",
          error: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const result = await validateDatabaseConnection(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Serverless database connection handler error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error during database connection handshake.",
        error: "INTERNAL_SERVER_ERROR",
        details: error?.message || "Unknown error occurred.",
      },
      { status: 500 }
    );
  }
}
