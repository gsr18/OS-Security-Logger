"use client";

import { Shield, Menu, Sun, Moon, LogOut, User, Terminal } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Terminal className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-base font-mono font-semibold text-white">sec<span className="text-emerald-500">logger</span></span>
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
                  className="px-3 py-1.5 text-sm font-mono text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"
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
              <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-900/80 border border-gray-700 rounded text-xs font-mono">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-gray-400">{user?.email}</span>
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
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : !isLoading && (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white font-mono text-xs">
                <Link href="/login">login</Link>
              </Button>
              <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs">
                <Link href="/signup">signup</Link>
              </Button>
            </div>
          )}
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-gray-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-gray-800 bg-black/95 backdrop-blur-xl">
          <nav className="container flex flex-col gap-1 py-3 px-4">
            <div className="sm:hidden pb-3 mb-2 border-b border-gray-800 flex flex-col gap-2">
              <ModeIndicator />
              <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
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
                className="px-3 py-2 text-sm font-mono text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-all"
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
