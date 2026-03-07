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
            get_system_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
