import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qsqxwpkjmvriukmbbtex.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcXh3cGtqbXZyaXVrbWJidGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5ODUxOCwiZXhwIjoyMDgwODc0NTE4fQ.YmxjNmmlMNxsupCRK56iL5x54yLej0yL5VL81iHjngw';
const supabase = createClient(supabaseUrl, supabaseKey);

function getOSFromUserAgent(ua: string): string {
  if (ua.includes("Windows NT 10")) return "Windows";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS") || ua.includes("Macintosh")) return "Darwin";
  if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function getBrowserFromUserAgent(ua: string): string {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Opera")) return "Opera";
  return "Unknown";
}

function generateHostname(os: string, ua: string): string {
  const browser = getBrowserFromUserAgent(ua);
  const randId = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  switch (os) {
    case "Windows":
      return `WIN-${browser.toUpperCase()}-${randId}`;
    case "Darwin":
      return `MacBook-${browser}-${randId}`;
    case "Linux":
      return `linux-${browser.toLowerCase()}-${randId}`;
    case "Android":
      return `android-${randId}`;
    case "iOS":
      return `iPhone-${randId}`;
    default:
      return `client-${randId}`;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      event_type, 
      severity, 
      description, 
      route,
      user_agent = "",
      screen_resolution,
      language,
      platform,
      timezone,
      referrer,
      connection_type,
      device_memory,
      hardware_concurrency,
      online_status,
      visibility_state,
      extra_data
    } = body;

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
      || request.headers.get("x-real-ip") 
      || "127.0.0.1";

    const os = getOSFromUserAgent(user_agent);
    const browser = getBrowserFromUserAgent(user_agent);
    const hostname = generateHostname(os, user_agent);
    
    const now = new Date();
    const timestamp = now.toISOString();
    const syslogTimestamp = now.toLocaleString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    }).replace(',', '');

    const extraInfo = [];
    if (screen_resolution) extraInfo.push(`screen=${screen_resolution}`);
    if (language) extraInfo.push(`lang=${language}`);
    if (timezone) extraInfo.push(`tz=${timezone}`);
    if (connection_type && connection_type !== "unknown") extraInfo.push(`conn=${connection_type}`);
    if (referrer && referrer !== "direct") extraInfo.push(`ref=${referrer.substring(0, 50)}`);
    if (device_memory) extraInfo.push(`mem=${device_memory}GB`);
    if (hardware_concurrency) extraInfo.push(`cores=${hardware_concurrency}`);
    if (typeof online_status === "boolean") extraInfo.push(`online=${online_status}`);
    if (visibility_state) extraInfo.push(`vis=${visibility_state}`);
    
    const extraInfoStr = extraInfo.length > 0 ? ` [${extraInfo.join(", ")}]` : "";
    const extraDataStr = extra_data ? ` data=${JSON.stringify(extra_data)}` : "";
    
    const rawMessage = `${syslogTimestamp} ${hostname} ${browser}[${Math.floor(Math.random() * 30000) + 1000}]: [${event_type}] ${description} route=${route} ip=${clientIp}${extraInfoStr}${extraDataStr}`;

    const event = {
      event_time: timestamp,
      timestamp: timestamp,
      event_type: event_type,
      severity: severity,
      raw_message: rawMessage,
      host: hostname,
      process_name: browser,
      username: "web_visitor",
      source_ip: clientIp,
      log_source: "browser_client",
      os_name: os
    };

    const { data: eventData, error: eventError } = await supabase
      .from("security_events")
      .insert(event)
      .select()
      .single();

    if (eventError) throw eventError;

    let alertData = null;
    const alertTriggers: Record<string, { type: string; severity: string }> = {
      "JS_ERROR": { type: "CLIENT_JAVASCRIPT_ERROR", severity: "medium" },
      "PROMISE_REJECTION": { type: "CLIENT_UNHANDLED_REJECTION", severity: "medium" },
      "API_ERROR": { type: "CLIENT_API_FAILURE", severity: "high" },
      "NETWORK_ERROR": { type: "CLIENT_NETWORK_FAILURE", severity: "high" },
      "NETWORK_OFFLINE": { type: "CLIENT_CONNECTION_LOST", severity: "medium" },
    };

    if (alertTriggers[event_type]) {
      const alertConfig = alertTriggers[event_type];
      const alert = {
        alert_type: alertConfig.type,
        severity: alertConfig.severity,
        description: `${description} (${browser} on ${os}, IP: ${clientIp})`,
        timestamp: timestamp,
        status: "new",
        related_event_ids: JSON.stringify([eventData.id])
      };

      const { data: createdAlert, error: alertError } = await supabase
        .from("alerts")
        .insert(alert)
        .select()
        .single();

      if (!alertError) {
        alertData = createdAlert;
      }
    }

    return NextResponse.json({
      success: true,
      event_id: eventData.id,
      alert_id: alertData?.id || null,
    });
  } catch (err) {
    console.error("Error logging client event:", err);
    return NextResponse.json(
      { error: "Failed to log event", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
