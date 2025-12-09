import { NextRequest, NextResponse } from "next/server";
import { initializeMockData, storedAlerts } from "@/lib/mock-data";

export async function GET(request: NextRequest) {
  initializeMockData();
  
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : pageSize;
  
  const alertType = searchParams.get("type") || searchParams.get("alertType") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const status = searchParams.get("status") || undefined;
  const sinceMinutes = searchParams.get("since_minutes") 
    ? parseInt(searchParams.get("since_minutes")!) 
    : undefined;

  let filtered = [...storedAlerts];
  
  if (alertType) {
    filtered = filtered.filter(a => a.alert_type === alertType);
  }
  if (severity) {
    filtered = filtered.filter(a => a.severity?.toUpperCase() === severity.toUpperCase());
  }
  if (status) {
    filtered = filtered.filter(a => a.status === status);
  }
  if (sinceMinutes) {
    const cutoff = Date.now() - sinceMinutes * 60 * 1000;
    filtered = filtered.filter(a => new Date(a.timestamp).getTime() >= cutoff);
  }

  const total = filtered.length;
  const offset = (page - 1) * pageSize;
  const paginatedAlerts = filtered.slice(offset, offset + limit);
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    alerts: paginatedAlerts,
    total,
    count: paginatedAlerts.length,
    page,
    pageSize,
    totalPages
  });
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const alertId = url.pathname.split('/').pop();
  
  if (!alertId) {
    return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
  }

  const body = await request.json();
  const { status } = body;
  
  const alert = storedAlerts.find(a => a.id === parseInt(alertId));
  if (alert) {
    alert.status = status;
    return NextResponse.json({ success: true, id: alert.id, status });
  }
  
  return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
}