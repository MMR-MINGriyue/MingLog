use tauri::{api::dialog, Window};
use serde_json::Value;

#[tauri::command]
pub async fn show_open_dialog(
    window: Window,
    options: Option<Value>
) -> Result<Option<Vec<String>>, String> {
    let mut builder = dialog::FileDialogBuilder::new();
    
    // 解析选项
    if let Some(opts) = options {
        if let Some(title) = opts.get("title").and_then(|v| v.as_str()) {
            builder = builder.set_title(title);
        }
        
        if let Some(default_path) = opts.get("defaultPath").and_then(|v| v.as_str()) {
            builder = builder.set_directory(default_path);
        }
        
        if let Some(multiple) = opts.get("multiple").and_then(|v| v.as_bool()) {
            if multiple {
                // 多选文件
                return Ok(builder.pick_files().map(|paths| {
                    paths.into_iter().map(|p| p.to_string_lossy().to_string()).collect()
                }));
            }
        }
        
        // 添加文件过滤器
        if let Some(filters) = opts.get("filters").and_then(|v| v.as_array()) {
            for filter in filters {
                if let (Some(name), Some(extensions)) = (
                    filter.get("name").and_then(|v| v.as_str()),
                    filter.get("extensions").and_then(|v| v.as_array())
                ) {
                    let exts: Vec<&str> = extensions
                        .iter()
                        .filter_map(|v| v.as_str())
                        .collect();
                    builder = builder.add_filter(name, &exts);
                }
            }
        }
    }
    
    // 单选文件
    Ok(builder.pick_file().map(|path| vec![path.to_string_lossy().to_string()]))
}

#[tauri::command]
pub async fn show_save_dialog(
    window: Window,
    options: Option<Value>
) -> Result<Option<String>, String> {
    let mut builder = dialog::FileDialogBuilder::new();
    
    // 解析选项
    if let Some(opts) = options {
        if let Some(title) = opts.get("title").and_then(|v| v.as_str()) {
            builder = builder.set_title(title);
        }
        
        if let Some(default_path) = opts.get("defaultPath").and_then(|v| v.as_str()) {
            builder = builder.set_file_name(default_path);
        }
        
        // 添加文件过滤器
        if let Some(filters) = opts.get("filters").and_then(|v| v.as_array()) {
            for filter in filters {
                if let (Some(name), Some(extensions)) = (
                    filter.get("name").and_then(|v| v.as_str()),
                    filter.get("extensions").and_then(|v| v.as_array())
                ) {
                    let exts: Vec<&str> = extensions
                        .iter()
                        .filter_map(|v| v.as_str())
                        .collect();
                    builder = builder.add_filter(name, &exts);
                }
            }
        }
    }
    
    Ok(builder.save_file().map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn show_message_box(
    window: Window,
    options: Value
) -> Result<String, String> {
    let title = options.get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("消息");
    
    let message = options.get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let message_type = options.get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("info");
    
    let buttons = options.get("buttons")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str())
                .map(|s| s.to_string())
                .collect::<Vec<String>>()
        })
        .unwrap_or_else(|| vec!["确定".to_string()]);
    
    // 根据类型显示不同的对话框
    match message_type {
        "error" => {
            dialog::message(&window, title, message);
            Ok("ok".to_string())
        }
        "warning" => {
            dialog::message(&window, title, message);
            Ok("ok".to_string())
        }
        "question" => {
            let result = dialog::ask(&window, title, message);
            Ok(if result { "yes".to_string() } else { "no".to_string() })
        }
        _ => {
            dialog::message(&window, title, message);
            Ok("ok".to_string())
        }
    }
}
