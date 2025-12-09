import { Shield, X, CheckCircle, Terminal, AlertTriangle, Server, Flame, Network, User, Clock, LogIn, LogOut, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id?: number;
  timestamp: string;
  eventType: string;
  username?: string | null;
  sourceIp?: string | null;
  processName?: string | null;
  osName: string;
  rawMessage: string;
}

const eventTypeIcons: Record<string, React.ElementType> = {
  AUTH_FAILURE: X,
  AUTH_SUCCESS: CheckCircle,
  FAILED_LOGIN: X,
  SUCCESS_LOGIN: CheckCircle,
  SUDO_SUCCESS: Terminal,
  SUDO_FAILURE: AlertTriangle,
  SUDO_COMMAND: Terminal,
  PRIV_ESCALATION: AlertTriangle,
  FIREWALL_BLOCK: Flame,
  FIREWALL_ALLOW: Network,
  FIREWALL_EVENT: Network,
  SERVICE_START: Server,
  SERVICE_STOP: Server,
  SERVICE_FAILURE: AlertTriangle,
  KERNEL_WARNING: AlertTriangle,
  KERNEL_ERROR: X,
  KERNEL_OOM: AlertTriangle,
  KERNEL_SEGFAULT: X,
  SESSION_START: LogIn,
  SESSION_END: LogOut,
  USER_CREATED: User,
  PASSWORD_CHANGE: User,
  GROUP_MEMBERSHIP_CHANGE: User,
  CONNECTION_CLOSED: Network,
  SYSTEM_ERROR: X,
  SYSTEM_WARNING: AlertTriangle,
};

const eventTypeColors: Record<string, { text: string; bg: string; border: string }> = {
  AUTH_FAILURE: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  AUTH_SUCCESS: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  FAILED_LOGIN: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  SUCCESS_LOGIN: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  SUDO_SUCCESS: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  SUDO_FAILURE: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  SUDO_COMMAND: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  PRIV_ESCALATION: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  FIREWALL_BLOCK: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  FIREWALL_ALLOW: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  FIREWALL_EVENT: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  SERVICE_START: { text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  SERVICE_STOP: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  SERVICE_FAILURE: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  KERNEL_WARNING: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  KERNEL_ERROR: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  KERNEL_OOM: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  KERNEL_SEGFAULT: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  SESSION_START: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  SESSION_END: { text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  USER_CREATED: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  PASSWORD_CHANGE: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  GROUP_MEMBERSHIP_CHANGE: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  CONNECTION_CLOSED: { text: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30" },
  SYSTEM_ERROR: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  SYSTEM_WARNING: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
};

const defaultColors = { text: "text-primary", bg: "bg-primary/10", border: "border-primary/30" };

export const EventCard = ({ 
  timestamp, 
  eventType, 
  username, 
  sourceIp, 
  processName, 
  osName,
  rawMessage 
}: EventCardProps) => {
  const Icon = eventTypeIcons[eventType] || Shield;
  const colors = eventTypeColors[eventType] || defaultColors;

  return (
    <div className="glass-card p-4 rounded-lg hover:border-primary/40 transition-all group">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg border", colors.bg, colors.border, colors.text)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn("font-mono text-xs", colors.text, colors.border)}
            >
              {eventType.replace(/_/g, " ")}
            </Badge>
            <Badge 
              variant="secondary" 
              className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
            >
              {osName}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            {username && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="font-medium text-foreground">{username}</span>
              </p>
            )}
            {sourceIp && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="font-mono text-primary">{sourceIp}</span>
              </p>
            )}
            {processName && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Terminal className="h-3 w-3" />
                <span className="font-mono text-xs">{processName}</span>
              </p>
            )}
            <div className="mt-2 p-2 rounded bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground font-mono leading-relaxed break-all">
                {rawMessage}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
            <Clock className="h-3 w-3" />
            <span className="terminal-text">{new Date(timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
