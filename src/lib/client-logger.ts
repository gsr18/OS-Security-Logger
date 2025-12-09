"use client";

interface ClientEvent {
  event_type: string;
  severity: string;
  description: string;
  route: string;
  user_agent?: string;
  screen_resolution?: string;
  language?: string;
  platform?: string;
  timezone?: string;
  referrer?: string;
  connection_type?: string;
  device_memory?: number;
  hardware_concurrency?: number;
  online_status?: boolean;
  visibility_state?: string;
  extra_data?: Record<string, unknown>;
}

function getOSFromUserAgent(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS") || ua.includes("Macintosh")) return "Darwin";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function getBrowserFromUserAgent(ua: string): string {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera")) return "Opera";
  return "Unknown";
}

async function sendEvent(event: ClientEvent) {
  try {
    await fetch("/api/events/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error("Failed to send client event:", error);
  }
}

function getConnectionType(): string {
  const nav = navigator as Navigator & { connection?: { effectiveType?: string } };
  return nav.connection?.effectiveType || "unknown";
}

function getDeviceMemory(): number {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory || 0;
}

export function initClientLogger() {
  if (typeof window === "undefined") return;

  const baseInfo = {
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referrer: document.referrer || "direct",
    connection_type: getConnectionType(),
    device_memory: getDeviceMemory(),
    hardware_concurrency: navigator.hardwareConcurrency || 0,
    online_status: navigator.onLine,
    visibility_state: document.visibilityState,
  };

  const os = getOSFromUserAgent(navigator.userAgent);
  const browser = getBrowserFromUserAgent(navigator.userAgent);

  sendEvent({
    event_type: "PAGE_VIEW",
    severity: "info",
    description: `User viewing website from ${browser} on ${os}`,
    route: window.location.pathname,
    ...baseInfo,
  });

  window.addEventListener("visibilitychange", () => {
    sendEvent({
      event_type: document.visibilityState === "hidden" ? "PAGE_HIDDEN" : "PAGE_VISIBLE",
      severity: "info",
      description: `Page visibility changed to ${document.visibilityState}`,
      route: window.location.pathname,
      visibility_state: document.visibilityState,
    });
  });

  window.addEventListener("online", () => {
    sendEvent({
      event_type: "NETWORK_ONLINE",
      severity: "info",
      description: "User came back online",
      route: window.location.pathname,
      online_status: true,
    });
  });

  window.addEventListener("offline", () => {
    sendEvent({
      event_type: "NETWORK_OFFLINE",
      severity: "warning",
      description: "User went offline",
      route: window.location.pathname,
      online_status: false,
    });
  });

  window.addEventListener("error", (event) => {
    sendEvent({
      event_type: "JS_ERROR",
      severity: "error",
      description: `JavaScript error: ${event.message}`,
      route: window.location.pathname,
      extra_data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    sendEvent({
      event_type: "PROMISE_REJECTION",
      severity: "error",
      description: `Unhandled promise rejection: ${event.reason}`,
      route: window.location.pathname,
    });
  });

  window.addEventListener("beforeunload", () => {
    sendEvent({
      event_type: "PAGE_UNLOAD",
      severity: "info",
      description: "User leaving page",
      route: window.location.pathname,
    });
  });

  let sessionStartTime = Date.now();
  setInterval(() => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (sessionDuration % 60 === 0 && sessionDuration > 0) {
      sendEvent({
        event_type: "SESSION_HEARTBEAT",
        severity: "info",
        description: `User active for ${sessionDuration} seconds`,
        route: window.location.pathname,
        extra_data: { session_duration_seconds: sessionDuration },
      });
    }
  }, 60000);

  window.addEventListener("copy", () => {
    sendEvent({
      event_type: "CLIPBOARD_COPY",
      severity: "info",
      description: "User copied content to clipboard",
      route: window.location.pathname,
    });
  });

  let printAttempted = false;
  window.addEventListener("beforeprint", () => {
    if (!printAttempted) {
      printAttempted = true;
      sendEvent({
        event_type: "PRINT_ATTEMPT",
        severity: "info",
        description: "User attempted to print page",
        route: window.location.pathname,
      });
    }
  });

  document.addEventListener("contextmenu", () => {
    sendEvent({
      event_type: "CONTEXT_MENU",
      severity: "info",
      description: "User opened context menu",
      route: window.location.pathname,
    });
  });

  if ("getBattery" in navigator) {
    (navigator as Navigator & { getBattery: () => Promise<{ charging: boolean; level: number; addEventListener: (e: string, cb: () => void) => void }> })
      .getBattery()
      .then((battery) => {
        battery.addEventListener("chargingchange", () => {
          sendEvent({
            event_type: battery.charging ? "BATTERY_CHARGING" : "BATTERY_DISCHARGING",
            severity: "info",
            description: `Battery ${battery.charging ? "started" : "stopped"} charging (${Math.round(battery.level * 100)}%)`,
            route: window.location.pathname,
            extra_data: { battery_level: Math.round(battery.level * 100) },
          });
        });
        battery.addEventListener("levelchange", () => {
          const level = Math.round(battery.level * 100);
          if (level <= 20) {
            sendEvent({
              event_type: "BATTERY_LOW",
              severity: "warning",
              description: `Low battery warning: ${level}%`,
              route: window.location.pathname,
              extra_data: { battery_level: level },
            });
          }
        });
      })
      .catch(() => {});
  }

  document.addEventListener("fullscreenchange", () => {
    sendEvent({
      event_type: document.fullscreenElement ? "FULLSCREEN_ENTER" : "FULLSCREEN_EXIT",
      severity: "info",
      description: `User ${document.fullscreenElement ? "entered" : "exited"} fullscreen mode`,
      route: window.location.pathname,
    });
  });

  window.addEventListener("resize", debounce(() => {
    sendEvent({
      event_type: "WINDOW_RESIZE",
      severity: "info",
      description: `Window resized to ${window.innerWidth}x${window.innerHeight}`,
      route: window.location.pathname,
      extra_data: { width: window.innerWidth, height: window.innerHeight },
    });
  }, 1000));

  if ("storage" in window) {
    window.addEventListener("storage", (event) => {
      sendEvent({
        event_type: "STORAGE_CHANGE",
        severity: "info",
        description: `Storage changed: ${event.key}`,
        route: window.location.pathname,
        extra_data: { key: event.key, newValue: event.newValue ? "set" : "removed" },
      });
    });
  }

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = Date.now();
    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - start;
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      
      if (!url.includes("/api/events/client") && !response.ok) {
        sendEvent({
          event_type: "API_ERROR",
          severity: "error",
          description: `API request failed: ${url} (${response.status})`,
          route: window.location.pathname,
          extra_data: { url, status: response.status, duration },
        });
      }
      return response;
    } catch (error) {
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request).url;
      if (!url.includes("/api/events/client")) {
        sendEvent({
          event_type: "NETWORK_ERROR",
          severity: "error",
          description: `Network request failed: ${url}`,
          route: window.location.pathname,
          extra_data: { url, error: String(error) },
        });
      }
      throw error;
    }
  };
}

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function logCustomEvent(eventType: string, severity: string, description: string, extraData?: Record<string, unknown>) {
  sendEvent({
    event_type: eventType,
    severity,
    description,
    route: typeof window !== "undefined" ? window.location.pathname : "/",
    extra_data: extraData,
  });
}
