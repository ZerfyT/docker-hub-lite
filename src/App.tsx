import { AppLayout } from "@/components/layout/AppLayout";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import { Containers } from "@/pages/Containers";
import { Images } from "@/pages/Images";
import { Volumes } from "@/pages/Volumes";
import { Networks } from "@/pages/Networks";
import { Logs } from "@/pages/Logs";
import { SystemInfo } from "@/pages/SystemInfo";
import { AppSettings } from "@/pages/AppSettings";
import { Templates } from "@/pages/Templates";

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/containers" element={<Containers />} />
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