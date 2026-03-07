// src/App.tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button"; // Shadcn component
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Define the shape based on bollard's ContainerSummary
interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
}

function App() {
  const [containers, setContainers] = useState<Container[]>([]);

  const fetchContainers = async () => {
    try {
      const data = await invoke<Container[]>("get_containers");
      setContainers(data);
    } catch (error) {
      console.error("Failed to fetch containers:", error);
    }
  };

  const startContainer = async (id: string) => {
    try {
      await invoke("start_container", { id });
      fetchContainers(); // Refresh list
    } catch (error) {
      console.error("Failed to start:", error);
    }
  };

  useEffect(() => {
    fetchContainers();
    // Set up polling or Tauri events for live updates here
    const interval = setInterval(fetchContainers, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Docker Control Center</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {containers.map((c) => (
            <TableRow key={c.Id}>
              <TableCell>{c.Names[0].replace("/", "")}</TableCell>
              <TableCell>{c.Image}</TableCell>
              <TableCell>
                <span className={c.State === "running" ? "text-green-500" : "text-red-500"}>
                  {c.Status}
                </span>
              </TableCell>
              <TableCell>
                {c.State !== "running" && (
                  <Button variant="outline" size="sm" onClick={() => startContainer(c.Id)}>
                    Start
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default App;