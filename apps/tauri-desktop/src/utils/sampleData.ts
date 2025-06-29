import { Note, Tag, CreateNoteRequest, CreateTagRequest } from './tauri'

// Sample tags data
export const sampleTags: CreateTagRequest[] = [
  { name: 'AI', color: '#3B82F6' },
  { name: 'Machine Learning', color: '#10B981' },
  { name: 'Programming', color: '#F59E0B' },
  { name: 'Web Development', color: '#EF4444' },
  { name: 'Data Science', color: '#8B5CF6' },
  { name: 'Productivity', color: '#06B6D4' },
  { name: 'Learning', color: '#84CC16' },
  { name: 'Research', color: '#F97316' },
  { name: 'Tutorial', color: '#EC4899' },
  { name: 'Project Ideas', color: '#6366F1' }
]

// Sample notes data
export const sampleNotes: CreateNoteRequest[] = [
  {
    title: 'Introduction to Machine Learning',
    content: `# Introduction to Machine Learning

Machine Learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed.

## Key Concepts

### Supervised Learning
- Uses labeled training data
- Examples: Classification, Regression
- Algorithms: Linear Regression, Decision Trees, SVM

### Unsupervised Learning
- Finds hidden patterns in data
- Examples: Clustering, Association
- Algorithms: K-Means, Hierarchical Clustering

### Reinforcement Learning
- Learns through interaction with environment
- Uses rewards and penalties
- Applications: Game playing, Robotics

## Getting Started

1. Learn Python or R
2. Understand statistics and linear algebra
3. Practice with datasets
4. Build projects

## Resources
- Coursera ML Course by Andrew Ng
- Kaggle competitions
- scikit-learn documentation`,
    tags: ['AI', 'Machine Learning', 'Learning']
  },
  {
    title: 'React Hooks Best Practices',
    content: `# React Hooks Best Practices

React Hooks revolutionized how we write React components. Here are some best practices to follow:

## useState
\`\`\`javascript
// ✅ Good: Use functional updates for state that depends on previous state
setCount(prevCount => prevCount + 1)

// ❌ Bad: Direct state mutation
setCount(count + 1)
\`\`\`

## useEffect
\`\`\`javascript
// ✅ Good: Include dependencies
useEffect(() => {
  fetchData(userId)
}, [userId])

// ❌ Bad: Missing dependencies
useEffect(() => {
  fetchData(userId)
}, [])
\`\`\`

## Custom Hooks
- Extract reusable logic
- Start with "use" prefix
- Return arrays or objects consistently

## Performance Tips
- Use useCallback for expensive functions
- Use useMemo for expensive calculations
- Avoid creating objects in render`,
    tags: ['Programming', 'Web Development', 'Tutorial']
  },
  {
    title: 'Data Science Workflow',
    content: `# Data Science Workflow

A systematic approach to data science projects:

## 1. Problem Definition
- Understand business requirements
- Define success metrics
- Identify stakeholders

## 2. Data Collection
- Identify data sources
- Assess data quality
- Handle missing values

## 3. Exploratory Data Analysis (EDA)
- Statistical summaries
- Data visualization
- Pattern identification

## 4. Data Preprocessing
- Data cleaning
- Feature engineering
- Data transformation

## 5. Model Development
- Algorithm selection
- Training and validation
- Hyperparameter tuning

## 6. Model Evaluation
- Performance metrics
- Cross-validation
- A/B testing

## 7. Deployment
- Model serving
- Monitoring
- Maintenance

## Tools
- Python: pandas, numpy, scikit-learn
- R: dplyr, ggplot2, caret
- Visualization: matplotlib, seaborn, plotly`,
    tags: ['Data Science', 'Research', 'Programming']
  },
  {
    title: 'Productivity System Setup',
    content: `# My Productivity System

A comprehensive system for managing tasks, projects, and goals.

## Core Principles
1. **Capture Everything** - Don't rely on memory
2. **Process Regularly** - Review and organize
3. **Single Source of Truth** - One system for everything
4. **Regular Reviews** - Weekly and monthly planning

## Tools Stack
- **Task Management**: Todoist
- **Note Taking**: Obsidian
- **Calendar**: Google Calendar
- **Time Tracking**: Toggl

## Daily Routine
### Morning (30 min)
- Review calendar
- Plan top 3 priorities
- Check urgent emails

### Evening (15 min)
- Review completed tasks
- Plan tomorrow
- Capture new ideas

## Weekly Review
- Review goals progress
- Plan upcoming week
- Archive completed projects
- Update project statuses

## Monthly Review
- Assess goal achievement
- Adjust systems and processes
- Plan next month's priorities`,
    tags: ['Productivity', 'Learning']
  },
  {
    title: 'Building a Personal Knowledge Base',
    content: `# Building a Personal Knowledge Base

Creating a system to capture, organize, and retrieve knowledge effectively.

## Why Build a Knowledge Base?
- Reduce information overload
- Connect ideas across domains
- Build upon previous learning
- Share knowledge with others

## Structure Principles
### Atomic Notes
- One concept per note
- Self-contained and understandable
- Linked to related concepts

### Progressive Summarization
1. Capture raw information
2. Bold important passages
3. Highlight key insights
4. Add personal commentary

### Linking Strategy
- Link liberally between notes
- Use consistent naming conventions
- Create index notes for topics
- Build concept maps

## Tools Comparison
| Tool | Pros | Cons |
|------|------|------|
| Obsidian | Powerful linking, Local files | Learning curve |
| Notion | All-in-one, Databases | Can be slow |
| Roam | Bi-directional links | Expensive |
| Logseq | Open source, Block-based | Less mature |

## Best Practices
- Review and update regularly
- Use templates for consistency
- Tag strategically
- Export backups regularly`,
    tags: ['Learning', 'Productivity', 'Research']
  },
  {
    title: 'TypeScript Advanced Types',
    content: `# TypeScript Advanced Types

Exploring powerful TypeScript features for better type safety.

## Utility Types

### Partial<T>
\`\`\`typescript
interface User {
  id: number
  name: string
  email: string
}

// Makes all properties optional
type PartialUser = Partial<User>
// { id?: number; name?: string; email?: string }
\`\`\`

### Pick<T, K>
\`\`\`typescript
// Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>
// { id: number; name: string }
\`\`\`

### Omit<T, K>
\`\`\`typescript
// Exclude specific properties
type CreateUser = Omit<User, 'id'>
// { name: string; email: string }
\`\`\`

## Conditional Types
\`\`\`typescript
type ApiResponse<T> = T extends string 
  ? { message: T } 
  : { data: T }

type StringResponse = ApiResponse<string>
// { message: string }

type DataResponse = ApiResponse<User>
// { data: User }
\`\`\`

## Mapped Types
\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

type ReadonlyUser = Readonly<User>
// { readonly id: number; readonly name: string; readonly email: string }
\`\`\`

## Template Literal Types
\`\`\`typescript
type EventName<T extends string> = \`on\${Capitalize<T>}\`

type ClickEvent = EventName<'click'> // 'onClick'
type HoverEvent = EventName<'hover'> // 'onHover'
\`\`\``,
    tags: ['Programming', 'Web Development', 'Tutorial']
  },
  {
    title: 'Project Ideas for 2024',
    content: `# Project Ideas for 2024

A collection of interesting project ideas to explore this year.

## Web Development
### 1. Real-time Collaboration Tool
- **Tech Stack**: React, Socket.io, Node.js
- **Features**: Live editing, user presence, comments
- **Learning Goals**: WebSockets, real-time sync

### 2. Personal Finance Dashboard
- **Tech Stack**: Next.js, Prisma, PostgreSQL
- **Features**: Expense tracking, budgeting, analytics
- **Learning Goals**: Data visualization, financial APIs

### 3. Code Snippet Manager
- **Tech Stack**: Tauri, React, SQLite
- **Features**: Syntax highlighting, tagging, search
- **Learning Goals**: Desktop apps, local storage

## Machine Learning
### 1. Document Classifier
- **Tech Stack**: Python, scikit-learn, FastAPI
- **Features**: PDF processing, text classification
- **Learning Goals**: NLP, document processing

### 2. Recommendation System
- **Tech Stack**: Python, TensorFlow, Redis
- **Features**: Collaborative filtering, content-based
- **Learning Goals**: Recommender algorithms

## Mobile Development
### 1. Habit Tracker
- **Tech Stack**: React Native, Expo
- **Features**: Streak tracking, notifications, analytics
- **Learning Goals**: Mobile UI, local notifications

### 2. Language Learning App
- **Tech Stack**: Flutter, Firebase
- **Features**: Spaced repetition, progress tracking
- **Learning Goals**: Cross-platform development

## DevOps & Infrastructure
### 1. Monitoring Dashboard
- **Tech Stack**: Grafana, Prometheus, Docker
- **Features**: Metrics collection, alerting
- **Learning Goals**: Observability, containerization

### 2. CI/CD Pipeline
- **Tech Stack**: GitHub Actions, Docker, AWS
- **Features**: Automated testing, deployment
- **Learning Goals**: DevOps practices, cloud deployment`,
    tags: ['Project Ideas', 'Programming', 'Learning']
  }
]

// Function to generate sample data
export const generateSampleData = async (
  createNote: (request: CreateNoteRequest) => Promise<any>,
  createTag: (request: CreateTagRequest) => Promise<any>
) => {
  try {
    console.log('Generating sample data...')
    
    // Create tags first
    const createdTags = []
    for (const tagData of sampleTags) {
      try {
        const tag = await createTag(tagData)
        if (tag) {
          createdTags.push(tag)
          console.log(`Created tag: ${tag.name}`)
        }
      } catch (error) {
        console.log(`Tag "${tagData.name}" might already exist`)
      }
    }
    
    // Create notes
    const createdNotes = []
    for (const noteData of sampleNotes) {
      try {
        const note = await createNote(noteData)
        if (note) {
          createdNotes.push(note)
          console.log(`Created note: ${note.title}`)
        }
      } catch (error) {
        console.error(`Failed to create note: ${noteData.title}`, error)
      }
    }
    
    console.log(`Sample data generation complete: ${createdTags.length} tags, ${createdNotes.length} notes`)
    return { tags: createdTags, notes: createdNotes }
  } catch (error) {
    console.error('Failed to generate sample data:', error)
    throw error
  }
}

// Function to clear all data (for testing)
export const clearAllData = async (
  deleteNote: (id: string) => Promise<boolean>,
  deleteTag: (id: string) => Promise<boolean>,
  getAllNotes: () => Promise<Note[]>,
  getAllTags: () => Promise<Tag[]>
) => {
  try {
    console.log('Clearing all data...')
    
    const notes = await getAllNotes()
    const tags = await getAllTags()
    
    // Delete all notes
    for (const note of notes) {
      await deleteNote(note.id)
    }
    
    // Delete all tags
    for (const tag of tags) {
      await deleteTag(tag.id)
    }
    
    console.log(`Cleared ${notes.length} notes and ${tags.length} tags`)
  } catch (error) {
    console.error('Failed to clear data:', error)
    throw error
  }
}
