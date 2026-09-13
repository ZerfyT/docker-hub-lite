<div align="center">
  <h1>🐳 Docker Lite</h1>
  <p><strong>A lightning-fast, lightweight Docker Desktop alternative built with Tauri, Rust, and React.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white" alt="Tauri" />
    <img src="https://img.shields.io/badge/Rust-🦀-black?logo=rust&logoColor=white" alt="Rust" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

---

## ✨ Features

- 📊 **Dashboard:** Overview of your Docker resources and system information in real-time.
- 📦 **Containers:** List, start, stop, restart, inspect, and remove containers effortlessly.
- 🖼️ **Images:** View, manage, and remove Docker images.
- 💾 **Volumes:** Keep track of and clean up Docker volumes.
- 🌐 **Networks:** Manage your Docker networks.
- 🧹 **System Prune:** Easily clean up unused Docker resources with a single click.
- 📈 **Real-time Stats:** Monitor CPU and memory usage using Recharts and Sysinfo.
- ⚡ **Lightweight & Fast:** Built with Rust and Tauri for minimal memory footprint compared to Electron-based alternatives.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Phosphor Icons](https://phosphoricons.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)

### Backend
- **Framework:** [Tauri v2](https://v2.tauri.app/)
- **Language:** [Rust](https://www.rust-lang.org/)
- **Docker API:** [Bollard](https://github.com/fussybeaver/bollard) (Async Rust Docker API client)
- **Async Runtime:** [Tokio](https://tokio.rs/)
- **System Metrics:** [Sysinfo](https://github.com/GuillaumeGomez/sysinfo)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **[Docker Engine](https://docs.docker.com/engine/install/)** (Make sure the Docker daemon is running and accessible without `sudo`)
- **[Node.js](https://nodejs.org/)** (v18+ recommended)
- **[Bun](https://bun.sh/)** (or npm/yarn/pnpm)
- **[Rust](https://www.rust-lang.org/tools/install)** & Cargo
- **[Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)** (OS-specific dependencies for building Tauri apps)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ZerfyT/docker-hub-lite.git
   cd docker-hub-lite
   ```

2. **Install frontend dependencies:**
   ```bash
   bun install
   ```

3. **Run in development mode:**
   ```bash
   bun run tauri dev
   ```

4. **Build for production:**
   ```bash
   bun run tauri build
   ```

## 📸 Screenshots

*(Add screenshots of your application here)*

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

This project is licensed under the MIT License.

---
<div align="center">
  <i>Built with ❤️ for a better Docker experience.</i>
</div>
