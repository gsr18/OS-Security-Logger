/**
 * API client for security logger backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface SecurityEvent {
  id: number;
  timestamp: string;
  os_name: string;
  event_type: string;
  username: string | null;
  source_ip: string | null;
  process_name: string | null;
  raw_message: string;
}

export interface Alert {
  id: number;
  timestamp: string;
  alert_type: string;
  severity: string;
  description: string;
  related_event_ids: string | null;
}

export interface Stats {
  total_events: number;
  total_alerts: number;
  events_by_type: Record<string, number>;
  events_by_os: Record<string, number>;
  alerts_by_severity: Record<string, number>;
  top_source_ips: Array<{ ip: string; count: number }>;
}

interface EventsResponse {
  events: SecurityEvent[];
  count: number;
}

interface AlertsResponse {
  alerts: Alert[];
  count: number;
}

export class SecurityLoggerAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async health(): Promise<{ status: string; timestamp: string; mode?: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('API health check failed');
    }
    return response.json();
  }

  async getEvents(params?: {
    limit?: number;
    type?: string;
    os?: string;
    since_minutes?: number;
  }): Promise<EventsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.type) queryParams.set('type', params.type);
    if (params?.os) queryParams.set('os', params.os);
    if (params?.since_minutes) queryParams.set('since_minutes', params.since_minutes.toString());

    const url = `${this.baseUrl}/api/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAlerts(params?: {
    limit?: number;
    severity?: string;
    since_minutes?: number;
  }): Promise<AlertsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.severity) queryParams.set('severity', params.severity);
    if (params?.since_minutes) queryParams.set('since_minutes', params.since_minutes.toString());

    const url = `${this.baseUrl}/api/alerts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getStats(): Promise<Stats> {
    const response = await fetch(`${this.baseUrl}/api/stats`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    
    return response.json();
  }

  async generateEvent(): Promise<SecurityEvent> {
    const response = await fetch(`${this.baseUrl}/api/events`, {
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