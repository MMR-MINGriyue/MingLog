// File system utilities for MingLog Tauri application

use std::path::{Path, PathBuf};
use std::fs;
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: u64,
    pub extension: Option<String>,
}

pub struct FileManager;

impl FileManager {
    /// Read file content as string
    pub fn read_text_file<P: AsRef<Path>>(path: P) -> Result<String> {
        let content = fs::read_to_string(&path)
            .with_context(|| format!("Failed to read file: {}", path.as_ref().display()))?;
        Ok(content)
    }

    /// Write string content to file
    pub fn write_text_file<P: AsRef<Path>>(path: P, content: &str) -> Result<()> {
        // Create parent directories if they don't exist
        if let Some(parent) = path.as_ref().parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create parent directories for: {}", path.as_ref().display()))?;
        }

        fs::write(&path, content)
            .with_context(|| format!("Failed to write file: {}", path.as_ref().display()))?;
        Ok(())
    }

    /// List directory contents
    pub fn list_directory<P: AsRef<Path>>(path: P) -> Result<Vec<FileEntry>> {
        let dir = fs::read_dir(&path)
            .with_context(|| format!("Failed to read directory: {}", path.as_ref().display()))?;

        let mut entries = Vec::new();

        for entry in dir {
            let entry = entry.context("Failed to read directory entry")?;
            let metadata = entry.metadata().context("Failed to read file metadata")?;
            let path = entry.path();

            let file_entry = FileEntry {
                name: entry.file_name().to_string_lossy().to_string(),
                path: path.to_string_lossy().to_string(),
                is_directory: metadata.is_dir(),
                size: metadata.len(),
                modified: metadata
                    .modified()
                    .unwrap_or(std::time::UNIX_EPOCH)
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
                extension: path.extension().map(|ext| ext.to_string_lossy().to_string()),
            };

            entries.push(file_entry);
        }

        // Sort entries: directories first, then files, both alphabetically
        entries.sort_by(|a, b| {
            match (a.is_directory, b.is_directory) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            }
        });

        Ok(entries)
    }

    /// Create directory (including parent directories)
    pub fn create_directory<P: AsRef<Path>>(path: P) -> Result<()> {
        fs::create_dir_all(&path)
            .with_context(|| format!("Failed to create directory: {}", path.as_ref().display()))?;
        Ok(())
    }

    /// Delete file
    pub fn delete_file<P: AsRef<Path>>(path: P) -> Result<()> {
        fs::remove_file(&path)
            .with_context(|| format!("Failed to delete file: {}", path.as_ref().display()))?;
        Ok(())
    }

    /// Delete directory (recursively)
    pub fn delete_directory<P: AsRef<Path>>(path: P) -> Result<()> {
        fs::remove_dir_all(&path)
            .with_context(|| format!("Failed to delete directory: {}", path.as_ref().display()))?;
        Ok(())
    }

    /// Copy file
    pub fn copy_file<P: AsRef<Path>, Q: AsRef<Path>>(source: P, destination: Q) -> Result<()> {
        // Create parent directories for destination if they don't exist
        if let Some(parent) = destination.as_ref().parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create parent directories for: {}", destination.as_ref().display()))?;
        }

        fs::copy(&source, &destination)
            .with_context(|| format!(
                "Failed to copy file from {} to {}",
                source.as_ref().display(),
                destination.as_ref().display()
            ))?;
        Ok(())
    }

    /// Move/rename file
    pub fn move_file<P: AsRef<Path>, Q: AsRef<Path>>(source: P, destination: Q) -> Result<()> {
        // Create parent directories for destination if they don't exist
        if let Some(parent) = destination.as_ref().parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create parent directories for: {}", destination.as_ref().display()))?;
        }

        fs::rename(&source, &destination)
            .with_context(|| format!(
                "Failed to move file from {} to {}",
                source.as_ref().display(),
                destination.as_ref().display()
            ))?;
        Ok(())
    }

    /// Check if file or directory exists
    pub fn exists<P: AsRef<Path>>(path: P) -> bool {
        path.as_ref().exists()
    }

    /// Get file metadata
    pub fn get_metadata<P: AsRef<Path>>(path: P) -> Result<FileEntry> {
        let path_ref = path.as_ref();
        let metadata = fs::metadata(path_ref)
            .with_context(|| format!("Failed to get metadata for: {}", path_ref.display()))?;

        Ok(FileEntry {
            name: path_ref
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            path: path_ref.to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
            size: metadata.len(),
            modified: metadata
                .modified()
                .unwrap_or(std::time::UNIX_EPOCH)
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            extension: path_ref.extension().map(|ext| ext.to_string_lossy().to_string()),
        })
    }

    /// Find files by extension in directory (recursive)
    pub fn find_files_by_extension<P: AsRef<Path>>(
        directory: P,
        extension: &str,
    ) -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();
        Self::find_files_recursive(directory.as_ref(), extension, &mut files)?;
        Ok(files)
    }

    fn find_files_recursive(
        dir: &Path,
        extension: &str,
        files: &mut Vec<PathBuf>,
    ) -> Result<()> {
        if dir.is_dir() {
            let entries = fs::read_dir(dir)
                .with_context(|| format!("Failed to read directory: {}", dir.display()))?;

            for entry in entries {
                let entry = entry.context("Failed to read directory entry")?;
                let path = entry.path();

                if path.is_dir() {
                    Self::find_files_recursive(&path, extension, files)?;
                } else if let Some(ext) = path.extension() {
                    if ext.to_string_lossy().to_lowercase() == extension.to_lowercase() {
                        files.push(path);
                    }
                }
            }
        }

        Ok(())
    }

    /// Get directory size (recursive)
    pub fn get_directory_size<P: AsRef<Path>>(path: P) -> Result<u64> {
        let mut size = 0;
        Self::calculate_directory_size(path.as_ref(), &mut size)?;
        Ok(size)
    }

    fn calculate_directory_size(dir: &Path, total_size: &mut u64) -> Result<()> {
        if dir.is_dir() {
            let entries = fs::read_dir(dir)
                .with_context(|| format!("Failed to read directory: {}", dir.display()))?;

            for entry in entries {
                let entry = entry.context("Failed to read directory entry")?;
                let path = entry.path();

                if path.is_dir() {
                    Self::calculate_directory_size(&path, total_size)?;
                } else {
                    let metadata = entry.metadata().context("Failed to read file metadata")?;
                    *total_size += metadata.len();
                }
            }
        }

        Ok(())
    }
}
