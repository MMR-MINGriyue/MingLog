// Tauri API 导入 (带回退)
let tauriAPI = null;
let dialogAPI = null;
let windowAPI = null;

if (window.__TAURI__) {
    tauriAPI = window.__TAURI__.tauri;
    dialogAPI = window.__TAURI__.dialog;
    windowAPI = window.__TAURI__.window;
} else {
    console.warn('Tauri API 不可用，使用模拟API');
    // 模拟API用于开发测试
    tauriAPI = {
        invoke: async (cmd, args) => {
            console.log(`模拟调用: ${cmd}`, args);
            return { success: false, error: 'Tauri API 不可用' };
        }
    };
    dialogAPI = {
        message: async (msg, options) => {
            alert(msg);
        },
        ask: async (title, msg) => {
            return confirm(`${title}: ${msg}`);
        },
        open: async (options) => {
            return null;
        },
        save: async (options) => {
            return null;
        }
    };
    windowAPI = {
        appWindow: null
    };
}

// 应用状态
const appState = {
    currentPageId: 'welcome',
    workspace: null,
    isLoading: false,
    isDirty: false,
    theme: 'light'
};

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    console.log('MingLog Tauri 应用启动');
    
    // 初始化主题
    initializeTheme();
    
    // 初始化事件监听器
    initializeEventListeners();
    
    // 加载工作空间
    await initializeWorkspace();
    
    // 设置键盘快捷键
    setupKeyboardShortcuts();
});

// 主题管理
function initializeTheme() {
    const savedTheme = localStorage.getItem('minglog-theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    appState.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('minglog-theme', theme);

    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const newTheme = appState.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    document.body.style.transition = 'all 0.3s ease';
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
}

// 事件监听器初始化
function initializeEventListeners() {
    // 工具栏按钮
    document.getElementById('newPageBtn')?.addEventListener('click', createNewPage);
    document.getElementById('saveBtn')?.addEventListener('click', savePage);
    document.getElementById('importBtn')?.addEventListener('click', importMarkdown);
    document.getElementById('exportBtn')?.addEventListener('click', exportMarkdown);
    document.getElementById('backupBtn')?.addEventListener('click', createBackup);
    document.getElementById('themeBtn')?.addEventListener('click', toggleTheme);
    document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
    document.getElementById('performanceBtn')?.addEventListener('click', showPerformanceInfo);
    document.getElementById('testBtn')?.addEventListener('click', testFunction);

    // 页面列表点击事件
    document.getElementById('pageList')?.addEventListener('click', (e) => {
        const pageItem = e.target.closest('.page-item');
        if (pageItem) {
            const pageId = pageItem.getAttribute('data-page-id');
            if (pageId) {
                selectPage(pageId);
            }
        }
    });

    // 页面标题输入事件
    document.querySelector('.page-title-input')?.addEventListener('input', () => {
        appState.isDirty = true;
        updateStatus();
    });
}

// 键盘快捷键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'n':
                    e.preventDefault();
                    createNewPage();
                    break;
                case 's':
                    e.preventDefault();
                    savePage();
                    break;
                case 'o':
                    e.preventDefault();
                    importMarkdown();
                    break;
                case 'e':
                    e.preventDefault();
                    exportMarkdown();
                    break;
            }
        }
    });
}

// 工作空间管理
async function initializeWorkspace() {
    try {
        setLoading(true);
        const result = await tauriAPI.invoke('load_workspace');

        if (result && result.success) {
            appState.workspace = result.data;
            renderPageList();
            if (appState.workspace.pages['welcome']) {
                selectPage('welcome');
            } else {
                const firstPageId = Object.keys(appState.workspace.pages)[0];
                if (firstPageId) {
                    selectPage(firstPageId);
                }
            }
            showMessage('工作空间加载成功');
        } else {
            showMessage('加载工作空间失败: ' + (result?.error || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('初始化工作空间失败:', error);
        showMessage('初始化失败', 'error');
    } finally {
        setLoading(false);
    }
}

// 创建新页面
async function createNewPage() {
    try {
        const title = prompt('请输入新页面标题:', '新页面');
        if (title && title.trim()) {
            setLoading(true);
            const result = await tauriAPI.invoke('create_page', { title: title.trim() });

            if (result && result.success) {
                const page = result.data;
                // 更新本地工作空间状态
                if (appState.workspace) {
                    appState.workspace.pages[page.id] = page;
                }
                addPageToList(page);
                selectPage(page.id);
                showMessage('页面创建成功');
            } else {
                showMessage('创建页面失败: ' + (result?.error || '未知错误'), 'error');
            }
        }
    } catch (error) {
        console.error('创建页面失败:', error);
        showMessage('创建页面失败', 'error');
    } finally {
        setLoading(false);
    }
}

// 保存页面
async function savePage() {
    if (!appState.workspace || !appState.currentPageId) return;

    try {
        setLoading(true);

        // 收集页面数据
        const title = document.querySelector('.page-title-input').value;
        const blockElements = document.querySelectorAll('.block');
        const updatedBlocks = [];

        blockElements.forEach((blockElement) => {
            const textarea = blockElement.querySelector('.block-content');
            const blockId = blockElement.getAttribute('data-block-id');
            const blockType = blockElement.getAttribute('data-type');
            const content = textarea.value;

            updatedBlocks.push({
                id: blockId,
                block_type: blockType,
                content: content,
                properties: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        });

        // 准备更新数据
        const updates = {
            title: title || '无标题页面',
            blocks: updatedBlocks,
            updated_at: new Date().toISOString()
        };

        // 调用存储API
        const result = await tauriAPI.invoke('update_page', {
            pageId: appState.currentPageId,
            updates: updates
        });

        if (result && result.success) {
            // 更新本地状态
            if (appState.workspace && appState.workspace.pages[appState.currentPageId]) {
                Object.assign(appState.workspace.pages[appState.currentPageId], updates);
                updatePageListItem(appState.currentPageId);
            }
            showMessage('保存成功');
            appState.isDirty = false;
        } else {
            showMessage('保存失败: ' + (result?.error || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('保存页面失败:', error);
        showMessage('保存失败', 'error');
    } finally {
        setLoading(false);
        updateStatus();
    }
}

// 导入Markdown
async function importMarkdown() {
    try {
        const selected = await dialogAPI.open({
            multiple: false,
            filters: [{
                name: 'Markdown',
                extensions: ['md', 'markdown']
            }]
        });

        if (selected) {
            const content = await tauriAPI.invoke('read_file', { path: selected });
            const title = prompt('请输入页面标题:', '导入的页面');

            if (title) {
                const result = await tauriAPI.invoke('import_markdown', {
                    markdown: content,
                    title: title
                });

                if (result.success) {
                    const page = result.data;
                    addPageToList(page);
                    selectPage(page.id);
                    showMessage('导入成功');
                } else {
                    showMessage('导入失败: ' + result.error, 'error');
                }
            }
        }
    } catch (error) {
        console.error('导入失败:', error);
        showMessage('导入失败', 'error');
    }
}

// 导出Markdown
async function exportMarkdown() {
    try {
        const filePath = await dialogAPI.save({
            filters: [{
                name: 'Markdown',
                extensions: ['md']
            }]
        });

        if (filePath) {
            const result = await tauriAPI.invoke('export_markdown', {
                pageId: appState.currentPageId
            });

            if (result.success) {
                await tauriAPI.invoke('write_file', {
                    path: filePath,
                    contents: result.data
                });
                showMessage('导出成功');
            } else {
                showMessage('导出失败: ' + result.error, 'error');
            }
        }
    } catch (error) {
        console.error('导出失败:', error);
        showMessage('导出失败', 'error');
    }
}

// 创建备份
async function createBackup() {
    try {
        setLoading(true);
        const result = await tauriAPI.invoke('create_backup');

        if (result.success) {
            showMessage('备份创建成功');
        } else {
            showMessage('备份创建失败: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('备份创建失败:', error);
        showMessage('备份创建失败', 'error');
    } finally {
        setLoading(false);
    }
}

// 打开设置
function openSettings() {
    showMessage('设置功能开发中...');
}

// 显示性能信息
async function showPerformanceInfo() {
    try {
        const appInfo = await tauriAPI.invoke('get_app_info');
        const metadata = await tauriAPI.invoke('get_metadata');

        if (metadata && metadata.success) {
            const info = `
应用信息:
- 名称: ${appInfo.name}
- 版本: ${appInfo.version}
- 平台: ${appInfo.platform}
- 架构: ${appInfo.arch}

数据信息:
- 总页面数: ${metadata.data.total_pages}
- 总块数: ${metadata.data.total_blocks}
- 数据路径: ${metadata.data.data_path}
- 最后修改: ${metadata.data.last_modified}
            `;

            if (dialogAPI && dialogAPI.message) {
                await dialogAPI.message(info, { title: '性能信息', type: 'info' });
            } else {
                alert(info);
            }
        } else {
            showMessage('获取性能信息失败: ' + (metadata?.error || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('获取性能信息失败:', error);
        showMessage('获取性能信息失败', 'error');
    }
}

// 测试函数
async function testFunction() {
    try {
        // 测试greet命令
        const greetResult = await tauriAPI.invoke('greet', { name: 'MingLog用户' });
        console.log('Greet result:', greetResult);

        // 测试get_app_info命令
        const appInfo = await tauriAPI.invoke('get_app_info');
        console.log('App info:', appInfo);

        // 测试load_workspace命令
        const workspaceResult = await tauriAPI.invoke('load_workspace');
        console.log('Workspace result:', workspaceResult);

        if (workspaceResult.success) {
            showMessage('Tauri API测试成功！工作空间已加载');
            appState.workspace = workspaceResult.data;
            renderPageList();
            if (workspaceResult.data.pages['welcome']) {
                selectPage('welcome');
            }
        } else {
            showMessage('工作空间加载失败: ' + workspaceResult.error, 'error');
        }
    } catch (error) {
        console.error('API测试失败:', error);
        showMessage('API测试失败: ' + error.message, 'error');
    }
}

// 工具函数
function setLoading(loading) {
    appState.isLoading = loading;
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach((btn) => {
        btn.disabled = loading;
        btn.style.opacity = loading ? '0.6' : '1';
    });
}

function showMessage(msg, type = 'info') {
    const statusElement = document.getElementById('lastSaved');
    if (statusElement) {
        statusElement.textContent = msg;
        statusElement.style.color = type === 'error' ? '#dc3545' : '#28a745';

        setTimeout(() => {
            statusElement.textContent = '已保存';
            statusElement.style.color = '';
        }, 3000);
    }
}

function updateStatus() {
    const wordCountElement = document.getElementById('wordCount');
    const blockCountElement = document.getElementById('blockCount');
    
    if (wordCountElement && blockCountElement) {
        const blocks = document.querySelectorAll('.block');
        let totalWords = 0;
        
        blocks.forEach(block => {
            const content = block.querySelector('.block-content').value;
            totalWords += content.length;
        });
        
        wordCountElement.textContent = `字数: ${totalWords}`;
        blockCountElement.textContent = `块数: ${blocks.length}`;
    }
}

// 页面管理函数
function renderPageList() {
    const pageList = document.getElementById('pageList');
    if (pageList && appState.workspace) {
        pageList.innerHTML = '';
        Object.values(appState.workspace.pages).forEach(page => {
            addPageToList(page);
        });
    }
}

function addPageToList(page) {
    const pageList = document.getElementById('pageList');
    if (!pageList) return;

    const newPageItem = document.createElement('div');
    newPageItem.className = 'page-item';
    newPageItem.setAttribute('data-page-id', page.id);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'page-title';
    titleDiv.textContent = page.title;

    const previewDiv = document.createElement('div');
    previewDiv.className = 'page-preview';
    previewDiv.textContent = getPagePreview(page);

    newPageItem.appendChild(titleDiv);
    newPageItem.appendChild(previewDiv);
    pageList.appendChild(newPageItem);
}

function getPagePreview(page) {
    if (!page.blocks || page.blocks.length === 0) return '空白页面';

    let content = '';
    page.blocks.forEach(block => {
        if (block.content && block.content.trim()) {
            content += block.content + ' ';
        }
    });

    const preview = content.substring(0, 50);
    return (preview + (content.length > 50 ? '...' : '')) || '空白页面';
}

function selectPage(pageId) {
    // 更新UI状态
    const pageItems = document.querySelectorAll('.page-item');
    pageItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page-id') === pageId) {
            item.classList.add('active');
        }
    });

    appState.currentPageId = pageId;
    loadPage(pageId);
    updateStatus();
}

function loadPage(pageId) {
    if (!appState.workspace || !appState.workspace.pages[pageId]) return;

    const page = appState.workspace.pages[pageId];
    
    // 更新页面标题
    const titleInput = document.querySelector('.page-title-input');
    if (titleInput) {
        titleInput.value = page.title;
    }

    // 清空编辑器
    const editorContent = document.getElementById('editorContent');
    if (editorContent) {
        editorContent.innerHTML = '';

        // 渲染所有块
        if (page.blocks && page.blocks.length > 0) {
            page.blocks.forEach(block => {
                const blockElement = createBlockElement(block);
                editorContent.appendChild(blockElement);
            });
        } else {
            // 如果没有块，创建一个默认的段落块
            const defaultBlock = {
                id: 'block_' + Date.now(),
                block_type: 'p',
                content: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const blockElement = createBlockElement(defaultBlock);
            editorContent.appendChild(blockElement);
        }
    }

    setupTextareas();
    updateStatus();
}

function createBlockElement(block) {
    const blockDiv = document.createElement('div');
    blockDiv.className = `block block-type-${block.block_type}`;
    blockDiv.setAttribute('data-type', block.block_type);
    blockDiv.setAttribute('data-block-id', block.id);

    const textarea = document.createElement('textarea');
    textarea.className = 'block-content';
    textarea.value = block.content;
    textarea.placeholder = getPlaceholderForType(block.block_type);

    blockDiv.appendChild(textarea);
    return blockDiv;
}

function getPlaceholderForType(type) {
    switch(type) {
        case 'h1': return '标题';
        case 'h2': return '子标题';
        case 'h3': return '小标题';
        case 'quote': return '引用内容';
        case 'code': return '代码';
        default: return '开始写作...';
    }
}

function setupTextareas() {
    const textareas = document.querySelectorAll('.block-content');
    textareas.forEach(textarea => {
        // 自动调整高度
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
            appState.isDirty = true;
            updateStatus();
        });

        // 初始化高度
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });
}

function updatePageListItem(pageId) {
    if (!appState.workspace || !appState.workspace.pages[pageId]) return;

    const page = appState.workspace.pages[pageId];
    const pageItem = document.querySelector(`[data-page-id="${pageId}"]`);
    
    if (pageItem) {
        const titleElement = pageItem.querySelector('.page-title');
        const previewElement = pageItem.querySelector('.page-preview');
        
        if (titleElement) titleElement.textContent = page.title;
        if (previewElement) previewElement.textContent = getPagePreview(page);
    }
}
