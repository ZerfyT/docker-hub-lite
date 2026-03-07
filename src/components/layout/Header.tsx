import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const pathName = location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
  const formattedPath = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
      <div className="flex items-center gap-4 flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">DockHost</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{formattedPath.replace("-", " ")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex justify-center flex-1">
        <div className="relative w-full max-w-md">
          <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search containers or images..."
            className="w-full pl-9 bg-muted/50 border-transparent hover:border-border focus-visible:bg-background transition-colors rounded-full"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 flex-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium border border-green-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Engine Connected
        </div>
      </div>
    </header>
  );
}
