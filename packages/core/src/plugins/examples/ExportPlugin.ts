/**
 * MingLog 导出插件示例
 * 演示如何创建一个数据导出插件
 */

import type { Plugin, PluginContext, PluginManifest } from '../PluginSystem';

export interface ExportConfig {
  /** 默认导出格式 */
  defaultFormat: string;
  /** 支持的格式 */
  supportedFormats: string[];
  /** 导出路径 */
  exportPath: string;
  /** 是否包含元数据 */
  includeMetadata: boolean;
}

export interface ExportOptions {
  /** 导出格式 */
  format: 'markdown' | 'html' | 'pdf' | 'json' | 'csv';
  /** 导出范围 */
  scope: 'all' | 'selected' | 'current';
  /** 是否包含链接 */
  includeLinks: boolean;
  /** 是否包含图片 */
  includeImages: boolean;
  /** 是否包含附件 */
  includeAttachments: boolean;
  /** 自定义模板 */
  template?: string;
}

export interface ExportResult {
  /** 是否成功 */
  success: boolean;
  /** 导出文件路径 */
  filePath?: string;
  /** 导出的文件数量 */
  fileCount: number;
  /** 错误信息 */
  error?: string;
  /** 导出统计 */
  stats: {
    pages: number;
    blocks: number;
    links: number;
    images: number;
    attachments: number;
  };
}

class ExportPlugin implements Plugin {
  manifest: PluginManifest = {
    id: 'minglog-export-plugin',
    name: '数据导出器',
    version: '1.0.0',
    description: '支持多种格式的数据导出功能',
    author: 'MingLog Team',
    main: 'ExportPlugin.js',
    permissions: ['links:read', 'ui:menu', 'fs:write', 'storage:read'],
    configSchema: {
      type: 'object',
      properties: {
        defaultFormat: {
          type: 'string',
          default: 'markdown',
          enum: ['markdown', 'html', 'pdf', 'json', 'csv'],
          title: '默认导出格式'
        },
        exportPath: {
          type: 'string',
          default: './exports',
          title: '导出路径'
        },
        includeMetadata: {
          type: 'boolean',
          default: true,
          title: '包含元数据'
        }
      }
    }
  };

  private context!: PluginContext;

  async activate(context: PluginContext): Promise<void> {
    this.context = context;
    
    // 设置UI
    this.setupUI();
    
    context.logger.info('Export plugin activated');
  }

  async deactivate(): Promise<void> {
    this.context.logger.info('Export plugin deactivated');
  }

  /**
   * 设置UI
   */
  private setupUI(): void {
    // 添加导出菜单
    this.context.api.ui.addMenuItem({
      id: 'export-menu',
      label: '导出',
      icon: '📤',
      action: () => this.showExportDialog(),
      submenu: [
        {
          id: 'export-markdown',
          label: '导出为 Markdown',
          action: () => this.quickExport('markdown')
        },
        {
          id: 'export-html',
          label: '导出为 HTML',
          action: () => this.quickExport('html')
        },
        {
          id: 'export-pdf',
          label: '导出为 PDF',
          action: () => this.quickExport('pdf')
        },
        {
          id: 'export-json',
          label: '导出为 JSON',
          action: () => this.quickExport('json')
        },
        {
          id: 'export-csv',
          label: '导出为 CSV',
          action: () => this.quickExport('csv')
        }
      ]
    });
  }

  /**
   * 快速导出
   */
  private async quickExport(format: ExportOptions['format']): Promise<void> {
    const options: ExportOptions = {
      format,
      scope: 'all',
      includeLinks: true,
      includeImages: true,
      includeAttachments: false
    };

    try {
      const result = await this.exportData(options);
      
      if (result.success) {
        this.context.api.ui.showNotification(
          `导出成功！已导出 ${result.fileCount} 个文件`,
          'info'
        );
      } else {
        this.context.api.ui.showNotification(
          `导出失败：${result.error}`,
          'error'
        );
      }
    } catch (error) {
      this.context.api.ui.showNotification(
        `导出失败：${error instanceof Error ? error.message : '未知错误'}`,
        'error'
      );
    }
  }

  /**
   * 显示导出对话框
   */
  private showExportDialog(): void {
    // 这里应该显示一个导出配置对话框
    // 简化实现，直接显示通知
    this.context.api.ui.showNotification('导出配置对话框开发中...', 'info');
  }

  /**
   * 导出数据
   */
  async exportData(options: ExportOptions): Promise<ExportResult> {
    this.context.logger.info(`Starting export with format: ${options.format}`);

    try {
      // 获取要导出的数据
      const data = await this.collectData(options.scope);
      
      // 根据格式导出
      switch (options.format) {
        case 'markdown':
          return await this.exportMarkdown(data, options);
        case 'html':
          return await this.exportHTML(data, options);
        case 'pdf':
          return await this.exportPDF(data, options);
        case 'json':
          return await this.exportJSON(data, options);
        case 'csv':
          return await this.exportCSV(data, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        fileCount: 0,
        error: error instanceof Error ? error.message : '导出失败',
        stats: { pages: 0, blocks: 0, links: 0, images: 0, attachments: 0 }
      };
    }
  }

  /**
   * 收集要导出的数据
   */
  private async collectData(scope: ExportOptions['scope']): Promise<any> {
    // 这里应该根据scope收集相应的数据
    // 简化实现，返回模拟数据
    const allLinks = await this.context.api.links.find({});
    
    return {
      pages: [
        {
          id: 'page1',
          title: '示例页面1',
          content: '这是一个示例页面的内容...',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['示例', '测试']
        },
        {
          id: 'page2',
          title: '示例页面2',
          content: '这是另一个示例页面的内容...',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['示例']
        }
      ],
      links: allLinks,
      metadata: {
        exportedAt: new Date(),
        version: '1.0.0',
        totalPages: 2,
        totalLinks: allLinks.length
      }
    };
  }

  /**
   * 导出为Markdown
   */
  private async exportMarkdown(data: any, options: ExportOptions): Promise<ExportResult> {
    let fileCount = 0;
    const stats = { pages: 0, blocks: 0, links: 0, images: 0, attachments: 0 };

    for (const page of data.pages) {
      let content = `# ${page.title}\n\n`;
      content += `${page.content}\n\n`;
      
      if (options.includeLinks && data.links.length > 0) {
        content += '## 相关链接\n\n';
        for (const link of data.links) {
          content += `- [${link.title || link.target}](${link.target})\n`;
          stats.links++;
        }
        content += '\n';
      }
      
      if (page.tags && page.tags.length > 0) {
        content += '## 标签\n\n';
        content += page.tags.map((tag: string) => `#${tag}`).join(' ') + '\n\n';
      }
      
      content += `---\n`;
      content += `创建时间: ${page.createdAt.toLocaleString()}\n`;
      content += `更新时间: ${page.updatedAt.toLocaleString()}\n`;

      const fileName = `${this.sanitizeFileName(page.title)}.md`;
      await this.writeFile(fileName, content);
      
      fileCount++;
      stats.pages++;
    }

    return {
      success: true,
      fileCount,
      stats
    };
  }

  /**
   * 导出为HTML
   */
  private async exportHTML(data: any, options: ExportOptions): Promise<ExportResult> {
    let fileCount = 0;
    const stats = { pages: 0, blocks: 0, links: 0, images: 0, attachments: 0 };

    // 创建索引页面
    let indexContent = this.generateHTMLTemplate('MingLog 导出', this.generateIndexHTML(data.pages));
    await this.writeFile('index.html', indexContent);
    fileCount++;

    // 导出各个页面
    for (const page of data.pages) {
      let content = `<h1>${this.escapeHTML(page.title)}</h1>\n`;
      content += `<div class="content">${this.markdownToHTML(page.content)}</div>\n`;
      
      if (options.includeLinks && data.links.length > 0) {
        content += '<h2>相关链接</h2>\n<ul>\n';
        for (const link of data.links) {
          content += `<li><a href="${this.escapeHTML(link.target)}">${this.escapeHTML(link.title || link.target)}</a></li>\n`;
          stats.links++;
        }
        content += '</ul>\n';
      }
      
      if (page.tags && page.tags.length > 0) {
        content += '<h2>标签</h2>\n';
        content += '<div class="tags">';
        content += page.tags.map((tag: string) => `<span class="tag">#${this.escapeHTML(tag)}</span>`).join(' ');
        content += '</div>\n';
      }
      
      content += '<hr>\n';
      content += `<p><small>创建时间: ${page.createdAt.toLocaleString()}</small></p>\n`;
      content += `<p><small>更新时间: ${page.updatedAt.toLocaleString()}</small></p>\n`;

      const htmlContent = this.generateHTMLTemplate(page.title, content);
      const fileName = `${this.sanitizeFileName(page.title)}.html`;
      await this.writeFile(fileName, htmlContent);
      
      fileCount++;
      stats.pages++;
    }

    return {
      success: true,
      fileCount,
      stats
    };
  }

  /**
   * 导出为PDF
   */
  private async exportPDF(data: any, options: ExportOptions): Promise<ExportResult> {
    // PDF导出需要使用专门的库，这里简化实现
    this.context.api.ui.showNotification('PDF导出功能需要额外的库支持', 'warning');
    
    return {
      success: false,
      fileCount: 0,
      error: 'PDF导出功能暂未实现',
      stats: { pages: 0, blocks: 0, links: 0, images: 0, attachments: 0 }
    };
  }

  /**
   * 导出为JSON
   */
  private async exportJSON(data: any, options: ExportOptions): Promise<ExportResult> {
    const exportData = {
      ...data,
      exportOptions: options,
      exportedAt: new Date().toISOString()
    };

    const content = JSON.stringify(exportData, null, 2);
    await this.writeFile('minglog-export.json', content);

    return {
      success: true,
      fileCount: 1,
      stats: {
        pages: data.pages.length,
        blocks: 0,
        links: data.links.length,
        images: 0,
        attachments: 0
      }
    };
  }

  /**
   * 导出为CSV
   */
  private async exportCSV(data: any, options: ExportOptions): Promise<ExportResult> {
    // 导出页面列表
    let csvContent = 'ID,标题,内容,创建时间,更新时间,标签\n';
    
    for (const page of data.pages) {
      const row = [
        page.id,
        `"${page.title.replace(/"/g, '""')}"`,
        `"${page.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        page.createdAt.toISOString(),
        page.updatedAt.toISOString(),
        `"${(page.tags || []).join(', ')}"`
      ].join(',');
      
      csvContent += row + '\n';
    }

    await this.writeFile('pages.csv', csvContent);

    // 导出链接列表
    if (options.includeLinks && data.links.length > 0) {
      let linksCSV = '源,目标,类型,标题\n';
      
      for (const link of data.links) {
        const row = [
          `"${(link.source || '').replace(/"/g, '""')}"`,
          `"${(link.target || '').replace(/"/g, '""')}"`,
          `"${(link.type || '').replace(/"/g, '""')}"`,
          `"${(link.title || '').replace(/"/g, '""')}"`
        ].join(',');
        
        linksCSV += row + '\n';
      }

      await this.writeFile('links.csv', linksCSV);
    }

    return {
      success: true,
      fileCount: options.includeLinks ? 2 : 1,
      stats: {
        pages: data.pages.length,
        blocks: 0,
        links: data.links.length,
        images: 0,
        attachments: 0
      }
    };
  }

  /**
   * 生成HTML模板
   */
  private generateHTMLTemplate(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHTML(title)}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3 { color: #333; }
        .content { margin: 20px 0; }
        .tags { margin: 10px 0; }
        .tag { background: #e3f2fd; color: #0066cc; padding: 2px 6px; border-radius: 3px; margin-right: 5px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
        hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
  }

  /**
   * 生成索引HTML
   */
  private generateIndexHTML(pages: any[]): string {
    let content = '<h1>MingLog 导出</h1>\n';
    content += '<h2>页面列表</h2>\n<ul>\n';
    
    for (const page of pages) {
      const fileName = `${this.sanitizeFileName(page.title)}.html`;
      content += `<li><a href="${fileName}">${this.escapeHTML(page.title)}</a></li>\n`;
    }
    
    content += '</ul>\n';
    content += `<p><small>导出时间: ${new Date().toLocaleString()}</small></p>\n`;
    
    return content;
  }

  /**
   * 简单的Markdown到HTML转换
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  /**
   * HTML转义
   */
  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 清理文件名
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  /**
   * 写入文件
   */
  private async writeFile(fileName: string, content: string): Promise<void> {
    const config = this.context.config as ExportConfig;
    const filePath = `${config.exportPath}/${fileName}`;
    
    try {
      await this.context.api.fs.write(filePath, content);
      this.context.logger.info(`Exported file: ${filePath}`);
    } catch (error) {
      this.context.logger.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }
}

// 导出插件
const exportPlugin = new ExportPlugin();
export default exportPlugin;
