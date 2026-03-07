import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock data to simulate live CPU and Memory usage
const generateData = () => {
  const data = [];
  const now = new Date().getTime();
  for (let i = 60; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 1000).toLocaleTimeString([], {
        second: "2-digit",
      }),
      cpu: Math.floor(Math.random() * 40) + 10,
      memory: Math.floor(Math.random() * 30) + 40,
    });
  }
  return data;
};

const data = generateData();

export function ResourceChart() {
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
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "var(--foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU Usage"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorCpu)"
                strokeWidth={2}
                animationDuration={0}
              />
              <Area
                type="monotone"
                dataKey="memory"
                name="Memory Usage"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorMemory)"
                strokeWidth={2}
                animationDuration={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
