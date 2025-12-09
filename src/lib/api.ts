/**
 * API client for security logger (uses Supabase via Next.js API routes)
 */

export interface SecurityEvent {
  id: number;
  created_at?: string;
  event_time?: string;
  timestamp: string;
  host?: string;
  process?: string;
  process_name?: string;
  pid?: number;
  event_type: string;
  user?: string | null;
  username?: string | null;
  src_ip?: string | null;
  source_ip?: string | null;
  dst_ip?: string | null;
  severity?: string;
  log_source?: string;
  raw_message: string;
  os_name: string;
}

export interface Alert {
  id: number;
  created_at?: string;
  timestamp: string;
  alert_type: string;
  severity: string;
  description: string;
  related_event_ids: string | null;
  status?: string;
}

export interface Stats {
  total_events: number;
  total_alerts: number;
  events_by_type: Record<string, number>;
  events_by_os: Record<string, number>;
  events_by_severity?: Record<string, number>;
  alerts_by_severity: Record<string, number>;
  alerts_by_status?: Record<string, number>;
  top_source_ips: Array<{ ip: string; count: number }>;
  top_users?: Array<{ user: string; count: number }>;
  hourly_events?: Array<{ hour: string; count: number }>;
  failed_logins?: number;
  successful_logins?: number;
  unique_ips?: number;
}

interface EventsResponse {
  events: SecurityEvent[];
  total: number;
  count: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
  count: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

interface HealthResponse {
  status: string;
  backend?: string;
  db?: string;
  mode?: string;
  timestamp: string;
}

interface ConfigResponse {
  mode: 'mock' | 'real';
  use_mock_data: boolean;
  version: string;
}

export class SecurityLoggerAPI {
  async health(): Promise<HealthResponse> {
    const response = await fetch('/api/health');
    if (!response.ok) {
      throw new Error('API health check failed');
    }
    return response.json();
  }

  async getEvents(params?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    type?: string;
    eventType?: string;
    os?: string;
    user?: string;
    srcIp?: string;
    severity?: string;
    search?: string;
    since_minutes?: number;
    from?: string;
    to?: string;
  }): Promise<EventsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.type) queryParams.set('type', params.type);
    if (params?.eventType) queryParams.set('eventType', params.eventType);
    if (params?.os) queryParams.set('os', params.os);
    if (params?.user) queryParams.set('user', params.user);
    if (params?.srcIp) queryParams.set('srcIp', params.srcIp);
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.since_minutes) queryParams.set('since_minutes', params.since_minutes.toString());
    if (params?.from) queryParams.set('from', params.from);
    if (params?.to) queryParams.set('to', params.to);

    const url = `/api/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAlerts(params?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    type?: string;
    alertType?: string;
    severity?: string;
    status?: string;
    since_minutes?: number;
    from?: string;
    to?: string;
  }): Promise<AlertsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.type) queryParams.set('type', params.type);
    if (params?.alertType) queryParams.set('alertType', params.alertType);
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.since_minutes) queryParams.set('since_minutes', params.since_minutes.toString());
    if (params?.from) queryParams.set('from', params.from);
    if (params?.to) queryParams.set('to', params.to);

    const url = `/api/alerts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateAlertStatus(alertId: number, status: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/alerts/${alertId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update alert: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getStats(): Promise<Stats> {
    const response = await fetch('/api/stats');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getConfig(): Promise<ConfigResponse> {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    return response.json();
  }

  async generateEvent(): Promise<SecurityEvent> {
    const response = await fetch('/api/events/simulate', {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate event: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.event;
  }
}

export const api = new SecurityLoggerAPI();