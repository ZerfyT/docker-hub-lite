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

export function Header() {
  const { dockerState, dockerStateError } = useStore();
  const location = useLocation();
  const pathName = location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
  const formattedPath = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
      <div className="flex items-center gap-4 flex-1">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">DockHost</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{formattedPath.replace("-", " ")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-end gap-4 flex-1">
        <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full text-sm font-medium border",
          dockerState == "Running" ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20")}
          title={dockerStateError}
        >
          <span className="relative flex h-2 w-2">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              dockerState == "Running" ? "bg-green-400" : "bg-red-400")}></span>
            <span className={cn("relative inline-flex rounded-full h-2 w-2",
              dockerState == "Running" ? "bg-green-500" : "bg-red-500")}></span>
          </span>
          Service {dockerState}
        </div>
      </div>
    </header>
  );
}
