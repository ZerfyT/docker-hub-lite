import {
  LayoutIcon,
  CubeIcon,
  StackIcon,
  HardDrivesIcon,
  NetworkIcon,
  FileTextIcon,
  CpuIcon,
  GearIcon,
  GithubLogoIcon,
  StarIcon,
  PlugsIcon,
  ActivityIcon,
  GraphIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from "@phosphor-icons/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { useStore } from "@/store/useStore";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: any;
  badge?: string;
  countKey?: "runningContainers" | "totalImages" | "volumes";
}

const workloadNav: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutIcon },
  { name: "Containers", path: "/containers", icon: CubeIcon, countKey: "runningContainers" },
  { name: "Images", path: "/images", icon: StackIcon, countKey: "totalImages" },
  { name: "Volumes", path: "/volumes", icon: HardDrivesIcon },
  { name: "Networks", path: "/networks", icon: NetworkIcon },
  { name: "Dev Starters", path: "/starters", icon: RocketLaunchIcon, badge: "Quick" },
  { name: "Stacks", path: "/stacks", icon: StackIcon },
];

const observabilityNav: NavItem[] = [
  { name: "Ports", path: "/ports", icon: PlugsIcon },
  { name: "Network Map", path: "/topology", icon: GraphIcon },
  { name: "Registries", path: "/registries", icon: ShieldCheckIcon },
  { name: "Event Log", path: "/events", icon: ActivityIcon },
  { name: "Logs", path: "/logs", icon: FileTextIcon },
];

const systemNav: NavItem[] = [
  { name: "System Info", path: "/system-info", icon: CpuIcon },
  { name: "App Settings", path: "/settings", icon: GearIcon },
];

export function Sidebar({ className = "" }: SidebarProps) {
  const containers = useStore((s) => s.containers);
  const images = useStore((s) => s.images);

  const runningCount = containers.filter((c) => c.State === "running").length;
  const imageCount = images.length;

  const renderBadge = (item: NavItem) => {
    if (item.countKey === "runningContainers" && runningCount > 0) {
      return (
        <span className="ml-auto flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono font-semibold border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {runningCount}
        </span>
      );
    }
    if (item.countKey === "totalImages" && imageCount > 0) {
      return (
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground font-mono border border-border/40">
          {imageCount}
        </span>
      );
    }
    if (item.badge) {
      return (
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-semibold tracking-wider uppercase border border-primary/20">
          {item.badge}
        </span>
      );
    }
    return null;
  };

  const renderNavGroup = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/45 uppercase">
        {title}
      </p>
      {items.map((item) => (
        <NavLink key={item.path} to={item.path} className="block group">
          {({ isActive }) => (
            <Button
              variant="ghost"
              className={`w-full justify-start h-9 px-3 text-xs font-medium rounded-lg transition-all ${
                isActive
                  ? "bg-primary/12 text-primary font-semibold border-l-2 border-primary shadow-xs"
                  : "text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              }`}
            >
              <item.icon
                className={`mr-2.5 h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? "text-primary" : "text-sidebar-foreground/60"
                }`}
                weight={isActive ? "fill" : "regular"}
              />
              <span className="truncate">{item.name}</span>
              {renderBadge(item)}
            </Button>
          )}
        </NavLink>
      ))}
    </div>
  );

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border text-sidebar-foreground select-none ${className}`}
      aria-label="Application navigation"
    >
      {/* Brand Header */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border/40">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary shadow-xs glow-primary overflow-hidden">
          <img src="/logo.svg" alt="Docker Lite" className="h-7 w-7 object-contain" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm tracking-tight text-foreground">
              Docker Lite
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50">
              v0.2
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Container Studio
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-4">
          {renderNavGroup("Workloads", workloadNav)}
          <Separator className="bg-sidebar-border/50 my-1" />
          {renderNavGroup("Observability", observabilityNav)}
          <Separator className="bg-sidebar-border/50 my-1" />
          {renderNavGroup("System & Engine", systemNav)}
        </div>
      </ScrollArea>

      {/* Footer / Community */}
      <div className="p-3 border-t border-sidebar-border/50 bg-sidebar/50">
        <a
          href="https://github.com/ZerfyT/docker-hub-lite"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent/70 text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors group"
        >
          <div className="flex items-center gap-2">
            <GithubLogoIcon size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-medium">GitHub Repository</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono bg-sidebar-accent px-1.5 py-0.5 rounded-md border border-border/40">
            <StarIcon size={11} weight="fill" className="text-amber-500" />
            <span>Star</span>
          </div>
        </a>
      </div>
    </aside>
  );
}
