import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HostStats {
  cpu: number;
  memory: number;
}

interface ChartDataPoint {
  time: string;
  cpu: number;
  memory: number;
}

export function ResourceChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Pre-fill array with empty data to avoid resizing jumps
    const initialData = Array.from({ length: 60 }).map((_, i) => ({
      time: new Date(Date.now() - (60 - i) * 1000).toLocaleTimeString([], { second: "2-digit" }),
      cpu: 0,
      memory: 0,
    }));
    setData(initialData);

    const intervalId = setInterval(async () => {
      try {
        const stats = await invoke<HostStats>("get_host_stats");

        setData((prevData) => {
          const newData = [...prevData.slice(1)];
          newData.push({
            time: new Date().toLocaleTimeString([], { second: "2-digit" }),
            cpu: Math.round(stats.cpu),
            memory: Math.round(stats.memory),
          });
          return newData;
        });
      } catch (error) {
        console.error("Failed to fetch host stats:", error);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Live CPU & Memory Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis
                tickFormatter={(val) => `${val}%`}
                axisLine={true}
                tickLine={true}
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU Usage"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCpu)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="memory"
                name="Memory Usage"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorMemory)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
