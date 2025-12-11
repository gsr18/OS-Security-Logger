import { NextRequest, NextResponse } from "next/server";
import { supabase, DbAlert } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : pageSize;
  const type = searchParams.get("type") || searchParams.get("alertType") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const status = searchParams.get("status") || undefined;

  let query = supabase
    .from('alerts')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false });

  if (type) query = query.eq('alert_type', type);
  if (severity) query = query.ilike('severity', severity);
  if (status) query = query.eq('status', status);

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const alerts = (data || []).map((a: DbAlert) => {
    const normalizedSeverity = (a.severity || '').toUpperCase();
    let severityLevel = normalizedSeverity;
    if (normalizedSeverity === 'HIGH') severityLevel = 'WARNING';
    if (normalizedSeverity === 'MEDIUM' || normalizedSeverity === 'LOW') severityLevel = 'INFO';

    return {
      id: a.id,
      created_at: a.created_at,
      timestamp: a.timestamp,
      alert_type: a.alert_type,
      severity: severityLevel,
      description: a.description,
      related_event_ids: a.related_event_ids,
      status: a.status,
    };
  });

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    alerts,
    total,
    count: alerts.length,
    page,
    pageSize,
    totalPages
  });
}