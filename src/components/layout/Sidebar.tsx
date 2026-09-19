import {
  LayoutIcon,
  CubeIcon,
  StackIcon,
  HardDrivesIcon,
  NetworkIcon,
  FileTextIcon,
  CpuIcon,
  GearIcon,
  UsersIcon,
  GithubLogoIcon,
  StarIcon,
  BoatIcon,
} from "@phosphor-icons/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

import { NavLink } from "react-router-dom";

const primaryNav = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutIcon },
  { name: "Containers", path: "/containers", icon: CubeIcon },
  { name: "Images", path: "/images", icon: StackIcon },
  { name: "Volumes", path: "/volumes", icon: HardDrivesIcon },
  { name: "Networks", path: "/networks", icon: NetworkIcon },
  { name: "Logs", path: "/logs", icon: FileTextIcon },
];

const secondaryNav = [
  { name: "System Info", path: "/system-info", icon: CpuIcon },
  { name: "App Settings", path: "/settings", icon: GearIcon },
];

export function Sidebar({ className }: SidebarProps) {
  return (
    <div
      className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground ${className}`}
    >
      {/* Brand / Logo */}
      <div className="p-4 flex items-center space-x-3 mb-4">
        <div className="bg-primary/10 p-2 rounded-xl text-primary">
          <BoatIcon size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight">
            DockHost
          </h1>
          <p className="text-xs text-sidebar-foreground/60 font-medium">
            Local Engine
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <NavLink key={item.name} to={item.path} className="block">
              {({ isActive }) => (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              )}
            </NavLink>
          ))}
        </div>

        <div className="my-6">
          <Separator className="bg-sidebar-border/50" />
        </div>

        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold tracking-wider text-sidebar-foreground/40 mb-2 uppercase">
            System & Community
          </p>
          {secondaryNav.map((item) => (
            <NavLink key={item.name} to={item.path} className="block">
              {({ isActive }) => (
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    }`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              )}
            </NavLink>
          ))}
        </div>
      </ScrollArea>

      {/* Footer link to Github */}
      <div className="p-4 mt-auto border-t border-sidebar-border/50">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-3 rounded-lg hover:bg-sidebar-accent text-sm text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <GithubLogoIcon size={16} />
            <span className="font-medium">Star on GitHub</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium bg-sidebar-accent px-2 py-0.5 rounded-full">
            <StarIcon size={10} className="fill-current text-yellow-500" />
            <span>1.2k</span>
          </div>
        </a>
      </div>
    </div>
  );
}
