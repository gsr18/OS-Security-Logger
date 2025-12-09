import { Shield, X, CheckCircle, Terminal, AlertTriangle, Server, Flame, Network, User, Clock, LogIn, LogOut } from "lucide-react";
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

const eventTypeColors: Record<string, string> = {
  AUTH_FAILURE: "text-red-600 dark:text-red-400",
  AUTH_SUCCESS: "text-green-600 dark:text-green-400",
  FAILED_LOGIN: "text-red-600 dark:text-red-400",
  SUCCESS_LOGIN: "text-green-600 dark:text-green-400",
  SUDO_SUCCESS: "text-green-600 dark:text-green-400",
  SUDO_FAILURE: "text-red-600 dark:text-red-400",
  SUDO_COMMAND: "text-yellow-600 dark:text-yellow-400",
  PRIV_ESCALATION: "text-orange-600 dark:text-orange-400",
  FIREWALL_BLOCK: "text-red-600 dark:text-red-400",
  FIREWALL_ALLOW: "text-green-600 dark:text-green-400",
  FIREWALL_EVENT: "text-blue-600 dark:text-blue-400",
  SERVICE_START: "text-green-600 dark:text-green-400",
  SERVICE_STOP: "text-yellow-600 dark:text-yellow-400",
  SERVICE_FAILURE: "text-red-600 dark:text-red-400",
  KERNEL_WARNING: "text-yellow-600 dark:text-yellow-400",
  KERNEL_ERROR: "text-red-600 dark:text-red-400",
  KERNEL_OOM: "text-red-600 dark:text-red-400",
  KERNEL_SEGFAULT: "text-red-600 dark:text-red-400",
  SESSION_START: "text-blue-600 dark:text-blue-400",
  SESSION_END: "text-blue-600 dark:text-blue-400",
  USER_CREATED: "text-purple-600 dark:text-purple-400",
  PASSWORD_CHANGE: "text-purple-600 dark:text-purple-400",
  GROUP_MEMBERSHIP_CHANGE: "text-purple-600 dark:text-purple-400",
  CONNECTION_CLOSED: "text-gray-600 dark:text-gray-400",
  SYSTEM_ERROR: "text-red-600 dark:text-red-400",
  SYSTEM_WARNING: "text-yellow-600 dark:text-yellow-400",
};

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
  const color = eventTypeColors[eventType] || "text-muted-foreground";

  return (
    <div className="p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg bg-muted", color)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-xs">
              {eventType.replace(/_/g, " ")}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {osName}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            {username && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">User:</span> {username}
              </p>
            )}
            {sourceIp && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">IP:</span> {sourceIp}
              </p>
            )}
            {processName && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Process:</span> {processName}
              </p>
            )}
            <p className="text-xs text-muted-foreground font-mono mt-2 p-2 bg-muted rounded">
              {rawMessage}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};