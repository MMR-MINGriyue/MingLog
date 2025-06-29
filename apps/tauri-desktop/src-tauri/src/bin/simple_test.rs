// Import modules from the current crate
use minglog_desktop::database::Database;
use minglog_desktop::models::{CreateNoteRequest, CreateTagRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔧 Testing MingLog Desktop Database (Simple)...");

    // Initialize database with in-memory database
    let db = Database::new_with_path(":memory:").await?;
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
        content: "This is a test note content.".to_string(),
        tags: Some(vec![tag.id.clone()]),
    };
    
    let note = db.create_note(note_request).await?;
    println!("✅ Created note: {} ({})", note.title, note.id);
    
    // Test note retrieval
    println!("\n📖 Testing note retrieval...");
    let retrieved_note = db.get_note(&note.id).await?;
    println!("✅ Retrieved note: {}", retrieved_note.title);
    
    println!("\n🎉 Basic database tests passed!");
    
    Ok(())
}
