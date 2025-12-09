"use client";

import { Header } from "@/components/header";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, RefreshCw, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { api, SecurityEvent } from "@/lib/api";
import { WebGLBackground } from "@/components/webgl-background";

export default function EventsPage() {
  const [allEvents, setAllEvents] = useState<SecurityEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventsPerPage = 10;

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.getEvents({ limit: 500 });
      setAllEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = searchQuery === "" || 
      event.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.source_ip?.includes(searchQuery) ||
      event.raw_message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEventType = eventTypeFilter === "all" || event.event_type === eventTypeFilter;
    const matchesOs = osFilter === "all" || event.os_name === osFilter;
    
    return matchesSearch && matchesEventType && matchesOs;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + eventsPerPage);

  const handleReset = () => {
    setSearchQuery("");
    setEventTypeFilter("all");
    setOsFilter("all");
    setCurrentPage(1);
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Timestamp', 'OS', 'Event Type', 'Username', 'Source IP', 'Process', 'Message'].join(','),
      ...sortedEvents.map(e => [
        e.id,
        e.timestamp,
        e.os_name,
        e.event_type,
        e.username || '',
        e.source_ip || '',
        e.process_name || '',
        `"${e.raw_message.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_events_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />
      
      <main className="container px-4 py-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 glow-text flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Security Events
          </h1>
          <p className="text-muted-foreground terminal-text">Browse and filter all captured security events</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive glass-card">
            <p className="font-medium">Error loading events</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6 p-4 rounded-lg glass-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by username, IP, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50 border-primary/30 focus:border-primary"
              />
            </div>

            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="bg-background/50 border-primary/30">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/30">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="AUTH_SUCCESS">Auth Success</SelectItem>
                <SelectItem value="AUTH_FAILURE">Auth Failure</SelectItem>
                <SelectItem value="SUDO_SUCCESS">Sudo Success</SelectItem>
                <SelectItem value="SUDO_FAILURE">Sudo Failure</SelectItem>
                <SelectItem value="FIREWALL_BLOCK">Firewall Block</SelectItem>
                <SelectItem value="FIREWALL_ALLOW">Firewall Allow</SelectItem>
                <SelectItem value="SERVICE_START">Service Start</SelectItem>
                <SelectItem value="SERVICE_STOP">Service Stop</SelectItem>
                <SelectItem value="SERVICE_FAILURE">Service Failure</SelectItem>
                <SelectItem value="KERNEL_WARNING">Kernel Warning</SelectItem>
                <SelectItem value="KERNEL_ERROR">Kernel Error</SelectItem>
                <SelectItem value="SESSION_START">Session Start</SelectItem>
                <SelectItem value="SESSION_END">Session End</SelectItem>
              </SelectContent>
            </Select>

            <Select value={osFilter} onValueChange={setOsFilter}>
              <SelectTrigger className="bg-background/50 border-primary/30">
                <SelectValue placeholder="Operating System" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/30">
                <SelectItem value="all">All OS</SelectItem>
                <SelectItem value="Linux">Linux</SelectItem>
                <SelectItem value="Windows">Windows</SelectItem>
                <SelectItem value="Darwin">macOS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleReset} className="border-primary/30 hover:bg-primary/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={sortedEvents.length === 0} className="border-primary/30 hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading} className="border-primary/30 hover:bg-primary/10">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="ml-auto text-sm text-muted-foreground terminal-text">
              {startIndex + 1}-{Math.min(startIndex + eventsPerPage, sortedEvents.length)} of {sortedEvents.length}
            </div>
          </div>
        </div>

        {isLoading && allEvents.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg">
            <RefreshCw className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground terminal-text">Loading events...</p>
          </div>
        ) : paginatedEvents.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-lg">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground terminal-text">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {paginatedEvents.map((event) => (
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="border-primary/30 hover:bg-primary/10"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? "bg-primary text-primary-foreground" : "border-primary/30 hover:bg-primary/10"}
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="border-primary/30 hover:bg-primary/10"
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
