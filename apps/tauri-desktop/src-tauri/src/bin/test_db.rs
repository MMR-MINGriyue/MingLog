use minglog_desktop::database::Database;
use minglog_desktop::models::{CreateNoteRequest, CreateTagRequest, SearchRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logger
    env_logger::init();
    
    println!("🔧 Testing MingLog Desktop Database...");
    
    // Initialize database
    let db = Database::new().await?;
    println!("✅ Database initialized successfully");
    
    // Test tag creation
    println!("\n📋 Testing tag creation...");
    let tag_request = CreateTagRequest {
        name: "test-tag".to_string(),
        color: Some("#FF5733".to_string()),
    };
    
    let tag = db.create_tag(tag_request).await?;
    println!("✅ Created tag: {} ({})", tag.name, tag.id);
    
    // Test note creation
    println!("\n📝 Testing note creation...");
    let note_request = CreateNoteRequest {
        title: "Test Note".to_string(),
        content: "This is a test note content with some **markdown** formatting.".to_string(),
        tags: Some(vec![tag.id.clone()]),
    };
    
    let note = db.create_note(note_request).await?;
    println!("✅ Created note: {} ({})", note.title, note.id);
    
    // Test note retrieval
    println!("\n📖 Testing note retrieval...");
    let retrieved_note = db.get_note(&note.id).await?;
    println!("✅ Retrieved note: {}", retrieved_note.title);
    println!("   Content: {}", retrieved_note.content);
    println!("   Tags: {:?}", retrieved_note.get_tags());
    
    // Test notes listing
    println!("\n📚 Testing notes listing...");
    let notes = db.get_notes(Some(10), Some(0)).await?;
    println!("✅ Retrieved {} notes", notes.len());
    for (i, note) in notes.iter().enumerate() {
        println!("   {}. {} ({})", i + 1, note.title, note.id);
    }
    
    // Test search functionality
    println!("\n🔍 Testing search functionality...");
    let search_request = SearchRequest {
        query: "test".to_string(),
        tags: None,
        date_from: None,
        date_to: None,
        include_archived: Some(false),
        limit: Some(10),
        offset: Some(0),
    };
    
    let search_result = db.search_notes(search_request).await?;
    println!("✅ Search found {} notes", search_result.notes.len());
    for (i, note) in search_result.notes.iter().enumerate() {
        println!("   {}. {} ({})", i + 1, note.title, note.id);
    }
    
    // Test tags listing
    println!("\n🏷️ Testing tags listing...");
    let tags = db.get_tags().await?;
    println!("✅ Retrieved {} tags", tags.len());
    for (i, tag) in tags.iter().enumerate() {
        println!("   {}. {} ({}) - {}", i + 1, tag.name, tag.id, tag.color.as_deref().unwrap_or("no color"));
    }
    
    // Test settings
    println!("\n⚙️ Testing settings...");
    db.set_setting("test_setting", "test_value").await?;
    let setting_value = db.get_setting("test_setting").await?;
    println!("✅ Setting test: {:?}", setting_value);
    
    let all_settings = db.get_all_settings().await?;
    println!("✅ All settings count: {}", all_settings.len());
    
    println!("\n🎉 All database tests passed!");
    
    Ok(())
}
