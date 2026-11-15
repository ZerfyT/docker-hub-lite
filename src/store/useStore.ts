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

interface AppState {
  // Global Poll Interval Controller
  isPolling: boolean;
  setIsPolling: (isPolling: boolean) => void;

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

  // Color Theme
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
  theme: string;
  setTheme: (theme: string) => void;

  // Prune
  systemPrune: () => Promise<string>;

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
  mode: (localStorage.getItem("docker-lite-mode") as "light" | "dark") || "dark",
  setMode: (mode) => {
    localStorage.setItem("docker-lite-mode", mode);
    set({ mode });
  },
  theme: localStorage.getItem("docker-lite-theme") || "zinc",
  setTheme: (theme) => {
    localStorage.setItem("docker-lite-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
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
