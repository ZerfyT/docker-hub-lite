// src-tauri/src/main.rs
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bollard::container::ListContainersOptions;
use bollard::models::ContainerSummary;
use bollard::Docker;
use tauri::State;

// Define a struct to hold our system state
struct AppState {
    docker: Docker,
    sys_info: std::sync::Mutex<sysinfo::System>,
    event_stream_started: std::sync::Arc<std::sync::Mutex<bool>>,
}

use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    total_images: usize,
    volume_storage: String,
    system_health: String,
    operating_system: String,
    kernel_version: String,
    server_version: String,
    ncpu: i64,
    mem_total: i64,
    driver: String,
    docker_root_dir: String,
}

#[derive(Serialize, Deserialize)]
struct HostStats {
    cpu: f32,
    memory: f32,
}

// Command to fetch containers
#[tauri::command]
async fn get_containers(state: State<'_, AppState>) -> Result<Vec<ContainerSummary>, String> {
    let options = Some(ListContainersOptions::<String> {
        all: true,
        ..Default::default()
    });

    match state.docker.list_containers(options).await {
        Ok(mut containers) => {
            containers.sort_by(|a, b| {
                let name_a = a
                    .names
                    .as_ref()
                    .and_then(|n| n.first())
                    .unwrap_or(&String::new())
                    .clone();
                let name_b = b
                    .names
                    .as_ref()
                    .and_then(|n| n.first())
                    .unwrap_or(&String::new())
                    .clone();
                name_a.cmp(&name_b)
            });
            Ok(containers)
        }
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch system stats
#[tauri::command]
async fn get_system_info(state: State<'_, AppState>) -> Result<SystemInfo, String> {
    // Basic health check (if we get here, daemon is up)
    let ping_result = state.docker.ping().await;
    let system_health = match ping_result {
        Ok(_) => "Healthy".to_string(),
        Err(_) => "Unhealthy".to_string(),
    };

    // Images
    let images = state
        .docker
        .list_images(None::<bollard::image::ListImagesOptions<String>>)
        .await
        .unwrap_or_default();
    let total_images = images.len();

    // Volumes (just hardcode space used for now)
    let volumes = state
        .docker
        .list_volumes(None::<bollard::volume::ListVolumesOptions<String>>)
        .await;

    let volume_storage = match volumes {
        Ok(res) => format!("Across {} volumes", res.volumes.unwrap_or_default().len()),
        Err(_) => "Error fetching volumes".to_string(),
    };

    // Detailed Info
    let info = state.docker.info().await.map_err(|e| e.to_string())?;

    Ok(SystemInfo {
        total_images,
        volume_storage,
        system_health,
        operating_system: info
            .operating_system
            .unwrap_or_else(|| "Unknown".to_string()),
        kernel_version: info.kernel_version.unwrap_or_else(|| "Unknown".to_string()),
        server_version: info.server_version.unwrap_or_else(|| "Unknown".to_string()),
        ncpu: info.ncpu.unwrap_or(0),
        mem_total: info.mem_total.unwrap_or(0),
        driver: info.driver.unwrap_or_else(|| "Unknown".to_string()),
        docker_root_dir: info
            .docker_root_dir
            .unwrap_or_else(|| "Unknown".to_string()),
    })
}

// Command to start a container
#[tauri::command]
async fn start_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.start_container::<String>(&id, None).await {
        Ok(_) => Ok(format!("Container {} started", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to stop a container
#[tauri::command]
async fn stop_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.stop_container(&id, None).await {
        Ok(_) => Ok(format!("Container {} stopped", id)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn remove_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.remove_container(&id, None).await {
        Ok(_) => Ok(format!("Container {} removed", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to pause a container
#[tauri::command]
async fn pause_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.pause_container(&id).await {
        Ok(_) => Ok(format!("Container {} paused", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to unpause a container
#[tauri::command]
async fn unpause_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.unpause_container(&id).await {
        Ok(_) => Ok(format!("Container {} unpaused", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to restart a container
#[tauri::command]
async fn restart_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.restart_container(&id, None).await {
        Ok(_) => Ok(format!("Container {} restarted", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to inspect a container (returns JSON string)
#[tauri::command]
async fn inspect_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.inspect_container(&id, None).await {
        Ok(info) => Ok(serde_json::to_string(&info).unwrap_or_else(|_| "{}".to_string())),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch one-shot stats
#[tauri::command]
async fn get_container_stats_once(
    state: State<'_, AppState>,
    id: String,
) -> Result<String, String> {
    use futures_util::StreamExt;
    let options = Some(bollard::container::StatsOptions {
        stream: false,
        one_shot: true,
    });

    let mut stats_stream = state.docker.stats(&id, options);

    if let Some(result) = stats_stream.next().await {
        match result {
            Ok(stats) => Ok(serde_json::to_string(&stats).unwrap_or_else(|_| "{}".to_string())),
            Err(e) => Err(e.to_string()),
        }
    } else {
        Err("Failed to fetch stats".to_string())
    }
}

// Command to execute command inside a container
#[tauri::command]
async fn exec_command(
    state: State<'_, AppState>,
    id: String,
    cmd: Vec<String>,
) -> Result<String, String> {
    use futures_util::StreamExt;
    let config = bollard::exec::CreateExecOptions {
        cmd: Some(cmd),
        attach_stdout: Some(true),
        attach_stderr: Some(true),
        ..Default::default()
    };

    match state.docker.create_exec(&id, config).await {
        Ok(exec) => match state.docker.start_exec(&exec.id, None).await {
            Ok(bollard::exec::StartExecResults::Attached { mut output, .. }) => {
                let mut result = String::new();
                while let Some(Ok(msg)) = output.next().await {
                    result.push_str(&msg.to_string());
                }
                Ok(result)
            }
            Ok(bollard::exec::StartExecResults::Detached) => Ok("Detached".to_string()),
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch images
#[tauri::command]
async fn get_images(
    state: State<'_, AppState>,
) -> Result<Vec<bollard::models::ImageSummary>, String> {
    match state
        .docker
        .list_images(None::<bollard::image::ListImagesOptions<String>>)
        .await
    {
        Ok(mut images) => {
            // Sort by created time descending (newest first)
            images.sort_by_key(|b| std::cmp::Reverse(b.created));
            Ok(images)
        }
        Err(e) => Err(e.to_string()),
    }
}

// Command to remove an image
#[tauri::command]
async fn remove_image(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.remove_image(&id, None, None).await {
        Ok(_) => Ok(format!("Image {} removed", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch volumes
#[tauri::command]
async fn get_volumes(state: State<'_, AppState>) -> Result<Vec<bollard::models::Volume>, String> {
    match state
        .docker
        .list_volumes(None::<bollard::volume::ListVolumesOptions<String>>)
        .await
    {
        Ok(res) => {
            let mut volumes = res.volumes.unwrap_or_default();
            volumes.sort_by(|a, b| a.name.cmp(&b.name));
            Ok(volumes)
        }
        Err(e) => Err(e.to_string()),
    }
}

// Command to remove a volume
#[tauri::command]
async fn remove_volume(state: State<'_, AppState>, name: String) -> Result<String, String> {
    match state.docker.remove_volume(&name, None).await {
        Ok(_) => Ok(format!("Volume {} removed", name)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch networks
#[tauri::command]
async fn get_networks(state: State<'_, AppState>) -> Result<Vec<bollard::models::Network>, String> {
    match state
        .docker
        .list_networks(None::<bollard::network::ListNetworksOptions<String>>)
        .await
    {
        Ok(mut networks) => {
            // Sort alphabetically by network name safely
            networks.sort_by(|a, b| a.name.cmp(&b.name));
            Ok(networks)
        }
        Err(e) => Err(e.to_string()),
    }
}

// Command to remove a network
#[tauri::command]
async fn remove_network(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.remove_network(&id).await {
        Ok(_) => Ok(format!("Network {} removed", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch container logs
#[tauri::command]
async fn get_container_logs(state: State<'_, AppState>, id: String) -> Result<String, String> {
    use futures_util::StreamExt;
    let options = Some(bollard::container::LogsOptions::<String> {
        stdout: true,
        stderr: true,
        tail: "100".to_string(),
        ..Default::default()
    });

    let mut logs_stream = state.docker.logs(&id, options);
    let mut all_logs = String::new();

    while let Some(log_result) = logs_stream.next().await {
        match log_result {
            Ok(log) => all_logs.push_str(&log.to_string()),
            Err(e) => return Err(e.to_string()),
        }
    }

    Ok(all_logs)
}

// Command to fetch host system stats
#[tauri::command]
fn get_host_stats(state: State<'_, AppState>) -> Result<HostStats, String> {
    let mut sys = state.sys_info.lock().map_err(|e| e.to_string())?;

    // Refresh CPU and memory info
    sys.refresh_cpu_all();
    sys.refresh_memory();

    Ok(HostStats {
        cpu: sys.global_cpu_usage(),
        memory: (sys.used_memory() as f32 / sys.total_memory() as f32) * 100.0,
    })
}

#[tauri::command]
async fn get_docker_daemon_state(state: State<'_, AppState>) -> Result<String, String> {
    match state.docker.info().await {
        Ok(_) => Ok("Running".to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn kill_container(state: State<'_, AppState>, id: String) -> Result<String, String> {
    match state.docker.kill_container::<String>(&id, None).await {
        Ok(_) => Ok(format!("Container {} killed", id)),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn commit_container(id: String) -> Result<String, String> {
    let output = tokio::process::Command::new("docker")
        .args(["commit", &id])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn quick_run_image(id: String) -> Result<String, String> {
    let output = tokio::process::Command::new("docker")
        .args(["run", "-d", &id])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
async fn backup_volume(name: String, path: String) -> Result<String, String> {
    let path_obj = std::path::Path::new(&path);
    let parent = path_obj.parent().ok_or("Invalid path")?.to_string_lossy();
    let filename = path_obj
        .file_name()
        .ok_or("Invalid filename")?
        .to_string_lossy();

    let output = tokio::process::Command::new("docker")
        .args([
            "run",
            "--rm",
            "-v",
            &format!("{}:/volume", name),
            "-v",
            &format!("{}:/backup", parent),
            "alpine",
            "tar",
            "-czf",
            &format!("/backup/{}", filename),
            "-C",
            "/volume",
            ".",
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Volume backed up to {}", path))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

async fn raw_system_prune() -> Result<String, String> {
    let output = tokio::process::Command::new("docker")
        .args(["system", "prune", "-af", "--volumes"])
        .output()
        .await;

    match output {
        Ok(o) => {
            if o.status.success() {
                Ok(String::from_utf8_lossy(&o.stdout).into_owned())
            } else {
                Err(String::from_utf8_lossy(&o.stderr).into_owned())
            }
        }
        Err(e) => Err(format!("Failed to execute docker cli fallback: {}", e)),
    }
}

#[tauri::command]
async fn system_prune(state: State<'_, AppState>) -> Result<String, String> {
    let mut success_msgs = Vec::new();

    // Containers
    if state
        .docker
        .prune_containers(None::<bollard::container::PruneContainersOptions<String>>)
        .await
        .is_err()
    {
        return raw_system_prune().await;
    } else {
        success_msgs.push("Containers pruned");
    }

    // Images
    if state
        .docker
        .prune_images(None::<bollard::image::PruneImagesOptions<String>>)
        .await
        .is_err()
    {
        return raw_system_prune().await;
    } else {
        success_msgs.push("Images pruned");
    }

    // Networks
    if state
        .docker
        .prune_networks(None::<bollard::network::PruneNetworksOptions<String>>)
        .await
        .is_err()
    {
        return raw_system_prune().await;
    } else {
        success_msgs.push("Networks pruned");
    }

    // Volumes
    if state
        .docker
        .prune_volumes(None::<bollard::volume::PruneVolumesOptions<String>>)
        .await
        .is_err()
    {
        return raw_system_prune().await;
    } else {
        success_msgs.push("Volumes pruned");
    }

    Ok(success_msgs.join(", "))
}

#[tauri::command]
async fn get_daemon_json() -> Result<String, String> {
    let path = "/etc/docker/daemon.json"; // Basic linux path
    match std::fs::read_to_string(path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Could not read {}: {}", path, e)),
    }
}

#[tauri::command]
async fn edit_daemon_json_external() -> Result<String, String> {
    let script = r#"
        if command -v gnome-terminal >/dev/null 2>&1; then
            gnome-terminal -- sudo nano /etc/docker/daemon.json
        elif command -v konsole >/dev/null 2>&1; then
            konsole -e sudo nano /etc/docker/daemon.json
        elif command -v x-terminal-emulator >/dev/null 2>&1; then
            x-terminal-emulator -e "sudo nano /etc/docker/daemon.json"
        elif command -v xterm >/dev/null 2>&1; then
            xterm -e "sudo nano /etc/docker/daemon.json"
        else
            exit 1
        fi
    "#;
    
    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg(script)
        .spawn();

    match output {
        Ok(_) => Ok("Terminal opened".to_string()),
        Err(e) => Err(e.to_string()),
    }
}
#[tauri::command]
async fn get_docker_config() -> Result<String, String> {
    let mut path = dirs::home_dir().ok_or("Could not find home directory")?;
    path.push(".docker");
    path.push("config.json");
    
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Could not read {}: {}", path.display(), e)),
    }
}

#[tauri::command]
async fn start_event_stream(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut started = state.event_stream_started.lock().map_err(|e| e.to_string())?;
    if *started {
        return Ok(());
    }
    *started = true;
    
    let docker = state.docker.clone();
    let started_clone = std::sync::Arc::clone(&state.event_stream_started);
    tauri::async_runtime::spawn(async move {
        use futures_util::StreamExt;
        use tauri::Emitter;
        let mut stream = docker.events(None::<bollard::system::EventsOptions<String>>);
        while let Some(event_res) = stream.next().await {
            if let Ok(event) = event_res {
                let _ = app.emit("docker-event", event);
            }
        }
        if let Ok(mut flag) = started_clone.lock() {
            *flag = false;
        }
    });
    Ok(())
}

fn main() {
    // Connect to the local Docker socket with fallback
    let docker = Docker::connect_with_local_defaults().unwrap_or_else(|e| {
        eprintln!("Warning: Failed to connect to Docker with local defaults: {}. Trying socket...", e);
        Docker::connect_with_socket_defaults().unwrap_or_else(|_| {
            Docker::connect_with_http_defaults().expect("Failed to initialize Docker client")
        })
    });

    // Initialize sysinfo
    let mut sys = System::new_all();
    sys.refresh_cpu_all(); // First refresh to get a baseline

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            docker,
            sys_info: std::sync::Mutex::new(sys),
            event_stream_started: std::sync::Arc::new(std::sync::Mutex::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            get_containers,
            start_container,
            stop_container,
            remove_container,
            pause_container,
            unpause_container,
            restart_container,
            inspect_container,
            get_container_stats_once,
            exec_command,
            get_system_info,
            get_images,
            remove_image,
            get_volumes,
            remove_volume,
            get_networks,
            remove_network,
            get_container_logs,
            get_host_stats,
            get_docker_daemon_state,
            get_docker_df,
            kill_container,
            commit_container,
            quick_run_image,
            backup_volume,
            system_prune,
            get_daemon_json,
            edit_daemon_json_external,
            start_event_stream,
            get_docker_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn get_docker_df(state: tauri::State<'_, AppState>) -> Result<String, String> {
    match state.docker.df().await {
        Ok(df) => Ok(serde_json::to_string(&df).unwrap_or_else(|_| "{}".to_string())),
        Err(e) => Err(e.to_string()),
    }
}
