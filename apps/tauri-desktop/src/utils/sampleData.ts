/**
 * 示例数据生成器
 * 用于演示和测试目的
 */

export interface SampleNote {
  id: string
  title: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface SampleData {
  notes: SampleNote[]
  tags: string[]
  categories: string[]
}

/**
 * 生成示例笔记数据
 */
export function generateSampleNotes(count: number = 10): SampleNote[] {
  const sampleTitles = [
    '项目规划与管理',
    '技术学习笔记',
    '会议记录',
    '想法收集',
    '读书笔记',
    '工作总结',
    '问题解决方案',
    '创意灵感',
    '学习计划',
    '代码片段'
  ]

  const sampleContents = [
    '这是一个关于项目规划的详细笔记，包含了项目的各个阶段和关键节点。',
    '记录了今天学习的新技术要点，包括实现原理和最佳实践。',
    '今天的团队会议讨论了产品的下一步发展方向和具体实施计划。',
    '突然想到的一个有趣想法，可能对当前项目有帮助。',
    '阅读《深入理解计算机系统》第三章的学习心得和重点摘录。',
    '本周工作完成情况总结，包括遇到的问题和解决方案。',
    '针对系统性能问题的分析和优化方案。',
    '关于用户体验改进的创意想法和设计思路。',
    '制定了下个月的学习计划，重点关注前端框架和工程化。',
    '常用的代码片段和工具函数，方便日后复用。'
  ]

  const sampleTags = [
    ['工作', '规划'],
    ['学习', '技术'],
    ['会议', '团队'],
    ['想法', '创意'],
    ['读书', '学习'],
    ['总结', '工作'],
    ['问题', '解决方案'],
    ['创意', '设计'],
    ['计划', '学习'],
    ['代码', '工具']
  ]

  const notes: SampleNote[] = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const index = i % sampleTitles.length
    const createdAt = new Date(now.getTime() - (count - i) * 24 * 60 * 60 * 1000)
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000)

    notes.push({
      id: `sample-note-${i + 1}`,
      title: sampleTitles[index],
      content: sampleContents[index],
      tags: sampleTags[index],
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString()
    })
  }

  return notes
}

/**
 * 生成示例标签数据
 */
export function generateSampleTags(): string[] {
  return [
    '工作',
    '学习',
    '技术',
    '规划',
    '会议',
    '想法',
    '创意',
    '读书',
    '总结',
    '问题',
    '解决方案',
    '设计',
    '计划',
    '代码',
    '工具',
    '项目',
    '团队',
    '产品',
    '用户体验',
    '性能优化'
  ]
}

/**
 * 生成示例分类数据
 */
export function generateSampleCategories(): string[] {
  return [
    '工作笔记',
    '学习资料',
    '项目文档',
    '会议记录',
    '想法收集',
    '技术文档',
    '读书笔记',
    '代码片段',
    '问题解决',
    '创意设计'
  ]
}

/**
 * 生成完整的示例数据
 */
export function generateSampleData(noteCount: number = 20): SampleData {
  return {
    notes: generateSampleNotes(noteCount),
    tags: generateSampleTags(),
    categories: generateSampleCategories()
  }
}

/**
 * 获取随机示例笔记
 */
export function getRandomSampleNote(): SampleNote {
  const notes = generateSampleNotes(1)
  return notes[0]
}

/**
 * 获取示例笔记的统计信息
 */
export function getSampleDataStats(data: SampleData) {
  return {
    totalNotes: data.notes.length,
    totalTags: data.tags.length,
    totalCategories: data.categories.length,
    averageTagsPerNote: data.notes.reduce((sum, note) => sum + note.tags.length, 0) / data.notes.length,
    mostUsedTags: getMostUsedTags(data.notes),
    recentNotes: data.notes.slice(-5)
  }
}

/**
 * 获取最常用的标签
 */
function getMostUsedTags(notes: SampleNote[]): Array<{ tag: string; count: number }> {
  const tagCounts: Record<string, number> = {}
  
  notes.forEach(note => {
    note.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}
