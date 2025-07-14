/**
 * 代码高亮服务
 * 提供多种编程语言的语法高亮功能
 */

/**
 * 支持的编程语言
 */
export type SupportedLanguage = 
  | 'javascript' | 'typescript' | 'jsx' | 'tsx'
  | 'python' | 'java' | 'csharp' | 'cpp' | 'c'
  | 'html' | 'css' | 'scss' | 'less'
  | 'json' | 'xml' | 'yaml' | 'toml'
  | 'markdown' | 'sql' | 'bash' | 'shell'
  | 'go' | 'rust' | 'php' | 'ruby'
  | 'swift' | 'kotlin' | 'dart'
  | 'text' | 'plaintext';

/**
 * 语言配置接口
 */
export interface LanguageConfig {
  /** 语言标识符 */
  id: SupportedLanguage;
  /** 显示名称 */
  name: string;
  /** 文件扩展名 */
  extensions: string[];
  /** 语言别名 */
  aliases: string[];
  /** 是否支持语法高亮 */
  highlightSupported: boolean;
  /** 是否支持自动完成 */
  autocompleteSupported: boolean;
}

/**
 * 高亮结果接口
 */
export interface HighlightResult {
  /** 高亮后的HTML */
  html: string;
  /** 检测到的语言 */
  language: SupportedLanguage;
  /** 是否自动检测 */
  autoDetected: boolean;
  /** 高亮的token数量 */
  tokenCount: number;
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 高亮选项接口
 */
export interface HighlightOptions {
  /** 指定语言（如果不指定则自动检测） */
  language?: SupportedLanguage;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
  /** 起始行号 */
  startLineNumber?: number;
  /** 高亮的行号 */
  highlightLines?: number[];
  /** 主题名称 */
  theme?: string;
  /** 是否启用自动检测 */
  autoDetect?: boolean;
  /** 最大处理长度 */
  maxLength?: number;
}

/**
 * 代码高亮服务类
 */
export class CodeHighlightService {
  private languages: Map<SupportedLanguage, LanguageConfig> = new Map();
  private highlightCache: Map<string, HighlightResult> = new Map();
  private maxCacheSize = 100;

  constructor() {
    this.initializeLanguages();
  }

  /**
   * 初始化支持的语言
   */
  private initializeLanguages(): void {
    const languageConfigs: LanguageConfig[] = [
      // Web技术
      { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.mjs'], aliases: ['js'], highlightSupported: true, autocompleteSupported: true },
      { id: 'typescript', name: 'TypeScript', extensions: ['.ts'], aliases: ['ts'], highlightSupported: true, autocompleteSupported: true },
      { id: 'jsx', name: 'JSX', extensions: ['.jsx'], aliases: ['react'], highlightSupported: true, autocompleteSupported: true },
      { id: 'tsx', name: 'TSX', extensions: ['.tsx'], aliases: ['tsx'], highlightSupported: true, autocompleteSupported: true },
      { id: 'html', name: 'HTML', extensions: ['.html', '.htm'], aliases: ['markup'], highlightSupported: true, autocompleteSupported: true },
      { id: 'css', name: 'CSS', extensions: ['.css'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'scss', name: 'SCSS', extensions: ['.scss'], aliases: ['sass'], highlightSupported: true, autocompleteSupported: true },
      { id: 'less', name: 'Less', extensions: ['.less'], aliases: [], highlightSupported: true, autocompleteSupported: false },

      // 后端语言
      { id: 'python', name: 'Python', extensions: ['.py', '.pyw'], aliases: ['py'], highlightSupported: true, autocompleteSupported: true },
      { id: 'java', name: 'Java', extensions: ['.java'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'csharp', name: 'C#', extensions: ['.cs'], aliases: ['cs', 'c#'], highlightSupported: true, autocompleteSupported: true },
      { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cxx', '.cc'], aliases: ['c++'], highlightSupported: true, autocompleteSupported: true },
      { id: 'c', name: 'C', extensions: ['.c', '.h'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'go', name: 'Go', extensions: ['.go'], aliases: ['golang'], highlightSupported: true, autocompleteSupported: true },
      { id: 'rust', name: 'Rust', extensions: ['.rs'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'php', name: 'PHP', extensions: ['.php'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'ruby', name: 'Ruby', extensions: ['.rb'], aliases: ['rb'], highlightSupported: true, autocompleteSupported: true },

      // 移动开发
      { id: 'swift', name: 'Swift', extensions: ['.swift'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'kotlin', name: 'Kotlin', extensions: ['.kt', '.kts'], aliases: ['kt'], highlightSupported: true, autocompleteSupported: true },
      { id: 'dart', name: 'Dart', extensions: ['.dart'], aliases: [], highlightSupported: true, autocompleteSupported: true },

      // 数据格式
      { id: 'json', name: 'JSON', extensions: ['.json'], aliases: [], highlightSupported: true, autocompleteSupported: false },
      { id: 'xml', name: 'XML', extensions: ['.xml'], aliases: [], highlightSupported: true, autocompleteSupported: false },
      { id: 'yaml', name: 'YAML', extensions: ['.yaml', '.yml'], aliases: ['yml'], highlightSupported: true, autocompleteSupported: false },
      { id: 'toml', name: 'TOML', extensions: ['.toml'], aliases: [], highlightSupported: true, autocompleteSupported: false },

      // 其他
      { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'], aliases: ['md'], highlightSupported: true, autocompleteSupported: false },
      { id: 'sql', name: 'SQL', extensions: ['.sql'], aliases: [], highlightSupported: true, autocompleteSupported: true },
      { id: 'bash', name: 'Bash', extensions: ['.sh', '.bash'], aliases: ['shell', 'sh'], highlightSupported: true, autocompleteSupported: true },
      { id: 'shell', name: 'Shell', extensions: ['.sh'], aliases: ['bash'], highlightSupported: true, autocompleteSupported: true },
      { id: 'text', name: 'Plain Text', extensions: ['.txt'], aliases: ['plaintext'], highlightSupported: false, autocompleteSupported: false },
      { id: 'plaintext', name: 'Plain Text', extensions: ['.txt'], aliases: ['text'], highlightSupported: false, autocompleteSupported: false }
    ];

    languageConfigs.forEach(config => {
      this.languages.set(config.id, config);
    });
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Array.from(this.languages.values());
  }

  /**
   * 根据语言ID获取语言配置
   */
  getLanguageConfig(language: SupportedLanguage): LanguageConfig | undefined {
    return this.languages.get(language);
  }

  /**
   * 根据文件扩展名检测语言
   */
  detectLanguageByExtension(extension: string): SupportedLanguage {
    const normalizedExt = extension.toLowerCase();
    if (!normalizedExt.startsWith('.')) {
      return this.detectLanguageByExtension('.' + normalizedExt);
    }

    for (const [, config] of this.languages) {
      if (config.extensions.includes(normalizedExt)) {
        return config.id;
      }
    }

    return 'text';
  }

  /**
   * 根据别名检测语言
   */
  detectLanguageByAlias(alias: string): SupportedLanguage {
    const normalizedAlias = alias.toLowerCase();
    
    for (const [, config] of this.languages) {
      if (config.aliases.includes(normalizedAlias) || config.id === normalizedAlias) {
        return config.id;
      }
    }

    return 'text';
  }

  /**
   * 简单的语言自动检测
   */
  autoDetectLanguage(code: string): SupportedLanguage {
    const trimmedCode = code.trim();
    
    // 检测常见的语言特征
    if (trimmedCode.includes('function') && trimmedCode.includes('{')) {
      if (trimmedCode.includes('const') || trimmedCode.includes('let') || trimmedCode.includes('=>')) {
        return 'javascript';
      }
    }
    
    if (trimmedCode.includes('def ') && trimmedCode.includes(':')) {
      return 'python';
    }
    
    if (trimmedCode.includes('public class') || trimmedCode.includes('import java.')) {
      return 'java';
    }
    
    if (trimmedCode.includes('<?php')) {
      return 'php';
    }
    
    if (trimmedCode.includes('<html') || trimmedCode.includes('<!DOCTYPE')) {
      return 'html';
    }
    
    if (trimmedCode.includes('{') && (trimmedCode.includes('color:') || trimmedCode.includes('margin:'))) {
      return 'css';
    }
    
    if (trimmedCode.startsWith('{') && trimmedCode.endsWith('}')) {
      try {
        JSON.parse(trimmedCode);
        return 'json';
      } catch {
        // 不是有效的JSON
      }
    }
    
    return 'text';
  }

  /**
   * 高亮代码
   */
  async highlightCode(code: string, options: HighlightOptions = {}): Promise<HighlightResult> {
    const startTime = performance.now();
    
    // 检查缓存
    const cacheKey = this.generateCacheKey(code, options);
    const cached = this.highlightCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 检查代码长度限制
    const maxLength = options.maxLength || 50000;
    if (code.length > maxLength) {
      return {
        html: this.escapeHtml(code.substring(0, maxLength) + '\n... (内容过长，已截断)'),
        language: 'text',
        autoDetected: false,
        tokenCount: 0,
        processingTime: performance.now() - startTime
      };
    }

    // 确定语言
    let language = options.language;
    let autoDetected = false;
    
    if (!language && options.autoDetect !== false) {
      language = this.autoDetectLanguage(code);
      autoDetected = true;
    }
    
    if (!language) {
      language = 'text';
    }

    // 简化的语法高亮实现
    const html = this.performHighlighting(code, language, options);
    
    const result: HighlightResult = {
      html,
      language,
      autoDetected,
      tokenCount: this.countTokens(code),
      processingTime: performance.now() - startTime
    };

    // 缓存结果
    this.cacheResult(cacheKey, result);
    
    return result;
  }

  /**
   * 执行语法高亮
   */
  private performHighlighting(code: string, language: SupportedLanguage, options: HighlightOptions): string {
    const config = this.getLanguageConfig(language);
    
    if (!config?.highlightSupported) {
      return this.wrapInCodeBlock(this.escapeHtml(code), options);
    }

    // 简化的语法高亮实现
    let highlightedCode = this.escapeHtml(code);
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        highlightedCode = this.highlightJavaScript(highlightedCode);
        break;
      case 'python':
        highlightedCode = this.highlightPython(highlightedCode);
        break;
      case 'html':
        highlightedCode = this.highlightHTML(highlightedCode);
        break;
      case 'css':
        highlightedCode = this.highlightCSS(highlightedCode);
        break;
      case 'json':
        highlightedCode = this.highlightJSON(highlightedCode);
        break;
      default:
        // 基础高亮：关键字、字符串、注释
        highlightedCode = this.highlightBasic(highlightedCode);
        break;
    }

    return this.wrapInCodeBlock(highlightedCode, options);
  }

  /**
   * JavaScript/TypeScript语法高亮
   */
  private highlightJavaScript(code: string): string {
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'static', 'public', 'private', 'protected'];
    
    return code
      .replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="keyword">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
  }

  /**
   * Python语法高亮
   */
  private highlightPython(code: string): string {
    const keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'import', 'from', 'return', 'yield', 'lambda', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False'];
    
    return code
      .replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="keyword">$1</span>')
      .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
  }

  /**
   * HTML语法高亮
   */
  private highlightHTML(code: string): string {
    return code
      .replace(/(&lt;\/?[^&gt;]+&gt;)/g, '<span class="tag">$1</span>')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>')
      .replace(/(\w+)=(['"`])((?:\\.|(?!\2)[^\\])*?)\2/g, '<span class="attribute">$1</span>=<span class="string">$2$3$2</span>');
  }

  /**
   * CSS语法高亮
   */
  private highlightCSS(code: string): string {
    return code
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
      .replace(/([.#]?[\w-]+)\s*{/g, '<span class="selector">$1</span> {')
      .replace(/([\w-]+)\s*:/g, '<span class="property">$1</span>:')
      .replace(/:\s*([^;]+);/g, ': <span class="value">$1</span>;');
  }

  /**
   * JSON语法高亮
   */
  private highlightJSON(code: string): string {
    return code
      .replace(/("[\w\s]*")\s*:/g, '<span class="key">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="string">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="number">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="keyword">$1</span>');
  }

  /**
   * 基础语法高亮
   */
  private highlightBasic(code: string): string {
    return code
      .replace(/(\/\/.*$|#.*$)/gm, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
      .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
  }

  /**
   * 包装代码块
   */
  private wrapInCodeBlock(code: string, options: HighlightOptions): string {
    const lines = code.split('\n');
    let html = '';

    if (options.showLineNumbers) {
      const startLine = options.startLineNumber || 1;
      html += '<div class="code-block with-line-numbers">';
      
      lines.forEach((line, index) => {
        const lineNumber = startLine + index;
        const isHighlighted = options.highlightLines?.includes(lineNumber);
        const lineClass = isHighlighted ? 'highlighted-line' : '';
        
        html += `<div class="code-line ${lineClass}">`;
        html += `<span class="line-number">${lineNumber}</span>`;
        html += `<span class="line-content">${line}</span>`;
        html += '</div>';
      });
      
      html += '</div>';
    } else {
      html = `<div class="code-block">${code}</div>`;
    }

    return html;
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 计算token数量
   */
  private countTokens(code: string): number {
    return code.split(/\s+/).filter(token => token.length > 0).length;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(code: string, options: HighlightOptions): string {
    const optionsStr = JSON.stringify(options);
    return `${code.length}-${optionsStr}-${code.substring(0, 100)}`;
  }

  /**
   * 缓存结果
   */
  private cacheResult(key: string, result: HighlightResult): void {
    if (this.highlightCache.size >= this.maxCacheSize) {
      const firstKey = this.highlightCache.keys().next().value;
      this.highlightCache.delete(firstKey);
    }
    this.highlightCache.set(key, result);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.highlightCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.highlightCache.size,
      maxSize: this.maxCacheSize
    };
  }
}
