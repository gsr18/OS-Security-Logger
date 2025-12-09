import { NextRequest, NextResponse } from "next/server";
import { getEvents, generateEvent, initializeMockData, storedEvents } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  initializeMockData();
  
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : pageSize;
  
  const type = searchParams.get("type") || searchParams.get("eventType") || undefined;
  const os = searchParams.get("os") || undefined;
  const user = searchParams.get("user") || undefined;
  const srcIp = searchParams.get("srcIp") || searchParams.get("src_ip") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const search = searchParams.get("search") || undefined;
  const sinceMinutes = searchParams.get("since_minutes") 
    ? parseInt(searchParams.get("since_minutes")!) 
    : undefined;

  let filtered = [...storedEvents];
  
  if (type) {
    filtered = filtered.filter(e => e.event_type === type);
  }
  if (os) {
    filtered = filtered.filter(e => e.os_name === os);
  }
  if (user) {
    filtered = filtered.filter(e => 
      e.username?.toLowerCase().includes(user.toLowerCase()) ||
      e.user?.toLowerCase().includes(user.toLowerCase())
    );
  }
  if (srcIp) {
    filtered = filtered.filter(e => 
      e.source_ip?.includes(srcIp) || e.src_ip?.includes(srcIp)
    );
  }
  if (severity) {
    filtered = filtered.filter(e => e.severity === severity);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(e => 
      e.raw_message?.toLowerCase().includes(searchLower) ||
      e.username?.toLowerCase().includes(searchLower) ||
      e.source_ip?.includes(search) ||
      e.process_name?.toLowerCase().includes(searchLower)
    );
  }
  if (sinceMinutes) {
    const cutoff = Date.now() - sinceMinutes * 60 * 1000;
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= cutoff);
  }

  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const paginatedEvents = filtered.slice(offset, offset + limit);
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    events: paginatedEvents,
    total,
    count: paginatedEvents.length,
    page,
    pageSize,
    totalPages
  });
}

export async function POST() {
  const event = generateEvent();
  return NextResponse.json({ success: true, event });
}