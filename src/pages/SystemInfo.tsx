import { useStore } from "@/store/useStore";
import { CubeIcon, StackIcon, HardDrivesIcon, HeartbeatIcon, ActivityIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SystemInfo() {
  const { systemInfo, dockerState, dockerStateError, containers, images, volumes, networks } = useStore();

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Information</h2>
        <p className="text-muted-foreground">Overview of your local Docker engine and resource usage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daemon Status</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dockerState === "Running" ? (
                <span className="text-green-500 flex items-center gap-2"><HeartbeatIcon className="h-6 w-6" /> Online</span>
              ) : (
                <span className="text-red-500 flex items-center gap-2"><WarningCircleIcon className="h-6 w-6" /> Offline</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dockerStateError ? dockerStateError : "Engine is responding normally"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Containers</CardTitle>
            <CubeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{containers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {containers.filter(c => c.State === "running").length} currently running
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local Images</CardTitle>
            <StackIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{images.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemInfo?.total_images || 0} images reported by engine
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volumes & Storage</CardTitle>
            <HardDrivesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volumes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {systemInfo?.volume_storage || "No volumes detected"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Engine Details</CardTitle>
          <CardDescription>Advanced information returned by the Docker API.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">API Health Check</span>
                <div className="flex items-center gap-2 mt-1">
                  {systemInfo?.system_health === "Healthy" ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Passed</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">System Resource Limits</span>
                <div className="font-medium mt-1">
                  {systemInfo?.ncpu || "-"} CPUs, {(systemInfo?.mem_total ? (systemInfo.mem_total / (1024 * 1024 * 1024)).toFixed(2) : "-")} GB Memory
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="bg-muted/30 p-4 rounded-lg font-mono text-sm overflow-x-auto text-muted-foreground">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-lg">
                  <div>Docker Version:</div>
                  <div className="text-foreground">{systemInfo?.server_version || "-"}</div>
                  <div>Operating System:</div>
                  <div className="text-foreground">{systemInfo?.operating_system || "-"}</div>
                  <div>Kernel Version:</div>
                  <div className="text-foreground">{systemInfo?.kernel_version || "-"}</div>
                  <div>Storage Driver:</div>
                  <div className="text-foreground">{systemInfo?.driver || "-"}</div>
                  <div>Root Directory:</div>
                  <div className="text-foreground">{systemInfo?.docker_root_dir || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
