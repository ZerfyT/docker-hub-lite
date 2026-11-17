import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ActivityIcon, CpuIcon, HardDriveIcon } from "@phosphor-icons/react";

export function ResourceChart() {
  const hostStatsHistory = useStore((s) => s.hostStatsHistory);
  const latestCpu = useStore((s) => s.latestCpu);
  const latestMemory = useStore((s) => s.latestMemory);
  const [activeFilter, setActiveFilter] = useState<"both" | "cpu" | "memory">("both");
  const data = hostStatsHistory;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md p-2.5 shadow-xl text-xs space-y-1.5 font-mono">
          <p className="text-[11px] text-muted-foreground font-sans">{label || "Live"}</p>
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-bold text-foreground">{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Host Resource Telemetry
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Real-time hardware utilization sampled every 1s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Live CPU Badge */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === "cpu" ? "both" : "cpu"))}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              activeFilter === "cpu" || activeFilter === "both"
                ? "bg-blue-500/10 text-blue-500 border-blue-500/30 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-transparent opacity-60"
            }`}
          >
            <CpuIcon className="w-3.5 h-3.5" weight="fill" />
            <span>CPU</span>
            <span className="font-bold">{latestCpu}%</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </button>

          {/* Live Memory Badge */}
          <button
            type="button"
            onClick={() => setActiveFilter((prev) => (prev === "memory" ? "both" : "memory"))}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
              activeFilter === "memory" || activeFilter === "both"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-xs"
                : "bg-muted/40 text-muted-foreground border-transparent opacity-60"
            }`}
          >
            <HardDriveIcon className="w-3.5 h-3.5" weight="fill" />
            <span>RAM</span>
            <span className="font-bold">{latestMemory}%</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="resourceCpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resourceMemGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.3}
              />
              <XAxis dataKey="time" hide />
              <YAxis
                tickFormatter={(val) => `${val}%`}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Tooltip content={<CustomTooltip />} />
              {(activeFilter === "both" || activeFilter === "cpu") && (
                <Area
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#resourceCpuGrad)"
                  isAnimationActive={false}
                />
              )}
              {(activeFilter === "both" || activeFilter === "memory") && (
                <Area
                  type="monotone"
                  dataKey="memory"
                  name="Memory"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#resourceMemGrad)"
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
