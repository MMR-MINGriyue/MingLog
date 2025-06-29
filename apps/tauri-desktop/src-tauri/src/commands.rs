use crate::error::Result;

#[cfg(test)]
mod tests;
use crate::models::{
    AppInfo, Graph, Page, Block, Note, Tag, Settings,
    CreateGraphRequest, UpdateGraphRequest,
    CreatePageRequest, UpdatePageRequest,
    CreateBlockRequest, UpdateBlockRequest,
    CreateNoteRequest, UpdateNoteRequest, CreateTagRequest,
    SearchRequest, SearchResult,
    BlockSearchRequest, BlockSearchResponse, BlockSearchResult,
};
use crate::state::AppState;
use serde_json::Value;
use sqlx::Row;
use std::collections::HashMap;
use tauri::State;

// App commands
#[tauri::command]
pub async fn init_app() -> Result<String> {
    log::info!("Initializing MingLog Desktop app");
    Ok("App initialized successfully".to_string())
}

#[tauri::command]
pub async fn get_app_info() -> Result<AppInfo> {
    Ok(AppInfo {
        name: "MingLog Desktop".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        description: env!("CARGO_PKG_DESCRIPTION").to_string(),
        author: "MingLog Team".to_string(),
    })
}

// Database commands
#[tauri::command]
pub async fn init_database(_state: State<'_, AppState>) -> Result<String> {
    log::info!("Database already initialized");
    Ok("Database ready".to_string())
}

// Note commands
#[tauri::command]
pub async fn create_note(
    request: CreateNoteRequest,
    state: State<'_, AppState>,
) -> Result<Note> {
    let db = state.db.lock().await;
    db.create_note(request).await
}

#[tauri::command]
pub async fn get_note(id: String, state: State<'_, AppState>) -> Result<Note> {
    let db = state.db.lock().await;
    db.get_note(&id).await
}

#[tauri::command]
pub async fn get_notes(
    limit: Option<i32>,
    offset: Option<i32>,
    state: State<'_, AppState>,
) -> Result<Vec<Note>> {
    let db = state.db.lock().await;
    db.get_notes(limit, offset).await
}

#[tauri::command]
pub async fn update_note(
    request: UpdateNoteRequest,
    state: State<'_, AppState>,
) -> Result<Note> {
    let db = state.db.lock().await;
    db.update_note(request).await
}

#[tauri::command]
pub async fn delete_note(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_note(&id).await
}

#[tauri::command]
pub async fn search_notes(
    request: SearchRequest,
    state: State<'_, AppState>,
) -> Result<SearchResult> {
    let db = state.db.lock().await;
    db.search_notes(request).await
}

#[tauri::command]
pub async fn search_blocks(
    request: BlockSearchRequest,
    state: State<'_, AppState>,
) -> Result<BlockSearchResponse> {
    let db = state.db.lock().await;

    // Use optimized FTS search instead of full scan
    let mut results = Vec::new();
    let limit = request.limit.unwrap_or(20) as i32;
    let query_escaped = request.query.replace("'", "''"); // Escape single quotes for FTS

    // Search pages using FTS if requested
    if request.include_pages.unwrap_or(true) {
        let page_query = format!(
            r#"
            SELECT p.*, rank
            FROM pages_fts
            JOIN pages p ON pages_fts.id = p.id
            WHERE pages_fts MATCH '{}'
            AND p.graph_id = 'default'
            ORDER BY rank
            LIMIT {}
            "#,
            query_escaped, limit
        );

        let page_rows = sqlx::query(&page_query)
            .fetch_all(db.get_pool())
            .await
            .unwrap_or_default();

        for row in page_rows {
            let page_id: String = row.get("id");
            let name: String = row.get("name");
            let title: Option<String> = row.get("title");
            let tags_json: String = row.get("tags");
            let is_journal: bool = row.get("is_journal");
            let created_at: String = row.get("created_at");
            let updated_at: String = row.get("updated_at");

            // Parse timestamps
            let created_timestamp = chrono::DateTime::parse_from_rfc3339(&created_at)
                .unwrap_or_else(|_| chrono::Utc::now().into())
                .timestamp();
            let updated_timestamp = chrono::DateTime::parse_from_rfc3339(&updated_at)
                .unwrap_or_else(|_| chrono::Utc::now().into())
                .timestamp();

            // Parse tags from JSON string
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            results.push(BlockSearchResult {
                id: page_id.clone(),
                result_type: "page".to_string(),
                title: title.clone().unwrap_or_else(|| name.clone()),
                content: name.clone(),
                excerpt: name.clone(),
                score: 0.9, // FTS provides relevance, we'll use a fixed high score for pages
                page_id: Some(page_id.clone()),
                page_name: Some(name),
                block_id: None,
                tags,
                is_journal,
                created_at: created_timestamp,
                updated_at: updated_timestamp,
            });
        }
    }

    // Search blocks using FTS if requested
    if request.include_blocks.unwrap_or(true) {
        let mut block_query = format!(
            r#"
            SELECT b.*, p.name as page_name, p.is_journal, rank
            FROM blocks_fts
            JOIN blocks b ON blocks_fts.id = b.id
            JOIN pages p ON b.page_id = p.id
            WHERE blocks_fts MATCH '{}'
            AND b.graph_id = 'default'
            "#,
            query_escaped
        );

        // Add page filter if specified
        if let Some(page_id) = &request.page_id {
            block_query.push_str(&format!(" AND b.page_id = '{}'", page_id));
        }

        block_query.push_str(&format!(" ORDER BY rank LIMIT {}", limit));

        let block_rows = sqlx::query(&block_query)
            .fetch_all(db.get_pool())
            .await
            .unwrap_or_default();

        for row in block_rows {
            let block_id: String = row.get("id");
            let content: String = row.get("content");
            let page_id: String = row.get("page_id");
            let page_name: String = row.get("page_name");
            let is_journal: bool = row.get("is_journal");
            let refs_json: String = row.get("refs");
            let created_at: String = row.get("created_at");
            let updated_at: String = row.get("updated_at");

            // Parse timestamps
            let created_timestamp = chrono::DateTime::parse_from_rfc3339(&created_at)
                .unwrap_or_else(|_| chrono::Utc::now().into())
                .timestamp();
            let updated_timestamp = chrono::DateTime::parse_from_rfc3339(&updated_at)
                .unwrap_or_else(|_| chrono::Utc::now().into())
                .timestamp();

            // Generate excerpt around the match
            let query_lower = request.query.to_lowercase();
            let content_lower = content.to_lowercase();
            let match_pos = content_lower.find(&query_lower).unwrap_or(0);
            let start = match_pos.saturating_sub(50);
            let end = std::cmp::min(content.len(), start + 150);
            let excerpt = if start > 0 { "..." } else { "" }.to_string() +
                &content[start..end] +
                if end < content.len() { "..." } else { "" };

            // Parse refs from JSON string
            let tags: Vec<String> = serde_json::from_str(&refs_json).unwrap_or_default();

            results.push(BlockSearchResult {
                id: block_id.clone(),
                result_type: "block".to_string(),
                title: content.lines().next().unwrap_or("").to_string(),
                content: content.clone(),
                excerpt,
                score: 0.8, // FTS provides relevance, we'll use a fixed score for blocks
                page_id: Some(page_id),
                page_name: Some(page_name),
                block_id: Some(block_id),
                tags,
                is_journal,
                created_at: created_timestamp,
                updated_at: updated_timestamp,
            });
        }
    }

    // Sort by score (descending)
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    // Apply limit
    let limit = request.limit.unwrap_or(50) as usize;
    let total = results.len() as i64;
    results.truncate(limit);

    Ok(BlockSearchResponse {
        results,
        total,
        query: request.query,
    })
}

#[tauri::command]
pub async fn search_in_page(
    page_id: String,
    query: String,
    state: State<'_, AppState>,
) -> Result<BlockSearchResponse> {
    let request = BlockSearchRequest {
        query: query.clone(),
        page_id: Some(page_id),
        include_pages: Some(false),
        include_blocks: Some(true),
        tags: None,
        is_journal: None,
        limit: Some(20),
        threshold: None,
    };

    search_blocks(request, state).await
}

// Graph commands
#[tauri::command]
pub async fn get_graph_data(
    graph_id: String,
    include_blocks: Option<bool>,
    state: State<'_, AppState>,
) -> Result<serde_json::Value> {
    let db = state.db.lock().await;

    // Get all pages in the graph
    let pages = db.get_pages_by_graph(&graph_id).await?;

    // Get all blocks if requested
    let mut all_blocks = Vec::new();
    if include_blocks.unwrap_or(false) {
        for page in &pages {
            let page_blocks = db.get_blocks_by_page(&page.id).await?;
            all_blocks.extend(page_blocks);
        }
    }

    // Get all tags
    let tags = db.get_tags().await?;

    // Create graph data structure
    let graph_data = serde_json::json!({
        "pages": pages,
        "blocks": all_blocks,
        "tags": tags,
        "includeBlocks": include_blocks.unwrap_or(false)
    });

    Ok(graph_data)
}

#[tauri::command]
pub async fn create_sample_graph_data(state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;

    // Create sample pages
    let page1 = CreatePageRequest {
        graph_id: "default".to_string(),
        name: "Machine Learning Basics".to_string(),
        title: Some("Introduction to Machine Learning".to_string()),
        properties: None,
        tags: Some(serde_json::to_string(&vec!["AI", "Learning"]).unwrap()),
        is_journal: Some(false),
        journal_date: None,
    };

    let page2 = CreatePageRequest {
        graph_id: "default".to_string(),
        name: "Deep Learning".to_string(),
        title: Some("Deep Learning Fundamentals".to_string()),
        properties: None,
        tags: Some(serde_json::to_string(&vec!["AI", "Neural Networks"]).unwrap()),
        is_journal: Some(false),
        journal_date: None,
    };

    let page3 = CreatePageRequest {
        graph_id: "default".to_string(),
        name: "Daily Journal".to_string(),
        title: Some("Today's Learning".to_string()),
        properties: None,
        tags: Some(serde_json::to_string(&vec!["Journal", "Learning"]).unwrap()),
        is_journal: Some(true),
        journal_date: Some(chrono::Utc::now().format("%Y-%m-%d").to_string()),
    };

    // Create the pages
    let created_page1 = db.create_page(page1).await?;
    let created_page2 = db.create_page(page2).await?;
    let created_page3 = db.create_page(page3).await?;

    // Create sample blocks
    let block1 = CreateBlockRequest {
        graph_id: "default".to_string(),
        page_id: created_page1.id.clone(),
        content: "Machine learning is a subset of artificial intelligence that focuses on algorithms.".to_string(),
        parent_id: None,
        properties: None,
        refs: Some(serde_json::to_string(&vec!["Deep Learning"]).unwrap()),
        order: Some(0),
    };

    let block2 = CreateBlockRequest {
        graph_id: "default".to_string(),
        page_id: created_page2.id.clone(),
        content: "Deep learning uses neural networks with multiple layers to learn complex patterns.".to_string(),
        parent_id: None,
        properties: None,
        refs: Some(serde_json::to_string(&vec!["Machine Learning Basics"]).unwrap()),
        order: Some(0),
    };

    let block3 = CreateBlockRequest {
        graph_id: "default".to_string(),
        page_id: created_page3.id.clone(),
        content: "Today I learned about the connection between machine learning and deep learning.".to_string(),
        parent_id: None,
        properties: None,
        refs: Some(serde_json::to_string(&vec!["Machine Learning Basics", "Deep Learning"]).unwrap()),
        order: Some(0),
    };

    // Create blocks for each page
    db.create_block(block1).await?;
    db.create_block(block2).await?;
    db.create_block(block3).await?;

    Ok(())
}

// File Operations commands
#[tauri::command]
pub async fn import_markdown_file(
    file_path: String,
    graph_id: String,
    state: State<'_, AppState>,
) -> Result<crate::file_operations::ImportResult> {
    let db = state.db.lock().await;
    let path = std::path::Path::new(&file_path);

    crate::file_operations::FileOperations::import_markdown_file(&db, path, &graph_id).await
        .map_err(|e| crate::error::AppError::Database(format!("Import failed: {}", e)))
}

#[tauri::command]
pub async fn export_page_to_markdown(
    page_id: String,
    output_dir: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let db = state.db.lock().await;
    let output_path = std::path::Path::new(&output_dir);

    let file_path = crate::file_operations::FileOperations::export_page_to_markdown(&db, &page_id, output_path).await
        .map_err(|e| crate::error::AppError::Database(format!("Export failed: {}", e)))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn bulk_export_pages(
    page_ids: Vec<String>,
    output_dir: String,
    state: State<'_, AppState>,
) -> Result<crate::file_operations::ExportResult> {
    let db = state.db.lock().await;
    let output_path = std::path::Path::new(&output_dir);

    let mut files_exported = 0;
    let mut total_size = 0u64;

    for page_id in page_ids {
        match crate::file_operations::FileOperations::export_page_to_markdown(&db, &page_id, output_path).await {
            Ok(file_path) => {
                files_exported += 1;
                if let Ok(metadata) = std::fs::metadata(&file_path) {
                    total_size += metadata.len();
                }
            }
            Err(e) => {
                eprintln!("Failed to export page {}: {}", page_id, e);
            }
        }
    }

    Ok(crate::file_operations::ExportResult {
        files_exported,
        total_size,
        export_path: output_dir,
    })
}

#[tauri::command]
pub async fn create_backup(
    output_path: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let db = state.db.lock().await;

    // Get all data
    let pages = db.get_all_pages().await?;
    let mut all_blocks = Vec::new();
    for page in &pages {
        let blocks = db.get_blocks_by_page(&page.id).await?;
        all_blocks.extend(blocks);
    }
    let tags = db.get_tags().await?;

    let backup_data = crate::file_operations::BackupData {
        version: "1.0".to_string(),
        created_at: chrono::Utc::now(),
        pages,
        blocks: all_blocks,
        tags,
    };

    let json_content = serde_json::to_string_pretty(&backup_data)
        .map_err(|e| crate::error::AppError::Database(format!("Serialization failed: {}", e)))?;

    std::fs::write(&output_path, json_content)
        .map_err(|e| crate::error::AppError::Database(format!("Write failed: {}", e)))?;

    Ok(output_path)
}

// Tag commands
#[tauri::command]
pub async fn get_tags(state: State<'_, AppState>) -> Result<Vec<Tag>> {
    let db = state.db.lock().await;
    db.get_tags().await
}

#[tauri::command]
pub async fn create_tag(
    request: CreateTagRequest,
    state: State<'_, AppState>,
) -> Result<Tag> {
    let db = state.db.lock().await;
    db.create_tag(request).await
}

#[tauri::command]
pub async fn delete_tag(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_tag(&id).await
}

// Settings commands
#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<HashMap<String, String>> {
    let db = state.db.lock().await;
    let settings = db.get_all_settings().await?;
    
    let mut map = HashMap::new();
    for setting in settings {
        map.insert(setting.key, setting.value);
    }
    
    Ok(map)
}

#[tauri::command]
pub async fn update_settings(
    settings: HashMap<String, String>,
    state: State<'_, AppState>,
) -> Result<()> {
    let db = state.db.lock().await;
    
    for (key, value) in settings {
        db.set_setting(&key, &value).await?;
    }
    
    Ok(())
}

// File commands
#[tauri::command]
pub async fn save_file(
    path: String,
    content: String,
) -> Result<()> {
    tokio::fs::write(&path, content).await?;
    Ok(())
}

#[tauri::command]
pub async fn load_file(path: String) -> Result<String> {
    let content = tokio::fs::read_to_string(&path).await?;
    Ok(content)
}

#[tauri::command]
pub async fn export_data(
    path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let db = state.db.lock().await;
    
    // Get all data
    let notes = db.get_notes(None, None).await?;
    let tags = db.get_tags().await?;
    let settings = db.get_all_settings().await?;
    
    // Create export data structure
    let export_data = serde_json::json!({
        "version": "1.0",
        "exported_at": chrono::Utc::now().to_rfc3339(),
        "notes": notes,
        "tags": tags,
        "settings": settings
    });
    
    // Write to file
    let json_string = serde_json::to_string_pretty(&export_data)?;
    tokio::fs::write(&path, json_string).await?;
    
    Ok(())
}

#[tauri::command]
pub async fn import_data(
    path: String,
    state: State<'_, AppState>,
) -> Result<String> {
    let content = tokio::fs::read_to_string(&path).await?;
    let import_data: Value = serde_json::from_str(&content)?;
    
    let db = state.db.lock().await;
    
    let mut imported_count = 0;
    
    // Import notes
    if let Some(notes) = import_data["notes"].as_array() {
        for note_value in notes {
            if let Ok(note) = serde_json::from_value::<Note>(note_value.clone()) {
                let tags = note.get_tags();
                let request = CreateNoteRequest {
                    title: note.title,
                    content: note.content,
                    tags: Some(tags),
                };
                
                if db.create_note(request).await.is_ok() {
                    imported_count += 1;
                }
            }
        }
    }
    
    // Import tags
    if let Some(tags) = import_data["tags"].as_array() {
        for tag_value in tags {
            if let Ok(tag) = serde_json::from_value::<Tag>(tag_value.clone()) {
                let request = CreateTagRequest {
                    name: tag.name,
                    color: tag.color,
                };
                
                let _ = db.create_tag(request).await;
            }
        }
    }
    
    // Import settings
    if let Some(settings) = import_data["settings"].as_array() {
        for setting_value in settings {
            if let Ok(setting) = serde_json::from_value::<Settings>(setting_value.clone()) {
                let _ = db.set_setting(&setting.key, &setting.value).await;
            }
        }
    }
    
    Ok(format!("Successfully imported {} items", imported_count))
}

// Graph commands
#[tauri::command]
pub async fn create_graph(
    request: CreateGraphRequest,
    state: State<'_, AppState>,
) -> Result<Graph> {
    let db = state.db.lock().await;
    db.create_graph(request).await
}

#[tauri::command]
pub async fn get_graph(id: String, state: State<'_, AppState>) -> Result<Graph> {
    let db = state.db.lock().await;
    db.get_graph(&id).await
}

#[tauri::command]
pub async fn get_graphs(state: State<'_, AppState>) -> Result<Vec<Graph>> {
    let db = state.db.lock().await;
    db.get_graphs().await
}

#[tauri::command]
pub async fn update_graph(
    request: UpdateGraphRequest,
    state: State<'_, AppState>,
) -> Result<Graph> {
    let db = state.db.lock().await;
    db.update_graph(request).await
}

#[tauri::command]
pub async fn delete_graph(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_graph(&id).await
}

// Page commands
#[tauri::command]
pub async fn create_page(
    request: CreatePageRequest,
    state: State<'_, AppState>,
) -> Result<Page> {
    let db = state.db.lock().await;
    db.create_page(request).await
}

#[tauri::command]
pub async fn get_page(id: String, state: State<'_, AppState>) -> Result<Page> {
    let db = state.db.lock().await;
    db.get_page(&id).await
}

#[tauri::command]
pub async fn get_pages_by_graph(
    graph_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Page>> {
    let db = state.db.lock().await;
    db.get_pages_by_graph(&graph_id).await
}

#[tauri::command]
pub async fn update_page(
    request: UpdatePageRequest,
    state: State<'_, AppState>,
) -> Result<Page> {
    let db = state.db.lock().await;
    db.update_page(request).await
}

#[tauri::command]
pub async fn delete_page(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_page(&id).await
}

// Block commands
#[tauri::command]
pub async fn create_block(
    request: CreateBlockRequest,
    state: State<'_, AppState>,
) -> Result<Block> {
    let db = state.db.lock().await;
    db.create_block(request).await
}

#[tauri::command]
pub async fn get_block(id: String, state: State<'_, AppState>) -> Result<Block> {
    let db = state.db.lock().await;
    db.get_block(&id).await
}

#[tauri::command]
pub async fn get_blocks_by_page(
    page_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<Block>> {
    let db = state.db.lock().await;
    db.get_blocks_by_page(&page_id).await
}

#[tauri::command]
pub async fn update_block(
    request: UpdateBlockRequest,
    state: State<'_, AppState>,
) -> Result<Block> {
    let db = state.db.lock().await;
    db.update_block(request).await
}

#[tauri::command]
pub async fn delete_block(id: String, state: State<'_, AppState>) -> Result<()> {
    let db = state.db.lock().await;
    db.delete_block(&id).await
}
