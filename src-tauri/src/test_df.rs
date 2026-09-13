#[tauri::command]
async fn get_docker_df(state: tauri::State<'_, crate::AppState>) -> Result<String, String> {
    match state.docker.df().await {
        Ok(df) => Ok(serde_json::to_string(&df).unwrap_or_else(|_| "{}".to_string())),
        Err(e) => Err(e.to_string()),
    }
}
