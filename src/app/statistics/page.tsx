"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Shield,
  Clock,
  Globe,
} from "lucide-react";
import { Header } from "@/components/header";

export default function StatisticsPage() {
  // Mock statistics data
  const topOffendingIPs = [
    { ip: "192.168.1.105", attempts: 24, severity: "high" },
    { ip: "172.16.0.50", attempts: 18, severity: "high" },
    { ip: "10.0.0.88", attempts: 12, severity: "medium" },
    { ip: "203.0.113.45", attempts: 8, severity: "medium" },
    { ip: "198.51.100.22", attempts: 5, severity: "low" },
  ];

  const eventsByType = [
    { type: "FAILED_LOGIN", count: 342, percentage: 45, trend: "up" },
    { type: "SUCCESS_LOGIN", count: 256, percentage: 34, trend: "stable" },
    { type: "SUDO_COMMAND", count: 98, percentage: 13, trend: "down" },
    { type: "PRIV_ESCALATION", count: 62, percentage: 8, trend: "up" },
  ];

  const eventsByOS = [
    { os: "Linux", count: 458, percentage: 60 },
    { os: "Windows", count: 229, percentage: 30 },
    { os: "macOS", count: 76, percentage: 10 },
  ];

  const hourlyActivity = [
    { hour: "00:00", events: 12 },
    { hour: "03:00", events: 8 },
    { hour: "06:00", events: 15 },
    { hour: "09:00", events: 45 },
    { hour: "12:00", events: 68 },
    { hour: "15:00", events: 52 },
    { hour: "18:00", events: 38 },
    { hour: "21:00", events: 25 },
  ];

  const recentPatterns = [
    {
      pattern: "Evening brute-force spike",
      description: "Increased failed login attempts between 18:00-21:00",
      impact: "High",
      icon: TrendingUp,
    },
    {
      pattern: "Business hours sudo usage",
      description: "Elevated privilege commands during 09:00-17:00",
      impact: "Medium",
      icon: Activity,
    },
    {
      pattern: "Weekend anomaly reduction",
      description: "Lower suspicious activity on weekends",
      impact: "Low",
      icon: TrendingDown,
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
    }
  };

  const maxActivity = Math.max(...hourlyActivity.map(h => h.events));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Statistics & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive security event analytics and trends
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Events</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">758</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              +12% from last week
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">18</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              +3 from yesterday
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Unique IPs</p>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">142</p>
            <p className="text-xs text-muted-foreground mt-1">
              Active sources
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">2.3s</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Detection time
            </p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Top Offending IPs */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Top Offending IPs</h2>
            </div>
            <div className="space-y-4">
              {topOffendingIPs.map((item, index) => (
                <div key={item.ip} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">{item.ip}</p>
                    <p className="text-xs text-muted-foreground">{item.attempts} attempts</p>
                  </div>
                  <Badge variant="outline" className={getSeverityColor(item.severity)}>
                    {item.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Events by Type */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Events by Type</h2>
            </div>
            <div className="space-y-4">
              {eventsByType.map((item) => (
                <div key={item.type}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{item.type.replace(/_/g, " ")}</p>
                      {item.trend === "up" && <TrendingUp className="h-3 w-3 text-red-500" />}
                      {item.trend === "down" && <TrendingDown className="h-3 w-3 text-green-500" />}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Hourly Activity Chart */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">24-Hour Activity</h2>
            </div>
            <div className="flex items-end justify-between gap-2 h-48">
              {hourlyActivity.map((item) => (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-muted rounded-t relative flex-1 flex items-end">
                    <div
                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                      style={{ height: `${(item.events / maxActivity) * 100}%` }}
                      title={`${item.events} events`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.hour}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Events by OS */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Events by Platform</h2>
            </div>
            <div className="space-y-6">
              {eventsByOS.map((item) => (
                <div key={item.os}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{item.os}</p>
                    <div className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Total monitored systems: 3 operating systems
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detected Patterns */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Detected Patterns</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentPatterns.map((pattern) => (
              <Card key={pattern.pattern} className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    <pattern.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{pattern.pattern}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
                    <Badge
                      variant="outline"
                      className={getSeverityColor(
                        pattern.impact === "High" ? "high" : pattern.impact === "Medium" ? "medium" : "low"
                      )}
                    >
                      {pattern.impact} Impact
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
