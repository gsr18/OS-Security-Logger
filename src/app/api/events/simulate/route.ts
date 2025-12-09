import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qsqxwpkjmvriukmbbtex.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcXh3cGtqbXZyaXVrbWJidGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5ODUxOCwiZXhwIjoyMDgwODc0NTE4fQ.YmxjNmmlMNxsupCRK56iL5x54yLej0yL5VL81iHjngw';
const supabase = createClient(supabaseUrl, supabaseKey);

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

const eventTemplates = [
  { event_type: "AUTH_FAILURE", severity: "warning", username: "admin", source_ip: "192.168.1." },
  { event_type: "AUTH_SUCCESS", severity: "info", username: "root", source_ip: "10.0.0.5" },
  { event_type: "SUDO_SUCCESS", severity: "info", username: "developer", process_name: "sudo" },
  { event_type: "SUDO_FAILURE", severity: "warning", username: "www-data", process_name: "sudo" },
  { event_type: "FIREWALL_BLOCK", severity: "warning", source_ip: "203.0.113.", process_name: "ufw" },
  { event_type: "SERVICE_START", severity: "info", process_name: "nginx" },
  { event_type: "SERVICE_STOP", severity: "info", process_name: "apache2" },
  { event_type: "KERNEL_WARNING", severity: "warning", process_name: "kernel" },
  { event_type: "SESSION_START", severity: "info", username: "root", process_name: "sshd" },
  { event_type: "SESSION_END", severity: "info", username: "admin", process_name: "sshd" },
];

export async function POST() {
  try {
    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    const now = new Date().toISOString();
    
    const randomOctet = Math.floor(Math.random() * 254) + 1;
    const source_ip = template.source_ip ? 
      (template.source_ip.endsWith('.') ? template.source_ip + randomOctet : template.source_ip) : 
      null;

    const event = {
      event_time: now,
      timestamp: now,
      event_type: template.event_type,
      severity: template.severity,
      raw_message: `[SIMULATED] ${template.event_type} event generated at ${now}`,
      host: "seclogger-host",
      process_name: template.process_name || "sshd",
      username: template.username || null,
      source_ip: source_ip,
      log_source: "simulation",
      os_name: "linux",
    };

    const { data, error } = await supabase
      .from("security_events")
      .insert(event)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      event: data,
      mode: USE_MOCK_DATA ? "mock" : "real",
    });
  } catch (err) {
    console.error("Error simulating event:", err);
    return NextResponse.json(
      { error: "Failed to simulate event" },
      { status: 500 }
    );
  }
}