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
}

use serde::{Deserialize, Serialize};
use sysinfo::System;

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    total_images: usize,
    volume_storage: String,
    system_health: String,
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
        Ok(containers) => Ok(containers),
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

    // Volumes (just hardcode space used for now, as Docker API df is complex via bollard)
    let volumes = state
        .docker
        .list_volumes(None::<bollard::volume::ListVolumesOptions<String>>)
        .await;

    let volume_storage = match volumes {
        Ok(res) => format!("Across {} volumes", res.volumes.unwrap_or_default().len()),
        Err(_) => "Error fetching volumes".to_string(),
    };

    Ok(SystemInfo {
        total_images,
        volume_storage,
        system_health,
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
        Ok(images) => Ok(images),
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
        Ok(res) => Ok(res.volumes.unwrap_or_default()),
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
        Ok(networks) => Ok(networks),
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

fn main() {
    // Connect to the local Docker socket
    let docker = Docker::connect_with_local_defaults().expect("Failed to connect to Docker");

    // Initialize sysinfo
    let mut sys = System::new_all();
    sys.refresh_cpu_all(); // First refresh to get a baseline

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            docker,
            sys_info: std::sync::Mutex::new(sys),
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
