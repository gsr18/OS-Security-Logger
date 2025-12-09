"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Server, Database, AlertCircle } from "lucide-react";

interface BackendStatus {
  mode: "real" | "mock" | "unknown";
  backend: string;
  db: string;
  connected: boolean;
}

export function ModeIndicator() {
  const [status, setStatus] = useState<BackendStatus>({
    mode: "unknown",
    backend: "checking",
    db: "checking",
    connected: false,
  });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await api.health();
        setStatus({
          mode: health.mode === "real" ? "real" : "mock",
          backend: health.backend || "unknown",
          db: health.db || "unknown",
          connected: true,
        });
      } catch {
        setStatus({
          mode: "mock",
          backend: "nextjs",
          db: "mock",
          connected: false,
        });
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status.mode === "unknown") {
    return null;
  }

  const isRealMode = status.mode === "real";
  const isMockMode = status.mode === "mock";

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        isRealMode
          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      }`}
    >
      {isRealMode ? (
        <>
          <Server className="h-3 w-3" />
          <span>Real OS Data</span>
          <span className="opacity-60">|</span>
          <Database className="h-3 w-3" />
          <span>Flask Backend</span>
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Demo Mode</span>
          {!status.connected && (
            <>
              <span className="opacity-60">|</span>
              <span>Backend Offline</span>
            </>
          )}
        </>
      )}
    </div>
  );
}
