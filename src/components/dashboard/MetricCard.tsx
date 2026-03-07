import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@phosphor-icons/react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: Icon;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
