import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@phosphor-icons/react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: Icon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "emerald" | "amber" | "blue";
}

export function MetricCard({
  title,
  value,
  description,
  icon: IconComponent,
  variant = "default",
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "emerald":
        return {
          iconBox: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          glow: "group-hover:border-emerald-500/40",
        };
      case "amber":
        return {
          iconBox: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          glow: "group-hover:border-amber-500/40",
        };
      case "blue":
        return {
          iconBox: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          glow: "group-hover:border-blue-500/40",
        };
      default:
        return {
          iconBox: "bg-primary/10 text-primary border-primary/20",
          glow: "group-hover:border-primary/40",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={`group relative overflow-hidden rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs transition-all duration-200 hover:shadow-md ${styles.glow}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {description}
              </p>
            )}
          </div>
          <div
            className={`p-3 rounded-xl border shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs ${styles.iconBox}`}
          >
            <IconComponent className="w-5 h-5" weight="fill" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
