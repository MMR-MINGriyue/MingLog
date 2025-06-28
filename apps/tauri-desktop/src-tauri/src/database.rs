// Database module for MingLog Tauri application
// This module handles SQLite database operations

use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Page {
    pub id: String,
    pub title: String,
    pub content: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub page_id: String,
    pub content: String,
    pub block_type: String,
    pub position: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        // Create pages table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS pages (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create blocks table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS blocks (
                id TEXT PRIMARY KEY,
                page_id TEXT NOT NULL,
                content TEXT NOT NULL,
                block_type TEXT NOT NULL DEFAULT 'paragraph',
                position INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create tags table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tags (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                color TEXT DEFAULT '#3b82f6',
                created_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Create page_tags junction table
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS page_tags (
                page_id TEXT NOT NULL,
                tag_id TEXT NOT NULL,
                PRIMARY KEY (page_id, tag_id),
                FOREIGN KEY (page_id) REFERENCES pages (id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes for better performance
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks (page_id)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks (page_id, position)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages (updated_at DESC)",
            [],
        )?;

        Ok(())
    }

    pub fn create_page(&self, page: &Page) -> Result<()> {
        self.conn.execute(
            "INSERT INTO pages (id, title, content, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            [&page.id, &page.title, &page.content, &page.created_at.to_string(), &page.updated_at.to_string()],
        )?;
        Ok(())
    }

    pub fn get_page(&self, id: &str) -> Result<Option<Page>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, created_at, updated_at FROM pages WHERE id = ?1"
        )?;

        let page_iter = stmt.query_map([id], |row| {
            Ok(Page {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        for page in page_iter {
            return Ok(Some(page?));
        }

        Ok(None)
    }

    pub fn get_all_pages(&self) -> Result<Vec<Page>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, content, created_at, updated_at FROM pages ORDER BY updated_at DESC"
        )?;

        let page_iter = stmt.query_map([], |row| {
            Ok(Page {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })?;

        let mut pages = Vec::new();
        for page in page_iter {
            pages.push(page?);
        }

        Ok(pages)
    }

    pub fn update_page(&self, page: &Page) -> Result<()> {
        self.conn.execute(
            "UPDATE pages SET title = ?1, content = ?2, updated_at = ?3 WHERE id = ?4",
            [&page.title, &page.content, &page.updated_at.to_string(), &page.id],
        )?;
        Ok(())
    }

    pub fn delete_page(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM pages WHERE id = ?1", [id])?;
        Ok(())
    }

    // Block operations
    pub fn create_block(&self, block: &Block) -> Result<()> {
        self.conn.execute(
            "INSERT INTO blocks (id, page_id, content, block_type, position, created_at, updated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &block.id, 
                &block.page_id, 
                &block.content, 
                &block.block_type, 
                &block.position.to_string(),
                &block.created_at.to_string(), 
                &block.updated_at.to_string()
            ],
        )?;
        Ok(())
    }

    pub fn get_blocks_by_page(&self, page_id: &str) -> Result<Vec<Block>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, page_id, content, block_type, position, created_at, updated_at 
             FROM blocks WHERE page_id = ?1 ORDER BY position"
        )?;

        let block_iter = stmt.query_map([page_id], |row| {
            Ok(Block {
                id: row.get(0)?,
                page_id: row.get(1)?,
                content: row.get(2)?,
                block_type: row.get(3)?,
                position: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        let mut blocks = Vec::new();
        for block in block_iter {
            blocks.push(block?);
        }

        Ok(blocks)
    }

    pub fn update_block(&self, block: &Block) -> Result<()> {
        self.conn.execute(
            "UPDATE blocks SET content = ?1, block_type = ?2, position = ?3, updated_at = ?4 WHERE id = ?5",
            [&block.content, &block.block_type, &block.position.to_string(), &block.updated_at.to_string(), &block.id],
        )?;
        Ok(())
    }

    pub fn delete_block(&self, id: &str) -> Result<()> {
        self.conn.execute("DELETE FROM blocks WHERE id = ?1", [id])?;
        Ok(())
    }
}
