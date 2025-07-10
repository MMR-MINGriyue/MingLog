/**
 * MingLog 数据库连接接口
 */

export interface DatabaseQueryResult {
  [key: string]: any;
}

export interface DatabaseConnection {
  /**
   * 执行SQL查询
   * @param sql SQL语句
   * @param params 参数
   * @returns 查询结果
   */
  query(sql: string, params?: any[]): Promise<DatabaseQueryResult[]>;

  /**
   * 执行SQL语句（无返回结果）
   * @param sql SQL语句
   * @param params 参数
   * @returns 影响的行数
   */
  execute(sql: string, params?: any[]): Promise<number>;

  /**
   * 开始事务
   */
  beginTransaction(): Promise<void>;

  /**
   * 提交事务
   */
  commitTransaction(): Promise<void>;

  /**
   * 回滚事务
   */
  rollbackTransaction(): Promise<void>;

  /**
   * 关闭连接
   */
  close(): Promise<void>;

  /**
   * 检查连接是否有效
   */
  isConnected(): boolean;
}
