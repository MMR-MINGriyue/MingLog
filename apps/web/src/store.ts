import { create } from 'zustand';

interface Page {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PagesState {
  pages: Page[];
  currentPage: Page | null;
  setCurrentPage: (pageId: string) => void;
  addPage: (title: string) => void;
  updatePageContent: (pageId: string, content: string) => void;
}

export const useZustandStore = create<PagesState>((set) => ({
  pages: [
    {
      id: '1',
      title: '首页',
      content: '# 欢迎使用MingLog\n\n这是你的个人知识管理空间。',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: '开发笔记',
      content: '# 开发笔记\n\n- 实现双向链接\n- 添加块引用功能\n- 优化编辑器性能',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  currentPage: null,
  setCurrentPage: (pageId) => set((state) => ({
    currentPage: state.pages.find(page => page.id === pageId) || null
  })),
  addPage: (title) => set((state) => {
    const newPage: Page = {
      id: Date.now().toString(),
      title,
      content: `# ${title}\n\n开始编辑...`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return {
      pages: [...state.pages, newPage],
      currentPage: newPage
    };
  }),
  updatePageContent: (pageId, content) => set((state) => ({
    pages: state.pages.map(page => 
      page.id === pageId ? { ...page, content, updatedAt: new Date() } : page
    ),
    currentPage: state.currentPage?.id === pageId ? { ...state.currentPage, content, updatedAt: new Date() } : state.currentPage
  }))
}));

// 初始化默认页面
setTimeout(() => {
  const state = useZustandStore.getState();
  if (state.pages.length > 0 && !state.currentPage) {
    state.setCurrentPage('1');
  }
}, 0);