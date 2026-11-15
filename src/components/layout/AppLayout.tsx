import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ReactNode, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { fetchAllData, fetchFastData, fetchSystemDf, fetchSystemInfo, isPolling } = useStore();

  useEffect(() => {
    // Initial fetch of all data
    fetchAllData();

    // Start event stream and listen for docker events to update state reactively
    invoke("start_event_stream").catch(console.error);

    const unlistenPromise = listen("docker-event", () => {
      fetchFastData();
    });

    if (!isPolling) {
      return () => {
        unlistenPromise.then(unlisten => unlisten());
      };
    }

    // Fast polling (containers, images, state, etc.)
    const fastInterval = setInterval(() => {
      fetchFastData();
    }, 4000);

    // Slower polling for heavy stats like system df and system info
    const slowInterval = setInterval(() => {
      fetchSystemDf();
      fetchSystemInfo();
    }, 30000);

    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [fetchAllData, fetchFastData, fetchSystemDf, fetchSystemInfo, isPolling]);

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
