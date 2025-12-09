"use client";

import { Shield, Menu, Sun, Moon, LogOut, User, Terminal, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ModeIndicator } from "./mode-indicator";
import { useAuth } from "@/lib/auth";

export const Header = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded bg-primary/20 group-hover:bg-primary/30 transition-colors pulse-glow">
              <Terminal className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-mono font-semibold">
              sec<span className="text-primary glow-text">logger</span>
              <span className="text-xs text-muted-foreground ml-1">OS</span>
            </span>
          </Link>
          
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: "/dashboard", label: "dashboard" },
                { href: "/events", label: "events" },
                { href: "/alerts", label: "alerts" },
                { href: "/statistics", label: "analytics" },
                { href: "/simulate", label: "simulate" },
              ].map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="px-3 py-1.5 text-sm font-mono text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all"
                >
                  ./{item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2">
              <ModeIndicator />
              <div className="flex items-center gap-2 px-2.5 py-1 glass-card rounded text-xs font-mono">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{user?.email}</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {user?.role}
                </span>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : !isLoading && (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-primary font-mono text-xs">
                <Link href="/login">login</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs">
                <Link href="/signup">signup</Link>
              </Button>
            </div>
          )}
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-primary/20 bg-background/95 backdrop-blur-xl">
          <nav className="container flex flex-col gap-1 py-3 px-4">
            <div className="sm:hidden pb-3 mb-2 border-b border-primary/20 flex flex-col gap-2">
              <ModeIndicator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <User className="h-3 w-3" />
                <span>{user?.email}</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {user?.role}
                </span>
              </div>
            </div>
            {[
              { href: "/dashboard", label: "dashboard" },
              { href: "/events", label: "events" },
              { href: "/alerts", label: "alerts" },
              { href: "/statistics", label: "analytics" },
              { href: "/simulate", label: "simulate" },
            ].map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="px-3 py-2 text-sm font-mono text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all"
              >
                ./{item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};