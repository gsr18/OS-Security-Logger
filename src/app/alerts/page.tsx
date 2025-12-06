"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Search, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { api, Alert } from "@/lib/api";

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
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter alerts
  const filteredAlerts = allAlerts.filter(alert => {
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesSearch = searchQuery === "" || 
      alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.alert_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSeverity && matchesSearch;
  });

  // Sort by timestamp (newest first)
  const sortedAlerts = [...filteredAlerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Calculate summary stats
  const criticalCount = allAlerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = allAlerts.filter(a => a.severity === 'WARNING').length;
  const infoCount = allAlerts.filter(a => a.severity === 'INFO').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Security Alerts</h1>
            <p className="text-muted-foreground">Manage and review security alerts</p>
          </div>
          <Button onClick={fetchAlerts} disabled={isLoading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive">
            <p className="font-medium">Error loading alerts</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">Make sure the Python backend is running on http://localhost:5000</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Critical Alerts</p>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-500">{criticalCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Warning Alerts</p>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-500">{warningCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Should be reviewed</p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Info Alerts</p>
              <AlertTriangle className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-500">{infoCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Informational</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alerts List */}
        {isLoading && allAlerts.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
            <p className="text-muted-foreground">All clear! No security alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${
                    alert.severity === 'CRITICAL' ? 'text-red-500' :
                    alert.severity === 'WARNING' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                    
                    <h3 className="text-lg font-semibold mb-2">{alert.alert_type.replace(/_/g, ' ')}</h3>
                    <p className="text-muted-foreground mb-3">{alert.description}</p>
                    
                    {alert.related_event_ids && (
                      <p className="text-sm text-muted-foreground">
                        Related Event IDs: {alert.related_event_ids}
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