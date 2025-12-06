import { Shield, X, CheckCircle, Terminal, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EventCardProps {
  timestamp: string;
  eventType: string;
  username?: string;
  sourceIp?: string;
  processName?: string;
  osName: string;
  rawMessage: string;
}

const eventTypeIcons = {
  FAILED_LOGIN: X,
  SUCCESS_LOGIN: CheckCircle,
  SUDO_COMMAND: Terminal,
  PRIV_ESCALATION: AlertTriangle,
};

const eventTypeColors = {
  FAILED_LOGIN: "text-red-600 dark:text-red-400",
  SUCCESS_LOGIN: "text-green-600 dark:text-green-400",
  SUDO_COMMAND: "text-yellow-600 dark:text-yellow-400",
  PRIV_ESCALATION: "text-orange-600 dark:text-orange-400",
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
  const Icon = eventTypeIcons[eventType as keyof typeof eventTypeIcons] || Shield;
  const color = eventTypeColors[eventType as keyof typeof eventTypeColors] || "text-muted-foreground";

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
