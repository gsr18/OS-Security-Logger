"use client";

import { Shield, Activity, AlertTriangle, BarChart3, Lock, Eye, Zap, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Stats } from "@/lib/api";

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-16">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Real-Time OS Security Event Logger
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Monitor, analyze, and respond to security events across Linux, Windows, and macOS in real-time.
            Stay ahead of threats with intelligent rule-based detection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link href="/dashboard">
                <Activity className="mr-2 h-5 w-5" />
                View Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/events">
                <Eye className="mr-2 h-5 w-5" />
                Browse Events
              </Link>
            </Button>
          </div>
        </section>

        {/* Live Stats Section */}
        {!isLoading && stats && (
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12">Live Security Data</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Top Source IPs */}
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Top Source IPs</h3>
                </div>
                <div className="space-y-3">
                  {stats.top_source_ips?.slice(0, 10).map((item, idx) => (
                    <div key={item.ip} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-mono">#{idx + 1}</span>
                        <span className="font-mono text-sm">{item.ip}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary">{item.count}</span>
                        <span className="text-xs text-muted-foreground">events</span>
                      </div>
                    </div>
                  ))}
                  {(!stats.top_source_ips || stats.top_source_ips.length === 0) && (
                    <p className="text-muted-foreground text-sm">No IP data available</p>
                  )}
                </div>
              </div>

              {/* Top Users */}
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Top Users</h3>
                </div>
                <div className="space-y-3">
                  {stats.top_users?.slice(0, 10).map((item, idx) => (
                    <div key={item.user} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-mono">#{idx + 1}</span>
                        <span className="font-mono text-sm">{item.user}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary">{item.count}</span>
                        <span className="text-xs text-muted-foreground">events</span>
                      </div>
                    </div>
                  ))}
                  {(!stats.top_users || stats.top_users.length === 0) && (
                    <p className="text-muted-foreground text-sm">No user data available</p>
                  )}
                </div>
              </div>

              {/* Events by Type */}
              <div className="p-6 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h3 className="text-xl font-semibold">Events by Type</h3>
                </div>
                <div className="space-y-3">
                  {stats.events_by_type && Object.entries(stats.events_by_type)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([type, count], idx) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-mono">#{idx + 1}</span>
                          <span className="font-mono text-xs px-2 py-1 bg-muted rounded">{type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-primary">{count}</span>
                          <span className="text-xs text-muted-foreground">events</span>
                        </div>
                      </div>
                    ))}
                  {(!stats.events_by_type || Object.keys(stats.events_by_type).length === 0) && (
                    <p className="text-muted-foreground text-sm">No event type data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card text-center">
                <p className="text-3xl font-bold text-primary">{stats.total_events}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card text-center">
                <p className="text-3xl font-bold text-yellow-500">{stats.total_alerts}</p>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card text-center">
                <p className="text-3xl font-bold text-red-500">{stats.failed_logins || 0}</p>
                <p className="text-sm text-muted-foreground">Failed Logins</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card text-center">
                <p className="text-3xl font-bold text-green-500">{stats.unique_ips || 0}</p>
                <p className="text-sm text-muted-foreground">Unique IPs</p>
              </div>
            </div>
          </section>
        )}

        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Track security events as they happen across your systems with near-instant detection and logging.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Alerts</h3>
              <p className="text-muted-foreground">
                Intelligent rule-based detection identifies suspicious activity like brute-force attacks and privilege escalation.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
              <p className="text-muted-foreground">
                Visualize trends, identify patterns, and gain actionable insights from your security event data.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Cross-Platform</h3>
              <p className="text-muted-foreground">
                Works seamlessly on Linux, Windows, and macOS with OS-specific event source integrations.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Event Filtering</h3>
              <p className="text-muted-foreground">
                Advanced search and filtering capabilities help you find exactly what you're looking for quickly.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SQLite Storage</h3>
              <p className="text-muted-foreground">
                Lightweight, fast, and reliable local storage for all your security events and alerts.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center max-w-3xl mx-auto p-12 rounded-lg border border-border bg-muted/50">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Systems?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Start monitoring your security events today with our intuitive dashboard.
          </p>
          <Button asChild size="lg" className="text-base">
            <Link href="/dashboard">
              Get Started
            </Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 SecLogger. Real-Time OS Security Event Logger.</p>
        </div>
      </footer>
    </div>
  );
}