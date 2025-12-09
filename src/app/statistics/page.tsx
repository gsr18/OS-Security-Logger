"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Users, RefreshCw, Globe, Shield, TrendingUp, Database, Cpu, Clock, BarChart3 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { api, Stats } from "@/lib/api";
import { WebGLBackground } from "@/components/webgl-background";
import { CustomAreaChart } from "@/components/charts/area-chart";
import { CustomBarChart } from "@/components/charts/bar-chart";
import { CustomPieChart } from "@/components/charts/pie-chart";
import { CustomLineChart } from "@/components/charts/line-chart";

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<{ time: string; events: number; alerts: number; ips: number }[]>([]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.getStats();
      setStats(data);
      
      setHistoricalData(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const newEntry = { 
          time: timeStr, 
          events: data.total_events, 
          alerts: data.total_alerts,
          ips: data.unique_ips || 0
        };
        return [...prev, newEntry].slice(-20);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const eventsByType = stats?.events_by_type || {};
  const eventsByOs = stats?.events_by_os || {};
  const topIps = stats?.top_source_ips || [];
  const topUsers = stats?.top_users || [];
  const alertsBySeverity = stats?.alerts_by_severity || {};
  const uniqueIps = stats?.unique_ips || topIps.length;

  const eventTypeData = useMemo(() => {
    return Object.entries(eventsByType)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value);
  }, [eventsByType]);

  const osDistributionData = useMemo(() => {
    return Object.entries(eventsByOs)
      .map(([name, value]) => ({ name, value }));
  }, [eventsByOs]);

  const topIpsData = useMemo(() => {
    return topIps.slice(0, 10).map(ip => ({
      name: ip.ip,
      value: ip.count,
    }));
  }, [topIps]);

  const topUsersData = useMemo(() => {
    return topUsers.slice(0, 10).map(user => ({
      name: user.user,
      value: user.count,
    }));
  }, [topUsers]);

  const severityData = useMemo(() => {
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
    return Object.entries(alertsBySeverity).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      value,
      fill: severityColors[name] || '#00ff88',
    }));
  }, [alertsBySeverity]);

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen relative">
        <WebGLBackground />
        <Header />
        <main className="container px-4 py-8 relative z-10">
          <div className="text-center py-24 glass-card rounded-lg">
            <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground terminal-text">Initializing analytics engine...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />
      
      <main className="container px-4 py-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 glow-text flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Analytics Center
            </h1>
            <p className="text-muted-foreground terminal-text">Comprehensive security event analysis & insights</p>
          </div>
          <Button onClick={fetchStats} disabled={isLoading} size="sm" className="bg-primary/20 border border-primary/50 hover:bg-primary/30">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive glass-card">
            <p className="font-medium">Error loading statistics</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="stat-card p-4 rounded-lg col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
            <p className="text-2xl font-bold text-primary glow-text">{stats?.total_events.toLocaleString() || 0}</p>
          </div>

          <div className="stat-card p-4 rounded-lg col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-xs text-muted-foreground">Alerts</p>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats?.total_alerts.toLocaleString() || 0}</p>
          </div>

          <div className="stat-card p-4 rounded-lg col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              <p className="text-xs text-muted-foreground">IPs</p>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{uniqueIps}</p>
          </div>

          <div className="stat-card p-4 rounded-lg col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <p className="text-2xl font-bold text-red-500">
              {alertsBySeverity.critical || alertsBySeverity.CRITICAL || 0}
            </p>
          </div>

          <div className="stat-card p-4 rounded-lg col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-400" />
              <p className="text-xs text-muted-foreground">Users</p>
            </div>
            <p className="text-2xl font-bold text-purple-400">{topUsers.length}</p>
          </div>

          <div className="stat-card p-4 rounded-lg col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-orange-400" />
              <p className="text-xs text-muted-foreground">Types</p>
            </div>
            <p className="text-2xl font-bold text-orange-400">{Object.keys(eventsByType).length}</p>
          </div>
        </div>

        {historicalData.length > 1 && (
          <div className="mb-8">
            <CustomAreaChart
              title="Real-Time Activity Monitor"
              data={historicalData}
              dataKeys={[
                { key: "events", color: "#00ff88", name: "Total Events" },
                { key: "alerts", color: "#ff6b6b", name: "Total Alerts" },
              ]}
              height={320}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {eventTypeData.length > 0 && (
            <CustomBarChart
              title="Event Distribution by Type"
              data={eventTypeData}
              height={350}
            />
          )}

          {osDistributionData.length > 0 && (
            <CustomPieChart
              title="Platform Analysis"
              data={osDistributionData}
              height={350}
              innerRadius={70}
              outerRadius={120}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {topIpsData.length > 0 && (
            <div className="chart-container p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary glow-text flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Source IP Addresses
              </h3>
              <div className="space-y-3">
                {topIps.slice(0, 10).map((item, index) => {
                  const maxCount = topIps[0]?.count || 1;
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item.ip} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-6">#{index + 1}</span>
                          <span className="font-mono text-sm group-hover:text-primary transition-colors">{item.ip}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{item.count}</span>
                          <span className="text-xs text-muted-foreground">events</span>
                        </div>
                      </div>
                      <div className="ml-9 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, #00ff88, #00ccff)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {topUsersData.length > 0 && (
            <div className="chart-container p-4">
              <h3 className="text-lg font-semibold mb-4 text-primary glow-text flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Active Users
              </h3>
              <div className="space-y-3">
                {topUsers.slice(0, 10).map((item, index) => {
                  const maxCount = topUsers[0]?.count || 1;
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={item.user} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-6">#{index + 1}</span>
                          <span className="font-mono text-sm group-hover:text-purple-400 transition-colors">{item.user}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-purple-400">{item.count}</span>
                          <span className="text-xs text-muted-foreground">events</span>
                        </div>
                      </div>
                      <div className="ml-9 h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, #c44dff, #ff6b9d)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {severityData.length > 0 && (
          <div className="chart-container p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6 text-primary glow-text flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert Severity Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'critical', label: 'Critical', color: '#ff4444', icon: Shield },
                { key: 'high', label: 'High', color: '#ff9f43', icon: AlertTriangle },
                { key: 'warning', label: 'Warning', color: '#ffd93d', icon: AlertTriangle },
                { key: 'medium', label: 'Medium', color: '#ffd93d', icon: Activity },
                { key: 'low', label: 'Low', color: '#00ccff', icon: Activity },
                { key: 'info', label: 'Info', color: '#00ff88', icon: Activity },
              ].map(({ key, label, color, icon: Icon }) => {
                const value = alertsBySeverity[key] || alertsBySeverity[key.toUpperCase()] || 0;
                if (value === 0) return null;
                return (
                  <div 
                    key={key}
                    className="p-5 rounded-lg text-center relative overflow-hidden group"
                    style={{ 
                      background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                      border: `1px solid ${color}40`
                    }}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `radial-gradient(circle at center, ${color}20, transparent)` }}
                    />
                    <Icon className="h-6 w-6 mx-auto mb-2" style={{ color }} />
                    <p className="text-4xl font-bold mb-1" style={{ color }}>{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Event Rate</h4>
                <p className="text-xs text-muted-foreground">Events per minute</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-primary glow-text">
              {stats?.total_events ? (stats.total_events / 60).toFixed(1) : '0'}
            </p>
          </div>

          <div className="glass-card p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <h4 className="font-semibold">Alert Rate</h4>
                <p className="text-xs text-muted-foreground">Alerts per 100 events</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-yellow-500">
              {stats?.total_events && stats.total_events > 0 
                ? ((stats.total_alerts / stats.total_events) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>

          <div className="glass-card p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Cpu className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold">System Load</h4>
                <p className="text-xs text-muted-foreground">Processing status</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-cyan-400">Active</p>
          </div>
        </div>
      </main>
    </div>
  );
}
