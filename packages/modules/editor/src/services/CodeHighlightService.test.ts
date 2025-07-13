/**
 * 代码高亮服务测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeHighlightService, type SupportedLanguage, type HighlightOptions } from './CodeHighlightService';

describe('CodeHighlightService', () => {
  let service: CodeHighlightService;

  beforeEach(() => {
    service = new CodeHighlightService();
  });

  describe('基础功能', () => {
    it('应该正确创建服务实例', () => {
      expect(service).toBeInstanceOf(CodeHighlightService);
    });

    it('应该获取支持的语言列表', () => {
      const languages = service.getSupportedLanguages();
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.some(lang => lang.id === 'javascript')).toBe(true);
      expect(languages.some(lang => lang.id === 'python')).toBe(true);
      expect(languages.some(lang => lang.id === 'html')).toBe(true);
    });

    it('应该根据语言ID获取语言配置', () => {
      const jsConfig = service.getLanguageConfig('javascript');
      expect(jsConfig).toBeDefined();
      expect(jsConfig?.name).toBe('JavaScript');
      expect(jsConfig?.extensions).toContain('.js');
      expect(jsConfig?.highlightSupported).toBe(true);
    });

    it('应该处理不存在的语言ID', () => {
      const config = service.getLanguageConfig('nonexistent' as SupportedLanguage);
      expect(config).toBeUndefined();
    });
  });

  describe('语言检测', () => {
    it('应该根据文件扩展名检测语言', () => {
      expect(service.detectLanguageByExtension('.js')).toBe('javascript');
      expect(service.detectLanguageByExtension('.py')).toBe('python');
      expect(service.detectLanguageByExtension('.html')).toBe('html');
      expect(service.detectLanguageByExtension('.css')).toBe('css');
      expect(service.detectLanguageByExtension('.unknown')).toBe('text');
    });

    it('应该处理不带点的扩展名', () => {
      expect(service.detectLanguageByExtension('js')).toBe('javascript');
      expect(service.detectLanguageByExtension('py')).toBe('python');
    });

    it('应该根据别名检测语言', () => {
      expect(service.detectLanguageByAlias('js')).toBe('javascript');
      expect(service.detectLanguageByAlias('py')).toBe('python');
      expect(service.detectLanguageByAlias('react')).toBe('jsx');
      expect(service.detectLanguageByAlias('unknown')).toBe('text');
    });

    it('应该自动检测JavaScript代码', () => {
      const jsCode = 'function hello() { console.log("Hello"); }';
      expect(service.autoDetectLanguage(jsCode)).toBe('javascript');
    });

    it('应该自动检测Python代码', () => {
      const pythonCode = 'def hello():\n    print("Hello")';
      expect(service.autoDetectLanguage(pythonCode)).toBe('python');
    });

    it('应该自动检测Java代码', () => {
      const javaCode = 'public class Hello { public static void main() {} }';
      expect(service.autoDetectLanguage(javaCode)).toBe('java');
    });

    it('应该自动检测HTML代码', () => {
      const htmlCode = '<!DOCTYPE html><html><head></head></html>';
      expect(service.autoDetectLanguage(htmlCode)).toBe('html');
    });

    it('应该自动检测CSS代码', () => {
      const cssCode = 'body { color: red; margin: 0; }';
      expect(service.autoDetectLanguage(cssCode)).toBe('css');
    });

    it('应该自动检测JSON代码', () => {
      const jsonCode = '{"name": "test", "value": 123}';
      expect(service.autoDetectLanguage(jsonCode)).toBe('json');
    });

    it('应该对无法识别的代码返回text', () => {
      const unknownCode = 'some random text without clear patterns';
      expect(service.autoDetectLanguage(unknownCode)).toBe('text');
    });
  });

  describe('代码高亮', () => {
    it('应该高亮JavaScript代码', async () => {
      const code = 'function hello() { return "world"; }';
      const result = await service.highlightCode(code, { language: 'javascript' });
      
      expect(result.language).toBe('javascript');
      expect(result.html).toContain('function');
      expect(result.html).toContain('return');
      expect(result.tokenCount).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('应该高亮Python代码', async () => {
      const code = 'def hello():\n    return "world"';
      const result = await service.highlightCode(code, { language: 'python' });
      
      expect(result.language).toBe('python');
      expect(result.html).toContain('def');
      expect(result.html).toContain('return');
    });

    it('应该高亮HTML代码', async () => {
      const code = '<div class="test">Hello</div>';
      const result = await service.highlightCode(code, { language: 'html' });
      
      expect(result.language).toBe('html');
      expect(result.html).toContain('div');
      expect(result.html).toContain('class');
    });

    it('应该高亮CSS代码', async () => {
      const code = '.test { color: red; }';
      const result = await service.highlightCode(code, { language: 'css' });
      
      expect(result.language).toBe('css');
      expect(result.html).toContain('test');
      expect(result.html).toContain('color');
    });

    it('应该高亮JSON代码', async () => {
      const code = '{"name": "test", "value": 123}';
      const result = await service.highlightCode(code, { language: 'json' });
      
      expect(result.language).toBe('json');
      expect(result.html).toContain('name');
      expect(result.html).toContain('test');
    });

    it('应该处理纯文本', async () => {
      const code = 'This is plain text';
      const result = await service.highlightCode(code, { language: 'text' });
      
      expect(result.language).toBe('text');
      expect(result.html).toContain('This is plain text');
    });

    it('应该支持自动语言检测', async () => {
      const code = 'function test() { return true; }';
      const result = await service.highlightCode(code, { autoDetect: true });
      
      expect(result.language).toBe('javascript');
      expect(result.autoDetected).toBe(true);
    });

    it('应该支持显示行号', async () => {
      const code = 'line 1\nline 2\nline 3';
      const result = await service.highlightCode(code, { 
        language: 'text',
        showLineNumbers: true 
      });
      
      expect(result.html).toContain('line-number');
      expect(result.html).toContain('1');
      expect(result.html).toContain('2');
      expect(result.html).toContain('3');
    });

    it('应该支持高亮指定行', async () => {
      const code = 'line 1\nline 2\nline 3';
      const result = await service.highlightCode(code, { 
        language: 'text',
        showLineNumbers: true,
        highlightLines: [2]
      });
      
      expect(result.html).toContain('highlighted-line');
    });

    it('应该处理空代码', async () => {
      const result = await service.highlightCode('');
      
      expect(result.language).toBe('text');
      expect(result.tokenCount).toBe(0);
    });

    it('应该处理超长代码', async () => {
      const longCode = 'a'.repeat(60000);
      const result = await service.highlightCode(longCode, { maxLength: 1000 });
      
      expect(result.html).toContain('内容过长，已截断');
      expect(result.language).toBe('text');
    });
  });

  describe('高亮选项', () => {
    it('应该支持指定起始行号', async () => {
      const code = 'line 1\nline 2';
      const result = await service.highlightCode(code, { 
        language: 'text',
        showLineNumbers: true,
        startLineNumber: 10
      });
      
      expect(result.html).toContain('10');
      expect(result.html).toContain('11');
    });

    it('应该支持禁用自动检测', async () => {
      const code = 'function test() {}';
      const result = await service.highlightCode(code, { 
        language: 'text',
        autoDetect: false 
      });
      
      expect(result.language).toBe('text');
      expect(result.autoDetected).toBe(false);
    });
  });

  describe('缓存功能', () => {
    it('应该缓存高亮结果', async () => {
      const code = 'function test() {}';
      const options = { language: 'javascript' as SupportedLanguage };
      
      const result1 = await service.highlightCode(code, options);
      const result2 = await service.highlightCode(code, options);
      
      expect(result1.html).toBe(result2.html);
      expect(result1.language).toBe(result2.language);
    });

    it('应该获取缓存统计', () => {
      const stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThanOrEqual(0);
      expect(stats.maxSize).toBeGreaterThan(0);
    });

    it('应该清除缓存', async () => {
      await service.highlightCode('test', { language: 'text' });
      service.clearCache();
      
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成高亮', async () => {
      const code = 'function test() {\n  console.log("Hello");\n  return true;\n}';
      const startTime = performance.now();
      
      await service.highlightCode(code, { language: 'javascript' });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it('应该正确计算token数量', async () => {
      const code = 'function test() { return true; }';
      const result = await service.highlightCode(code, { language: 'javascript' });
      
      expect(result.tokenCount).toBe(7); // function, test, (, ), {, return, true, }, ;
    });

    it('应该记录处理时间', async () => {
      const code = 'console.log("test");';
      const result = await service.highlightCode(code, { language: 'javascript' });
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(1000);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的JSON', async () => {
      const invalidJson = '{"invalid": json}';
      const result = await service.highlightCode(invalidJson, { autoDetect: true });
      
      // 应该不会检测为JSON，因为格式无效
      expect(result.language).not.toBe('json');
    });

    it('应该处理特殊字符', async () => {
      const code = 'console.log("特殊字符: <>&\\"");';
      const result = await service.highlightCode(code, { language: 'javascript' });
      
      expect(result.html).toBeDefined();
      expect(result.language).toBe('javascript');
    });
  });
});
