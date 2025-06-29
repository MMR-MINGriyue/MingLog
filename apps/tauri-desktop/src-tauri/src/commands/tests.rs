#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use crate::state::AppState;
    use crate::models::*;
    use tempfile::tempdir;
    use tokio;
    use std::sync::Arc;
    use tokio::sync::Mutex;

    async fn create_test_app_state() -> AppState {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Database::new_with_path(db_path.to_str().unwrap()).await.unwrap();
        
        AppState {
            db: Arc::new(Mutex::new(db)),
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
            is_journal: false,
            journal_date: None,
            tags: Some(vec!["test".to_string()]),
        };

        let created_page = create_page(request, tauri::State::from(&state)).await.unwrap();
        assert_eq!(created_page.name, "Test Page");

        let retrieved_page = get_page(created_page.id.clone(), tauri::State::from(&state)).await.unwrap();
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
            is_journal: false,
            journal_date: None,
            tags: None,
        };
        let page = create_page(page_request, tauri::State::from(&state)).await.unwrap();

        // Then create a block
        let block_request = CreateBlockRequest {
            content: "Test block content".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: 0,
            refs: None,
        };

        let created_block = create_block(block_request, tauri::State::from(&state)).await.unwrap();
        assert_eq!(created_block.content, "Test block content");
        assert_eq!(created_block.page_id, page.id);

        let retrieved_block = get_block(created_block.id.clone(), tauri::State::from(&state)).await.unwrap();
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
            is_journal: false,
            journal_date: None,
            tags: Some(vec!["searchable".to_string()]),
        };
        let page = create_page(page_request, tauri::State::from(&state)).await.unwrap();

        let block_request = CreateBlockRequest {
            content: "This block has searchable text content".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: 0,
            refs: None,
        };
        create_block(block_request, tauri::State::from(&state)).await.unwrap();

        // Test search
        let search_request = BlockSearchRequest {
            query: "searchable".to_string(),
            include_pages: Some(true),
            include_blocks: Some(true),
            page_id: None,
            limit: Some(10),
            threshold: None,
        };

        let search_result = search_blocks(search_request, tauri::State::from(&state)).await.unwrap();
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
            is_journal: false,
            journal_date: None,
            tags: Some(vec!["tag1".to_string()]),
        };
        let page1 = create_page(page1_request, tauri::State::from(&state)).await.unwrap();

        let page2_request = CreatePageRequest {
            name: "Page Two".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: false,
            journal_date: None,
            tags: Some(vec!["tag2".to_string()]),
        };
        let page2 = create_page(page2_request, tauri::State::from(&state)).await.unwrap();

        // Create blocks with references
        let block_request = CreateBlockRequest {
            content: "This references [[Page Two]]".to_string(),
            page_id: page1.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: 0,
            refs: Some(vec![page2.id.clone()]),
        };
        create_block(block_request, tauri::State::from(&state)).await.unwrap();

        // Test graph data retrieval
        let graph_data = get_graph_data("default".to_string(), tauri::State::from(&state)).await.unwrap();
        
        assert!(graph_data.nodes.len() >= 2); // At least our two pages
        assert!(graph_data.links.len() >= 1); // At least one reference link
    }

    #[tokio::test]
    async fn test_update_page() {
        let state = create_test_app_state().await;
        
        let request = CreatePageRequest {
            name: "Original Name".to_string(),
            title: Some("Original Title".to_string()),
            graph_id: "default".to_string(),
            is_journal: false,
            journal_date: None,
            tags: None,
        };
        let page = create_page(request, tauri::State::from(&state)).await.unwrap();

        let update_request = UpdatePageRequest {
            name: Some("Updated Name".to_string()),
            title: Some("Updated Title".to_string()),
            is_journal: None,
            journal_date: None,
            tags: Some(vec!["updated".to_string()]),
        };

        let updated_page = update_page(page.id.clone(), update_request, tauri::State::from(&state)).await.unwrap();
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
            is_journal: false,
            journal_date: None,
            tags: None,
        };
        let page = create_page(request, tauri::State::from(&state)).await.unwrap();

        // Verify page exists
        let retrieved = get_page(page.id.clone(), tauri::State::from(&state)).await;
        assert!(retrieved.is_ok());

        // Delete page
        delete_page(page.id.clone(), tauri::State::from(&state)).await.unwrap();

        // Verify page is deleted
        let retrieved_after_delete = get_page(page.id, tauri::State::from(&state)).await;
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
                is_journal: false,
                journal_date: None,
                tags: None,
            };
            create_page(request, tauri::State::from(&state)).await.unwrap();
        }

        let pages = get_pages_by_graph("default".to_string(), tauri::State::from(&state)).await.unwrap();
        assert_eq!(pages.len(), 5);
    }

    #[tokio::test]
    async fn test_error_handling() {
        let state = create_test_app_state().await;
        
        // Test getting non-existent page
        let result = get_page("non-existent-id".to_string(), tauri::State::from(&state)).await;
        assert!(result.is_err());

        // Test getting non-existent block
        let result = get_block("non-existent-id".to_string(), tauri::State::from(&state)).await;
        assert!(result.is_err());

        // Test creating block with non-existent page
        let block_request = CreateBlockRequest {
            content: "Test content".to_string(),
            page_id: "non-existent-page".to_string(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: 0,
            refs: None,
        };
        let result = create_block(block_request, tauri::State::from(&state)).await;
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
                    is_journal: false,
                    journal_date: None,
                    tags: None,
                };
                create_page(request, tauri::State::from(state_clone.as_ref())).await
            });
            handles.push(handle);
        }
        
        // Wait for all operations to complete
        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result.is_ok());
        }
        
        // Verify all pages were created
        let pages = get_pages_by_graph("default".to_string(), tauri::State::from(state.as_ref())).await.unwrap();
        assert_eq!(pages.len(), 10);
    }
}
