"use client";

import { Header } from "@/components/header";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Shield, Activity, AlertTriangle, TrendingUp, RefreshCw, Radio, Server, Globe, Clock, Cpu } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { api, SecurityEvent, Alert, Stats } from "@/lib/api";
import { WebGLBackground } from "@/components/webgl-background";
import { CustomAreaChart } from "@/components/charts/area-chart";
import { CustomBarChart } from "@/components/charts/bar-chart";
import { CustomPieChart } from "@/components/charts/pie-chart";
import { CustomLineChart } from "@/components/charts/line-chart";

export default function DashboardPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [eventHistory, setEventHistory] = useState<{ time: string; events: number; alerts: number }[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [eventsData, alertsData, statsData] = await Promise.all([
        api.getEvents({ limit: 10 }),
        api.getAlerts({ limit: 5 }),
        api.getStats(),
      ]);
      
      setEvents(eventsData.events);
      setAlerts(alertsData.alerts);
      setStats(statsData);
      setLastUpdate(new Date());
      
      setEventHistory(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const newEntry = { 
          time: timeStr, 
          events: statsData.total_events, 
          alerts: statsData.total_alerts 
        };
        const updated = [...prev, newEntry].slice(-12);
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'CRITICAL').length;
  const totalEvents = stats?.total_events || 0;
  const totalAlerts = stats?.total_alerts || 0;
  
  const eventTypeData = useMemo(() => {
    if (!stats?.events_by_type) return [];
    return Object.entries(stats.events_by_type)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [stats]);

  const osDistributionData = useMemo(() => {
    if (!stats?.events_by_os) return [];
    return Object.entries(stats.events_by_os)
      .map(([name, value]) => ({ name, value }));
  }, [stats]);

  const topIpsData = useMemo(() => {
    if (!stats?.top_source_ips) return [];
    return stats.top_source_ips.slice(0, 6).map(ip => ({
      name: ip.ip.length > 12 ? ip.ip.slice(0, 12) + '...' : ip.ip,
      value: ip.count,
    }));
  }, [stats]);

  const severityData = useMemo(() => {
    if (!stats?.alerts_by_severity) return [];
    const severityColors: Record<string, string> = {
      critical: '#ff4444',
      CRITICAL: '#ff4444',
      high: '#ff9f43',
      HIGH: '#ff9f43',
      warning: '#ffd93d',
      WARNING: '#ffd93d',
      medium: '#ffd93d',
      MEDIUM: '#ffd93d',
      low: '#00ccff',
      LOW: '#00ccff',
      info: '#00ff88',
      INFO: '#00ff88',
    };
    return Object.entries(stats.alerts_by_severity).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      value,
      fill: severityColors[name] || '#00ff88',
    }));
  }, [stats]);

  return (
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />
      
      <div className="border-b border-primary/30 bg-primary/5 backdrop-blur-sm">
        <div className="container px-4 py-2 flex items-center justify-center gap-2">
          <Radio className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-primary terminal-text">
            SYSTEM ACTIVE — Real-time security monitoring enabled
          </span>
        </div>
      </div>
      
      <main className="container px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 glow-text">Security Dashboard</h1>
            <p className="text-muted-foreground terminal-text">
              Real-time system monitoring & threat analysis
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground glass-card px-3 py-2 rounded-lg">
              <Clock className="h-4 w-4" />
              <span className="terminal-text">{lastUpdate.toLocaleTimeString()}</span>
            </div>
            <Button onClick={fetchData} disabled={isLoading} size="sm" className="bg-primary/20 border border-primary/50 hover:bg-primary/30">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive glass-card">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground terminal-text">Total Events</p>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="text-4xl font-bold text-primary glow-text">{totalEvents.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              <p className="text-xs text-muted-foreground">All time recorded</p>
            </div>
          </div>

          <div className="stat-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground terminal-text">Active Alerts</p>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-4xl font-bold text-yellow-500">{totalAlerts.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <Server className="h-3 w-3 text-yellow-500" />
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </div>
          </div>

          <div className="stat-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground terminal-text">Critical Alerts</p>
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-4xl font-bold text-red-500">{criticalAlerts}</p>
            <div className="flex items-center gap-2 mt-2">
              <Cpu className="h-3 w-3 text-red-500" />
              <p className="text-xs text-muted-foreground">High priority</p>
            </div>
          </div>

          <div className="stat-card p-6 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground terminal-text">Unique IPs</p>
              <Globe className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-4xl font-bold text-cyan-400">{stats?.unique_ips || 0}</p>
            <div className="flex items-center gap-2 mt-2">
              <Globe className="h-3 w-3 text-cyan-400" />
              <p className="text-xs text-muted-foreground">Source addresses</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {eventHistory.length > 1 && (
            <CustomAreaChart
              title="Event Activity Timeline"
              data={eventHistory}
              dataKeys={[
                { key: "events", color: "#00ff88", name: "Events" },
                { key: "alerts", color: "#ff6b6b", name: "Alerts" },
              ]}
              height={280}
            />
          )}

          {eventTypeData.length > 0 && (
            <CustomBarChart
              title="Events by Type"
              data={eventTypeData}
              height={280}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {osDistributionData.length > 0 && (
            <CustomPieChart
              title="Platform Distribution"
              data={osDistributionData}
              height={280}
            />
          )}

          {topIpsData.length > 0 && (
            <CustomBarChart
              title="Top Source IPs"
              data={topIpsData}
              height={280}
              layout="vertical"
            />
          )}

          {severityData.length > 0 && (
            <div className="chart-container p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary glow-text">Alert Severity</h3>
              <div className="grid grid-cols-2 gap-3">
                {severityData.map((item) => (
                  <div 
                    key={item.name} 
                    className="p-4 rounded-lg text-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${item.fill}15, ${item.fill}05)`,
                      border: `1px solid ${item.fill}40`
                    }}
                  >
                    <p className="text-3xl font-bold" style={{ color: item.fill }}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 glow-text flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Recent Alerts
            </h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="p-4 rounded-lg glass-card flex items-start gap-4 scan-line"
                >
                  <div className={`mt-1 ${
                    alert.severity === 'critical' || alert.severity === 'CRITICAL' ? 'text-red-500' :
                    alert.severity === 'warning' || alert.severity === 'WARNING' ? 'text-yellow-500' :
                    'text-cyan-400'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium terminal-text ${
                        alert.severity === 'critical' || alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        alert.severity === 'warning' || alert.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-muted-foreground terminal-text">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium">{alert.description}</p>
                    <p className="text-sm text-muted-foreground mt-1 terminal-text">Type: {alert.alert_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4 glow-text flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Events
          </h2>
          {isLoading && events.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-lg">
              <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin mb-4" />
              <p className="text-muted-foreground terminal-text">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-lg">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground terminal-text">Events will appear here as they are detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard 
                  key={event.id}
                  id={event.id}
                  timestamp={event.timestamp}
                  eventType={event.event_type}
                  username={event.username}
                  sourceIp={event.source_ip}
                  processName={event.process_name}
                  osName={event.os_name}
                  rawMessage={event.raw_message}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
