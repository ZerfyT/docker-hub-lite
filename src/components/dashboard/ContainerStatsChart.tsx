import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function MetricChart({ data, dataKey, name, color, unit, tickFormatter }: any) {
  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
          <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={tickFormatter || ((val) => `${val}${unit}`)} width={60} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
            formatter={(val: any) => [tickFormatter ? tickFormatter(val) : `${val}${unit}`, name]}
          />
          <Line type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContainerStatsChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/50 rounded-lg bg-muted/20 animate-pulse">
        Initializing metrics stream...
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-4 border border-border/50 rounded-xl bg-card/50 shadow-sm">
        <h4 className="font-semibold text-sm text-muted-foreground">CPU Usage</h4>
        <MetricChart data={data} dataKey="cpu" name="CPU" color="#3b82f6" unit="%" />
      </div>
      <div className="p-4 border border-border/50 rounded-xl bg-card/50 shadow-sm">
        <h4 className="font-semibold text-sm text-muted-foreground">Memory Usage</h4>
        <MetricChart data={data} dataKey="mem" name="Memory" color="#10b981" tickFormatter={formatBytes} unit="" />
      </div>
      <div className="p-4 border border-border/50 rounded-xl bg-card/50 shadow-sm">
        <h4 className="font-semibold text-sm text-muted-foreground">Network I/O (RX)</h4>
        <MetricChart data={data} dataKey="netRx" name="Network RX" color="#8b5cf6" tickFormatter={formatBytes} unit="" />
      </div>
      <div className="p-4 border border-border/50 rounded-xl bg-card/50 shadow-sm">
        <h4 className="font-semibold text-sm text-muted-foreground">Block I/O (Read)</h4>
        <MetricChart data={data} dataKey="blockRead" name="Block Read" color="#f59e0b" tickFormatter={formatBytes} unit="" />
      </div>
    </div>
  );
}
