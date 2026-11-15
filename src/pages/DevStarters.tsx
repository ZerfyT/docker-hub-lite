import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RocketLaunchIcon,
  DatabaseIcon,
  PlayIcon,
  CheckCircleIcon,
  SpinnerGapIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { RunContainerModal } from "@/components/modals/RunContainerModal";

interface DevStarter {
  id: string;
  name: string;
  category: "database" | "cache" | "queue" | "tool";
  image: string;
  defaultName: string;
  description: string;
  ports: { host_port: number; container_port: number; protocol?: string }[];
  env?: string[];
  volumes?: string[];
  tags: string[];
}

const STARTERS: DevStarter[] = [
  {
    id: "postgres",
    name: "PostgreSQL 16",
    category: "database",
    image: "postgres:16-alpine",
    defaultName: "dev-postgres",
    description: "Reliable, open-source object-relational database with persistent volume.",
    ports: [{ host_port: 5432, container_port: 5432, protocol: "tcp" }],
    env: ["POSTGRES_USER=postgres", "POSTGRES_PASSWORD=postgres", "POSTGRES_DB=devdb"],
    volumes: ["postgres_dev_data:/var/lib/postgresql/data:rw"],
    tags: ["SQL", "Relational", "ACID"],
  },
  {
    id: "redis",
    name: "Redis 7",
    category: "cache",
    image: "redis:7-alpine",
    defaultName: "dev-redis",
    description: "In-memory data structure store used as a database, cache, and message broker.",
    ports: [{ host_port: 6379, container_port: 6379, protocol: "tcp" }],
    volumes: ["redis_dev_data:/data:rw"],
    tags: ["In-Memory", "Cache", "PubSub"],
  },
  {
    id: "mongo",
    name: "MongoDB 7",
    category: "database",
    image: "mongo:latest",
    defaultName: "dev-mongo",
    description: "Document-oriented NoSQL database designed for modern apps and flexible schemas.",
    ports: [{ host_port: 27017, container_port: 27017, protocol: "tcp" }],
    volumes: ["mongo_dev_data:/data/db:rw"],
    tags: ["NoSQL", "JSON", "Document"],
  },
  {
    id: "mysql",
    name: "MySQL 8",
    category: "database",
    image: "mysql:8.0",
    defaultName: "dev-mysql",
    description: "World's most popular open-source relational database management system.",
    ports: [{ host_port: 3306, container_port: 3306, protocol: "tcp" }],
    env: ["MYSQL_ROOT_PASSWORD=root", "MYSQL_DATABASE=devdb"],
    volumes: ["mysql_dev_data:/var/lib/mysql:rw"],
    tags: ["SQL", "RDBMS", "InnoDB"],
  },
  {
    id: "rabbitmq",
    name: "RabbitMQ + Management",
    category: "queue",
    image: "rabbitmq:3-management-alpine",
    defaultName: "dev-rabbitmq",
    description: "Robust message broker with Web Management UI on port 15672.",
    ports: [
      { host_port: 5672, container_port: 5672, protocol: "tcp" },
      { host_port: 15672, container_port: 15672, protocol: "tcp" },
    ],
    tags: ["AMQP", "Message Broker", "Management UI"],
  },
  {
    id: "mailpit",
    name: "Mailpit (Local SMTP)",
    category: "tool",
    image: "axllent/mailpit",
    defaultName: "dev-mailpit",
    description: "Zero-dependency email testing tool with local SMTP and beautiful Web UI on 8025.",
    ports: [
      { host_port: 1025, container_port: 1025, protocol: "tcp" },
      { host_port: 8025, container_port: 8025, protocol: "tcp" },
    ],
    tags: ["Email", "SMTP", "Testing"],
  },
  {
    id: "nginx",
    name: "Nginx Web Server",
    category: "tool",
    image: "nginx:alpine",
    defaultName: "dev-nginx",
    description: "High performance HTTP web server and reverse proxy.",
    ports: [{ host_port: 8080, container_port: 80, protocol: "tcp" }],
    tags: ["HTTP", "Reverse Proxy", "Static"],
  },
];

export function DevStarters() {
  const { containers, fetchContainers, fetchImages } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const filteredStarters = STARTERS.filter((s) => {
    if (selectedCategory === "all") return true;
    return s.category === selectedCategory;
  });

  const isStarterRunning = (starter: DevStarter) => {
    return containers.some(
      (c) =>
        c.State === "running" &&
        (c.Names?.[0]?.includes(starter.defaultName) || c.Image?.includes(starter.image.split(":")[0]))
    );
  };

  const handleQuickLaunch = async (starter: DevStarter) => {
    setLaunchingId(starter.id);
    toast.loading(`Launching ${starter.name}...`, { id: `starter-${starter.id}` });

    try {
      // 1. Pull image if not already cached
      try {
        await invoke("pull_image", { image: starter.image });
      } catch (err) {
        console.warn("Pull image warning (might already exist):", err);
      }

      // 2. Create and start container
      await invoke("create_and_start_container", {
        args: {
          name: starter.defaultName,
          image: starter.image,
          ports: starter.ports,
          env: starter.env || null,
          volumes: starter.volumes || null,
          restart_policy: "unless-stopped",
        },
      });

      toast.success(`${starter.name} is running!`, { id: `starter-${starter.id}` });
      await fetchContainers();
      await fetchImages();
    } catch (error) {
      console.error(`Failed to launch ${starter.name}:`, error);
      toast.error(`Failed to launch: ${error}`, { id: `starter-${starter.id}` });
    } finally {
      setLaunchingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <RocketLaunchIcon className="h-6 w-6 text-primary" />
          Dev Starters
        </h2>
        <p className="text-muted-foreground text-sm">
          Instantly spin up isolated databases, message brokers, and development tools with single-click configurations.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { id: "all", label: "All Services" },
          { id: "database", label: "Databases" },
          { id: "cache", label: "Caches" },
          { id: "queue", label: "Queues" },
          { id: "tool", label: "Web & Testing" },
        ].map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className="text-xs h-8"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Grid of Starters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStarters.map((starter) => {
          const running = isStarterRunning(starter);
          const isBusy = launchingId === starter.id;

          return (
            <Card key={starter.id} className="flex flex-col justify-between border-border/60 shadow-sm bg-card hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <DatabaseIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{starter.name}</CardTitle>
                      <span className="text-[11px] font-mono text-muted-foreground">{starter.image}</span>
                    </div>
                  </div>
                  {running && (
                    <Badge variant="default" className="bg-green-500/10 text-green-500 border-0 flex items-center gap-1 text-[10px]">
                      <CheckCircleIcon className="h-3 w-3" /> Running
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {starter.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                {/* Port badge readout */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-muted-foreground">Ports:</span>
                  {starter.ports.map((p, i) => (
                    <span key={i} className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/40 text-foreground">
                      {p.host_port}:{p.container_port}
                    </span>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {starter.tags.map((t) => (
                    <span key={t} className="text-[10px] bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => {
                    setSelectedImage(starter.image);
                    setCustomModalOpen(true);
                  }}
                  disabled={isBusy}
                >
                  <SlidersHorizontalIcon className="h-3.5 w-3.5" />
                  Customize...
                </Button>

                <Button
                  size="sm"
                  className="text-xs h-8 gap-1.5"
                  onClick={() => handleQuickLaunch(starter)}
                  disabled={isBusy || running}
                >
                  {isBusy ? (
                    <>
                      <SpinnerGapIcon className="h-3.5 w-3.5 animate-spin" /> Launching...
                    </>
                  ) : running ? (
                    "Active"
                  ) : (
                    <>
                      <PlayIcon className="h-3.5 w-3.5 fill-current" /> 1-Click Launch
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <RunContainerModal
        open={customModalOpen}
        onOpenChange={setCustomModalOpen}
        defaultImage={selectedImage}
      />
    </div>
  );
}
