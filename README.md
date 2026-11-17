<div align="center">
  <h1>🐳 Docker Lite</h1>
  <p><strong>A lightning-fast, ultra-lightweight Docker desktop client and container studio built with Tauri v2, Rust, and React 19.</strong></p>

  <p>
    <a href="https://github.com/ZerfyT/docker-hub-lite/releases"><img src="https://img.shields.io/badge/version-0.2.0-blue.svg?style=flat-square" alt="Version 0.2.0" /></a>
    <img src="https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white&style=flat-square" alt="Tauri v2" />
    <img src="https://img.shields.io/badge/Rust-2021-black?logo=rust&logoColor=white&style=flat-square" alt="Rust" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black&style=flat-square" alt="React 19" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss&logoColor=white&style=flat-square" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="MIT License" />
  </p>
</div>

---

## 🌟 What is Docker Lite?

**Docker Lite** is designed as a modern, high-performance alternative to resource-heavy Electron-based container management tools. Powered by a native **Rust (Tauri v2)** backend and an optimized **React 19** frontend, Docker Lite delivers real-time Docker engine observability and container orchestration while consuming only a fraction of system RAM.

---

## ✨ Features

- ⚡ **Ultra-Low Memory Footprint:** 
  - Rust backend leverages selective `sysinfo` polling, avoiding scanning of unwanted OS process tables and disks.
  - Release binaries built with Link-Time Optimization (`lto = true`), single codegen units, and symbol stripping.
  - Frontend bundle code-splitting and dynamic `React.lazy()` loading keeps initial heap allocation minimal (~328 kB entry bundle).
- 📊 **Real-time Host Telemetry:**
  - 1-second sampled CPU and RAM hardware utilization graph with persistent history across page navigations.
  - Zero-lag decoupled state selectors preventing unnecessary UI re-render cycles.
- 📦 **Container Workloads Studio:**
  - Instant start, stop, restart, pause, unpause, kill, commit, and inspect containers.
  - Interactive terminal shell exec and live streaming container logs with tail configuration.
- 🔍 **Smart Online Image Puller:**
  - Real-time Docker Hub search with tag auto-completion and suggestion dropdown.
  - Live layer-by-layer progress visualization for pulls.
- 🧹 **Targeted Storage Cleanup & Pruning:**
  - Dedicated cleanup actions with confirmation dialogs for Images, Volumes, Build Cache, Stopped Containers, and Networks.
  - Instant space reclamation metrics via `docker system df`.
- 🌐 **Interactive Network Topology:**
  - Visual node map showing connected containers, subnets, and virtual bridge networks powered by XYFlow (lazy loaded on demand).
- 🚀 **Developer Starters Studio:**
  - 1-click instant provisioning for PostgreSQL, Redis, MongoDB, MySQL, RabbitMQ, Mailpit (local SMTP), and Nginx.
- 🎨 **Modern Eye-Friendly UI/UX:**
  - Clean light and dark color schemes built with OKLCH color spaces, high-contrast typography, and smooth transitions.
  - Responsive window geometry (`1320 x 860`) with smart constraints for laptops, 1080p, 1440p, and 4K screens.
- ⚙️ **Comprehensive Settings & Diagnostics:**
  - Engine configuration inspector, direct `daemon.json` external editor trigger, and built-in Help & Info documentation.

---

## 🛠️ Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                 React 19 Frontend (Vite)                    │
│   Tailwind CSS v4 • Radix UI • Phosphor Icons • Recharts   │
│                 Zustand (Selective Subscriptions)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Tauri IPC / Events
┌──────────────────────────────┴──────────────────────────────┐
│                    Tauri v2 (Rust Backend)                  │
│       Tokio Async • Bollard (Docker Engine API Client)      │
│                Targeted Sysinfo • Auto-updater              │
└──────────────────────────────┬──────────────────────────────┘
                               │ Unix Socket / Named Pipe
┌──────────────────────────────┴──────────────────────────────┐
│                      Docker Daemon                          │
└─────────────────────────────────────────────────────────────┘
```

### Frontend
- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite](https://vitejs.dev/) with Rollup chunk splitting
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + CSS Variables
- **Components:** [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Phosphor Icons](https://phosphoricons.com/)
- **Charts & Graphs:** [Recharts](https://recharts.org/) & [@xyflow/react](https://reactflow.dev/)
- **State:** [Zustand](https://zustand-demo.pmnd.rs/) with scoped selector slices

### Backend
- **Framework:** [Tauri v2](https://v2.tauri.app/)
- **Language:** [Rust (Edition 2021)](https://www.rust-lang.org/)
- **Docker Client:** [Bollard](https://github.com/fussybeaver/bollard)
- **Async Runtime:** [Tokio](https://tokio.rs/)
- **System Metrics:** [Sysinfo](https://github.com/GuillaumeGomez/sysinfo)

---

## 💻 Supported Platforms

Docker Lite provides native builds and installers across major operating systems:

| Platform | Format / Bundles | Minimum Version |
| :--- | :--- | :--- |
| **Linux (Ubuntu / Debian / Fedora / Arch)** | `.deb`, `.AppImage` | WebKit2GTK 4.1+ |
| **macOS (Apple Silicon & Intel)** | `.dmg`, `.app` | macOS 10.15+ (Catalina) |
| **Windows** | `.exe` (NSIS Installer) | Windows 10/11 (WebView2) |

---

## 🚀 Getting Started

### Prerequisites

1. **Docker Engine**: Ensure Docker daemon is installed and running:
   ```bash
   docker info
   ```
   *(Ensure your user has permission to connect without sudo, e.g., added to the `docker` user group on Linux).*
2. **Node / Bun**: [Bun](https://bun.sh/) (recommended) or Node.js 18+
3. **Rust Toolchain**: [Rust & Cargo](https://www.rust-lang.org/tools/install) (stable)
4. **Tauri Prerequisites**: Refer to [Tauri v2 Prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS (e.g., `libwebkit2gtk-4.1-dev` on Linux).

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ZerfyT/docker-hub-lite.git
   cd docker-hub-lite
   ```

2. **Install frontend dependencies:**
   ```bash
   bun install
   ```

3. **Start in development mode:**
   ```bash
   bun run tauri dev
   ```

### Production Build

To compile a release build for your current operating system:
```bash
bun run tauri build
```
The compiled binaries and installers will be located in:
- Linux: `src-tauri/target/release/bundle/deb/` or `bundle/appimage/`
- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/nsis/`

---

## 🤖 CI/CD Automation

Docker Lite includes an automated GitHub Actions pipeline ([.github/workflows/release.yml](.github/workflows/release.yml)) that:
- Runs cross-platform builds on `ubuntu-22.04`, `macos-latest`, and `windows-latest`.
- Compiles production release bundles with automated Rust caching.
- Uploads workflow artifacts on every push to `main` and pull requests.
- Automatically generates draft GitHub releases when version tags (`v*`) are pushed.

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!
Feel free to open an issue or submit a pull request.

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).
