#[cfg(test)]
mod unit_tests {
    use crate::database::Database;
    use crate::models::*;
    use crate::error::Result;
    use tempfile::tempdir;
    use tokio;

    async fn create_test_database() -> Result<Database> {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        Database::new_with_path(db_path.to_str().unwrap()).await
    }

    #[tokio::test]
    async fn test_database_creation() {
        let db = create_test_database().await;
        assert!(db.is_ok());
    }

    #[tokio::test]
    async fn test_create_page() {
        let db = create_test_database().await.unwrap();
        
        let request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: Some("Test Page Title".to_string()),
            properties: None,
            tags: Some("test,page".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };

        let created_page = db.create_page(request).await.unwrap();
        assert_eq!(created_page.name, "Test Page");
        assert_eq!(created_page.title, Some("Test Page Title".to_string()));
        assert_eq!(created_page.graph_id, "default");
        assert!(!created_page.is_journal);
    }

    #[tokio::test]
    async fn test_get_page() {
        let db = create_test_database().await.unwrap();
        
        let request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: Some("Test Page Title".to_string()),
            properties: None,
            tags: Some("test".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };

        let created_page = db.create_page(request).await.unwrap();
        let retrieved_page = db.get_page(&created_page.id).await.unwrap();
        
        assert_eq!(retrieved_page.id, created_page.id);
        assert_eq!(retrieved_page.name, "Test Page");
        assert_eq!(retrieved_page.title, Some("Test Page Title".to_string()));
    }

    #[tokio::test]
    async fn test_create_block() {
        let db = create_test_database().await.unwrap();
        
        // First create a page
        let page_request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: None,
            properties: None,
            tags: None,
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        let page = db.create_page(page_request).await.unwrap();

        // Then create a block
        let block_request = CreateBlockRequest {
            content: "Test block content".to_string(),
            parent_id: None,
            properties: None,
            refs: Some("reference".to_string()),
            order: Some(0),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
        };

        let created_block = db.create_block(block_request).await.unwrap();
        assert_eq!(created_block.content, "Test block content");
        assert_eq!(created_block.page_id, page.id);
        assert_eq!(created_block.order, 0);
    }

    #[tokio::test]
    async fn test_get_block() {
        let db = create_test_database().await.unwrap();
        
        // Create page and block
        let page_request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: None,
            properties: None,
            tags: None,
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        let page = db.create_page(page_request).await.unwrap();

        let block_request = CreateBlockRequest {
            content: "Test block content".to_string(),
            parent_id: None,
            properties: None,
            refs: None,
            order: Some(0),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
        };
        let created_block = db.create_block(block_request).await.unwrap();

        // Retrieve the block
        let retrieved_block = db.get_block(&created_block.id).await.unwrap();
        assert_eq!(retrieved_block.id, created_block.id);
        assert_eq!(retrieved_block.content, "Test block content");
        assert_eq!(retrieved_block.page_id, page.id);
    }

    #[tokio::test]
    async fn test_update_page() {
        let db = create_test_database().await.unwrap();
        
        // Create a page
        let request = CreatePageRequest {
            name: "Original Page".to_string(),
            title: Some("Original Title".to_string()),
            properties: None,
            tags: Some("original".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        let created_page = db.create_page(request).await.unwrap();

        // Update the page
        let update_request = UpdatePageRequest {
            id: created_page.id.clone(),
            name: Some("Updated Page".to_string()),
            title: Some("Updated Title".to_string()),
            properties: None,
            tags: Some("updated".to_string()),
            is_journal: None,
            journal_date: None,
        };
        let updated_page = db.update_page(update_request).await.unwrap();

        assert_eq!(updated_page.name, "Updated Page");
        assert_eq!(updated_page.title, Some("Updated Title".to_string()));
        assert_eq!(updated_page.tags, "updated");
    }

    #[tokio::test]
    async fn test_delete_page() {
        let db = create_test_database().await.unwrap();
        
        // Create a page
        let request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: None,
            properties: None,
            tags: None,
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        let created_page = db.create_page(request).await.unwrap();

        // Delete the page
        let result = db.delete_page(&created_page.id).await;
        assert!(result.is_ok());

        // Verify it's deleted
        let get_result = db.get_page(&created_page.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_list_pages() {
        let db = create_test_database().await.unwrap();
        
        // Create multiple pages
        for i in 0..5 {
            let request = CreatePageRequest {
                name: format!("Test Page {}", i),
                title: Some(format!("Title {}", i)),
                properties: None,
                tags: Some(format!("tag{}", i)),
                is_journal: Some(false),
                journal_date: None,
                graph_id: "default".to_string(),
            };
            db.create_page(request).await.unwrap();
        }

        // List pages
        let pages = db.list_pages(10, 0).await.unwrap();
        assert_eq!(pages.len(), 5);
        
        // Check ordering (should be by updated_at desc)
        for i in 0..4 {
            assert!(pages[i].updated_at >= pages[i + 1].updated_at);
        }
    }

    #[tokio::test]
    async fn test_search_pages() {
        let db = create_test_database().await.unwrap();
        
        // Create pages with different content
        let request1 = CreatePageRequest {
            name: "Searchable Page".to_string(),
            title: Some("This is searchable".to_string()),
            properties: None,
            tags: Some("search,test".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        db.create_page(request1).await.unwrap();

        let request2 = CreatePageRequest {
            name: "Another Page".to_string(),
            title: Some("Different content".to_string()),
            properties: None,
            tags: Some("other".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        db.create_page(request2).await.unwrap();

        // Search for pages
        let search_results = db.search_pages("searchable", 10, 0).await.unwrap();
        assert_eq!(search_results.len(), 1);
        assert_eq!(search_results[0].name, "Searchable Page");
    }

    #[tokio::test]
    async fn test_database_error_handling() {
        let db = create_test_database().await.unwrap();
        
        // Test getting non-existent page
        let result = db.get_page("non-existent-id").await;
        assert!(result.is_err());

        // Test getting non-existent block
        let result = db.get_block("non-existent-id").await;
        assert!(result.is_err());

        // Test deleting non-existent page
        let result = db.delete_page("non-existent-id").await;
        assert!(result.is_err());
    }
}
