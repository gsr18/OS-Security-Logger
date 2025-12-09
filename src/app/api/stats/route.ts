import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const [eventsResult, alertsResult] = await Promise.all([
    supabase.from('security_events').select('id, event_type, os_name, severity, source_ip, username'),
    supabase.from('alerts').select('id, severity, status'),
  ]);

  if (eventsResult.error || alertsResult.error) {
    console.error('Supabase error:', eventsResult.error || alertsResult.error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  const events = eventsResult.data || [];
  const alerts = alertsResult.data || [];

  const events_by_type: Record<string, number> = {};
  const events_by_os: Record<string, number> = {};
  const events_by_severity: Record<string, number> = {};
  const ip_counts: Record<string, number> = {};
  const user_counts: Record<string, number> = {};

  for (const event of events) {
    events_by_type[event.event_type] = (events_by_type[event.event_type] || 0) + 1;
    events_by_os[event.os_name] = (events_by_os[event.os_name] || 0) + 1;
    if (event.severity) {
      events_by_severity[event.severity] = (events_by_severity[event.severity] || 0) + 1;
    }
    if (event.source_ip) {
      ip_counts[event.source_ip] = (ip_counts[event.source_ip] || 0) + 1;
    }
    if (event.username) {
      user_counts[event.username] = (user_counts[event.username] || 0) + 1;
    }
  }

  const alerts_by_severity: Record<string, number> = {};
  const alerts_by_status: Record<string, number> = {};
  for (const alert of alerts) {
    alerts_by_severity[alert.severity] = (alerts_by_severity[alert.severity] || 0) + 1;
    if (alert.status) {
      alerts_by_status[alert.status] = (alerts_by_status[alert.status] || 0) + 1;
    }
  }

  const top_source_ips = Object.entries(ip_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  const top_users = Object.entries(user_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user, count]) => ({ user, count }));

  const failed_logins = events.filter(e => e.event_type === "AUTH_FAILURE").length;
  const successful_logins = events.filter(e => e.event_type === "AUTH_SUCCESS").length;
  const unique_ips = Object.keys(ip_counts).length;

  return NextResponse.json({
    total_events: events.length,
    total_alerts: alerts.length,
    events_by_type,
    events_by_os,
    events_by_severity,
    alerts_by_severity,
    alerts_by_status,
    top_source_ips,
    top_users,
    failed_logins,
    successful_logins,
    unique_ips,
  });
}
