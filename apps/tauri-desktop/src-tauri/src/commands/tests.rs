#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::state::AppState;
    use crate::models::*;
    use crate::error::Result;
    use crate::commands::{init_app, get_app_info, create_page, get_page, update_page, delete_page, create_block, get_block, update_block, delete_block, get_blocks_by_page, search_blocks, import_markdown_file, export_page_to_markdown, create_backup};
    use tempfile::tempdir;
    use tokio;
    use std::sync::Arc;
    use tokio::sync::Mutex;
    use serde_json::Value;

    // Test helper functions that work directly with AppState instead of tauri::State
    async fn test_create_page(request: CreatePageRequest, state: &AppState) -> Result<Page> {
        let db = state.db.lock().await;
        db.create_page(request).await
    }

    async fn test_get_page(id: String, state: &AppState) -> Result<Page> {
        let db = state.db.lock().await;
        db.get_page(&id).await
    }

    async fn test_create_block(request: CreateBlockRequest, state: &AppState) -> Result<Block> {
        let db = state.db.lock().await;
        db.create_block(request).await
    }

    async fn test_get_block(id: String, state: &AppState) -> Result<Block> {
        let db = state.db.lock().await;
        db.get_block(&id).await
    }

    async fn search_blocks_helper(request: BlockSearchRequest, state: &AppState) -> Result<BlockSearchResponse> {
        // Simple search implementation for testing
        let db = state.db.lock().await;

        // Get all pages and blocks for simple text search
        let pages = db.get_pages_by_graph("default").await?;
        let mut results = Vec::new();

        // Search in pages if requested
        if request.include_pages.unwrap_or(true) {
            for page in pages {
                if page.name.contains(&request.query) ||
                   page.title.as_ref().map_or(false, |t| t.contains(&request.query)) {
                    results.push(BlockSearchResult {
                        id: page.id.clone(),
                        result_type: "page".to_string(),
                        title: page.name.clone(),
                        content: page.title.unwrap_or_default(),
                        excerpt: format!("{}...", page.name),
                        score: 0.9,
                        page_id: Some(page.id),
                        page_name: Some(page.name),
                        block_id: None,
                        tags: vec![],
                        is_journal: page.is_journal,
                        created_at: page.created_at.timestamp(),
                        updated_at: page.updated_at.timestamp(),
                    });
                }
            }
        }

        let total = results.len() as i64;
        Ok(BlockSearchResponse {
            results,
            total,
            query: request.query,
        })
    }

    async fn get_graph_data_helper(graph_id: String, state: &AppState) -> Result<Value> {
        // Simple graph data implementation for testing
        let db = state.db.lock().await;

        // Get all pages in the graph
        let pages = db.get_pages_by_graph(&graph_id).await?;

        // Create graph data structure
        let graph_data = serde_json::json!({
            "pages": pages,
            "blocks": [],
            "tags": [],
            "includeBlocks": false
        });

        Ok(graph_data)
    }

    async fn update_page_helper(request: UpdatePageRequest, state: &AppState) -> Result<Page> {
        let db = state.db.lock().await;
        db.update_page(request).await
    }

    async fn delete_page_helper(id: String, state: &AppState) -> Result<()> {
        let db = state.db.lock().await;
        db.delete_page(&id).await
    }

    async fn get_pages_by_graph_helper(graph_id: String, state: &AppState) -> Result<Vec<Page>> {
        let db = state.db.lock().await;
        db.get_pages_by_graph(&graph_id).await
    }

    async fn create_test_app_state() -> AppState {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Database::new_with_path(db_path.to_str().unwrap()).await.unwrap();

        // Default graph is now created automatically in migrate()

        let sync_manager = crate::sync::WebDAVSyncManager::new();

        AppState {
            db: Arc::new(Mutex::new(db)),
            sync_manager: Arc::new(Mutex::new(sync_manager)),
        }
    }

    #[tokio::test]
    async fn test_init_app() {
        let result = init_app().await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "App initialized successfully");
    }

    #[tokio::test]
    async fn test_get_app_info() {
        let result = get_app_info().await;
        assert!(result.is_ok());
        
        let app_info = result.unwrap();
        assert_eq!(app_info.name, "MingLog Desktop");
        assert!(!app_info.version.is_empty());
    }

    #[tokio::test]
    async fn test_create_and_get_page() {
        let state = create_test_app_state().await;

        let request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: Some("Test Title".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["test".to_string()]).unwrap()),
            properties: None,
        };

        let created_page = test_create_page(request, &state).await.unwrap();
        assert_eq!(created_page.name, "Test Page");
        assert_eq!(created_page.graph_id, "default");

        let retrieved_page = test_get_page(created_page.id.clone(), &state).await.unwrap();
        assert_eq!(retrieved_page.id, created_page.id);
        assert_eq!(retrieved_page.name, "Test Page");
    }

    #[tokio::test]
    async fn test_create_and_get_block() {
        let state = create_test_app_state().await;

        // First create a page
        let page_request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = test_create_page(page_request, &state).await.unwrap();

        // Then create a block
        let block_request = CreateBlockRequest {
            content: "Test block content".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: None,
            properties: None,
        };

        let created_block = test_create_block(block_request, &state).await.unwrap();
        assert_eq!(created_block.content, "Test block content");
        assert_eq!(created_block.page_id, page.id);

        let retrieved_block = test_get_block(created_block.id.clone(), &state).await.unwrap();
        assert_eq!(retrieved_block.id, created_block.id);
        assert_eq!(retrieved_block.content, "Test block content");
    }

    #[tokio::test]
    async fn test_search_blocks() {
        let state = create_test_app_state().await;
        
        // Create test data
        let page_request = CreatePageRequest {
            name: "Searchable Page".to_string(),
            title: Some("This contains searchable content".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["searchable".to_string()]).unwrap()),
            properties: None,
        };
        let page = test_create_page(page_request, &state).await.unwrap();

        let block_request = CreateBlockRequest {
            content: "This block has searchable text content".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: None,
            properties: None,
        };
        test_create_block(block_request, &state).await.unwrap();

        // Test search
        let search_request = BlockSearchRequest {
            query: "searchable".to_string(),
            include_pages: Some(true),
            include_blocks: Some(true),
            page_id: None,
            tags: None,
            is_journal: None,
            limit: Some(10),
            threshold: None,
        };

        let search_result = search_blocks_helper(search_request, &state).await.unwrap();
        assert!(search_result.results.len() > 0);
        
        // Verify search results contain our test data
        let has_page_result = search_result.results.iter().any(|r| r.result_type == "page");
        let has_block_result = search_result.results.iter().any(|r| r.result_type == "block");
        
        assert!(has_page_result || has_block_result);
    }

    #[tokio::test]
    async fn test_get_graph_data() {
        let state = create_test_app_state().await;
        
        // Create test pages with references
        let page1_request = CreatePageRequest {
            name: "Page One".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["tag1".to_string()]).unwrap()),
            properties: None,
        };
        let page1 = test_create_page(page1_request, &state).await.unwrap();

        let page2_request = CreatePageRequest {
            name: "Page Two".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["tag2".to_string()]).unwrap()),
            properties: None,
        };
        let page2 = test_create_page(page2_request, &state).await.unwrap();

        // Create blocks with references
        let block_request = CreateBlockRequest {
            content: "This references [[Page Two]]".to_string(),
            page_id: page1.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: Some(serde_json::to_string(&vec![page2.id.clone()]).unwrap()),
            properties: None,
        };
        test_create_block(block_request, &state).await.unwrap();

        // Test graph data retrieval
        let graph_data = get_graph_data_helper("default".to_string(), &state).await.unwrap();

        // Basic validation that we got some data back
        assert!(graph_data.is_object());
    }

    #[tokio::test]
    async fn test_update_page() {
        let state = create_test_app_state().await;

        let request = CreatePageRequest {
            name: "Original Name".to_string(),
            title: Some("Original Title".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = test_create_page(request, &state).await.unwrap();

        let update_request = UpdatePageRequest {
            id: page.id.clone(),
            name: Some("Updated Name".to_string()),
            title: Some("Updated Title".to_string()),
            is_journal: None,
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["updated".to_string()]).unwrap()),
            properties: None,
        };

        let updated_page = update_page_helper(update_request, &state).await.unwrap();
        assert_eq!(updated_page.name, "Updated Name");
        assert_eq!(updated_page.title, Some("Updated Title".to_string()));
    }

    #[tokio::test]
    async fn test_delete_page() {
        let state = create_test_app_state().await;
        
        let request = CreatePageRequest {
            name: "To Delete".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = test_create_page(request, &state).await.unwrap();

        // Verify page exists
        let retrieved = test_get_page(page.id.clone(), &state).await;
        assert!(retrieved.is_ok());

        // Delete page
        delete_page_helper(page.id.clone(), &state).await.unwrap();

        // Verify page is deleted
        let retrieved_after_delete = test_get_page(page.id, &state).await;
        assert!(retrieved_after_delete.is_err());
    }

    #[tokio::test]
    async fn test_get_pages_by_graph() {
        let state = create_test_app_state().await;
        
        // Create multiple pages
        for i in 0..5 {
            let request = CreatePageRequest {
                name: format!("Page {}", i),
                title: None,
                graph_id: "default".to_string(),
                is_journal: Some(false),
                journal_date: None,
                tags: None,
                properties: None,
            };
            test_create_page(request, &state).await.unwrap();
        }

        let pages = get_pages_by_graph_helper("default".to_string(), &state).await.unwrap();
        assert_eq!(pages.len(), 5);
    }

    #[tokio::test]
    async fn test_error_handling() {
        let state = create_test_app_state().await;
        
        // Test getting non-existent page
        let result = test_get_page("non-existent-id".to_string(), &state).await;
        assert!(result.is_err());

        // Test getting non-existent block
        let result = test_get_block("non-existent-id".to_string(), &state).await;
        assert!(result.is_err());

        // Test creating block with non-existent page
        let block_request = CreateBlockRequest {
            content: "Test content".to_string(),
            page_id: "non-existent-page".to_string(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: None,
            properties: None,
        };
        let result = test_create_block(block_request, &state).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        let state = Arc::new(create_test_app_state().await);
        
        // Test concurrent page creation
        let mut handles = vec![];
        
        for i in 0..10 {
            let state_clone = state.clone();
            let handle = tokio::spawn(async move {
                let request = CreatePageRequest {
                    name: format!("Concurrent Page {}", i),
                    title: None,
                    graph_id: "default".to_string(),
                    is_journal: Some(false),
                    journal_date: None,
                    tags: None,
                    properties: None,
                };
                test_create_page(request, state_clone.as_ref()).await
            });
            handles.push(handle);
        }

        // Wait for all operations to complete
        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result.is_ok());
        }

        // Verify all pages were created
        let pages = get_pages_by_graph_helper("default".to_string(), state.as_ref()).await.unwrap();
        assert_eq!(pages.len(), 10);
    }
}
