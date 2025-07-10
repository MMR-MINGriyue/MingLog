/**
 * MingLog 搜索查询解析器
 * 支持复杂搜索语法解析（AND、OR、NOT、引号、通配符等）
 */

export interface SearchQuery {
  /** 原始查询字符串 */
  raw: string;
  /** 解析后的查询树 */
  ast: SearchNode;
  /** 是否有语法错误 */
  hasError: boolean;
  /** 错误信息 */
  errors: string[];
}

export interface SearchNode {
  type: 'term' | 'phrase' | 'wildcard' | 'and' | 'or' | 'not' | 'field' | 'range';
  value?: string;
  field?: string;
  children?: SearchNode[];
  start?: number;
  end?: number;
}

export interface SearchFilter {
  /** 文件类型过滤 */
  fileTypes?: string[];
  /** 创建时间范围 */
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  /** 标签过滤 */
  tags?: string[];
  /** 作者过滤 */
  authors?: string[];
  /** 大小范围 */
  sizeRange?: {
    min?: number;
    max?: number;
  };
  /** 路径过滤 */
  paths?: string[];
}

export class SearchQueryParser {
  private tokens: Token[] = [];
  private current = 0;

  /**
   * 解析搜索查询
   */
  parse(query: string): SearchQuery {
    this.tokens = this.tokenize(query);
    this.current = 0;

    const errors: string[] = [];
    let ast: SearchNode;

    try {
      ast = this.parseExpression();
      
      // 检查是否有未消费的token
      if (this.current < this.tokens.length) {
        errors.push(`Unexpected token: ${this.tokens[this.current].value}`);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      ast = { type: 'term', value: query };
    }

    return {
      raw: query,
      ast,
      hasError: errors.length > 0,
      errors
    };
  }

  /**
   * 词法分析
   */
  private tokenize(query: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < query.length) {
      const char = query[i];

      // 跳过空白字符
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // 引号字符串
      if (char === '"' || char === "'") {
        const quote = char;
        const start = i;
        i++; // 跳过开始引号
        
        let value = '';
        let escaped = false;
        
        while (i < query.length) {
          const current = query[i];
          
          if (escaped) {
            value += current;
            escaped = false;
          } else if (current === '\\') {
            escaped = true;
          } else if (current === quote) {
            i++; // 跳过结束引号
            break;
          } else {
            value += current;
          }
          
          i++;
        }
        
        tokens.push({
          type: 'phrase',
          value,
          start,
          end: i
        });
        continue;
      }

      // 操作符
      if (char === '(' || char === ')') {
        tokens.push({
          type: char === '(' ? 'lparen' : 'rparen',
          value: char,
          start: i,
          end: i + 1
        });
        i++;
        continue;
      }

      // 字段查询 (field:value)
      const fieldMatch = query.slice(i).match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
      if (fieldMatch) {
        tokens.push({
          type: 'field',
          value: fieldMatch[1],
          start: i,
          end: i + fieldMatch[0].length
        });
        i += fieldMatch[0].length;
        continue;
      }

      // 范围查询 [start TO end]
      const rangeMatch = query.slice(i).match(/^\[([^\]]*)\s+TO\s+([^\]]*)\]/i);
      if (rangeMatch) {
        tokens.push({
          type: 'range',
          value: `${rangeMatch[1]}|${rangeMatch[2]}`,
          start: i,
          end: i + rangeMatch[0].length
        });
        i += rangeMatch[0].length;
        continue;
      }

      // 单词或通配符
      const wordMatch = query.slice(i).match(/^[^\s()]+/);
      if (wordMatch) {
        const word = wordMatch[0];
        let type: TokenType = 'term';

        // 检查是否为操作符
        const upperWord = word.toUpperCase();
        if (upperWord === 'AND') {
          type = 'and';
        } else if (upperWord === 'OR') {
          type = 'or';
        } else if (upperWord === 'NOT') {
          type = 'not';
        } else if (word.includes('*') || word.includes('?')) {
          type = 'wildcard';
        }

        tokens.push({
          type,
          value: word,
          start: i,
          end: i + word.length
        });
        
        i += word.length;
        continue;
      }

      // 未知字符，跳过
      i++;
    }

    return tokens;
  }

  /**
   * 解析表达式
   */
  private parseExpression(): SearchNode {
    return this.parseOrExpression();
  }

  /**
   * 解析OR表达式
   */
  private parseOrExpression(): SearchNode {
    let left = this.parseAndExpression();

    while (this.match('or')) {
      const right = this.parseAndExpression();
      left = {
        type: 'or',
        children: [left, right]
      };
    }

    return left;
  }

  /**
   * 解析AND表达式
   */
  private parseAndExpression(): SearchNode {
    let left = this.parseNotExpression();

    while (this.match('and') || this.isImplicitAnd()) {
      if (this.previous()?.type !== 'and') {
        // 隐式AND
      }
      const right = this.parseNotExpression();
      left = {
        type: 'and',
        children: [left, right]
      };
    }

    return left;
  }

  /**
   * 解析NOT表达式
   */
  private parseNotExpression(): SearchNode {
    if (this.match('not')) {
      const operand = this.parsePrimary();
      return {
        type: 'not',
        children: [operand]
      };
    }

    return this.parsePrimary();
  }

  /**
   * 解析基本表达式
   */
  private parsePrimary(): SearchNode {
    // 括号表达式
    if (this.match('lparen')) {
      const expr = this.parseExpression();
      if (!this.match('rparen')) {
        throw new Error('Expected closing parenthesis');
      }
      return expr;
    }

    // 字段查询
    if (this.check('field')) {
      const field = this.advance().value;
      const value = this.parsePrimary();
      return {
        type: 'field',
        field,
        children: [value]
      };
    }

    // 范围查询
    if (this.match('range')) {
      const [start, end] = this.previous()!.value.split('|');
      return {
        type: 'range',
        value: `${start}|${end}`
      };
    }

    // 短语查询
    if (this.match('phrase')) {
      return {
        type: 'phrase',
        value: this.previous()!.value
      };
    }

    // 通配符查询
    if (this.match('wildcard')) {
      return {
        type: 'wildcard',
        value: this.previous()!.value
      };
    }

    // 普通词项
    if (this.match('term')) {
      return {
        type: 'term',
        value: this.previous()!.value
      };
    }

    throw new Error(`Unexpected token: ${this.peek()?.value || 'EOF'}`);
  }

  /**
   * 检查是否为隐式AND
   */
  private isImplicitAnd(): boolean {
    const current = this.peek();
    return current && 
           current.type !== 'or' && 
           current.type !== 'rparen' && 
           current.type !== 'and' &&
           this.current < this.tokens.length;
  }

  /**
   * 匹配指定类型的token
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * 检查当前token类型
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek()!.type === type;
  }

  /**
   * 前进到下一个token
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous()!;
  }

  /**
   * 是否到达末尾
   */
  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  /**
   * 获取当前token
   */
  private peek(): Token | undefined {
    return this.tokens[this.current];
  }

  /**
   * 获取前一个token
   */
  private previous(): Token | undefined {
    return this.tokens[this.current - 1];
  }
}

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

type TokenType = 
  | 'term' 
  | 'phrase' 
  | 'wildcard' 
  | 'and' 
  | 'or' 
  | 'not' 
  | 'field' 
  | 'range'
  | 'lparen' 
  | 'rparen';

export default SearchQueryParser;
