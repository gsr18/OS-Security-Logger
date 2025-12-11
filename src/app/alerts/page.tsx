"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, RefreshCw, CheckCircle, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { api, Alert } from "@/lib/api";
import { WebGLBackground } from "@/components/webgl-background";
import { supabase, DbAlert } from "@/lib/supabase";

const normalizeSeverity = (severity: string) => {
  const normalized = (severity || "").toUpperCase();
  if (normalized === "HIGH") return "WARNING";
  if (normalized === "MEDIUM" || normalized === "LOW") return "INFO";
  return normalized || "INFO";
};

const mapDbAlert = (alert: Partial<DbAlert>): Alert => ({
  id: alert.id ?? 0,
  created_at: alert.created_at ?? "",
  timestamp: alert.timestamp ?? "",
  alert_type: alert.alert_type ?? "",
  severity: normalizeSeverity(alert.severity ?? ""),
  description: alert.description ?? "",
  related_event_ids: alert.related_event_ids ?? null,
  status: alert.status,
});

export default function AlertsPage() {
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getAlerts({ limit: 500 });
      setAllAlerts(response.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      console.error('Error fetching alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, (payload) => {
        if (payload.eventType === "DELETE" && payload.old?.id) {
          setAllAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          return;
        }

        if (!payload.new) return;
        const incoming = mapDbAlert(payload.new as DbAlert);
        setAllAlerts((prev) => {
          const next = [incoming, ...prev.filter((a) => a.id !== incoming.id)];
          return next.slice(0, 500);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredAlerts = allAlerts.filter(alert => {
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesSearch = searchQuery === "" || 
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSeverity && matchesSearch;
  });

  const sortedAlerts = [...filteredAlerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const criticalCount = allAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = allAlerts.filter(a => a.severity === 'WARNING').length;
  const infoCount = allAlerts.filter(a => a.severity === 'INFO').length;

  return (
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />
      
      <main className="container px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 glow-text flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              Security Alerts
            </h1>
            <p className="text-muted-foreground terminal-text">Manage and review security alerts</p>
          </div>
          <Button onClick={fetchAlerts} disabled={isLoading} size="sm" className="bg-primary/20 border border-primary/50 hover:bg-primary/30">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive glass-card">
            <p className="font-medium">Error loading alerts</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">Critical</p>
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Immediate attention</p>
          </div>

          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">Warning</p>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-500">{warningCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Should review</p>
          </div>

          <div className="stat-card p-5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground terminal-text">Info</p>
              <AlertTriangle className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-cyan-400">{infoCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Informational</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg glass-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="bg-background/50 border-primary/30">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/30">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && allAlerts.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg">
            <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground terminal-text">Loading alerts...</p>
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg">
            <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Clear</h3>
            <p className="text-muted-foreground terminal-text">No security alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-5 rounded-lg glass-card hover:border-primary/40 transition-all scan-line"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    alert.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold terminal-text ${
                        alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        alert.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono px-2 py-1 bg-muted/30 rounded">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <p className="text-foreground mb-2">{alert.description}</p>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="terminal-text">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    
                    {alert.related_event_ids && (
                      <p className="text-xs text-muted-foreground mt-2 terminal-text">
                        Related Events: {alert.related_event_ids}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}