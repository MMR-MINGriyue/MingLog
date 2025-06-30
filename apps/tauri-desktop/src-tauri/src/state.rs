use crate::database::Database;
use crate::sync::WebDAVSyncManager;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug)]
pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub sync_manager: Arc<Mutex<WebDAVSyncManager>>,
}

impl AppState {
    pub async fn new() -> crate::error::Result<Self> {
        let db = Database::new().await?;
        let sync_manager = WebDAVSyncManager::new();
        Ok(Self {
            db: Arc::new(Mutex::new(db)),
            sync_manager: Arc::new(Mutex::new(sync_manager)),
        })
    }
}
