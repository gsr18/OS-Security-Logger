import { AlertTriangle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AlertCardProps {
  timestamp: string;
  alertType: string;
  severity: string;
  description: string;
  relatedEventIds?: number[];
}

const severityIcons = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: XCircle,
};

const severityColors = {
  INFO: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
  WARNING: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
  CRITICAL: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
};

const severityBadgeColors = {
  INFO: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  WARNING: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  CRITICAL: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
};

export const AlertCard = ({
  timestamp,
  alertType,
  severity,
  description,
  relatedEventIds,
}: AlertCardProps) => {
  const Icon = severityIcons[severity as keyof typeof severityIcons] || AlertTriangle;
  const colorClass = severityColors[severity as keyof typeof severityColors] || severityColors.INFO;
  const badgeColor = severityBadgeColors[severity as keyof typeof severityBadgeColors] || severityBadgeColors.INFO;

  return (
    <div className={cn("p-4 rounded-lg border border-border", colorClass)}>
      <div className="flex items-start gap-3">
        <div className="p-2">
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("font-semibold", badgeColor)}>
              {severity}
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              {alertType.replace(/_/g, " ")}
            </Badge>
          </div>
          
          <p className="text-sm font-medium mb-2">{description}</p>
          
          {relatedEventIds && relatedEventIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Related events: {relatedEventIds.join(", ")}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            {new Date(timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
