use crate::database::Database;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug)]
pub struct AppState {
    pub db: Arc<Mutex<Database>>,
}

impl AppState {
    pub async fn new() -> crate::error::Result<Self> {
        let db = Database::new().await?;
        Ok(Self {
            db: Arc::new(Mutex::new(db)),
        })
    }
}
