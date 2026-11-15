import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Created: number;
  Ports?: { PrivatePort: number; PublicPort?: number; Type: string; IP?: string }[];
  NetworkSettings?: { Networks: Record<string, { IPAddress: string }> };
  Labels?: Record<string, string> | null;
}

export interface SystemInfo {
  total_images: number;
  volume_storage: string;
  system_health: string;
  operating_system: string;
  kernel_version: string;
  server_version: string;
  ncpu: number;
  mem_total: number;
  driver: string;
  docker_root_dir: string;
}

export interface ImageSummary {
  Id: string;
  RepoTags: string[];
  Size: number;
  Created: number;
  Containers: number;
}

export interface NetworkSummary {
  Id: string;
  Name: string;
  Driver: string;
  Scope: string;
}

export interface VolumeSummary {
  Name: string;
  Driver: string;
  Mountpoint: string;
  CreatedAt?: string;
  Labels: Record<string, string> | null;
}

export interface HostStatsPoint {
  time: string;
  cpu: number;
  memory: number;
}

interface AppState {
  // Global Poll Interval Controller
  isPolling: boolean;
  setIsPolling: (isPolling: boolean) => void;

  // Host Stats History (Persistent across route changes)
  hostStatsHistory: HostStatsPoint[];
  latestCpu: number;
  latestMemory: number;
  fetchHostStats: () => Promise<void>;

  // Docker State
  dockerState: string;
  dockerStateError: string;
  fetchDockerState: () => Promise<void>;

  // System Info
  systemInfo: SystemInfo | null;
  fetchSystemInfo: () => Promise<void>;

  // System DF
  systemDf: any | null;
  fetchSystemDf: () => Promise<void>;

  // Containers
  containers: Container[];
  fetchContainers: () => Promise<void>;

  // Images
  images: ImageSummary[];
  fetchImages: () => Promise<void>;

  // Networks
  networks: NetworkSummary[];
  fetchNetworks: () => Promise<void>;

  // Volumes
  volumes: VolumeSummary[];
  fetchVolumes: () => Promise<void>;

  // Fetch all background Data
  fetchAllData: () => Promise<void>;
  fetchFastData: () => Promise<void>;

  // System & Application Settings
  pollingInterval: number;
  setPollingInterval: (ms: number) => void;
  enableTelemetry: boolean;
  setEnableTelemetry: (enabled: boolean) => void;
  confirmDestructive: boolean;
  setConfirmDestructive: (enabled: boolean) => void;
  containerShell: string;
  setContainerShell: (shell: string) => void;
  defaultLogTail: number;
  setDefaultLogTail: (lines: number) => void;

  // Color Scheme
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;

  // Prune
  systemPrune: () => Promise<string>;
  executeCustomPrune: (params: {
    target: "system" | "image" | "container" | "volume" | "builder" | "network";
    all: boolean;
    volumes: boolean;
    until?: string;
    label?: string;
    label_not?: string;
    keep_storage?: string;
  }) => Promise<string>;

  // Daemon JSON
  daemonJson: string | null;
  daemonJsonError: string | null;
  fetchDaemonJson: () => Promise<void>;
  editDaemonJsonExternal: () => Promise<void>;

  // Docker Config
  dockerConfig: any | null;
  fetchDockerConfig: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isPolling: true,
  setIsPolling: (isPolling) => set({ isPolling }),

  hostStatsHistory: Array.from({ length: 60 }).map((_, i) => ({
    time: new Date(Date.now() - (60 - i) * 1000).toLocaleTimeString([], { second: "2-digit" }),
    cpu: 0,
    memory: 0,
  })),
  latestCpu: 0,
  latestMemory: 0,
  fetchHostStats: async () => {
    try {
      const stats = await invoke<{ cpu: number; memory: number }>("get_host_stats");
      const cpuVal = Math.round(stats.cpu);
      const memVal = Math.round(stats.memory);
      set((state) => {
        const next = [...state.hostStatsHistory.slice(1)];
        next.push({
          time: new Date().toLocaleTimeString([], { second: "2-digit" }),
          cpu: cpuVal,
          memory: memVal,
        });
        return {
          hostStatsHistory: next,
          latestCpu: cpuVal,
          latestMemory: memVal,
        };
      });
    } catch (e) {
      console.error("Failed to fetch host stats in background store:", e);
    }
  },

  mode: (localStorage.getItem("docker-lite-mode") as "light" | "dark") || "dark",
  setMode: (mode) => {
    localStorage.setItem("docker-lite-mode", mode);
    set({ mode });
  },

  pollingInterval: parseInt(localStorage.getItem("docker-lite-polling-interval") || "4000", 10),
  setPollingInterval: (pollingInterval) => {
    localStorage.setItem("docker-lite-polling-interval", pollingInterval.toString());
    set({ pollingInterval });
  },

  enableTelemetry: localStorage.getItem("docker-lite-telemetry") !== "false",
  setEnableTelemetry: (enableTelemetry) => {
    localStorage.setItem("docker-lite-telemetry", enableTelemetry ? "true" : "false");
    set({ enableTelemetry });
  },

  confirmDestructive: localStorage.getItem("docker-lite-confirm-destructive") !== "false",
  setConfirmDestructive: (confirmDestructive) => {
    localStorage.setItem("docker-lite-confirm-destructive", confirmDestructive ? "true" : "false");
    set({ confirmDestructive });
  },

  containerShell: localStorage.getItem("docker-lite-shell") || "default",
  setContainerShell: (containerShell) => {
    localStorage.setItem("docker-lite-shell", containerShell);
    set({ containerShell });
  },

  defaultLogTail: parseInt(localStorage.getItem("docker-lite-log-tail") || "150", 10),
  setDefaultLogTail: (defaultLogTail) => {
    localStorage.setItem("docker-lite-log-tail", defaultLogTail.toString());
    set({ defaultLogTail });
  },

  dockerState: "Disconnected",
  dockerStateError: "",
  fetchDockerState: async () => {
    try {
      const state = await invoke<string>("get_docker_daemon_state");
      set({ dockerState: state, dockerStateError: "" });
    } catch (error) {
      set({ dockerState: "Disconnected", dockerStateError: error as string });
      console.error("Failed to fetch docker state:", error);
    }
  },

  systemInfo: null,
  fetchSystemInfo: async () => {
    try {
      const info = await invoke<SystemInfo>("get_system_info");
      set({ systemInfo: info });
    } catch (error) {
      console.error("Failed to fetch system info:", error);
    }
  },

  systemDf: null,
  fetchSystemDf: async () => {
    try {
      const rawDf = await invoke<string>("get_docker_df");
      const df = JSON.parse(rawDf);
      set({ systemDf: df });
    } catch (error) {
      console.error("Failed to fetch system df:", error);
    }
  },

  containers: [],
  fetchContainers: async () => {
    try {
      const containers = await invoke<Container[]>("get_containers");
      set({ containers: containers || [] });
    } catch (error) {
      console.error("Failed to fetch containers:", error);
    }
  },

  images: [],
  fetchImages: async () => {
    try {
      const images = await invoke<ImageSummary[]>("get_images");
      set({ images: images || [] });
    } catch (error) {
      console.error("Failed to fetch images:", error);
    }
  },

  networks: [],
  fetchNetworks: async () => {
    try {
      const networks = await invoke<NetworkSummary[]>("get_networks");
      set({ networks: networks || [] });
    } catch (error) {
      console.error("Failed to fetch networks:", error);
    }
  },

  volumes: [],
  fetchVolumes: async () => {
    try {
      const volumes = await invoke<VolumeSummary[]>("get_volumes");
      set({ volumes: volumes || [] });
    } catch (error) {
      console.error("Failed to fetch volumes:", error);
    }
  },

  fetchAllData: async () => {
    const { fetchDockerState, fetchSystemInfo, fetchSystemDf, fetchContainers, fetchImages, fetchNetworks, fetchVolumes } = get();
    await Promise.allSettled([
      fetchDockerState(),
      fetchSystemInfo(),
      fetchSystemDf(),
      fetchContainers(),
      fetchImages(),
      fetchNetworks(),
      fetchVolumes()
    ]);
  },

  fetchFastData: async () => {
    const { fetchDockerState, fetchContainers, fetchImages, fetchNetworks, fetchVolumes } = get();
    await Promise.allSettled([
      fetchDockerState(),
      fetchContainers(),
      fetchImages(),
      fetchNetworks(),
      fetchVolumes()
    ]);
  },

  systemPrune: async () => {
    try {
      const result = await invoke<string>("system_prune");
      get().fetchAllData(); // refresh data after prune
      return result;
    } catch (error) {
      console.error("Failed to prune system:", error);
      throw error;
    }
  },

  executeCustomPrune: async (params) => {
    try {
      const result = await invoke<string>("execute_custom_prune", { params });
      get().fetchAllData();
      return result;
    } catch (error) {
      console.error("Failed to execute custom prune:", error);
      throw error;
    }
  },

  daemonJson: null,
  daemonJsonError: null,
  fetchDaemonJson: async () => {
    try {
      const json = await invoke<string>("get_daemon_json");
      set({ daemonJson: json, daemonJsonError: null });
    } catch (error) {
      set({ daemonJson: null, daemonJsonError: error as string });
    }
  },

  editDaemonJsonExternal: async () => {
    try {
      await invoke("edit_daemon_json_external");
    } catch (error) {
      console.error("Failed to open external editor:", error);
      throw error;
    }
  },

  dockerConfig: null,
  fetchDockerConfig: async () => {
    try {
      const configStr = await invoke<string>("get_docker_config");
      set({ dockerConfig: JSON.parse(configStr) });
    } catch (error) {
      console.error("Failed to fetch docker config:", error);
      set({ dockerConfig: null });
    }
  }
}));
