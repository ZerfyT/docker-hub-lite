# Publishing Docker Lite on Ubuntu Store (Snap & Deb Guide)

This guide provides step-by-step instructions for publishing and distributing **Docker Lite** on Ubuntu using both the **Ubuntu Snap Store** and native **Debian (`.deb`)** packages.

---

## 🛍️ Part 1: Publishing to the Ubuntu Snap Store

The **Snap Store** is the official application store built into Ubuntu (known as *App Center* / *Ubuntu Software*).

### 1. Prerequisites
- An Ubuntu One account ([login.ubuntu.com](https://login.ubuntu.com))
- `snapcraft` installed locally:
  ```bash
  sudo snap install snapcraft --classic
  ```

### 2. Register the Snap Name
Log in to Snapcraft and register your application name:
```bash
snapcraft login
snapcraft register docker-lite
```
*(If `docker-lite` is taken, you can register an alternative name or request it via the Canonical forum).*

### 3. Generate Store Credentials for GitHub Actions
To allow automated publishing from GitHub Actions CI/CD:
1. Export your encrypted login token:
   ```bash
   snapcraft export-login --snaps=docker-lite --channels=edge,beta,candidate,stable snapcraft.token
   ```
2. Open your GitHub repository in your browser:
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `SNAPCRAFT_STORE_CREDENTIALS`
   - Value: Paste the entire content of `snapcraft.token`
3. Delete the local `snapcraft.token` file securely:
   ```bash
   rm snapcraft.token
   ```

### 4. Automated Publishing via GitHub Actions
Whenever you push a version tag (e.g. `v0.2.2`):
```bash
git tag v0.2.2
git push origin v0.2.2
```
The [release.yml](file:///.github/workflows/release.yml) workflow will automatically:
1. Build the `.snap` package using `core22` and GNOME extensions.
2. Publish it to the `candidate` channel on the Snap Store.
3. Attach the `.snap` file to the GitHub Release draft.

### 5. Local Snap Build (Optional)
To test and build the snap locally on your Ubuntu machine:
```bash
snapcraft pack
```
Install the locally built snap:
```bash
sudo snap install docker-lite_0.2.2_amd64.snap --dangerous
```

### 6. The `docker` Interface & Permissions
Because Docker Lite manages the local Docker daemon socket (`/var/run/docker.sock`), users connect the `docker` interface after installing:
```bash
sudo snap connect docker-lite:docker
```
> **Tip for Developers:** You can request **auto-connection** for the `docker` interface on the official [Snapcraft Forum](https://forum.snapcraft.io/c/store-requests) so users do not need to run the manual `snap connect` command!

---

## 📦 Part 2: Debian (`.deb`) Distribution on Ubuntu

### 1. How the `.deb` Package is Configured
Docker Lite is pre-configured in [tauri.conf.json](file:///src-tauri/tauri.conf.json) to generate production Debian packages:
- **Dependencies**: Includes `libwebkit2gtk-4.1-0`, `libayatana-appindicator3-1`, and `librsvg2-common`.
- **AppStream Metainfo**: Bundles [com.nipun.docker-lite.metainfo.xml](file:///src-tauri/resources/com.nipun.docker-lite.metainfo.xml) into `/usr/share/metainfo/`. This allows Ubuntu App Center and GNOME Software to render rich screenshots, descriptions, and feature lists.
- **Desktop Entry**: Integrates into the system application menu with keywords and window grouping.

### 2. Building the `.deb` Locally
```bash
bun run tauri build --bundles deb
```
The compiled package will be placed in:
`src-tauri/target/release/bundle/deb/docker-lite_0.2.2_amd64.deb`

### 3. Installing the `.deb` Package on Ubuntu
Users can install it via:
```bash
sudo apt install ./docker-lite_0.2.2_amd64.deb
```
Or double-click the `.deb` file in Ubuntu Files to open it directly in the **Ubuntu App Center**.

### 4. PPA / APT Repository Distribution (Optional)
If you wish to provide an APT repository or Launchpad PPA:
1. Create a PPA on [Launchpad](https://launchpad.net/).
2. Upload source packages using `dput ppa:your-username/docker-lite ...`.
3. Users can then install and update Docker Lite via standard APT:
   ```bash
   sudo add-apt-repository ppa:your-username/docker-lite
   sudo apt update
   sudo apt install docker-lite
   ```
