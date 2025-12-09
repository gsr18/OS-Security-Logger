"use client";

import { useEffect } from "react";
import { initClientLogger } from "@/lib/client-logger";

export function ClientLoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initClientLogger();
  }, []);

  return <>{children}</>;
}
