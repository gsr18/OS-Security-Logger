"use client";

import { Header } from "@/components/header";
import { StatCard } from "@/components/stat-card";
import { EventCard } from "@/components/event-card";
import { AlertCard } from "@/components/alert-card";
import { Activity, AlertTriangle, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";

// Mock data - in production, this would come from the backend API
const mockEvents = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    eventType: "FAILED_LOGIN",
    username: "admin",
    sourceIp: "192.168.1.100",
    processName: "sshd",
    osName: "Linux",
    rawMessage: "Failed password for admin from 192.168.1.100 port 22 ssh2"
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 180000).toISOString(),
    eventType: "SUCCESS_LOGIN",
    username: "john",
    sourceIp: "192.168.1.50",
    processName: "sshd",
    osName: "Linux",
    rawMessage: "Accepted password for john from 192.168.1.50 port 22 ssh2"
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 120000).toISOString(),
    eventType: "SUDO_COMMAND",
    username: "john",
    sourceIp: null,
    processName: "sudo",
    osName: "Linux",
    rawMessage: "john : TTY=pts/0 ; PWD=/home/john ; USER=root ; COMMAND=/usr/bin/apt update"
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 60000).toISOString(),
    eventType: "FAILED_LOGIN",
    username: "root",
    sourceIp: "203.0.113.45",
    processName: "sshd",
    osName: "Linux",
    rawMessage: "Failed password for root from 203.0.113.45 port 22 ssh2"
  }
];

const mockAlerts = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 240000).toISOString(),
    alertType: "BRUTE_FORCE_SUSPECTED",
    severity: "WARNING",
    description: "5 failed logins for user 'admin' from IP 192.168.1.100 in 10 minutes",
    relatedEventIds: [1, 5, 9, 13, 17]
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 90000).toISOString(),
    alertType: "SUSPICIOUS_SUDO",
    severity: "INFO",
    description: "Sudo command by unusual user: john",
    relatedEventIds: [3]
  }
];

export default function Dashboard() {
  const [events, setEvents] = useState(mockEvents);
  const [alerts, setAlerts] = useState(mockAlerts);
  const [stats, setStats] = useState({
    totalEvents: 1247,
    activeAlerts: 3,
    failedLogins: 89,
    criticalAlerts: 1
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update stats with slight variations
      setStats(prev => ({
        totalEvents: prev.totalEvents + Math.floor(Math.random() * 3),
        activeAlerts: prev.activeAlerts,
        failedLogins: prev.failedLogins + Math.floor(Math.random() * 2),
        criticalAlerts: prev.criticalAlerts
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">Monitor real-time security events and alerts across your systems</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Events"
            value={stats.totalEvents.toLocaleString()}
            icon={Activity}
            description="Last 24 hours"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Active Alerts"
            value={stats.activeAlerts}
            icon={AlertTriangle}
            description="Requires attention"
          />
          <StatCard
            title="Failed Logins"
            value={stats.failedLogins}
            icon={Shield}
            description="Last 24 hours"
            trend={{ value: 8, isPositive: false }}
          />
          <StatCard
            title="Critical Alerts"
            value={stats.criticalAlerts}
            icon={TrendingUp}
            description="High priority"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Events</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/events">View All</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {events.slice(0, 4).map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Alerts</h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/alerts">View All</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} {...alert} />
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span>Real-time monitoring active</span>
        </div>
      </main>
    </div>
  );
}