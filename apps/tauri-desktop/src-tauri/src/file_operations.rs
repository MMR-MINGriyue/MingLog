use std::fs;
use std::path::{Path, PathBuf};
use anyhow::Result;
use chrono::{DateTime, Utc};
use pulldown_cmark::{Parser, Options, Event, Tag};
use serde::{Deserialize, Serialize};

use crate::models::{Page, Block, Tag as TagModel, CreatePageRequest, CreateBlockRequest};
use crate::database::Database;

#[cfg(test)]
mod tests;

#[derive(Debug, Serialize, Deserialize)]
pub struct MarkdownFrontmatter {
    pub title: Option<String>,
    pub tags: Option<Vec<String>>,
    pub created: Option<String>,
    pub updated: Option<String>,
    pub is_journal: Option<bool>,
    pub journal_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub pages_imported: usize,
    pub blocks_imported: usize,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub files_exported: usize,
    pub total_size: u64,
    pub export_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupData {
    pub version: String,
    pub created_at: DateTime<Utc>,
    pub pages: Vec<Page>,
    pub blocks: Vec<Block>,
    pub tags: Vec<TagModel>,
}

pub struct FileOperations;

#[allow(dead_code)]
impl FileOperations {
    /// Parse Markdown file with frontmatter
    pub fn parse_markdown_file(content: &str) -> Result<(MarkdownFrontmatter, String)> {
        let mut frontmatter = MarkdownFrontmatter {
            title: None,
            tags: None,
            created: None,
            updated: None,
            is_journal: None,
            journal_date: None,
        };
        
        let markdown_content = if content.starts_with("---\n") {
            // Extract frontmatter
            let end_pos = content[4..].find("\n---\n").map(|pos| pos + 4);
            if let Some(end_pos) = end_pos {
                let frontmatter_str = &content[4..end_pos];
                let content_str = &content[end_pos + 5..];
                
                // Parse YAML frontmatter
                if let Ok(fm) = serde_yaml::from_str::<MarkdownFrontmatter>(frontmatter_str) {
                    frontmatter = fm;
                }
                
                content_str.to_string()
            } else {
                content.to_string()
            }
        } else {
            content.to_string()
        };
        
        Ok((frontmatter, markdown_content))
    }
    
    /// Convert Markdown content to blocks
    pub fn markdown_to_blocks(markdown: &str) -> Vec<String> {
        let mut blocks = Vec::new();
        let mut current_block = String::new();
        
        let parser = Parser::new_ext(markdown, Options::all());
        let mut in_code_block = false;
        
        for event in parser {
            match event {
                Event::Start(Tag::CodeBlock(_)) => {
                    if !current_block.trim().is_empty() {
                        blocks.push(current_block.trim().to_string());
                        current_block.clear();
                    }
                    in_code_block = true;
                    current_block.push_str("```");
                }
                Event::End(Tag::CodeBlock(_)) => {
                    current_block.push_str("```");
                    blocks.push(current_block.trim().to_string());
                    current_block.clear();
                    in_code_block = false;
                }
                Event::Start(Tag::Heading(_, _, _)) => {
                    if !current_block.trim().is_empty() {
                        blocks.push(current_block.trim().to_string());
                        current_block.clear();
                    }
                }
                Event::End(Tag::Heading(_, _, _)) => {
                    blocks.push(current_block.trim().to_string());
                    current_block.clear();
                }
                Event::Start(Tag::Paragraph) => {
                    if !current_block.trim().is_empty() && !in_code_block {
                        blocks.push(current_block.trim().to_string());
                        current_block.clear();
                    }
                }
                Event::End(Tag::Paragraph) => {
                    if !in_code_block && !current_block.trim().is_empty() {
                        blocks.push(current_block.trim().to_string());
                        current_block.clear();
                    }
                }
                Event::Text(text) => {
                    current_block.push_str(&text);
                }
                Event::Code(code) => {
                    current_block.push('`');
                    current_block.push_str(&code);
                    current_block.push('`');
                }
                Event::SoftBreak | Event::HardBreak => {
                    if in_code_block {
                        current_block.push('\n');
                    } else {
                        current_block.push(' ');
                    }
                }
                _ => {}
            }
        }
        
        // Add any remaining content
        if !current_block.trim().is_empty() {
            blocks.push(current_block.trim().to_string());
        }
        
        // Filter out empty blocks
        blocks.into_iter().filter(|b| !b.trim().is_empty()).collect()
    }
    
    /// Convert page and blocks to Markdown format
    pub fn page_to_markdown(page: &Page, blocks: &[Block]) -> String {
        let mut markdown = String::new();
        
        // Add frontmatter
        markdown.push_str("---\n");
        if let Some(title) = &page.title {
            markdown.push_str(&format!("title: \"{}\"\n", title));
        }
        
        // Parse and add tags
        let tags: Vec<String> = serde_json::from_str(&page.tags).unwrap_or_default();
        if !tags.is_empty() {
            markdown.push_str("tags:\n");
            for tag in tags {
                markdown.push_str(&format!("  - \"{}\"\n", tag));
            }
        }
        
        markdown.push_str(&format!("created: \"{}\"\n", page.created_at.format("%Y-%m-%d %H:%M:%S")));
        markdown.push_str(&format!("updated: \"{}\"\n", page.updated_at.format("%Y-%m-%d %H:%M:%S")));
        
        if page.is_journal {
            markdown.push_str("is_journal: true\n");
            if let Some(journal_date) = &page.journal_date {
                markdown.push_str(&format!("journal_date: \"{}\"\n", journal_date));
            }
        }
        
        markdown.push_str("---\n\n");
        
        // Add page title as heading if different from frontmatter title
        if let Some(title) = &page.title {
            markdown.push_str(&format!("# {}\n\n", title));
        } else {
            markdown.push_str(&format!("# {}\n\n", page.name));
        }
        
        // Add blocks content
        for block in blocks {
            markdown.push_str(&block.content);
            markdown.push_str("\n\n");
        }
        
        markdown
    }
    
    /// Import single Markdown file
    pub async fn import_markdown_file(
        db: &Database,
        file_path: &Path,
        graph_id: &str,
    ) -> Result<ImportResult> {
        let content = fs::read_to_string(file_path)?;
        let (frontmatter, markdown_content) = Self::parse_markdown_file(&content)?;
        
        let mut result = ImportResult {
            pages_imported: 0,
            blocks_imported: 0,
            errors: Vec::new(),
        };
        
        // Create page
        let page_name = frontmatter.title
            .clone()
            .or_else(|| file_path.file_stem().map(|s| s.to_string_lossy().to_string()))
            .unwrap_or_else(|| "Untitled".to_string());
        
        let tags_json = if let Some(tags) = frontmatter.tags {
            serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string())
        } else {
            "[]".to_string()
        };
        
        let page_request = CreatePageRequest {
            graph_id: graph_id.to_string(),
            name: page_name,
            title: frontmatter.title,
            properties: None,
            tags: Some(tags_json),
            is_journal: frontmatter.is_journal,
            journal_date: frontmatter.journal_date,
        };
        
        match db.create_page(page_request).await {
            Ok(page) => {
                result.pages_imported += 1;
                
                // Convert markdown to blocks
                let block_contents = Self::markdown_to_blocks(&markdown_content);
                
                for (index, content) in block_contents.into_iter().enumerate() {
                    let block_request = CreateBlockRequest {
                        graph_id: graph_id.to_string(),
                        page_id: page.id.clone(),
                        content,
                        parent_id: None,
                        properties: None,
                        refs: Some("[]".to_string()),
                        order: Some(index as i32),
                    };
                    
                    match db.create_block(block_request).await {
                        Ok(_) => result.blocks_imported += 1,
                        Err(e) => result.errors.push(format!("Failed to create block: {}", e)),
                    }
                }
            }
            Err(e) => result.errors.push(format!("Failed to create page: {}", e)),
        }
        
        Ok(result)
    }
    
    /// Export page to Markdown file
    pub async fn export_page_to_markdown(
        db: &Database,
        page_id: &str,
        output_dir: &Path,
    ) -> Result<PathBuf> {
        let page = db.get_page(page_id).await?;
        let blocks = db.get_blocks_by_page(page_id).await?;

        let markdown_content = Self::page_to_markdown(&page, &blocks);

        // Create safe filename
        let filename = format!("{}.md", page.name.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_"));
        let file_path = output_dir.join(filename);

        fs::write(&file_path, markdown_content)?;

        Ok(file_path)
    }

    /// Export all pages to Markdown files
    pub async fn export_all_pages(
        db: &Database,
        output_dir: &Path,
    ) -> Result<ExportResult> {
        let pages = db.get_all_pages().await?;
        let mut files_exported = 0;
        let mut total_size = 0;

        // Ensure output directory exists
        fs::create_dir_all(output_dir)?;

        for page in pages {
            let blocks = db.get_blocks_by_page(&page.id).await?;
            let markdown_content = Self::page_to_markdown(&page, &blocks);

            // Create safe filename
            let filename = format!("{}.md", page.name.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_"));
            let file_path = output_dir.join(filename);

            fs::write(&file_path, &markdown_content)?;

            files_exported += 1;
            total_size += markdown_content.len() as u64;
        }

        Ok(ExportResult {
            files_exported,
            total_size,
            export_path: output_dir.to_string_lossy().to_string(),
        })
    }

    /// Create backup of all data
    pub async fn create_backup(
        db: &Database,
        output_path: &str,
    ) -> Result<()> {
        let pages = db.get_all_pages().await?;
        let mut all_blocks = Vec::new();
        for page in &pages {
            let blocks = db.get_blocks_by_page(&page.id).await?;
            all_blocks.extend(blocks);
        }
        let tags = db.get_tags().await?;

        let backup_data = BackupData {
            version: "1.0".to_string(),
            created_at: chrono::Utc::now(),
            pages,
            blocks: all_blocks,
            tags,
        };

        let json_content = serde_json::to_string_pretty(&backup_data)?;
        fs::write(output_path, json_content)?;

        Ok(())
    }

    /// Restore backup data
    pub async fn restore_backup(
        db: &Database,
        backup_path: &str,
    ) -> Result<()> {
        let backup_content = fs::read_to_string(backup_path)?;
        let backup_data: BackupData = serde_json::from_str(&backup_content)?;

        // Clear existing data (in a transaction)
        // Note: This is a simplified implementation
        // In production, you'd want proper transaction handling

        // Restore pages
        for page in backup_data.pages {
            let create_request = crate::models::CreatePageRequest {
                name: page.name,
                title: page.title,
                graph_id: page.graph_id,
                is_journal: Some(page.is_journal),
                journal_date: page.journal_date,
                tags: Some(page.tags),
                properties: page.properties,
            };
            db.create_page(create_request).await?;
        }

        // Restore blocks
        for block in backup_data.blocks {
            let create_request = crate::models::CreateBlockRequest {
                content: block.content,
                page_id: block.page_id,
                graph_id: block.graph_id,
                parent_id: block.parent_id,
                order: Some(block.order),
                refs: Some(block.refs),
                properties: block.properties,
            };
            db.create_block(create_request).await?;
        }

        Ok(())
    }
}
