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
import { Palette, Moon, Sun } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header() {
  const { dockerState, dockerStateError, theme, setTheme, mode, setMode } = useStore();
  const location = useLocation();
  const pathName = location.pathname.split("/").filter(Boolean).pop() || "Dashboard";
  const formattedPath = pathName.charAt(0).toUpperCase() + pathName.slice(1);

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const themes = [
    { id: "zinc", name: "Zinc (Default)", color: "bg-zinc-500" },
    { id: "slate", name: "Slate", color: "bg-slate-500" },
    { id: "red", name: "Red", color: "bg-red-500" },
    { id: "rose", name: "Rose", color: "bg-rose-500" },
    { id: "orange", name: "Orange", color: "bg-orange-500" },
    { id: "yellow", name: "Yellow", color: "bg-yellow-500" },
    { id: "green", name: "Green", color: "bg-green-500" },
    { id: "emerald", name: "Emerald", color: "bg-emerald-500" },
    { id: "cyan", name: "Cyan", color: "bg-cyan-500" },
    { id: "blue", name: "Blue", color: "bg-blue-500" },
    { id: "violet", name: "Violet", color: "bg-violet-500" },
  ];

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
        
        <Button variant="outline" size="sm" onClick={toggleMode} className="h-8 rounded-full border border-border bg-background hover:bg-muted font-medium flex items-center justify-center p-2 text-muted-foreground hover:text-foreground">
          {mode === "dark" ? <Moon className="h-4 w-4" weight="fill" /> : <Sun className="h-4 w-4" weight="fill" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 rounded-full border border-border bg-background hover:bg-muted font-medium flex items-center gap-2 px-3 text-muted-foreground hover:text-foreground">
              <Palette className="h-4 w-4 text-primary" weight="fill" />
              Theme
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {themes.map((t) => (
              <DropdownMenuItem 
                key={t.id} 
                onClick={() => setTheme(t.id)}
                className={`flex items-center justify-between cursor-pointer ${theme === t.id ? 'bg-primary/10 font-bold' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${t.color}`} />
                  <span>{t.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border",
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
