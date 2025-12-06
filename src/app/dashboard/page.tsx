"use client";

import { Header } from "@/components/header";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Shield, Activity, AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api, SecurityEvent, Alert, Stats } from "@/lib/api";

export default function DashboardPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [eventsData, alertsData, statsData] = await Promise.all([
        api.getEvents({ limit: 10 }),
        api.getAlerts({ limit: 5 }),
        api.getStats()
      ]);
      
      setEvents(eventsData.events);
      setAlerts(alertsData.alerts);
      setStats(statsData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const totalEvents = stats?.total_events || 0;
  const totalAlerts = stats?.total_alerts || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Security Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of system security events
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button onClick={fetchData} disabled={isLoading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">Make sure the Python backend is running on http://localhost:5000</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Events</p>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold">{totalEvents.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">{totalAlerts.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total alerts</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{criticalAlerts}</p>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Recent Events</p>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold">{events.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 10 events</p>
          </div>
        </div>

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="p-4 rounded-lg border border-border bg-card flex items-start gap-4"
                >
                  <div className={`mt-1 ${
                    alert.severity === 'CRITICAL' ? 'text-red-500' :
                    alert.severity === 'WARNING' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                        alert.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium">{alert.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">Type: {alert.alert_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
          {isLoading && events.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-lg bg-card">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground">Events will appear here as they are detected</p>
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