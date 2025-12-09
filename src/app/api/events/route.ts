import { NextRequest, NextResponse } from "next/server";
import { getEvents, generateEvent } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100;
  const type = searchParams.get("type") || undefined;
  const os = searchParams.get("os") || undefined;
  const sinceMinutes = searchParams.get("since_minutes") 
    ? parseInt(searchParams.get("since_minutes")!) 
    : undefined;

  const result = getEvents({ limit, type, os, since_minutes: sinceMinutes });
  
  return NextResponse.json(result);
}

export async function POST() {
  const event = generateEvent();
  return NextResponse.json({ event });
}
