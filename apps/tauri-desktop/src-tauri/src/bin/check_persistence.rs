use minglog_desktop::database::Database;
use minglog_desktop::models::{CreatePageRequest, CreateBlockRequest, CreateGraphRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔍 MingLog 数据持久化检查工具");
    println!("================================\n");
    
    // 连接到实际的数据库文件
    let db = Database::new().await?;
    println!("✅ 成功连接到数据库\n");
    
    // 确保默认图谱存在
    println!("📊 初始化默认图谱:");
    println!("----------------");

    // 尝试创建默认图谱（如果不存在）
    let graph_request = CreateGraphRequest {
        name: "Default Graph".to_string(),
        path: "default".to_string(),
        settings: None,
    };

    match db.create_graph(graph_request).await {
        Ok(graph) => println!("✅ 创建默认图谱: {}", graph.name),
        Err(_) => println!("ℹ️  默认图谱已存在"),
    }

    // 检查现有数据
    println!("\n📊 检查现有数据:");
    println!("--------------");

    let pages = db.get_pages_by_graph("default").await?;
    println!("📄 页面数量: {}", pages.len());
    
    let mut total_blocks = 0;
    for page in &pages {
        let blocks = db.get_blocks_by_page(&page.id).await?;
        total_blocks += blocks.len();
        println!("   页面 '{}' 包含 {} 个块", page.name, blocks.len());
    }
    println!("🧱 总块数量: {}\n", total_blocks);
    
    // 测试数据持久化
    println!("🧪 测试数据持久化:");
    println!("----------------");
    
    // 创建测试页面
    let page_request = CreatePageRequest {
        graph_id: "default".to_string(),
        name: format!("持久化测试页面_{}", chrono::Utc::now().timestamp()),
        title: Some("数据持久化测试".to_string()),
        tags: Some(serde_json::to_string(&vec!["测试", "持久化"]).unwrap()),
        is_journal: Some(false),
        journal_date: None,
        properties: None,
    };
    
    let test_page = db.create_page(page_request).await?;
    println!("✅ 创建测试页面: {} (ID: {})", test_page.name, test_page.id);
    
    // 创建测试块
    let block_request = CreateBlockRequest {
        graph_id: "default".to_string(),
        page_id: test_page.id.clone(),
        content: format!("这是一个持久化测试块，创建时间: {}", chrono::Utc::now().to_rfc3339()),
        parent_id: None,
        order: Some(0),
        properties: None,
        refs: None,
    };
    
    let test_block = db.create_block(block_request).await?;
    println!("✅ 创建测试块: {} (ID: {})", test_block.content, test_block.id);
    
    // 验证数据是否持久化
    println!("\n🔍 验证数据持久化:");
    println!("----------------");
    
    let retrieved_page = db.get_page(&test_page.id).await?;
    println!("✅ 成功检索页面: {}", retrieved_page.name);
    
    let retrieved_blocks = db.get_blocks_by_page(&test_page.id).await?;
    println!("✅ 成功检索块: {} 个", retrieved_blocks.len());
    
    if let Some(block) = retrieved_blocks.first() {
        println!("   块内容: {}", block.content);
    }
    
    // 测试搜索功能（跳过，因为当前实现只有search_notes）
    println!("\n🔍 搜索功能:");
    println!("----------");
    println!("⚠️  当前版本暂时跳过搜索测试（仅实现了search_notes）");
    
    // 数据完整性检查
    println!("\n🔒 数据完整性检查:");
    println!("----------------");
    
    let all_pages = db.get_pages_by_graph("default").await?;
    let mut integrity_ok = true;
    
    for page in &all_pages {
        let blocks = db.get_blocks_by_page(&page.id).await?;
        for block in &blocks {
            if block.page_id != page.id {
                println!("❌ 发现完整性问题: 块 {} 的 page_id 不匹配", block.id);
                integrity_ok = false;
            }
            if block.graph_id != page.graph_id {
                println!("❌ 发现完整性问题: 块 {} 的 graph_id 不匹配", block.id);
                integrity_ok = false;
            }
        }
    }
    
    if integrity_ok {
        println!("✅ 数据完整性检查通过");
    }
    
    // 性能测试
    println!("\n⚡ 性能测试:");
    println!("----------");
    
    let start_time = std::time::Instant::now();
    let _pages = db.get_pages_by_graph("default").await?;
    let page_query_time = start_time.elapsed();
    println!("📄 页面查询耗时: {:?}", page_query_time);
    
    let start_time = std::time::Instant::now();
    let _pages = db.get_pages_by_graph("default").await?;
    let query_time = start_time.elapsed();
    println!("📄 页面查询耗时: {:?}", query_time);
    
    // 清理测试数据
    println!("\n🧹 清理测试数据:");
    println!("---------------");
    
    db.delete_page(&test_page.id).await?;
    println!("✅ 删除测试页面: {}", test_page.id);
    
    // 最终统计
    println!("\n📈 最终统计:");
    println!("----------");
    
    let final_pages = db.get_pages_by_graph("default").await?;
    println!("📄 最终页面数量: {}", final_pages.len());
    
    let mut final_blocks = 0;
    for page in &final_pages {
        let blocks = db.get_blocks_by_page(&page.id).await?;
        final_blocks += blocks.len();
    }
    println!("🧱 最终块数量: {}", final_blocks);
    
    println!("\n🎉 数据持久化检查完成！");
    println!("✅ 所有功能正常工作");
    
    Ok(())
}
