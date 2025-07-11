#[cfg(test)]
mod tests {
    use crate::models::*;
    use crate::database::Database;
    use crate::error::Result;
    use tempfile::tempdir;
    use tokio;
    use serde_json;

    async fn create_test_database() -> Result<(Database, tempfile::TempDir, String)> {
        let temp_dir = tempdir().unwrap();
        let db_path = temp_dir.path().join("test.db");
        let db = Database::new_with_path(db_path.to_str().unwrap()).await?;

        // Create a default graph for testing
        let graph_request = crate::models::CreateGraphRequest {
            name: "Test Graph".to_string(),
            path: "test".to_string(),
            settings: None,
        };
        let graph = db.create_graph(graph_request).await?;

        Ok((db, temp_dir, graph.id))
    }

    #[tokio::test]
    async fn test_database_creation() {
        let result = create_test_database().await;
        assert!(result.is_ok());
        let (_db, _temp_dir, _graph_id) = result.unwrap();
    }

    #[tokio::test]
    async fn test_create_and_get_page() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        let request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: Some("Test Page Title".to_string()),
            graph_id: graph_id.clone(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some("test,page".to_string()),
            properties: None,
        };

        let created_page = db.create_page(request).await.unwrap();
        assert_eq!(created_page.name, "Test Page");
        assert_eq!(created_page.title, Some("Test Page Title".to_string()));
        assert_eq!(created_page.graph_id, graph_id);

        let retrieved_page = db.get_page(&created_page.id).await.unwrap();
        assert_eq!(retrieved_page.id, created_page.id);
        assert_eq!(retrieved_page.name, "Test Page");
    }

    #[tokio::test]
    async fn test_create_and_get_block() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        // First create a page
        let page_request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: None,
            graph_id: graph_id.clone(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = db.create_page(page_request).await.unwrap();

        // Then create a block
        let block_request = CreateBlockRequest {
            content: "Test block content".to_string(),
            page_id: page.id.clone(),
            graph_id: graph_id.clone(),
            parent_id: None,
            order: Some(0),
            refs: Some(serde_json::to_string(&vec!["reference".to_string()]).unwrap()),
            properties: None,
        };

        let created_block = db.create_block(block_request).await.unwrap();
        assert_eq!(created_block.content, "Test block content");
        assert_eq!(created_block.page_id, page.id);
        assert_eq!(created_block.order, 0);

        let retrieved_block = db.get_block(&created_block.id).await.unwrap();
        assert_eq!(retrieved_block.id, created_block.id);
        assert_eq!(retrieved_block.content, "Test block content");
    }

    #[tokio::test]
    async fn test_update_page() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        let request = CreatePageRequest {
            name: "Original Name".to_string(),
            title: Some("Original Title".to_string()),
            graph_id: graph_id.clone(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };

        let page = db.create_page(request).await.unwrap();

        let update_request = UpdatePageRequest {
            id: page.id.clone(),
            name: Some("Updated Name".to_string()),
            title: Some("Updated Title".to_string()),
            is_journal: None,
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["updated".to_string()]).unwrap()),
            properties: None,
        };

        let updated_page = db.update_page(update_request).await.unwrap();
        assert_eq!(updated_page.name, "Updated Name");
        assert_eq!(updated_page.title, Some("Updated Title".to_string()));
    }

    #[tokio::test]
    async fn test_delete_page() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        let request = CreatePageRequest {
            name: "To Delete".to_string(),
            title: None,
            graph_id: graph_id.clone(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };

        let page = db.create_page(request).await.unwrap();
        
        // Verify page exists
        let retrieved = db.get_page(&page.id).await;
        assert!(retrieved.is_ok());

        // Delete page
        db.delete_page(&page.id).await.unwrap();

        // Verify page is deleted
        let retrieved_after_delete = db.get_page(&page.id).await;
        assert!(retrieved_after_delete.is_err());
    }

    #[tokio::test]
    async fn test_get_pages_by_graph() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        // Create multiple pages
        for i in 0..5 {
            let request = CreatePageRequest {
                name: format!("Page {}", i),
                title: None,
                graph_id: graph_id.clone(),
                is_journal: Some(false),
                journal_date: None,
                tags: None,
                properties: None,
            };
            db.create_page(request).await.unwrap();
        }

        let pages = db.get_pages_by_graph(&graph_id).await.unwrap();
        assert_eq!(pages.len(), 5);
    }

    #[tokio::test]
    async fn test_get_blocks_by_page() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        // Create a page
        let page_request = CreatePageRequest {
            name: "Test Page".to_string(),
            title: None,
            graph_id: graph_id.clone(),
            is_journal: Some(false),
            journal_date: None,
            tags: None,
            properties: None,
        };
        let page = db.create_page(page_request).await.unwrap();

        // Create multiple blocks
        for i in 0..3 {
            let block_request = CreateBlockRequest {
                content: format!("Block content {}", i),
                page_id: page.id.clone(),
                graph_id: graph_id.clone(),
                parent_id: None,
                order: Some(i),
                refs: None,
                properties: None,
            };
            db.create_block(block_request).await.unwrap();
        }

        let blocks = db.get_blocks_by_page(&page.id).await.unwrap();
        assert_eq!(blocks.len(), 3);
        
        // Verify blocks are ordered correctly
        for (i, block) in blocks.iter().enumerate() {
            assert_eq!(block.order, i as i32);
        }
    }

    #[tokio::test]
    async fn test_search_functionality() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();

        // Create test data
        let page_request = CreatePageRequest {
            name: "Searchable Page".to_string(),
            title: Some("This is a searchable title".to_string()),
            graph_id: graph_id.clone(),
            is_journal: Some(false),
            journal_date: None,
            tags: Some(serde_json::to_string(&vec!["searchable".to_string()]).unwrap()),
            properties: None,
        };
        let page = db.create_page(page_request).await.unwrap();

        let block_request = CreateBlockRequest {
            content: "This block contains searchable content".to_string(),
            page_id: page.id.clone(),
            graph_id: graph_id.clone(),
            parent_id: None,
            order: Some(0),
            refs: None,
            properties: None,
        };
        db.create_block(block_request).await.unwrap();

        // Test search (this would require implementing a search method in Database)
        // For now, we'll test that we can retrieve the data
        let pages = db.get_pages_by_graph(&graph_id).await.unwrap();
        let blocks = db.get_blocks_by_page(&page.id).await.unwrap();
        
        assert!(!pages.is_empty());
        assert!(!blocks.is_empty());
        
        // Verify searchable content exists
        assert!(pages[0].name.contains("Searchable"));
        assert!(blocks[0].content.contains("searchable"));
    }

    #[tokio::test]
    async fn test_database_performance() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();
        
        let start_time = std::time::Instant::now();
        
        // Create many pages and blocks to test performance
        for i in 0..100 {
            let page_request = CreatePageRequest {
                name: format!("Performance Page {}", i),
                title: None,
                graph_id: graph_id.clone(),
                is_journal: Some(false),
                journal_date: None,
                tags: None,
                properties: None,
            };
            let page = db.create_page(page_request).await.unwrap();

            // Create blocks for each page
            for j in 0..10 {
                let block_request = CreateBlockRequest {
                    content: format!("Performance block {} for page {}", j, i),
                    page_id: page.id.clone(),
                    graph_id: graph_id.clone(),
                    parent_id: None,
                    order: Some(j),
                    refs: None,
                    properties: None,
                };
                db.create_block(block_request).await.unwrap();
            }
        }
        
        let creation_time = start_time.elapsed();
        
        // Test retrieval performance
        let retrieval_start = std::time::Instant::now();
        let pages = db.get_pages_by_graph(&graph_id).await.unwrap();
        let retrieval_time = retrieval_start.elapsed();
        
        assert_eq!(pages.len(), 100);
        
        // Performance assertions (adjust thresholds as needed)
        assert!(creation_time.as_millis() < 5000, "Creation took too long: {:?}", creation_time);
        assert!(retrieval_time.as_millis() < 100, "Retrieval took too long: {:?}", retrieval_time);
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        let (db, _temp_dir, graph_id) = create_test_database().await.unwrap();
        let db = std::sync::Arc::new(db);
        let graph_id = std::sync::Arc::new(graph_id);

        // Test concurrent page creation
        let mut handles = vec![];

        for i in 0..10 {
            let db_clone = db.clone();
            let graph_id_clone = graph_id.clone();
            let handle = tokio::spawn(async move {
                let request = CreatePageRequest {
                    name: format!("Concurrent Page {}", i),
                    title: None,
                    graph_id: (*graph_id_clone).clone(),
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
        for handle in handles {
            let result = handle.await.unwrap();
            assert!(result.is_ok());
        }
        
        // Verify all pages were created
        let pages = db.get_pages_by_graph(&graph_id).await.unwrap();
        assert_eq!(pages.len(), 10);
    }
}
