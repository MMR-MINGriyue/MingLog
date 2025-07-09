#[cfg(test)]
mod integration_tests {
    use super::*;
    use crate::models::*;
    use crate::state::AppState;
    use crate::database::Database;
    use tempfile::tempdir;
    use tokio;
    use std::sync::Arc;

    async fn create_test_app_state() -> Arc<AppState> {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test_commands.db");
        let database = Database::new_with_path(db_path.to_str().unwrap()).await.unwrap();
        
        Arc::new(AppState {
            database,
        })
    }

    #[tokio::test]
    async fn test_init_app_command() {
        let result = init_app().await;
        assert!(result.is_ok(), "init_app should succeed");
        
        let app_info = result.unwrap();
        assert!(!app_info.version.is_empty(), "Version should not be empty");
        assert!(!app_info.name.is_empty(), "Name should not be empty");
    }

    #[tokio::test]
    async fn test_get_app_info_command() {
        let result = get_app_info().await;
        assert!(result.is_ok(), "get_app_info should succeed");
        
        let app_info = result.unwrap();
        assert_eq!(app_info.name, "MingLog Desktop");
        assert!(!app_info.version.is_empty());
    }

    #[tokio::test]
    async fn test_page_commands() {
        let state = create_test_app_state().await;
        
        // Test create_page
        let create_request = CreatePageRequest {
            name: "Command Test Page".to_string(),
            title: Some("Test Title".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some("test,command".to_string()),
            properties: None,
        };

        let created_page = create_page(create_request, state.clone()).await.unwrap();
        assert_eq!(created_page.name, "Command Test Page");

        // Test get_page
        let retrieved_page = get_page(created_page.id.clone(), state.clone()).await.unwrap();
        assert_eq!(retrieved_page.id, created_page.id);
        assert_eq!(retrieved_page.name, "Command Test Page");

        // Test update_page
        let update_request = UpdatePageRequest {
            id: created_page.id.clone(),
            name: Some("Updated Command Page".to_string()),
            title: Some("Updated Title".to_string()),
            is_journal: Some(true),
            tags: Some("updated,command".to_string()),
            properties: None,
        };

        let updated_page = update_page(update_request, state.clone()).await.unwrap();
        assert_eq!(updated_page.name, "Updated Command Page");

        // Test delete_page
        let delete_result = delete_page(created_page.id.clone(), state.clone()).await;
        assert!(delete_result.is_ok(), "Page deletion should succeed");

        // Verify deletion
        let get_result = get_page(created_page.id, state.clone()).await;
        assert!(get_result.is_err(), "Page should not exist after deletion");
    }

    #[tokio::test]
    async fn test_block_commands() {
        let state = create_test_app_state().await;
        
        // First create a page
        let page_request = CreatePageRequest {
            name: "Block Command Test".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = create_page(page_request, state.clone()).await.unwrap();

        // Test create_block
        let create_request = CreateBlockRequest {
            content: "Command test block content".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: Some(vec!["test_ref".to_string()]),
            properties: None,
        };

        let created_block = create_block(create_request, state.clone()).await.unwrap();
        assert_eq!(created_block.content, "Command test block content");

        // Test get_block
        let retrieved_block = get_block(created_block.id.clone(), state.clone()).await.unwrap();
        assert_eq!(retrieved_block.id, created_block.id);

        // Test update_block
        let update_request = UpdateBlockRequest {
            id: created_block.id.clone(),
            content: Some("Updated command block content".to_string()),
            order: Some(1),
            refs: Some(vec!["updated_ref".to_string()]),
            properties: None,
        };

        let updated_block = update_block(update_request, state.clone()).await.unwrap();
        assert_eq!(updated_block.content, "Updated command block content");

        // Test delete_block
        let delete_result = delete_block(created_block.id.clone(), state.clone()).await;
        assert!(delete_result.is_ok(), "Block deletion should succeed");
    }

    #[tokio::test]
    async fn test_search_commands() {
        let state = create_test_app_state().await;
        
        // Create test data
        let page_request = CreatePageRequest {
            name: "Search Command Test".to_string(),
            title: Some("Searchable Title".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some("searchable,command".to_string()),
            properties: None,
        };
        let page = create_page(page_request, state.clone()).await.unwrap();

        let block_request = CreateBlockRequest {
            content: "This content contains searchable keywords for testing".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: None,
            properties: None,
        };
        create_block(block_request, state.clone()).await.unwrap();

        // Test search_blocks
        let search_request = BlockSearchRequest {
            query: "searchable".to_string(),
            graph_id: Some("default".to_string()),
            limit: Some(10),
            offset: Some(0),
            is_journal: None,
            tags: None,
        };

        let search_results = search_blocks(search_request, state.clone()).await.unwrap();
        assert!(!search_results.is_empty(), "Search should return results");
        
        let first_result = &search_results[0];
        assert!(first_result.content.contains("searchable"));
    }

    #[tokio::test]
    async fn test_get_pages_command() {
        let state = create_test_app_state().await;
        
        // Create multiple test pages
        for i in 0..3 {
            let request = CreatePageRequest {
                name: format!("Test Page {}", i),
                title: None,
                graph_id: "default".to_string(),
                is_journal: Some(false),
                journal_date: None,
                tags: None,
                properties: None,
            };
            create_page(request, state.clone()).await.unwrap();
        }

        // Test get_pages
        let pages = get_pages(state.clone()).await.unwrap();
        assert!(pages.len() >= 3, "Should have at least 3 pages");
    }

    #[tokio::test]
    async fn test_get_blocks_by_page_command() {
        let state = create_test_app_state().await;
        
        // Create test page
        let page_request = CreatePageRequest {
            name: "Blocks Test Page".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = create_page(page_request, state.clone()).await.unwrap();

        // Create multiple blocks
        for i in 0..3 {
            let block_request = CreateBlockRequest {
                content: format!("Block content {}", i),
                page_id: page.id.clone(),
                graph_id: "default".to_string(),
                parent_id: None,
                order: Some(i),
                refs: None,
                properties: None,
            };
            create_block(block_request, state.clone()).await.unwrap();
        }

        // Test get_blocks_by_page
        let blocks = get_blocks_by_page(page.id, state.clone()).await.unwrap();
        assert_eq!(blocks.len(), 3, "Should have 3 blocks");
    }

    #[tokio::test]
    async fn test_error_handling_commands() {
        let state = create_test_app_state().await;
        
        // Test getting non-existent page
        let result = get_page("non-existent-id".to_string(), state.clone()).await;
        assert!(result.is_err(), "Getting non-existent page should fail");

        // Test getting non-existent block
        let result = get_block("non-existent-id".to_string(), state.clone()).await;
        assert!(result.is_err(), "Getting non-existent block should fail");

        // Test deleting non-existent page
        let result = delete_page("non-existent-id".to_string(), state.clone()).await;
        assert!(result.is_err(), "Deleting non-existent page should fail");
    }

    #[tokio::test]
    async fn test_concurrent_command_execution() {
        let state = create_test_app_state().await;
        
        // Execute multiple commands concurrently
        let mut handles = vec![];
        
        for i in 0..3 {
            let state_clone = state.clone();
            let handle = tokio::spawn(async move {
                let request = CreatePageRequest {
                    name: format!("Concurrent Command Page {}", i),
                    title: None,
                    graph_id: "default".to_string(),
                    is_journal: Some(false),
                    journal_date: None,
                    tags: None,
                    properties: None,
                };
                create_page(request, state_clone).await
            });
            handles.push(handle);
        }

        // Wait for all commands to complete
        let results: Vec<_> = futures::future::join_all(handles).await;
        
        // Verify all commands succeeded
        for result in results {
            let page_result = result.unwrap();
            assert!(page_result.is_ok(), "Concurrent command execution should succeed");
        }
    }
}
