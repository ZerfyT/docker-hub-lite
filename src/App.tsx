import { AppLayout } from "@/components/layout/AppLayout";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/store/useStore";
import { useEffect, lazy, Suspense } from "react";

// Route-level code splitting to prevent loading heavy libraries (XYFlow, Recharts, etc.) into webview memory on launch
const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Containers = lazy(() => import("@/pages/Containers").then((m) => ({ default: m.Containers })));
const ContainerDetails = lazy(() => import("@/pages/ContainerDetails").then((m) => ({ default: m.ContainerDetails })));
const Images = lazy(() => import("@/pages/Images").then((m) => ({ default: m.Images })));
const Volumes = lazy(() => import("@/pages/Volumes").then((m) => ({ default: m.Volumes })));
const Networks = lazy(() => import("@/pages/Networks").then((m) => ({ default: m.Networks })));
const Logs = lazy(() => import("@/pages/Logs").then((m) => ({ default: m.Logs })));
const Events = lazy(() => import("@/pages/Events").then((m) => ({ default: m.Events })));
const Ports = lazy(() => import("@/pages/Ports").then((m) => ({ default: m.Ports })));
const Stacks = lazy(() => import("@/pages/Stacks").then((m) => ({ default: m.Stacks })));
const DevStarters = lazy(() => import("@/pages/DevStarters").then((m) => ({ default: m.DevStarters })));
const NetworkMap = lazy(() => import("@/pages/NetworkMap").then((m) => ({ default: m.NetworkMap })));
const Registries = lazy(() => import("@/pages/Registries").then((m) => ({ default: m.Registries })));
const SystemInfo = lazy(() => import("@/pages/SystemInfo").then((m) => ({ default: m.SystemInfo })));
const AppSettings = lazy(() => import("@/pages/AppSettings").then((m) => ({ default: m.AppSettings })));

function RouteFallback() {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-xs text-muted-foreground font-mono">Loading module...</span>
    </div>
  );
}

function App() {
  const mode = useStore((s) => s.mode);

  useEffect(() => {
    const root = window.document.documentElement;

    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute("content", mode);
    }
  }, [mode]);

  return (
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/containers" element={<Containers />} />
            <Route path="/containers/:id" element={<ContainerDetails />} />
            <Route path="/images" element={<Images />} />
            <Route path="/volumes" element={<Volumes />} />
            <Route path="/networks" element={<Networks />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/ports" element={<Ports />} />
            <Route path="/stacks" element={<Stacks />} />
            <Route path="/starters" element={<DevStarters />} />
            <Route path="/topology" element={<NetworkMap />} />
            <Route path="/registries" element={<Registries />} />
            <Route path="/system-info" element={<SystemInfo />} />
            <Route path="/settings" element={<AppSettings />} />
          </Routes>
        </Suspense>
      </AppLayout>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
