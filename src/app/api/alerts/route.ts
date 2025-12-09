import { NextRequest, NextResponse } from "next/server";
import { getAlerts } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
  const severity = searchParams.get("severity") || undefined;
  const sinceMinutes = searchParams.get("since_minutes") 
    ? parseInt(searchParams.get("since_minutes")!) 
    : undefined;

  const result = getAlerts({ limit, severity, since_minutes: sinceMinutes });
  
  return NextResponse.json(result);
}
