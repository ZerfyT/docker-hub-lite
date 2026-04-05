import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface Container {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
}

export interface SystemInfo {
  total_images: number;
  volume_storage: string;
  system_health: string;
}

export interface ImageSummary {
  Id: string;
  RepoTags: string[];
  Size: number;
  Created: number;
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

  // Theme
  theme: string;
  setTheme: (theme: string) => void;
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
}

export const useStore = create<AppState>((set, get) => ({
  isPolling: true,
  setIsPolling: (isPolling) => set({ isPolling }),
  theme: localStorage.getItem("docker-lite-theme") || "zinc",
  setTheme: (theme) => {
    localStorage.setItem("docker-lite-theme", theme);
    set({ theme });
  },
  mode: (localStorage.getItem("docker-lite-mode") as "light" | "dark") || "dark",
  setMode: (mode) => {
    localStorage.setItem("docker-lite-mode", mode);
    set({ mode });
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
    const { fetchDockerState, fetchSystemInfo, fetchContainers, fetchImages, fetchNetworks, fetchVolumes } = get();
    await Promise.allSettled([
      fetchDockerState(),
      fetchSystemInfo(),
      fetchContainers(),
      fetchImages(),
      fetchNetworks(),
      fetchVolumes()
    ]);
  }
}));
