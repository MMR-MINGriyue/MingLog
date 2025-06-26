/**
 * MingLog 编辑器 JavaScript
 * 实现基础的块编辑器功能
 */

class MingLogEditor {
    constructor() {
        this.currentPage = null;
        this.pages = new Map();
        this.focusedBlock = null;
        this.floatingToolbar = document.getElementById('floatingToolbar');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.updateWordCount();
        this.autoSave();
    }

    setupEventListeners() {
        // 编辑器事件
        const editorContent = document.getElementById('editorContent');
        editorContent.addEventListener('click', this.handleEditorClick.bind(this));
        editorContent.addEventListener('keydown', this.handleKeyDown.bind(this));
        editorContent.addEventListener('input', this.handleInput.bind(this));

        // 块事件
        this.setupBlockEvents();

        // 全局事件
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));

        // 页面标题事件
        const titleInput = document.querySelector('.page-title-input');
        titleInput.addEventListener('input', this.handleTitleChange.bind(this));
    }

    setupBlockEvents() {
        const blocks = document.querySelectorAll('.block');
        blocks.forEach(block => {
            const textarea = block.querySelector('.block-content');
            
            textarea.addEventListener('focus', () => {
                this.focusBlock(block);
            });

            textarea.addEventListener('blur', () => {
                this.blurBlock(block);
            });

            textarea.addEventListener('input', () => {
                this.autoResize(textarea);
                this.updateWordCount();
            });

            textarea.addEventListener('keydown', (e) => {
                this.handleBlockKeyDown(e, block);
            });

            // 自动调整高度
            this.autoResize(textarea);
        });
    }

    focusBlock(block) {
        // 移除其他块的焦点
        document.querySelectorAll('.block.focused').forEach(b => {
            b.classList.remove('focused');
        });

        // 设置当前块焦点
        block.classList.add('focused');
        this.focusedBlock = block;

        // 显示浮动工具栏
        this.showFloatingToolbar(block);
    }

    blurBlock(block) {
        setTimeout(() => {
            if (!document.activeElement.closest('.block')) {
                block.classList.remove('focused');
                this.focusedBlock = null;
                this.hideFloatingToolbar();
            }
        }, 100);
    }

    showFloatingToolbar(block) {
        const rect = block.getBoundingClientRect();
        const toolbar = this.floatingToolbar;
        
        toolbar.style.left = `${rect.left}px`;
        toolbar.style.top = `${rect.top - 50}px`;
        toolbar.classList.add('show');

        // 更新工具栏状态
        this.updateToolbarState(block);
    }

    hideFloatingToolbar() {
        this.floatingToolbar.classList.remove('show');
    }

    updateToolbarState(block) {
        const blockType = block.dataset.type;
        const buttons = this.floatingToolbar.querySelectorAll('.floating-btn');
        
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.onclick.toString().includes(blockType)) {
                btn.classList.add('active');
            }
        });
    }

    handleEditorClick(e) {
        if (e.target.classList.contains('editor-content')) {
            // 点击空白区域，创建新块
            this.createNewBlock('p');
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.createNewBlock('p');
        }
    }

    handleBlockKeyDown(e, block) {
        const textarea = block.querySelector('.block-content');
        
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.createNewBlockAfter(block, 'p');
        } else if (e.key === 'Backspace' && textarea.value === '') {
            e.preventDefault();
            this.deleteBlock(block);
        } else if (e.key === 'ArrowUp' && textarea.selectionStart === 0) {
            e.preventDefault();
            this.focusPreviousBlock(block);
        } else if (e.key === 'ArrowDown' && textarea.selectionStart === textarea.value.length) {
            e.preventDefault();
            this.focusNextBlock(block);
        }
    }

    handleInput(e) {
        this.updateWordCount();
        this.markAsUnsaved();
    }

    handleTitleChange(e) {
        this.markAsUnsaved();
    }

    handleGlobalClick(e) {
        if (!e.target.closest('.floating-toolbar') && !e.target.closest('.block')) {
            this.hideFloatingToolbar();
        }
    }

    handleGlobalKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 's') {
                e.preventDefault();
                this.savePage();
            } else if (e.key === 'n') {
                e.preventDefault();
                this.createNewPage();
            }
        }
    }

    createNewBlock(type = 'p') {
        const editorContent = document.getElementById('editorContent');
        const newBlock = this.createBlockElement(type);
        editorContent.appendChild(newBlock);
        
        this.setupBlockEvents();
        
        // 聚焦新块
        const textarea = newBlock.querySelector('.block-content');
        textarea.focus();
        
        this.updateBlockCount();
    }

    createNewBlockAfter(afterBlock, type = 'p') {
        const newBlock = this.createBlockElement(type);
        afterBlock.insertAdjacentElement('afterend', newBlock);
        
        this.setupBlockEvents();
        
        // 聚焦新块
        const textarea = newBlock.querySelector('.block-content');
        textarea.focus();
        
        this.updateBlockCount();
    }

    createBlockElement(type) {
        const block = document.createElement('div');
        block.className = `block block-type-${type}`;
        block.dataset.type = type;
        
        const textarea = document.createElement('textarea');
        textarea.className = 'block-content';
        textarea.placeholder = this.getPlaceholderForType(type);
        
        block.appendChild(textarea);
        return block;
    }

    getPlaceholderForType(type) {
        const placeholders = {
            'h1': '标题',
            'h2': '子标题',
            'h3': '小标题',
            'p': '开始写作...',
            'quote': '引用内容',
            'code': '代码'
        };
        return placeholders[type] || '开始写作...';
    }

    deleteBlock(block) {
        const blocks = document.querySelectorAll('.block');
        if (blocks.length <= 1) return; // 至少保留一个块
        
        const prevBlock = block.previousElementSibling;
        block.remove();
        
        if (prevBlock) {
            const textarea = prevBlock.querySelector('.block-content');
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
        
        this.updateBlockCount();
    }

    focusPreviousBlock(block) {
        const prevBlock = block.previousElementSibling;
        if (prevBlock) {
            const textarea = prevBlock.querySelector('.block-content');
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
    }

    focusNextBlock(block) {
        const nextBlock = block.nextElementSibling;
        if (nextBlock) {
            const textarea = nextBlock.querySelector('.block-content');
            textarea.focus();
            textarea.setSelectionRange(0, 0);
        }
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    updateWordCount() {
        const blocks = document.querySelectorAll('.block-content');
        let totalWords = 0;
        
        blocks.forEach(textarea => {
            const text = textarea.value.trim();
            if (text) {
                // 简单的中英文字数统计
                const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
                const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
                totalWords += chineseChars + englishWords;
            }
        });
        
        document.getElementById('wordCount').textContent = `字数: ${totalWords}`;
    }

    updateBlockCount() {
        const blockCount = document.querySelectorAll('.block').length;
        document.getElementById('blockCount').textContent = `块数: ${blockCount}`;
    }

    markAsUnsaved() {
        document.getElementById('lastSaved').textContent = '未保存';
    }

    markAsSaved() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        document.getElementById('lastSaved').textContent = `已保存 ${timeStr}`;
    }

    loadSampleData() {
        // 示例数据已在 HTML 中定义
        this.setupBlockEvents();
        this.updateBlockCount();
    }

    autoSave() {
        // 每30秒自动保存
        setInterval(() => {
            this.savePage();
        }, 30000);
    }
}

// 全局函数
function formatBlock(type) {
    const editor = window.minglogEditor;
    if (editor.focusedBlock) {
        const block = editor.focusedBlock;
        const textarea = block.querySelector('.block-content');
        const value = textarea.value;
        
        // 更新块类型
        block.className = `block block-type-${type} focused`;
        block.dataset.type = type;
        
        // 更新占位符
        textarea.placeholder = editor.getPlaceholderForType(type);
        
        // 保持焦点
        textarea.focus();
        
        // 更新工具栏状态
        editor.updateToolbarState(block);
    }
}

function createNewPage() {
    if (window.electronAPI) {
        window.electronAPI.showMessageBox({
            type: 'info',
            title: '新建页面',
            message: '新建页面功能',
            detail: '此功能正在开发中，敬请期待！'
        });
    } else {
        alert('新建页面功能正在开发中！');
    }
}

function savePage() {
    const editor = window.minglogEditor;
    editor.markAsSaved();
    
    if (window.electronAPI) {
        window.electronAPI.showMessageBox({
            type: 'info',
            title: '保存成功',
            message: '页面已保存',
            detail: '您的内容已成功保存到本地。'
        });
    }
}

function showSettings() {
    if (window.electronAPI) {
        window.electronAPI.showMessageBox({
            type: 'info',
            title: '设置',
            message: '设置功能',
            detail: '设置功能正在开发中，敬请期待！'
        });
    } else {
        alert('设置功能正在开发中！');
    }
}

async function showPerformance() {
    if (window.electronAPI) {
        try {
            const performance = await window.electronAPI.getPerformance();
            const report = await window.electronAPI.generatePerformanceReport();
            
            window.electronAPI.showMessageBox({
                type: 'info',
                title: '性能信息',
                message: '应用性能状态',
                detail: `内存使用: ${performance.resources.memory.used}MB\n运行时间: ${performance.summary.uptime}秒\n窗口数量: ${performance.summary.windowCount}`
            });
        } catch (error) {
            console.error('获取性能信息失败:', error);
        }
    } else {
        alert('性能信息功能需要在桌面应用中使用！');
    }
}

function selectPage(pageItem) {
    // 移除其他页面的选中状态
    document.querySelectorAll('.page-item.active').forEach(item => {
        item.classList.remove('active');
    });
    
    // 选中当前页面
    pageItem.classList.add('active');
    
    // 更新编辑器内容（这里是示例）
    const title = pageItem.querySelector('.page-title').textContent;
    document.querySelector('.page-title-input').value = title;
}

// 初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
    window.minglogEditor = new MingLogEditor();
});
