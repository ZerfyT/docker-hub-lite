import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricChartProps {
  data: any[];
  dataKey: string;
  name: string;
  color: string;
  gradientId: string;
  unit?: string;
  tickFormatter?: (val: any) => string;
}

export function MetricChart({
  data,
  dataKey,
  name,
  color,
  gradientId,
  unit = "",
  tickFormatter,
}: MetricChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const formatted = tickFormatter ? tickFormatter(val) : `${val}${unit}`;
      return (
        <div className="rounded-lg border border-border/80 bg-popover/95 backdrop-blur-md p-2 shadow-xl text-xs space-y-1 font-mono">
          <p className="text-[10px] text-muted-foreground font-sans">{label || "Live"}</p>
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{name}:</span>
            <span className="text-primary">{formatted}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[180px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
            opacity={0.3}
          />
          <XAxis
            dataKey="time"
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormatter || ((val) => `${val}${unit}`)}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={name}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContainerStatsChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl bg-muted/20 animate-pulse font-mono">
        Connecting to container telemetry stream...
      </div>
    );
  }

  const latest = data[data.length - 1] || {};

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CPU Card */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            CPU Utilization
          </span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {latest.cpu !== undefined ? `${latest.cpu}%` : "0%"}
          </span>
        </div>
        <MetricChart
          data={data}
          dataKey="cpu"
          name="CPU"
          color="#3b82f6"
          gradientId="cpuStatsGrad"
          unit="%"
        />
      </div>

      {/* Memory Card */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Memory Allocated
          </span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {formatBytes(latest.mem)}
          </span>
        </div>
        <MetricChart
          data={data}
          dataKey="mem"
          name="Memory"
          color="#10b981"
          gradientId="memStatsGrad"
          tickFormatter={formatBytes}
        />
      </div>

      {/* Network I/O (RX) */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Network Inbound (RX)
          </span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            {formatBytes(latest.netRx)}
          </span>
        </div>
        <MetricChart
          data={data}
          dataKey="netRx"
          name="Network RX"
          color="#8b5cf6"
          gradientId="netRxStatsGrad"
          tickFormatter={formatBytes}
        />
      </div>

      {/* Block I/O (Read) */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Block Storage I/O
          </span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {formatBytes(latest.blockRead)}
          </span>
        </div>
        <MetricChart
          data={data}
          dataKey="blockRead"
          name="Block Read"
          color="#f59e0b"
          gradientId="blockStatsGrad"
          tickFormatter={formatBytes}
        />
      </div>
    </div>
  );
}
