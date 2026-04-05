import { AppLayout } from "@/components/layout/AppLayout";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import { Containers } from "@/pages/Containers";
import { ContainerDetails } from "@/pages/ContainerDetails";
import { Images } from "@/pages/Images";
import { Volumes } from "@/pages/Volumes";
import { Networks } from "@/pages/Networks";
import { Logs } from "@/pages/Logs";
import { SystemInfo } from "@/pages/SystemInfo";
import { AppSettings } from "@/pages/AppSettings";
import { Templates } from "@/pages/Templates";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";

function App() {
  const { theme, mode } = useStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.dataset.theme = theme;
    
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mode]);

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/containers/:id" element={<ContainerDetails />} />
          <Route path="/images" element={<Images />} />
          <Route path="/volumes" element={<Volumes />} />
          <Route path="/networks" element={<Networks />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/system-info" element={<SystemInfo />} />
          <Route path="/settings" element={<AppSettings />} />
          <Route path="/templates" element={<Templates />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;