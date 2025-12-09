import { NextResponse } from "next/server";
import { initializeMockData, storedEvents, storedAlerts } from "@/lib/mock-data";

export async function GET() {
  initializeMockData();
  
  const events_by_type: Record<string, number> = {};
  const events_by_os: Record<string, number> = {};
  const events_by_severity: Record<string, number> = {};
  const ip_counts: Record<string, number> = {};
  const user_counts: Record<string, number> = {};

  for (const event of storedEvents) {
    events_by_type[event.event_type] = (events_by_type[event.event_type] || 0) + 1;
    events_by_os[event.os_name] = (events_by_os[event.os_name] || 0) + 1;
    if (event.severity) {
      events_by_severity[event.severity] = (events_by_severity[event.severity] || 0) + 1;
    }
    const ip = event.source_ip || event.src_ip;
    if (ip) {
      ip_counts[ip] = (ip_counts[ip] || 0) + 1;
    }
    const user = event.username || event.user;
    if (user) {
      user_counts[user] = (user_counts[user] || 0) + 1;
    }
  }

  const alerts_by_severity: Record<string, number> = {};
  const alerts_by_status: Record<string, number> = {};
  for (const alert of storedAlerts) {
    if (alert.severity) {
      alerts_by_severity[alert.severity] = (alerts_by_severity[alert.severity] || 0) + 1;
    }
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

  const failed_logins = storedEvents.filter(e => 
    e.event_type === 'AUTH_FAILURE' || e.event_type === 'FAILED_LOGIN'
  ).length;
  
  const successful_logins = storedEvents.filter(e => 
    e.event_type === 'AUTH_SUCCESS' || e.event_type === 'SUCCESS_LOGIN'
  ).length;

  const unique_ips = new Set(
    storedEvents
      .map(e => e.source_ip || e.src_ip)
      .filter(Boolean)
  ).size;

  const hourly_events: Array<{ hour: string; count: number }> = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hourStart = new Date(now);
    hourStart.setHours(now.getHours() - i, 0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);
    
    const count = storedEvents.filter(e => {
      const t = new Date(e.timestamp).getTime();
      return t >= hourStart.getTime() && t < hourEnd.getTime();
    }).length;
    
    hourly_events.push({
      hour: hourStart.toISOString().slice(0, 13) + ':00:00',
      count
    });
  }

  return NextResponse.json({
    total_events: storedEvents.length,
    total_alerts: storedAlerts.length,
    events_by_type,
    events_by_os,
    events_by_severity,
    alerts_by_severity,
    alerts_by_status,
    top_source_ips,
    top_users,
    hourly_events,
    failed_logins,
    successful_logins,
    unique_ips
  });
}