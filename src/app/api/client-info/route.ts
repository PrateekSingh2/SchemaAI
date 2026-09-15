import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfIp = request.headers.get("cf-connecting-ip");

    let ip = "127.0.0.1";
    if (forwarded) {
      ip = forwarded.split(",")[0].trim();
    } else if (realIp) {
      ip = realIp.trim();
    } else if (cfIp) {
      ip = cfIp.trim();
    }

    // Clean ipv6 localhost representation if any
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
    }

    return NextResponse.json({ ip }, { status: 200 });
  } catch (_) {
    return NextResponse.json({ ip: "127.0.0.1" }, { status: 200 });
  }
}
