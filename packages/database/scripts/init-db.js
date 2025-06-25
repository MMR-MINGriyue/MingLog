import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initializing database...');

  try {
    // Create default graph
    const defaultGraph = await prisma.graph.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        name: 'Default Graph',
        path: './data',
        settings: JSON.stringify({
          theme: 'light',
          autoSave: true,
          enableSearch: true,
        }),
      },
    });

    console.log('✅ Default graph created:', defaultGraph.name);

    // Create welcome page
    const welcomePage = await prisma.page.upsert({
      where: {
        graphId_name: {
          graphId: 'default',
          name: 'Welcome to MingLog',
        },
      },
      update: {},
      create: {
        id: 'welcome-page',
        name: 'Welcome to MingLog',
        title: 'Welcome to MingLog',
        graphId: 'default',
        properties: JSON.stringify({
          tags: ['welcome', 'getting-started'],
          created: new Date().toISOString(),
        }),
      },
    });

    console.log('✅ Welcome page created:', welcomePage.name);

    // Create welcome blocks
    const welcomeBlocks = [
      {
        id: 'welcome-block-1',
        content: '# Welcome to MingLog! 🎉',
        pageId: welcomePage.id,
        graphId: 'default',
      },
      {
        id: 'welcome-block-2',
        content: 'MingLog is a modern knowledge management tool built with TypeScript and React.',
        pageId: welcomePage.id,
        graphId: 'default',
      },
      {
        id: 'welcome-block-3',
        content: '## Getting Started',
        pageId: welcomePage.id,
        graphId: 'default',
      },
      {
        id: 'welcome-block-4',
        content: '- Create pages with [[Page Name]] syntax',
        pageId: welcomePage.id,
        graphId: 'default',
      },
      {
        id: 'welcome-block-5',
        content: '- Reference blocks with ((block-id)) syntax',
        pageId: welcomePage.id,
        graphId: 'default',
      },
      {
        id: 'welcome-block-6',
        content: '- Use #tags to organize your content',
        pageId: welcomePage.id,
        graphId: 'default',
      },
    ];

    for (const blockData of welcomeBlocks) {
      await prisma.block.upsert({
        where: { id: blockData.id },
        update: {},
        create: blockData,
      });
    }

    console.log('✅ Welcome blocks created');

    // Create today's journal page
    const today = new Date().toISOString().split('T')[0];
    const journalPage = await prisma.page.upsert({
      where: {
        graphId_name: {
          graphId: 'default',
          name: today,
        },
      },
      update: {},
      create: {
        id: `journal-${today}`,
        name: today,
        title: `Journal - ${today}`,
        graphId: 'default',
        isJournal: true,
        journalDate: today,
        properties: JSON.stringify({
          type: 'journal',
          created: new Date().toISOString(),
        }),
      },
    });

    console.log('✅ Today\'s journal page created:', journalPage.name);

    console.log('🎉 Database initialization completed!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
