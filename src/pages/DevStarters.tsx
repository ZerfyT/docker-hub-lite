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
  StackIcon,
  HardDrivesIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { containers, fetchContainers, fetchImages } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const filteredStarters = STARTERS.filter((s) => {
    if (selectedCategory === "all") return true;
    return s.category === selectedCategory;
  });

  const getRunningContainer = (starter: DevStarter) => {
    return containers.find(
      (c) =>
        c.State === "running" &&
        (c.Names?.[0]?.includes(starter.defaultName) || c.Image?.includes(starter.image.split(":")[0]))
    );
  };

  const handleQuickLaunch = async (starter: DevStarter) => {
    setLaunchingId(starter.id);
    toast.loading(`Launching ${starter.name}...`, { id: `starter-${starter.id}` });

    try {
      try {
        await invoke("pull_image", { image: starter.image });
      } catch (err) {
        console.warn("Pull image warning (might already exist):", err);
      }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-foreground">
            <RocketLaunchIcon className="h-6 w-6 text-primary" weight="fill" />
            Developer Starters Studio
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            1-Click instant provisioning for isolated databases, caches, message brokers, and developer tooling.
          </p>
        </div>

        <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 w-fit border-border/70">
          {STARTERS.length} curated templates
        </Badge>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 backdrop-blur-xs rounded-xl border border-border/70 w-fit overflow-x-auto max-w-full">
        {[
          { id: "all", label: "All Templates", count: STARTERS.length },
          { id: "database", label: "Databases", count: STARTERS.filter(s => s.category === "database").length },
          { id: "cache", label: "Caches", count: STARTERS.filter(s => s.category === "cache").length },
          { id: "queue", label: "Queues", count: STARTERS.filter(s => s.category === "queue").length },
          { id: "tool", label: "Web & Testing", count: STARTERS.filter(s => s.category === "tool").length },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedCategory === cat.id
                ? "bg-background text-foreground shadow-xs border border-border/60 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <span>{cat.label}</span>
            <span className="text-[10px] opacity-70 font-mono">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Grid of Starters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStarters.map((starter) => {
          const runningContainer = getRunningContainer(starter);
          const isBusy = launchingId === starter.id;

          return (
            <Card
              key={starter.id}
              className={`flex flex-col justify-between border rounded-xl shadow-xs bg-card/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md ${
                runningContainer
                  ? "border-emerald-500/40 hover:border-emerald-500/60"
                  : "border-border/70 hover:border-primary/40"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                      {starter.category === "database" ? (
                        <DatabaseIcon className="h-5 w-5" weight="fill" />
                      ) : starter.category === "cache" ? (
                        <HardDrivesIcon className="h-5 w-5" weight="fill" />
                      ) : (
                        <StackIcon className="h-5 w-5" weight="fill" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">
                        {starter.name}
                      </CardTitle>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {starter.image}
                      </span>
                    </div>
                  </div>

                  {runningContainer && (
                    <button
                      type="button"
                      onClick={() => navigate(`/containers/${runningContainer.Id}`)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors"
                      title="View running container details"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                      <ArrowSquareOutIcon className="w-3 h-3 opacity-70" />
                    </button>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {starter.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                {/* Port badge readout */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-muted-foreground">Port(s):</span>
                  {starter.ports.map((p, i) => (
                    <span
                      key={i}
                      className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded-md border border-border/50 text-foreground"
                    >
                      {p.host_port}:{p.container_port}
                    </span>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {starter.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-[10px] font-normal px-2 py-0.2 border-border/40"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
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
                  Customize
                </Button>

                <Button
                  size="sm"
                  className="text-xs h-8 gap-1.5 bg-primary text-primary-foreground font-medium"
                  onClick={() => handleQuickLaunch(starter)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <>
                      <SpinnerGapIcon className="h-3.5 w-3.5 animate-spin" />
                      Starting...
                    </>
                  ) : runningContainer ? (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-300" weight="fill" />
                      Relaunch
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-3.5 w-3.5 fill-current" />
                      Quick Launch
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
