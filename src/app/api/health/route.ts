import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    backend: "nextjs",
    db: "mock",
    mode: "mock",
    timestamp: new Date().toISOString(),
  });
}
