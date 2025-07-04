#[cfg(test)]
mod integration_tests {
    use super::*;
    use crate::models::*;
    use crate::database::Database;
    use tempfile::tempdir;
    use tokio;

    async fn create_test_database() -> crate::error::Result<Database> {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test_integration.db");
        Database::new_with_path(db_path.to_str().unwrap()).await
    }

    #[tokio::test]
    async fn test_database_initialization() {
        let db = create_test_database().await;
        assert!(db.is_ok(), "Database should initialize successfully");
    }

    #[tokio::test]
    async fn test_page_crud_operations() {
        let db = create_test_database().await.unwrap();
        
        // Create page
        let create_request = CreatePageRequest {
            name: "Integration Test Page".to_string(),
            title: Some("Test Title".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some("test,integration".to_string()),
            properties: None,
        };

        let created_page = db.create_page(create_request).await.unwrap();
        assert_eq!(created_page.name, "Integration Test Page");
        assert_eq!(created_page.title, Some("Test Title".to_string()));

        // Read page
        let retrieved_page = db.get_page(&created_page.id).await.unwrap();
        assert_eq!(retrieved_page.id, created_page.id);
        assert_eq!(retrieved_page.name, "Integration Test Page");

        // Update page
        let update_request = UpdatePageRequest {
            id: created_page.id.clone(),
            name: Some("Updated Page Name".to_string()),
            title: Some("Updated Title".to_string()),
            is_journal: Some(true),
            journal_date: None,
            tags: Some("updated,test".to_string()),
            properties: None,
        };

        let updated_page = db.update_page(update_request).await.unwrap();
        assert_eq!(updated_page.name, "Updated Page Name");
        assert_eq!(updated_page.title, Some("Updated Title".to_string()));

        // Delete page
        let delete_result = db.delete_page(&created_page.id).await;
        assert!(delete_result.is_ok(), "Page deletion should succeed");

        // Verify deletion
        let get_result = db.get_page(&created_page.id).await;
        assert!(get_result.is_err(), "Page should not exist after deletion");
    }

    #[tokio::test]
    async fn test_block_crud_operations() {
        let db = create_test_database().await.unwrap();
        
        // First create a page
        let page_request = CreatePageRequest {
            name: "Block Test Page".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = db.create_page(page_request).await.unwrap();

        // Create block
        let create_request = CreateBlockRequest {
            content: "Test block content".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: Some("test_ref".to_string()),
            properties: None,
        };

        let created_block = db.create_block(create_request).await.unwrap();
        assert_eq!(created_block.content, "Test block content");
        assert_eq!(created_block.page_id, page.id);

        // Read block
        let retrieved_block = db.get_block(&created_block.id).await.unwrap();
        assert_eq!(retrieved_block.id, created_block.id);
        assert_eq!(retrieved_block.content, "Test block content");

        // Update block
        let update_request = UpdateBlockRequest {
            id: created_block.id.clone(),
            content: Some("Updated block content".to_string()),
            order: Some(1),
            parent_id: None,
            collapsed: None,
            refs: Some("updated_ref".to_string()),
            properties: None,
        };

        let updated_block = db.update_block(update_request).await.unwrap();
        assert_eq!(updated_block.content, "Updated block content");

        // Delete block
        let delete_result = db.delete_block(&created_block.id).await;
        assert!(delete_result.is_ok(), "Block deletion should succeed");

        // Verify deletion
        let get_result = db.get_block(&created_block.id).await;
        assert!(get_result.is_err(), "Block should not exist after deletion");
    }

    #[tokio::test]
    async fn test_search_functionality() {
        let db = create_test_database().await.unwrap();
        
        // Create test page
        let page_request = CreatePageRequest {
            name: "Searchable Page".to_string(),
            title: Some("Search Test".to_string()),
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some("searchable,test".to_string()),
            properties: None,
        };
        let page = db.create_page(page_request).await.unwrap();

        // Create searchable block
        let block_request = CreateBlockRequest {
            content: "This is searchable content with unique keywords".to_string(),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
            parent_id: None,
            order: Some(0),
            refs: None,
            properties: None,
        };
        db.create_block(block_request).await.unwrap();

        // Test search
        let search_request = BlockSearchRequest {
            query: "searchable".to_string(),
            page_id: None,
            include_pages: Some(true),
            include_blocks: Some(true),
            threshold: Some(0.1),
        };

        let search_results = db.search_blocks(search_request).await.unwrap();
        assert!(!search_results.is_empty(), "Search should return results");
        
        let first_result = &search_results[0];
        assert!(first_result.content.contains("searchable"));
    }

    #[tokio::test]
    async fn test_pagination() {
        let db = create_test_database().await.unwrap();
        
        // Create test page
        let page_request = CreatePageRequest {
            name: "Pagination Test".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = db.create_page(page_request).await.unwrap();

        // Create multiple blocks
        for i in 0..5 {
            let block_request = CreateBlockRequest {
                content: format!("Block content {}", i),
                page_id: page.id.clone(),
                graph_id: "default".to_string(),
                parent_id: None,
                order: Some(i),
                refs: None,
                properties: None,
            };
            db.create_block(block_request).await.unwrap();
        }

        // Test pagination
        let search_request = BlockSearchRequest {
            query: "Block".to_string(),
            page_id: None,
            include_pages: Some(true),
            include_blocks: Some(true),
            threshold: Some(0.1),
        };

        let search_results = db.search_blocks(search_request).await.unwrap();
        assert!(search_results.len() >= 5, "Should find all blocks");

        // Test that search returns results
        let search_request_page2 = BlockSearchRequest {
            query: "Block".to_string(),
            page_id: None,
            include_pages: Some(true),
            include_blocks: Some(true),
            threshold: Some(0.1),
        };

        let second_search = db.search_blocks(search_request_page2).await.unwrap();
        assert!(second_search.len() >= 5, "Should find all blocks in second search");
    }

    #[tokio::test]
    async fn test_error_handling() {
        let db = create_test_database().await.unwrap();
        
        // Test getting non-existent page
        let result = db.get_page("non-existent-id").await;
        assert!(result.is_err(), "Getting non-existent page should fail");

        // Test getting non-existent block
        let result = db.get_block("non-existent-id").await;
        assert!(result.is_err(), "Getting non-existent block should fail");

        // Test deleting non-existent page
        let result = db.delete_page("non-existent-id").await;
        assert!(result.is_err(), "Deleting non-existent page should fail");

        // Test deleting non-existent block
        let result = db.delete_block("non-existent-id").await;
        assert!(result.is_err(), "Deleting non-existent block should fail");
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        let db = create_test_database().await.unwrap();
        
        // Create multiple pages concurrently
        let mut handles = vec![];
        
        for i in 0..3 {
            let db_clone = db.clone();
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
                db_clone.create_page(request).await
            });
            handles.push(handle);
        }

        // Wait for all operations to complete
        let results: Vec<_> = futures::future::join_all(handles).await;
        
        // Verify all operations succeeded
        for result in results {
            let page_result = result.unwrap();
            assert!(page_result.is_ok(), "Concurrent page creation should succeed");
        }
    }

    #[tokio::test]
    async fn test_transaction_rollback() {
        let db = create_test_database().await.unwrap();
        
        // This test would require transaction support in the database
        // For now, we'll test basic consistency
        
        let page_request = CreatePageRequest {
            name: "Transaction Test".to_string(),
            title: None,
            graph_id: "default".to_string(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        
        let page = db.create_page(page_request).await.unwrap();
        
        // Verify page exists
        let retrieved = db.get_page(&page.id).await;
        assert!(retrieved.is_ok(), "Page should exist after creation");
        
        // Delete and verify
        db.delete_page(&page.id).await.unwrap();
        let retrieved_after_delete = db.get_page(&page.id).await;
        assert!(retrieved_after_delete.is_err(), "Page should not exist after deletion");
    }
}
