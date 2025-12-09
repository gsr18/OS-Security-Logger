"use client";

import { Shield, Menu, Sun, Moon, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ModeIndicator } from "./mode-indicator";
import { useAuth } from "@/lib/auth";

export const Header = () => {
  const [darkMode, setDarkMode] = useState(false);
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">SecLogger</span>
          </Link>
          
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Events
              </Link>
              <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Alerts
              </Link>
              <Link href="/statistics" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Statistics
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-3">
              <ModeIndicator />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{user?.email}</span>
                <span className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium">
                  {user?.role}
                </span>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-9 w-9"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : !isLoading && (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container flex flex-col gap-4 py-4 px-4">
            <div className="sm:hidden pb-2 flex flex-col gap-2">
              <ModeIndicator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>{user?.email}</span>
                <span className="px-1.5 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium">
                  {user?.role}
                </span>
              </div>
            </div>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Events
            </Link>
            <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Alerts
            </Link>
            <Link href="/statistics" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Statistics
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};