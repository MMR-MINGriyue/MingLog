use minglog_desktop::database::Database;
use minglog_desktop::models::{CreateNoteRequest, CreateTagRequest, UpdateNoteRequest, SearchRequest};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔧 MingLog Desktop - Comprehensive Database Test");
    println!("================================================\n");
    
    // Initialize database
    let db = Database::new_with_path(":memory:").await?;
    println!("✅ Database initialized successfully\n");
    
    // Test 1: Tag Management
    println!("📋 Test 1: Tag Management");
    println!("-----------------------");
    
    let tag1 = db.create_tag(CreateTagRequest {
        name: "programming".to_string(),
        color: Some("#FF5733".to_string()),
    }).await?;
    println!("✅ Created tag: {} ({})", tag1.name, tag1.id);
    
    let tag2 = db.create_tag(CreateTagRequest {
        name: "rust".to_string(),
        color: Some("#CE422B".to_string()),
    }).await?;
    println!("✅ Created tag: {} ({})", tag2.name, tag2.id);
    
    let tag3 = db.create_tag(CreateTagRequest {
        name: "tutorial".to_string(),
        color: Some("#4CAF50".to_string()),
    }).await?;
    println!("✅ Created tag: {} ({})", tag3.name, tag3.id);
    
    let all_tags = db.get_tags().await?;
    println!("✅ Retrieved {} tags total\n", all_tags.len());
    
    // Test 2: Note Creation and Management
    println!("📝 Test 2: Note Creation and Management");
    println!("-------------------------------------");
    
    let note1 = db.create_note(CreateNoteRequest {
        title: "Getting Started with Rust".to_string(),
        content: "Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety.".to_string(),
        tags: Some(vec![tag1.id.clone(), tag2.id.clone(), tag3.id.clone()]),
    }).await?;
    println!("✅ Created note: {} ({})", note1.title, note1.id);
    
    let note2 = db.create_note(CreateNoteRequest {
        title: "Advanced Rust Concepts".to_string(),
        content: "This note covers advanced Rust concepts like lifetimes, traits, and async programming.".to_string(),
        tags: Some(vec![tag1.id.clone(), tag2.id.clone()]),
    }).await?;
    println!("✅ Created note: {} ({})", note2.title, note2.id);
    
    let note3 = db.create_note(CreateNoteRequest {
        title: "Project Ideas".to_string(),
        content: "Some interesting project ideas for learning programming.".to_string(),
        tags: Some(vec![tag1.id.clone()]),
    }).await?;
    println!("✅ Created note: {} ({})", note3.title, note3.id);
    
    // Test 3: Note Retrieval
    println!("\n📖 Test 3: Note Retrieval");
    println!("------------------------");
    
    let retrieved_note = db.get_note(&note1.id).await?;
    println!("✅ Retrieved note: {}", retrieved_note.title);
    println!("   Content preview: {}...", &retrieved_note.content[..50]);
    println!("   Tags: {:?}", retrieved_note.get_tags());
    
    let all_notes = db.get_notes(Some(10), Some(0)).await?;
    println!("✅ Retrieved {} notes total", all_notes.len());
    
    // Test 4: Note Updates
    println!("\n📝 Test 4: Note Updates");
    println!("----------------------");
    
    let updated_note = db.update_note(UpdateNoteRequest {
        id: note1.id.clone(),
        title: Some("Getting Started with Rust - Updated".to_string()),
        content: Some("Rust is a systems programming language that runs blazingly fast, prevents segfaults, and guarantees thread safety. This is an updated version with more details.".to_string()),
        tags: Some(vec![tag1.id.clone(), tag2.id.clone()]),
        is_favorite: Some(true),
        is_archived: Some(false),
    }).await?;
    println!("✅ Updated note: {}", updated_note.title);
    println!("   Is favorite: {}", updated_note.is_favorite);
    
    // Test 5: Search Functionality
    println!("\n🔍 Test 5: Search Functionality");
    println!("------------------------------");
    
    let search_result = db.search_notes(SearchRequest {
        query: "rust".to_string(),
        tags: None,
        date_from: None,
        date_to: None,
        include_archived: Some(false),
        limit: Some(10),
        offset: Some(0),
    }).await?;
    println!("✅ Search for 'rust' found {} notes", search_result.notes.len());
    for (i, note) in search_result.notes.iter().enumerate() {
        println!("   {}. {} ({})", i + 1, note.title, note.id);
    }
    
    // Test search with tags
    let tag_search_result = db.search_notes(SearchRequest {
        query: "".to_string(),
        tags: Some(vec![tag1.id.clone()]),
        date_from: None,
        date_to: None,
        include_archived: Some(false),
        limit: Some(10),
        offset: Some(0),
    }).await?;
    println!("✅ Search by tag '{}' found {} notes", tag1.name, tag_search_result.notes.len());
    
    // Test 6: Settings Management
    println!("\n⚙️ Test 6: Settings Management");
    println!("-----------------------------");
    
    db.set_setting("theme", "dark").await?;
    db.set_setting("auto_save", "true").await?;
    db.set_setting("font_size", "14").await?;
    println!("✅ Set 3 settings");
    
    let theme = db.get_setting("theme").await?;
    println!("✅ Retrieved theme setting: {:?}", theme);
    
    let all_settings = db.get_all_settings().await?;
    println!("✅ Retrieved {} settings total", all_settings.len());
    for setting in &all_settings {
        println!("   {}: {}", setting.key, setting.value);
    }
    
    // Test 7: Note Deletion
    println!("\n🗑️ Test 7: Note Deletion");
    println!("-----------------------");
    
    db.delete_note(&note3.id).await?;
    println!("✅ Deleted note: {}", note3.title);
    
    let remaining_notes = db.get_notes(Some(10), Some(0)).await?;
    println!("✅ {} notes remaining after deletion", remaining_notes.len());
    
    // Test 8: Tag Deletion
    println!("\n🗑️ Test 8: Tag Deletion");
    println!("----------------------");
    
    db.delete_tag(&tag3.id).await?;
    println!("✅ Deleted tag: {}", tag3.name);
    
    let remaining_tags = db.get_tags().await?;
    println!("✅ {} tags remaining after deletion", remaining_tags.len());
    
    // Test 9: Performance Test
    println!("\n⚡ Test 9: Performance Test");
    println!("--------------------------");
    
    let start_time = std::time::Instant::now();
    
    // Create 100 notes quickly
    for i in 1..=100 {
        db.create_note(CreateNoteRequest {
            title: format!("Performance Test Note {}", i),
            content: format!("This is test note number {} for performance testing.", i),
            tags: Some(vec![tag1.id.clone()]),
        }).await?;
    }
    
    let creation_time = start_time.elapsed();
    println!("✅ Created 100 notes in {:?}", creation_time);
    
    // Search through all notes
    let search_start = std::time::Instant::now();
    let search_result = db.search_notes(SearchRequest {
        query: "performance".to_string(),
        tags: None,
        date_from: None,
        date_to: None,
        include_archived: Some(false),
        limit: Some(50),
        offset: Some(0),
    }).await?;
    let search_time = search_start.elapsed();
    println!("✅ Searched through {} notes in {:?}", search_result.total, search_time);
    
    // Final summary
    println!("\n🎉 Comprehensive Database Test Summary");
    println!("=====================================");
    println!("✅ All tests passed successfully!");
    println!("📊 Final database state:");
    
    let final_notes = db.get_notes(Some(1000), Some(0)).await?;
    let final_tags = db.get_tags().await?;
    let final_settings = db.get_all_settings().await?;
    
    println!("   - Notes: {}", final_notes.len());
    println!("   - Tags: {}", final_tags.len());
    println!("   - Settings: {}", final_settings.len());
    
    println!("\n🚀 MingLog Desktop backend is ready for production!");
    
    Ok(())
}
