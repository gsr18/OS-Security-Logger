import { NextResponse } from "next/server";
import { initializeMockData, storedEvents, storedAlerts } from "@/lib/mock-data";

export async function GET() {
  initializeMockData();
  
  return NextResponse.json({
    status: "ok",
    backend: "nextjs",
    db: "mock",
    mode: "mock",
    timestamp: new Date().toISOString(),
    events_count: storedEvents.length,
    alerts_count: storedAlerts.length
  });
}