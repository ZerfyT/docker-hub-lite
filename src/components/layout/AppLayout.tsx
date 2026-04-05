import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ReactNode, useEffect } from "react";
import { useStore } from "@/store/useStore";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { fetchAllData, isPolling } = useStore();

  useEffect(() => {
    // Initial fetch
    fetchAllData();

    if (!isPolling) return;

    // Set up global polling
    const interval = setInterval(() => {
      fetchAllData();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchAllData, isPolling]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      <Sidebar className="w-64 shrink-0" />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
