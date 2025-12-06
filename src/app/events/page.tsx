"use client";

import { Header } from "@/components/header";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

// Mock data - in production, this would come from the backend API
const generateMockEvents = () => {
  const eventTypes = ["FAILED_LOGIN", "SUCCESS_LOGIN", "SUDO_COMMAND", "PRIV_ESCALATION"];
  const usernames = ["admin", "root", "john", "alice", "bob"];
  const ips = ["192.168.1.100", "192.168.1.50", "203.0.113.45", "198.51.100.20", "10.0.0.5"];
  const osNames = ["Linux", "Windows", "Darwin"];
  const processes = ["sshd", "sudo", "loginwindow", "winlogon"];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    username: usernames[Math.floor(Math.random() * usernames.length)],
    sourceIp: Math.random() > 0.3 ? ips[Math.floor(Math.random() * ips.length)] : null,
    processName: processes[Math.floor(Math.random() * processes.length)],
    osName: osNames[Math.floor(Math.random() * osNames.length)],
    rawMessage: `Sample log message for event ${i + 1}`
  }));
};

export default function EventsPage() {
  const [allEvents] = useState(generateMockEvents());
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  // Filter events based on search and filters
  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = searchQuery === "" || 
      event.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.sourceIp?.includes(searchQuery) ||
      event.rawMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEventType = eventTypeFilter === "all" || event.eventType === eventTypeFilter;
    const matchesOs = osFilter === "all" || event.osName === osFilter;
    
    return matchesSearch && matchesEventType && matchesOs;
  });

  // Sort by timestamp (newest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + eventsPerPage);

  const handleReset = () => {
    setSearchQuery("");
    setEventTypeFilter("all");
    setOsFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Events</h1>
          <p className="text-muted-foreground">Browse and filter all captured security events</p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by username, IP, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Event Type Filter */}
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FAILED_LOGIN">Failed Login</SelectItem>
                <SelectItem value="SUCCESS_LOGIN">Success Login</SelectItem>
                <SelectItem value="SUDO_COMMAND">Sudo Command</SelectItem>
                <SelectItem value="PRIV_ESCALATION">Privilege Escalation</SelectItem>
              </SelectContent>
            </Select>

            {/* OS Filter */}
            <Select value={osFilter} onValueChange={setOsFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Operating System" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OS</SelectItem>
                <SelectItem value="Linux">Linux</SelectItem>
                <SelectItem value="Windows">Windows</SelectItem>
                <SelectItem value="Darwin">macOS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + eventsPerPage, sortedEvents.length)} of {sortedEvents.length} events
            </div>
          </div>
        </div>

        {/* Events List */}
        {paginatedEvents.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {paginatedEvents.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
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
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
