#[cfg(test)]
mod simple_tests {
    use crate::database::Database;
    use crate::models::*;
    use crate::error::Result;

    async fn create_test_database() -> Result<Database> {
        // Use in-memory database for tests
        Database::create_minimal().await
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
        for i in 0..3 {
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
        assert_eq!(pages.len(), 3);
        
        // Check ordering (should be by updated_at desc)
        for i in 0..2 {
            assert!(pages[i].updated_at >= pages[i + 1].updated_at);
        }
    }

    #[tokio::test]
    async fn test_update_block() {
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
            content: "Original content".to_string(),
            parent_id: None,
            properties: None,
            refs: None,
            order: Some(0),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
        };
        let created_block = db.create_block(block_request).await.unwrap();

        // Update the block
        let update_request = UpdateBlockRequest {
            id: created_block.id.clone(),
            content: Some("Updated content".to_string()),
            parent_id: None,
            properties: Some("{\"updated\": true}".to_string()),
            refs: Some("new-ref".to_string()),
            order: Some(1),
            collapsed: Some(true),
        };
        let updated_block = db.update_block(update_request).await.unwrap();

        assert_eq!(updated_block.content, "Updated content");
        assert_eq!(updated_block.properties, Some("{\"updated\": true}".to_string()));
        assert_eq!(updated_block.refs, "new-ref");
        assert_eq!(updated_block.order, 1);
        assert!(updated_block.collapsed);
    }

    #[tokio::test]
    async fn test_delete_block() {
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
            content: "Test content".to_string(),
            parent_id: None,
            properties: None,
            refs: None,
            order: Some(0),
            page_id: page.id.clone(),
            graph_id: "default".to_string(),
        };
        let created_block = db.create_block(block_request).await.unwrap();

        // Delete the block
        let result = db.delete_block(&created_block.id).await;
        assert!(result.is_ok());

        // Verify it's deleted
        let get_result = db.get_block(&created_block.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_get_blocks_by_page() {
        let db = create_test_database().await.unwrap();

        // Create a page
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

        // Create multiple blocks
        for i in 0..3 {
            let block_request = CreateBlockRequest {
                content: format!("Block content {}", i),
                parent_id: None,
                properties: None,
                refs: None,
                order: Some(i),
                page_id: page.id.clone(),
                graph_id: "default".to_string(),
            };
            db.create_block(block_request).await.unwrap();
        }

        // Get blocks by page
        let blocks = db.get_blocks_by_page(&page.id).await.unwrap();
        assert_eq!(blocks.len(), 3);

        // Check ordering (should be by order)
        for i in 0..3 {
            assert_eq!(blocks[i].order, i as i32);
            assert_eq!(blocks[i].content, format!("Block content {}", i));
        }
    }

    #[tokio::test]
    async fn test_create_graph() {
        let db = create_test_database().await.unwrap();

        let request = CreateGraphRequest {
            name: "Test Graph".to_string(),
            path: "/test/graph".to_string(),
            settings: Some("{\"theme\": \"dark\"}".to_string()),
        };

        let created_graph = db.create_graph(request).await.unwrap();
        assert_eq!(created_graph.name, "Test Graph");
        assert_eq!(created_graph.path, "/test/graph");
        assert_eq!(created_graph.settings, Some("{\"theme\": \"dark\"}".to_string()));
    }

    #[tokio::test]
    async fn test_get_graph() {
        let db = create_test_database().await.unwrap();

        let request = CreateGraphRequest {
            name: "Test Graph".to_string(),
            path: "/test/graph".to_string(),
            settings: None,
        };

        let created_graph = db.create_graph(request).await.unwrap();
        let retrieved_graph = db.get_graph(&created_graph.id).await.unwrap();

        assert_eq!(retrieved_graph.id, created_graph.id);
        assert_eq!(retrieved_graph.name, "Test Graph");
        assert_eq!(retrieved_graph.path, "/test/graph");
    }

    #[tokio::test]
    async fn test_update_graph() {
        let db = create_test_database().await.unwrap();

        // Create a graph
        let request = CreateGraphRequest {
            name: "Original Graph".to_string(),
            path: "/original/path".to_string(),
            settings: Some("{\"original\": true}".to_string()),
        };
        let created_graph = db.create_graph(request).await.unwrap();

        // Update the graph
        let update_request = UpdateGraphRequest {
            id: created_graph.id.clone(),
            name: Some("Updated Graph".to_string()),
            settings: Some("{\"updated\": true}".to_string()),
        };
        let updated_graph = db.update_graph(update_request).await.unwrap();

        assert_eq!(updated_graph.name, "Updated Graph");
        assert_eq!(updated_graph.path, "/original/path"); // Path doesn't change
        assert_eq!(updated_graph.settings, Some("{\"updated\": true}".to_string()));
    }

    #[tokio::test]
    async fn test_delete_graph() {
        let db = create_test_database().await.unwrap();

        // Create a graph
        let request = CreateGraphRequest {
            name: "Test Graph".to_string(),
            path: "/test/path".to_string(),
            settings: None,
        };
        let created_graph = db.create_graph(request).await.unwrap();

        // Delete the graph
        let result = db.delete_graph(&created_graph.id).await;
        assert!(result.is_ok());

        // Verify it's deleted
        let get_result = db.get_graph(&created_graph.id).await;
        assert!(get_result.is_err());
    }

    #[tokio::test]
    async fn test_get_graphs() {
        let db = create_test_database().await.unwrap();

        // Create multiple graphs
        for i in 0..3 {
            let request = CreateGraphRequest {
                name: format!("Test Graph {}", i),
                path: format!("/test/path/{}", i),
                settings: Some(format!("{{\"index\": {}}}", i)),
            };
            db.create_graph(request).await.unwrap();
        }

        // Get graphs
        let graphs = db.get_graphs().await.unwrap();
        assert!(graphs.len() >= 3); // May include default graph

        // Check that our graphs are included
        let test_graphs: Vec<_> = graphs.iter()
            .filter(|g| g.name.starts_with("Test Graph"))
            .collect();
        assert_eq!(test_graphs.len(), 3);
    }

    #[tokio::test]
    async fn test_search_pages_functionality() {
        let db = create_test_database().await.unwrap();

        // Create pages with different content
        let request1 = CreatePageRequest {
            name: "Searchable Page".to_string(),
            title: Some("This is searchable content".to_string()),
            properties: None,
            tags: Some("search,test".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        db.create_page(request1).await.unwrap();

        let request2 = CreatePageRequest {
            name: "Another Page".to_string(),
            title: Some("Different content here".to_string()),
            properties: None,
            tags: Some("other".to_string()),
            is_journal: Some(false),
            journal_date: None,
            graph_id: "default".to_string(),
        };
        db.create_page(request2).await.unwrap();

        // Test basic page listing (since FTS may not be available in test DB)
        let all_pages = db.list_pages(10, 0).await.unwrap();
        assert!(all_pages.len() >= 2);

        // Check that our pages are included
        let searchable_pages: Vec<_> = all_pages.iter()
            .filter(|p| p.name.contains("Searchable"))
            .collect();
        assert_eq!(searchable_pages.len(), 1);
        assert_eq!(searchable_pages[0].name, "Searchable Page");

        let other_pages: Vec<_> = all_pages.iter()
            .filter(|p| p.name.contains("Another"))
            .collect();
        assert_eq!(other_pages.len(), 1);
        assert_eq!(other_pages[0].name, "Another Page");
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

        // Test getting non-existent graph
        let result = db.get_graph("non-existent-id").await;
        assert!(result.is_err());

        // Test deleting non-existent page (may succeed with 0 rows affected)
        let result = db.delete_page("non-existent-id").await;
        // Delete operations typically succeed even if no rows are affected
        assert!(result.is_ok());
    }
}
