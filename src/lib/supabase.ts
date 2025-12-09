import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qsqxwpkjmvriukmbbtex.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcXh3cGtqbXZyaXVrbWJidGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTg1MTgsImV4cCI6MjA4MDg3NDUxOH0.FOseILDY-zodDD5b3c9FQEYkgv_SruDrkw_82Lg5fJU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DbSecurityEvent {
  id: number
  created_at: string
  event_time: string
  timestamp: string
  host: string | null
  process_name: string | null
  pid: number | null
  event_type: string
  username: string | null
  source_ip: string | null
  dst_ip: string | null
  severity: string
  log_source: string | null
  raw_message: string
  os_name: string
}

export interface DbAlert {
  id: number
  created_at: string
  timestamp: string
  alert_type: string
  severity: string
  description: string
  related_event_ids: string | null
  status: string
}
