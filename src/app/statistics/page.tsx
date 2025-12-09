"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { api, Stats } from "@/lib/api";

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </main>
      </div>
    );
  }

  const eventsByType = stats?.events_by_type || {};
  const eventsByOs = stats?.events_by_os || {};
  const topIps = stats?.top_source_ips || [];
  const alertsBySeverity = stats?.alerts_by_severity || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Statistics & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive security event analysis</p>
          </div>
          <Button onClick={fetchStats} disabled={isLoading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive">
            <p className="font-medium">Error loading statistics</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Events</p>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats?.total_events.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Alerts</p>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold">{stats?.total_alerts.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Generated alerts</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Unique IPs</p>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold">{topIps.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Source addresses</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">
              {alertsBySeverity.CRITICAL || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">High priority</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Offending IPs */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold mb-4">Top Source IPs</h2>
            {topIps.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No IP data available</p>
            ) : (
              <div className="space-y-3">
                {topIps.slice(0, 10).map((item, index) => (
                  <div key={item.ip} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="font-mono text-sm">{item.ip}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.count}</span>
                      <span className="text-xs text-muted-foreground">events</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Events by Type */}
          <div className="p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold mb-4">Events by Type</h2>
            {Object.keys(eventsByType).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No event data available</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(eventsByType).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{type.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ 
                          width: `${(count / Math.max(...Object.values(eventsByType))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="p-6 rounded-lg border border-border bg-card mb-8">
          <h2 className="text-xl font-semibold mb-4">Platform Distribution</h2>
          {Object.keys(eventsByOs).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No platform data available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(eventsByOs).map(([os, count]) => (
                <div key={os} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold mb-1">{count}</p>
                  <p className="text-sm text-muted-foreground">{os} Events</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((count / stats!.total_events) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Severity Breakdown */}
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">Alert Severity Distribution</h2>
          {Object.keys(alertsBySeverity).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No alerts generated yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold text-red-500 mb-1">
                  {alertsBySeverity.CRITICAL || 0}
                </p>
                <p className="text-sm text-muted-foreground">Critical</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold text-yellow-500 mb-1">
                  {alertsBySeverity.WARNING || 0}
                </p>
                <p className="text-sm text-muted-foreground">Warning</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold text-blue-500 mb-1">
                  {alertsBySeverity.INFO || 0}
                </p>
                <p className="text-sm text-muted-foreground">Info</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}