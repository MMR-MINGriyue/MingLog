/**
 * MingLog 搜索 Web Worker
 * 在后台线程中执行搜索操作，避免阻塞主线程
 */

import { SearchEngine } from '../search/SearchEngine';
import type { SearchDocument, SearchResult, SearchOptions } from '../search/SearchEngine';
import { SearchQueryParser } from '../search/SearchQueryParser';

// Worker消息类型
export interface WorkerMessage {
  id: string;
  type: 'search' | 'index' | 'suggest' | 'stats';
  payload: any;
}

export interface WorkerResponse {
  id: string;
  type: 'success' | 'error' | 'progress';
  payload: any;
}

// 搜索请求
export interface SearchRequest {
  query: string;
  options?: SearchOptions;
}

// 索引请求
export interface IndexRequest {
  documents: SearchDocument[];
  operation: 'add' | 'update' | 'remove';
}

// 建议请求
export interface SuggestRequest {
  query: string;
  limit?: number;
}

class SearchWorkerImpl {
  private searchEngine: SearchEngine;
  private parser: SearchQueryParser;

  constructor() {
    this.searchEngine = new SearchEngine();
    this.parser = new SearchQueryParser();
  }

  /**
   * 处理来自主线程的消息
   */
  handleMessage(event: MessageEvent<WorkerMessage>): void {
    const { id, type, payload } = event.data;

    try {
      switch (type) {
        case 'search':
          this.handleSearch(id, payload as SearchRequest);
          break;
        
        case 'index':
          this.handleIndex(id, payload as IndexRequest);
          break;
        
        case 'suggest':
          this.handleSuggest(id, payload as SuggestRequest);
          break;
        
        case 'stats':
          this.handleStats(id);
          break;
        
        default:
          this.sendError(id, `Unknown message type: ${type}`);
      }
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 处理搜索请求
   */
  private async handleSearch(id: string, request: SearchRequest): Promise<void> {
    try {
      const { query, options = {} } = request;
      
      // 发送进度更新
      this.sendProgress(id, { stage: 'parsing', progress: 0.1 });
      
      // 执行搜索
      const results = this.searchEngine.search(query, options);
      
      this.sendProgress(id, { stage: 'ranking', progress: 0.8 });
      
      // 发送结果
      this.sendSuccess(id, {
        results,
        query,
        totalTime: Date.now()
      });
      
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : 'Search failed');
    }
  }

  /**
   * 处理索引请求
   */
  private async handleIndex(id: string, request: IndexRequest): Promise<void> {
    try {
      const { documents, operation } = request;
      let processed = 0;
      
      for (const document of documents) {
        switch (operation) {
          case 'add':
            this.searchEngine.addDocument(document);
            break;
          case 'update':
            this.searchEngine.updateDocument(document);
            break;
          case 'remove':
            this.searchEngine.removeDocument(document.id);
            break;
        }
        
        processed++;
        
        // 发送进度更新
        if (processed % 10 === 0 || processed === documents.length) {
          this.sendProgress(id, {
            stage: 'indexing',
            progress: processed / documents.length,
            processed,
            total: documents.length
          });
        }
      }
      
      this.sendSuccess(id, {
        operation,
        processed,
        stats: this.searchEngine.getStats()
      });
      
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : 'Indexing failed');
    }
  }

  /**
   * 处理建议请求
   */
  private async handleSuggest(id: string, request: SuggestRequest): Promise<void> {
    try {
      const { query, limit = 10 } = request;
      const suggestions = this.searchEngine.getSuggestions(query, limit);
      
      this.sendSuccess(id, { suggestions });
      
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : 'Suggestion failed');
    }
  }

  /**
   * 处理统计请求
   */
  private async handleStats(id: string): Promise<void> {
    try {
      const stats = this.searchEngine.getStats();
      this.sendSuccess(id, stats);
    } catch (error) {
      this.sendError(id, error instanceof Error ? error.message : 'Stats failed');
    }
  }

  /**
   * 发送成功响应
   */
  private sendSuccess(id: string, payload: any): void {
    const response: WorkerResponse = {
      id,
      type: 'success',
      payload
    };
    self.postMessage(response);
  }

  /**
   * 发送错误响应
   */
  private sendError(id: string, error: string): void {
    const response: WorkerResponse = {
      id,
      type: 'error',
      payload: { error }
    };
    self.postMessage(response);
  }

  /**
   * 发送进度更新
   */
  private sendProgress(id: string, payload: any): void {
    const response: WorkerResponse = {
      id,
      type: 'progress',
      payload
    };
    self.postMessage(response);
  }
}

// 在Worker环境中运行
if (typeof self !== 'undefined' && self.addEventListener) {
  const worker = new SearchWorkerImpl();
  
  self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
    worker.handleMessage(event);
  });
}

export default SearchWorkerImpl;
