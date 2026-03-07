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

// Command to start a container
#[tauri::command]
async fn start_container(state: State<'_, DockerState>, id: String) -> Result<String, String> {
    match state.client.start_container::<String>(&id, None).await {
        Ok(_) => Ok(format!("Container {} started", id)),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    // Connect to the local Docker socket
    let docker = Docker::connect_with_local_defaults().expect("Failed to connect to Docker");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(DockerState { client: docker })
        .invoke_handler(tauri::generate_handler![get_containers, start_container])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
