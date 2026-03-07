// src-tauri/src/main.rs
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use bollard::container::ListContainersOptions;
use bollard::models::ContainerSummary;
use bollard::Docker;
use tauri::State;

// Define a struct to hold our Docker client state
struct DockerState {
    client: Docker,
}

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    total_images: usize,
    volume_storage: String,
    system_health: String,
}

// Command to fetch containers
#[tauri::command]
async fn get_containers(state: State<'_, DockerState>) -> Result<Vec<ContainerSummary>, String> {
    let options = Some(ListContainersOptions::<String> {
        all: true,
        ..Default::default()
    });

    match state.client.list_containers(options).await {
        Ok(containers) => Ok(containers),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch system stats
#[tauri::command]
async fn get_system_info(state: State<'_, DockerState>) -> Result<SystemInfo, String> {
    // Basic health check (if we get here, daemon is up)
    let ping_result = state.client.ping().await;
    let system_health = match ping_result {
        Ok(_) => "Healthy".to_string(),
        Err(_) => "Unhealthy".to_string(),
    };

    // Images
    let images = state
        .client
        .list_images(None::<bollard::image::ListImagesOptions<String>>)
        .await
        .unwrap_or_default();
    let total_images = images.len();

    // Volumes (just hardcode space used for now, as Docker API df is complex via bollard)
    let volumes = state
        .client
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
async fn start_container(state: State<'_, DockerState>, id: String) -> Result<String, String> {
    match state.client.start_container::<String>(&id, None).await {
        Ok(_) => Ok(format!("Container {} started", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to stop a container
#[tauri::command]
async fn stop_container(state: State<'_, DockerState>, id: String) -> Result<String, String> {
    match state.client.stop_container(&id, None).await {
        Ok(_) => Ok(format!("Container {} stopped", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch images
#[tauri::command]
async fn get_images(
    state: State<'_, DockerState>,
) -> Result<Vec<bollard::models::ImageSummary>, String> {
    match state.client.list_images(None::<bollard::image::ListImagesOptions<String>>).await {
        Ok(images) => Ok(images),
        Err(e) => Err(e.to_string()),
    }
}

// Command to remove an image
#[tauri::command]
async fn remove_image(state: State<'_, DockerState>, id: String) -> Result<String, String> {
    match state.client.remove_image(&id, None, None).await {
        Ok(_) => Ok(format!("Image {} removed", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch volumes
#[tauri::command]
async fn get_volumes(
    state: State<'_, DockerState>,
) -> Result<Vec<bollard::models::Volume>, String> {
    match state.client.list_volumes(None::<bollard::volume::ListVolumesOptions<String>>).await {
        Ok(res) => Ok(res.volumes.unwrap_or_default()),
        Err(e) => Err(e.to_string()),
    }
}

// Command to remove a volume
#[tauri::command]
async fn remove_volume(state: State<'_, DockerState>, name: String) -> Result<String, String> {
    match state.client.remove_volume(&name, None).await {
        Ok(_) => Ok(format!("Volume {} removed", name)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch networks
#[tauri::command]
async fn get_networks(
    state: State<'_, DockerState>,
) -> Result<Vec<bollard::models::Network>, String> {
    match state.client.list_networks(None::<bollard::network::ListNetworksOptions<String>>).await {
        Ok(networks) => Ok(networks),
        Err(e) => Err(e.to_string()),
    }
}

// Command to remove a network
#[tauri::command]
async fn remove_network(state: State<'_, DockerState>, id: String) -> Result<String, String> {
    match state.client.remove_network(&id).await {
        Ok(_) => Ok(format!("Network {} removed", id)),
        Err(e) => Err(e.to_string()),
    }
}

// Command to fetch container logs
#[tauri::command]
async fn get_container_logs(state: State<'_, DockerState>, id: String) -> Result<String, String> {
    use futures_util::StreamExt;
    let options = Some(bollard::container::LogsOptions::<String> {
        stdout: true,
        stderr: true,
        tail: "100".to_string(),
        ..Default::default()
    });

    let mut logs_stream = state.client.logs(&id, options);
    let mut all_logs = String::new();

    while let Some(log_result) = logs_stream.next().await {
        match log_result {
            Ok(log) => all_logs.push_str(&log.to_string()),
            Err(e) => return Err(e.to_string()),
        }
    }

    Ok(all_logs)
}

fn main() {
    // Connect to the local Docker socket
    let docker = Docker::connect_with_local_defaults().expect("Failed to connect to Docker");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DockerState { client: docker })
        .invoke_handler(tauri::generate_handler![
            get_containers,
            start_container,
            stop_container,
            get_system_info,
            get_images,
            remove_image,
            get_volumes,
            remove_volume,
            get_networks,
            remove_network,
            get_container_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
