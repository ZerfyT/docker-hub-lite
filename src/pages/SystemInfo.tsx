import { useStore } from "@/store/useStore";
import { CubeIcon, StackIcon, HardDrivesIcon, PulseIcon, CopyIcon, CpuIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { toast } from "sonner";

export function SystemInfo() {
  const systemInfo = useStore((s) => s.systemInfo);
  const dockerState = useStore((s) => s.dockerState);
  const dockerStateError = useStore((s) => s.dockerStateError);
  const containers = useStore((s) => s.containers);
  const images = useStore((s) => s.images);
  const volumes = useStore((s) => s.volumes);

  const isOnline = dockerState === "Running";
  const runningContainers = containers.filter((c) => c.State === "running").length;

  const copyText = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          System & Engine Information
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Low-level Docker engine architecture, daemon status, and allocated hardware limits.
        </p>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Daemon Status"
          value={isOnline ? "Online" : "Offline"}
          description={dockerStateError || (isOnline ? "Daemon responding normally" : "Daemon unreachable")}
          icon={PulseIcon}
          variant={isOnline ? "emerald" : "default"}
        />

        <MetricCard
          title="Fleet Containers"
          value={`${runningContainers} / ${containers.length}`}
          description={`${runningContainers} active, ${containers.length - runningContainers} idle`}
          icon={CubeIcon}
          variant="emerald"
        />

        <MetricCard
          title="Local Images"
          value={images.length}
          description={`${systemInfo?.total_images || images.length} cached layers in engine`}
          icon={StackIcon}
          variant="blue"
        />

        <MetricCard
          title="Storage Volumes"
          value={volumes.length}
          description={systemInfo?.volume_storage || `${volumes.length} named volumes`}
          icon={HardDrivesIcon}
          variant="amber"
        />
      </div>

      {/* Advanced Engine Details */}
      <Card className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-xs">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <CpuIcon className="h-5 w-5 text-primary" weight="fill" />
            <CardTitle className="text-base font-semibold text-foreground">
              Docker Engine Runtime Specifications
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Configuration parameters extracted directly from the local Docker daemon socket
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                API Health Status
              </span>
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    systemInfo?.system_health === "Healthy"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      systemInfo?.system_health === "Healthy" ? "bg-emerald-500 animate-pulse" : "bg-destructive"
                    }`}
                  />
                  <span>{systemInfo?.system_health === "Healthy" ? "Verified Passing" : "Degraded"}</span>
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hardware Limits Assigned
              </span>
              <div className="text-sm font-mono font-bold text-foreground pt-1">
                {systemInfo?.ncpu || "-"} CPU Cores •{" "}
                {systemInfo?.mem_total ? (systemInfo.mem_total / (1024 * 1024 * 1024)).toFixed(1) : "-"} GB RAM
              </div>
            </div>
          </div>

          {/* Key Value Inspector Table */}
          <div className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden font-mono text-xs">
            <div className="p-3 bg-muted/50 border-b border-border/50 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Engine Key-Value Parameters
            </div>
            <div className="divide-y divide-border/40">
              {[
                { label: "Server Version", value: systemInfo?.server_version || "-" },
                { label: "Operating System", value: systemInfo?.operating_system || "-" },
                { label: "Kernel Version", value: systemInfo?.kernel_version || "-" },
                { label: "Storage Driver", value: systemInfo?.driver || "-" },
                { label: "Docker Root Dir", value: systemInfo?.docker_root_dir || "-" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-muted-foreground font-sans font-medium">{item.label}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-bold">{item.value}</span>
                    {item.value !== "-" && (
                      <button
                        type="button"
                        onClick={() => copyText(item.value, item.label)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                        title="Copy value"
                      >
                        <CopyIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
