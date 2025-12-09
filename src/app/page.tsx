"use client";

import { Shield, Activity, AlertTriangle, BarChart3, Lock, Eye, Zap, Users, Globe, Cpu, Server, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Stats } from "@/lib/api";
import { WebGLBackground } from "@/components/webgl-background";

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />
      
      <main className="container px-4 py-16 relative z-10">
        <section className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6 pulse-glow border border-primary/30">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 glow-text">
            SecLogger <span className="text-primary">OS</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto terminal-text">
            Real-Time Operating System Security Event Logger
          </p>
          <p className="text-base text-muted-foreground mb-8 max-w-xl mx-auto">
            Monitor, analyze, and respond to security events across Linux, Windows, and macOS in real-time with intelligent rule-based detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base bg-primary hover:bg-primary/90 text-primary-foreground glow-green">
              <Link href="/dashboard">
                <Terminal className="mr-2 h-5 w-5" />
                Launch Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" className="text-base bg-primary hover:bg-primary/90 text-primary-foreground glow-green">
              <Link href="/events">
                <Eye className="mr-2 h-5 w-5" />
                Browse Events
              </Link>
            </Button>
          </div>
        </section>

        {!isLoading && stats && (
          <section className="mb-20">
            <h2 className="text-2xl font-bold text-center mb-8 glow-text">Live System Status</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="stat-card p-5 rounded-lg text-center">
                <Activity className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-primary glow-text">{stats.total_events}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Events</p>
              </div>
              <div className="stat-card p-5 rounded-lg text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-3xl font-bold text-yellow-500">{stats.total_alerts}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Alerts</p>
              </div>
              <div className="stat-card p-5 rounded-lg text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-3xl font-bold text-red-500">{stats.failed_logins || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Failed Logins</p>
              </div>
              <div className="stat-card p-5 rounded-lg text-center">
                <Globe className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
                <p className="text-3xl font-bold text-cyan-400">{stats.unique_ips || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique IPs</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-lg scan-line">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Top Source IPs</h3>
                </div>
                <div className="space-y-2">
                  {stats.top_source_ips?.slice(0, 5).map((item, idx) => (
                    <div key={item.ip} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                        <span className="font-mono text-xs">{item.ip}</span>
                      </div>
                      <span className="font-semibold text-primary">{item.count}</span>
                    </div>
                  ))}
                  {(!stats.top_source_ips || stats.top_source_ips.length === 0) && (
                    <p className="text-muted-foreground text-sm text-center py-4">No IP data</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-6 rounded-lg scan-line">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Top Users</h3>
                </div>
                <div className="space-y-2">
                  {stats.top_users?.slice(0, 5).map((item, idx) => (
                    <div key={item.user} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                        <span className="font-mono text-xs">{item.user}</span>
                      </div>
                      <span className="font-semibold text-purple-400">{item.count}</span>
                    </div>
                  ))}
                  {(!stats.top_users || stats.top_users.length === 0) && (
                    <p className="text-muted-foreground text-sm text-center py-4">No user data</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-6 rounded-lg scan-line">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold">Events by Type</h3>
                </div>
                <div className="space-y-2">
                  {stats.events_by_type && Object.entries(stats.events_by_type)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([type, count], idx) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <span className="font-mono text-xs truncate max-w-[120px]">{type}</span>
                        </div>
                        <span className="font-semibold text-cyan-400">{count}</span>
                      </div>
                    ))}
                  {(!stats.events_by_type || Object.keys(stats.events_by_type).length === 0) && (
                    <p className="text-muted-foreground text-sm text-center py-4">No event data</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mb-20">
          <h2 className="text-2xl font-bold text-center mb-8 glow-text">Core Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Activity, title: "Real-Time Monitoring", desc: "Track security events as they happen with near-instant detection.", color: "#00ff88" },
              { icon: AlertTriangle, title: "Smart Alerts", desc: "Intelligent detection of brute-force attacks and privilege escalation.", color: "#ffd93d" },
              { icon: BarChart3, title: "Analytics & Insights", desc: "Visualize trends and gain actionable insights from event data.", color: "#00ccff" },
              { icon: Lock, title: "Cross-Platform", desc: "Works on Linux, Windows, and macOS with OS-specific integrations.", color: "#c44dff" },
              { icon: Eye, title: "Event Filtering", desc: "Advanced search capabilities to find exactly what you need.", color: "#ff6b6b" },
              { icon: Zap, title: "SQLite Storage", desc: "Lightweight, fast, and reliable local storage for all events.", color: "#ff9f43" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="glass-card p-6 rounded-lg group hover:scale-[1.02] transition-all duration-300">
                <div 
                  className="inline-flex items-center justify-center p-3 rounded-lg mb-4"
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center max-w-3xl mx-auto glass-card p-10 rounded-lg">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Server className="h-6 w-6 text-primary" />
            <Cpu className="h-6 w-6 text-cyan-400" />
            <Shield className="h-6 w-6 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4 glow-text">Ready to Secure Your Systems?</h2>
          <p className="text-muted-foreground mb-6">
            Start monitoring your security events today with our advanced dashboard.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-green">
            <Link href="/dashboard">
              <Terminal className="mr-2 h-5 w-5" />
              Access Terminal
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-primary/20 mt-20 py-6 relative z-10">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground terminal-text">
            SecLogger OS v1.0.0 — Real-Time Security Event Logger
          </p>
        </div>
      </footer>
    </div>
  );
}