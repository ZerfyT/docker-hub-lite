import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Moon, Sun, ArrowsClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Header() {
  const { dockerState, dockerStateError, mode, setMode, fetchFastData, fetchSystemInfo, fetchSystemDf } = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const location = useLocation();
  const pathName = location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
  const formattedPath = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([fetchFastData(), fetchSystemInfo(), fetchSystemDf()]);
      toast.success("Engine state refreshed");
    } catch {
      toast.error("Failed to refresh state");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const isRunning = dockerState === "Running";

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border/70 bg-background/80 backdrop-blur-md sticky top-0 z-30 select-none">
      <div className="flex items-center gap-4 flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Docker Lite
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/40" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xs font-semibold text-foreground">
                {formattedPath.replace("-", " ")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-end gap-2.5 flex-1">
        {/* Refresh button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          title="Refresh Engine State"
          aria-label="Refresh Engine State"
        >
          <ArrowsClockwise className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
        </Button>

        {/* Dark/Light mode toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMode}
          className="h-8 w-8 p-0 rounded-lg border border-border/70 bg-card hover:bg-muted font-medium text-muted-foreground hover:text-foreground transition-all"
          title={`Switch to ${mode === "dark" ? "Light" : "Dark"} mode`}
          aria-label={`Switch to ${mode === "dark" ? "Light" : "Dark"} mode`}
        >
          {mode === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" weight="fill" />
          ) : (
            <Moon className="h-4 w-4 text-slate-700" weight="fill" />
          )}
        </Button>

        {/* Docker Engine Service Pill */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors",
            isRunning
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 glow-emerald"
              : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25"
          )}
          title={dockerStateError || (isRunning ? "Docker Daemon is active" : "Docker Daemon is disconnected")}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isRunning ? "bg-emerald-400" : "bg-red-400"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isRunning ? "bg-emerald-500" : "bg-red-500"
              )}
            />
          </span>
          <span className="font-mono text-[11px]">{dockerState || "Offline"}</span>
        </div>
      </div>
    </header>
  );
}
