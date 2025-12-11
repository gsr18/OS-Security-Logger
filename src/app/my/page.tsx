"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { WebGLBackground } from "@/components/webgl-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/event-card";
import { api, SecurityEvent, Alert } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AlertTriangle, Cpu, Gauge, Loader2, Radar, Shield, SlidersHorizontal, Sparkles, Timer, Waves } from "lucide-react";
import { CustomBarChart } from "@/components/charts/bar-chart";
import { CustomPieChart } from "@/components/charts/pie-chart";

export default function MyViewPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [systemTag, setSystemTag] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem("systemTag") || "";
    const fallback = user.email?.split("@")[0] || "";
    const initial = saved || fallback;
    setSystemTag(initial);
    setTagInput(initial);
  }, [user]);

  useEffect(() => {
    if (!systemTag) {
      setEvents([]);
      setAlerts([]);
      return;
    }
    fetchData(systemTag);
  }, [systemTag]);

  const fetchData = async (tag: string) => {
    setIsFetching(true);
    setError(null);
    try {
      const eventsRes = await api.getEvents({ limit: 50, user: tag });
      const eventIds = eventsRes.events.map((e) => String(e.id));
      const alertsRes = await api.getAlerts({ limit: 120 });
      const filteredAlerts = alertsRes.alerts.filter((a) => {
        if (!a.related_event_ids) return false;
        return a.related_event_ids.split(",").some((id) => eventIds.includes(id.trim())) || a.description.toLowerCase().includes(tag.toLowerCase());
      });
      setEvents(eventsRes.events);
      setAlerts(filteredAlerts);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveTag = () => {
    setSystemTag(tagInput.trim());
    localStorage.setItem("systemTag", tagInput.trim());
  };

  const eventTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      counts[e.event_type] = (counts[e.event_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [events]);

  const osData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e) => {
      if (e.os_name) counts[e.os_name] = (counts[e.os_name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [events]);

  const alertSeverityData = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach((a) => {
      const key = a.severity.toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [alerts]);

  const totalEvents = events.length;
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter((a) => a.severity.toUpperCase() === "CRITICAL").length;

  return (
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />

      <main className="container px-4 py-8 relative z-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs uppercase tracking-wide text-primary">Personal feed</span>
            </div>
            <h1 className="text-3xl font-bold glow-text">My system dashboard</h1>
            <p className="text-muted-foreground terminal-text">Only data that matches your system tag is shown. Admins see full data elsewhere.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="system tag (username, host, ip)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-56 bg-background/50 border-primary/30"
            />
            <Button onClick={handleSaveTag} disabled={isFetching || !tagInput.trim()} size="sm" className="bg-primary/20 border border-primary/50 hover:bg-primary/30">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Set tag
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive glass-card">
            <p className="font-medium">Unable to load</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">System tag</p>
              <Radar className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xl font-semibold text-primary">{systemTag || "Not set"}</p>
            <p className="text-xs text-muted-foreground mt-1">Data filtered by this tag</p>
          </div>

          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">Events</p>
              <Gauge className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-cyan-400">{totalEvents}</p>
            <p className="text-xs text-muted-foreground mt-1">From your system</p>
          </div>

          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">Alerts</p>
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-500">{totalAlerts}</p>
            <p className="text-xs text-muted-foreground mt-1">Linked to your events</p>
          </div>

          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">Critical</p>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{criticalAlerts}</p>
            <p className="text-xs text-muted-foreground mt-1">Immediate attention</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-semibold">Event types</h3>
              </div>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            {eventTypeData.length > 0 ? (
              <CustomBarChart data={eventTypeData} height={260} />
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">No event activity for this tag</div>
            )}
          </div>

          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Waves className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Platforms</h3>
            </div>
            {osData.length > 0 ? (
              <CustomPieChart data={osData} height={240} />
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No platform data</div>
            )}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-4 rounded-lg lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Alerts tied to your events</h3>
            </div>
            {alerts.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">No alerts for this system tag</div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4 rounded-lg glass-card flex items-start gap-3">
                    <div className={`${alert.severity.toUpperCase() === "CRITICAL" ? "text-red-500" : "text-yellow-500"}`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/30 terminal-text">{alert.severity}</span>
                        <span className="text-xs text-muted-foreground terminal-text">{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="font-medium">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Type: {alert.alert_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Alert severity</h3>
            </div>
            {alertSeverityData.length > 0 ? (
              <CustomBarChart data={alertSeverityData} height={240} />
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">No alert data</div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold">Recent events</h3>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          {events.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm glass-card rounded-lg">No events for this tag yet</div>
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

      {!isAuthenticated && !isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="p-6 rounded-lg glass-card text-center space-y-3">
            <p className="text-lg font-semibold">Sign in required</p>
            <p className="text-sm text-muted-foreground">Log in to view your system dashboard.</p>
            <Button asChild>
              <a href="/login">Go to login</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
