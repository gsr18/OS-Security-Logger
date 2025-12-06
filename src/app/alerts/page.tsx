"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Filter,
  CheckCircle2,
  X,
  Eye,
} from "lucide-react";
import { Header } from "@/components/header";

interface Alert {
  id: string;
  timestamp: string;
  alertType: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  description: string;
  relatedEvents: number;
  status: "active" | "acknowledged" | "resolved";
}

// Mock data for alerts
const mockAlerts: Alert[] = [
  {
    id: "1",
    timestamp: "2025-12-06 18:45:23",
    alertType: "BRUTE_FORCE_SUSPECTED",
    severity: "CRITICAL",
    description: "Multiple failed login attempts detected from IP 192.168.1.105 (8 attempts in 5 minutes)",
    relatedEvents: 8,
    status: "active",
  },
  {
    id: "2",
    timestamp: "2025-12-06 18:30:15",
    alertType: "SUSPICIOUS_SUDO",
    severity: "WARNING",
    description: "Unusual sudo command executed by user 'contractor' - privilege escalation attempt",
    relatedEvents: 3,
    status: "active",
  },
  {
    id: "3",
    timestamp: "2025-12-06 17:55:42",
    alertType: "RAPID_LOGIN_ATTEMPTS",
    severity: "WARNING",
    description: "Rapid login attempts from 172.16.0.50 across multiple accounts (5 users in 2 minutes)",
    relatedEvents: 5,
    status: "acknowledged",
  },
  {
    id: "4",
    timestamp: "2025-12-06 16:20:33",
    alertType: "PRIV_ESCALATION",
    severity: "CRITICAL",
    description: "Unauthorized privilege escalation detected - user 'guest' attempted root access",
    relatedEvents: 2,
    status: "acknowledged",
  },
  {
    id: "5",
    timestamp: "2025-12-06 15:10:18",
    alertType: "BRUTE_FORCE_SUSPECTED",
    severity: "WARNING",
    description: "Failed login pattern detected from IP 10.0.0.88 (6 attempts in 8 minutes)",
    relatedEvents: 6,
    status: "resolved",
  },
  {
    id: "6",
    timestamp: "2025-12-06 14:05:09",
    alertType: "SYSTEM_MONITORING",
    severity: "INFO",
    description: "New authentication source detected - monitoring initialized for macOS unified log",
    relatedEvents: 1,
    status: "resolved",
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4" />;
      case "WARNING":
        return <AlertCircle className="h-4 w-4" />;
      case "INFO":
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "WARNING":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "INFO":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "acknowledged":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "resolved":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: "acknowledged" as const } : alert
    ));
  };

  const handleResolve = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: "resolved" as const } : alert
    ));
  };

  const handleDismiss = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.alertType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const activeCount = alerts.filter(a => a.status === "active").length;
  const acknowledgedCount = alerts.filter(a => a.status === "acknowledged").length;
  const resolvedCount = alerts.filter(a => a.status === "resolved").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage security alerts detected by the rule engine
          </p>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Alerts</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{activeCount}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Acknowledged</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{acknowledgedCount}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Eye className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{resolvedCount}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts by description or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
              <p className="text-muted-foreground">
                {searchQuery || severityFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "All clear! No security alerts at this time."}
              </p>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{alert.alertType.replace(/_/g, " ")}</h3>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.timestamp}</p>
                        <p className="text-sm">{alert.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Related events: {alert.relatedEvents}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-2">
                    {alert.status === "active" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(alert.id)}
                          className="text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      </>
                    )}
                    {alert.status === "acknowledged" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(alert.id)}
                        className="text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(alert.id)}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
