/**
 * MingLog 链接一致性检查器
 * 检查和修复链接系统中的一致性问题
 */

import { LinkManagerService } from '../links/LinkManagerService';
import type { PageLink, BlockLink, BacklinkInfo } from '../types/links';

export interface ConsistencyIssue {
  /** 问题ID */
  id: string;
  /** 问题类型 */
  type: 'broken-link' | 'orphaned-page' | 'circular-reference' | 'duplicate-link' | 'invalid-syntax';
  /** 严重程度 */
  severity: 'error' | 'warning' | 'info';
  /** 问题描述 */
  description: string;
  /** 受影响的源 */
  sourceId: string;
  /** 受影响的目标 */
  targetId?: string;
  /** 问题位置 */
  position?: number;
  /** 建议的修复方案 */
  suggestions: FixSuggestion[];
  /** 自动修复是否可用 */
  autoFixable: boolean;
}

export interface FixSuggestion {
  /** 修复方案ID */
  id: string;
  /** 修复描述 */
  description: string;
  /** 修复类型 */
  type: 'replace' | 'remove' | 'create' | 'redirect';
  /** 修复参数 */
  params: Record<string, any>;
  /** 置信度 */
  confidence: number;
}

export interface ConsistencyReport {
  /** 检查时间 */
  timestamp: Date;
  /** 总问题数 */
  totalIssues: number;
  /** 按类型分组的问题 */
  issuesByType: Record<string, ConsistencyIssue[]>;
  /** 按严重程度分组的问题 */
  issuesBySeverity: Record<string, ConsistencyIssue[]>;
  /** 可自动修复的问题数 */
  autoFixableCount: number;
  /** 检查统计 */
  stats: {
    totalPages: number;
    totalBlocks: number;
    totalLinks: number;
    brokenLinks: number;
    orphanedPages: number;
    circularReferences: number;
  };
}

export class LinkConsistencyChecker {
  private linkManager: LinkManagerService;
  private issues: ConsistencyIssue[] = [];

  constructor(linkManager: LinkManagerService) {
    this.linkManager = linkManager;
  }

  /**
   * 执行完整的一致性检查
   */
  async checkConsistency(): Promise<ConsistencyReport> {
    this.issues = [];

    // 获取所有数据
    const allPages = await this.getAllPages();
    const allBlocks = await this.getAllBlocks();
    const allLinks = await this.getAllLinks();

    // 执行各种检查
    await this.checkBrokenLinks(allLinks, allPages, allBlocks);
    await this.checkOrphanedPages(allPages, allLinks);
    await this.checkCircularReferences(allLinks);
    await this.checkDuplicateLinks(allLinks);
    await this.checkInvalidSyntax(allLinks);

    // 生成报告
    return this.generateReport(allPages, allBlocks, allLinks);
  }

  /**
   * 检查损坏的链接
   */
  private async checkBrokenLinks(
    links: (PageLink | BlockLink)[],
    pages: any[],
    blocks: any[]
  ): Promise<void> {
    const pageIds = new Set(pages.map(p => p.id));
    const blockIds = new Set(blocks.map(b => b.id));

    for (const link of links) {
      let targetExists = false;
      let targetType = '';

      if (link.type === 'page-reference') {
        const pageLink = link as PageLink;
        targetExists = pageIds.has(pageLink.pageName);
        targetType = 'page';
      } else if (link.type === 'block-reference') {
        const blockLink = link as BlockLink;
        targetExists = blockIds.has(blockLink.blockId);
        targetType = 'block';
      }

      if (!targetExists) {
        this.issues.push({
          id: `broken-${link.type}-${Date.now()}-${Math.random()}`,
          type: 'broken-link',
          severity: 'error',
          description: `${targetType}链接指向不存在的目标`,
          sourceId: this.getSourceId(link),
          targetId: this.getTargetId(link),
          position: link.position,
          suggestions: this.generateBrokenLinkSuggestions(link, pages, blocks),
          autoFixable: true
        });
      }
    }
  }

  /**
   * 检查孤立页面
   */
  private async checkOrphanedPages(pages: any[], links: (PageLink | BlockLink)[]): Promise<void> {
    const referencedPages = new Set<string>();
    
    // 收集所有被引用的页面
    for (const link of links) {
      if (link.type === 'page-reference') {
        const pageLink = link as PageLink;
        referencedPages.add(pageLink.pageName);
      }
    }

    // 检查未被引用的页面
    for (const page of pages) {
      if (!referencedPages.has(page.id) && !this.isSpecialPage(page)) {
        this.issues.push({
          id: `orphaned-${page.id}`,
          type: 'orphaned-page',
          severity: 'warning',
          description: `页面 "${page.title}" 没有被任何其他页面引用`,
          sourceId: page.id,
          suggestions: [
            {
              id: 'create-index-link',
              description: '在索引页面中添加链接',
              type: 'create',
              params: { targetPage: 'index', linkText: page.title },
              confidence: 0.7
            },
            {
              id: 'add-to-category',
              description: '添加到相关分类页面',
              type: 'create',
              params: { category: 'uncategorized' },
              confidence: 0.6
            }
          ],
          autoFixable: false
        });
      }
    }
  }

  /**
   * 检查循环引用
   */
  private async checkCircularReferences(links: (PageLink | BlockLink)[]): Promise<void> {
    const graph = this.buildLinkGraph(links);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        this.detectCycle(nodeId, graph, visited, recursionStack, []);
      }
    }
  }

  /**
   * 检查重复链接
   */
  private async checkDuplicateLinks(links: (PageLink | BlockLink)[]): Promise<void> {
    const linkMap = new Map<string, (PageLink | BlockLink)[]>();

    // 按源和目标分组链接
    for (const link of links) {
      const key = `${this.getSourceId(link)}->${this.getTargetId(link)}`;
      if (!linkMap.has(key)) {
        linkMap.set(key, []);
      }
      linkMap.get(key)!.push(link);
    }

    // 检查重复
    for (const [key, duplicateLinks] of linkMap) {
      if (duplicateLinks.length > 1) {
        this.issues.push({
          id: `duplicate-${key}`,
          type: 'duplicate-link',
          severity: 'warning',
          description: `发现 ${duplicateLinks.length} 个重复的链接`,
          sourceId: this.getSourceId(duplicateLinks[0]),
          targetId: this.getTargetId(duplicateLinks[0]),
          suggestions: [
            {
              id: 'remove-duplicates',
              description: '移除重复的链接，保留第一个',
              type: 'remove',
              params: { keepFirst: true },
              confidence: 0.9
            }
          ],
          autoFixable: true
        });
      }
    }
  }

  /**
   * 检查无效语法
   */
  private async checkInvalidSyntax(links: (PageLink | BlockLink)[]): Promise<void> {
    // 这里应该使用实际的语法检查逻辑
    // 简化实现
    for (const link of links) {
      if (link.type === 'page-reference') {
        const pageLink = link as PageLink;
        if (!pageLink.pageName || pageLink.pageName.trim() === '') {
          this.issues.push({
            id: `invalid-syntax-${Date.now()}-${Math.random()}`,
            type: 'invalid-syntax',
            severity: 'error',
            description: '页面链接缺少目标页面名称',
            sourceId: this.getSourceId(link),
            position: link.position,
            suggestions: [
              {
                id: 'remove-invalid-link',
                description: '移除无效的链接',
                type: 'remove',
                params: {},
                confidence: 0.8
              }
            ],
            autoFixable: true
          });
        }
      }
    }
  }

  /**
   * 自动修复问题
   */
  async autoFix(issueIds: string[]): Promise<{ fixed: number; errors: string[] }> {
    let fixed = 0;
    const errors: string[] = [];

    for (const issueId of issueIds) {
      const issue = this.issues.find(i => i.id === issueId);
      if (!issue || !issue.autoFixable) {
        errors.push(`问题 ${issueId} 无法自动修复`);
        continue;
      }

      try {
        await this.fixIssue(issue);
        fixed++;
      } catch (error) {
        errors.push(`修复问题 ${issueId} 时出错: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return { fixed, errors };
  }

  /**
   * 修复单个问题
   */
  private async fixIssue(issue: ConsistencyIssue): Promise<void> {
    const bestSuggestion = issue.suggestions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    switch (bestSuggestion.type) {
      case 'remove':
        await this.removeBrokenLink(issue);
        break;
      case 'replace':
        await this.replaceLink(issue, bestSuggestion.params);
        break;
      case 'create':
        await this.createMissingTarget(issue, bestSuggestion.params);
        break;
      case 'redirect':
        await this.redirectLink(issue, bestSuggestion.params);
        break;
    }
  }

  /**
   * 生成损坏链接的修复建议
   */
  private generateBrokenLinkSuggestions(
    link: PageLink | BlockLink,
    pages: any[],
    blocks: any[]
  ): FixSuggestion[] {
    const suggestions: FixSuggestion[] = [];

    if (link.type === 'page-reference') {
      const pageLink = link as PageLink;
      
      // 查找相似的页面名称
      const similarPages = this.findSimilarPages(pageLink.pageName, pages);
      for (const similarPage of similarPages) {
        suggestions.push({
          id: `replace-with-${similarPage.id}`,
          description: `替换为相似页面 "${similarPage.title}"`,
          type: 'replace',
          params: { newTarget: similarPage.id },
          confidence: this.calculateSimilarity(pageLink.pageName, similarPage.title)
        });
      }

      // 建议创建新页面
      suggestions.push({
        id: 'create-new-page',
        description: `创建新页面 "${pageLink.pageName}"`,
        type: 'create',
        params: { pageName: pageLink.pageName },
        confidence: 0.5
      });
    }

    // 建议移除链接
    suggestions.push({
      id: 'remove-broken-link',
      description: '移除损坏的链接',
      type: 'remove',
      params: {},
      confidence: 0.3
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 构建链接图
   */
  private buildLinkGraph(links: (PageLink | BlockLink)[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    for (const link of links) {
      const sourceId = this.getSourceId(link);
      const targetId = this.getTargetId(link);

      if (!graph.has(sourceId)) {
        graph.set(sourceId, new Set());
      }
      graph.get(sourceId)!.add(targetId);
    }

    return graph;
  }

  /**
   * 检测循环引用
   */
  private detectCycle(
    nodeId: string,
    graph: Map<string, Set<string>>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.detectCycle(neighbor, graph, visited, recursionStack, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // 发现循环
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        
        this.issues.push({
          id: `circular-${cycle.join('-')}`,
          type: 'circular-reference',
          severity: 'warning',
          description: `检测到循环引用: ${cycle.join(' → ')} → ${neighbor}`,
          sourceId: nodeId,
          targetId: neighbor,
          suggestions: [
            {
              id: 'break-cycle',
              description: '断开循环中的一个链接',
              type: 'remove',
              params: { breakPoint: cycle[cycle.length - 1] },
              confidence: 0.7
            }
          ],
          autoFixable: false
        });
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
  }

  /**
   * 生成一致性报告
   */
  private generateReport(pages: any[], blocks: any[], links: (PageLink | BlockLink)[]): ConsistencyReport {
    const issuesByType: Record<string, ConsistencyIssue[]> = {};
    const issuesBySeverity: Record<string, ConsistencyIssue[]> = {};

    for (const issue of this.issues) {
      // 按类型分组
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);

      // 按严重程度分组
      if (!issuesBySeverity[issue.severity]) {
        issuesBySeverity[issue.severity] = [];
      }
      issuesBySeverity[issue.severity].push(issue);
    }

    return {
      timestamp: new Date(),
      totalIssues: this.issues.length,
      issuesByType,
      issuesBySeverity,
      autoFixableCount: this.issues.filter(i => i.autoFixable).length,
      stats: {
        totalPages: pages.length,
        totalBlocks: blocks.length,
        totalLinks: links.length,
        brokenLinks: issuesByType['broken-link']?.length || 0,
        orphanedPages: issuesByType['orphaned-page']?.length || 0,
        circularReferences: issuesByType['circular-reference']?.length || 0
      }
    };
  }

  // 辅助方法
  private getSourceId(link: PageLink | BlockLink): string {
    return link.context || 'unknown';
  }

  private getTargetId(link: PageLink | BlockLink): string {
    if (link.type === 'page-reference') {
      return (link as PageLink).pageName;
    } else {
      return (link as BlockLink).blockId;
    }
  }

  private isSpecialPage(page: any): boolean {
    const specialPages = ['index', 'home', 'dashboard', 'settings'];
    return specialPages.includes(page.id.toLowerCase());
  }

  private findSimilarPages(target: string, pages: any[]): any[] {
    return pages
      .map(page => ({
        ...page,
        similarity: this.calculateSimilarity(target, page.title)
      }))
      .filter(page => page.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // 简化的相似度计算
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 修复操作的实现
  private async removeBrokenLink(issue: ConsistencyIssue): Promise<void> {
    // 实现移除损坏链接的逻辑
  }

  private async replaceLink(issue: ConsistencyIssue, params: Record<string, any>): Promise<void> {
    // 实现替换链接的逻辑
  }

  private async createMissingTarget(issue: ConsistencyIssue, params: Record<string, any>): Promise<void> {
    // 实现创建缺失目标的逻辑
  }

  private async redirectLink(issue: ConsistencyIssue, params: Record<string, any>): Promise<void> {
    // 实现重定向链接的逻辑
  }

  // 数据获取方法（需要根据实际数据源实现）
  private async getAllPages(): Promise<any[]> {
    // 实现获取所有页面的逻辑
    return [];
  }

  private async getAllBlocks(): Promise<any[]> {
    // 实现获取所有块的逻辑
    return [];
  }

  private async getAllLinks(): Promise<(PageLink | BlockLink)[]> {
    // 实现获取所有链接的逻辑
    return [];
  }
}

export default LinkConsistencyChecker;
