/**
 * 数据库管理器
 * 提供模块化的数据库访问和管理功能
 */

import { DatabaseSchema } from '../types'

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>
  execute(sql: string, params?: any[]): Promise<void>
  transaction<T>(callback: () => Promise<T>): Promise<T>
  close(): Promise<void>
}

export interface DatabaseMigration {
  version: number
  description: string
  up: string[]
  down: string[]
}

export class DatabaseManager {
  private connection: DatabaseConnection
  private schemas: Map<string, DatabaseSchema> = new Map()
  private migrations: DatabaseMigration[] = []
  private currentVersion: number = 0

  constructor(connection: DatabaseConnection) {
    this.connection = connection
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    // 创建系统表
    await this.createSystemTables()
    
    // 获取当前数据库版本
    this.currentVersion = await this.getCurrentVersion()
    
    // 运行迁移
    await this.runMigrations()
  }

  /**
   * 注册模块数据库模式
   */
  registerSchema(moduleId: string, schema: DatabaseSchema): void {
    this.schemas.set(moduleId, schema)
    
    // 生成迁移脚本
    this.generateMigrations(moduleId, schema)
  }

  /**
   * 注销模块数据库模式
   */
  unregisterSchema(moduleId: string): void {
    this.schemas.delete(moduleId)
  }

  /**
   * 获取数据库连接
   */
  getConnection(): DatabaseConnection {
    return this.connection
  }

  /**
   * 执行查询
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.connection.query<T>(sql, params)
  }

  /**
   * 执行SQL语句
   */
  async execute(sql: string, params?: any[]): Promise<void> {
    return this.connection.execute(sql, params)
  }

  /**
   * 执行事务
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.connection.transaction(callback)
  }

  /**
   * 创建表
   */
  async createTable(tableName: string, schema: DatabaseSchema['tables'][string]): Promise<void> {
    const columns = Object.entries(schema.columns).map(([name, config]) => {
      let columnDef = `${name} ${config.type}`
      
      if (config.primaryKey) columnDef += ' PRIMARY KEY'
      if (config.notNull) columnDef += ' NOT NULL'
      if (config.unique) columnDef += ' UNIQUE'
      if (config.defaultValue !== undefined) {
        columnDef += ` DEFAULT ${this.formatValue(config.defaultValue)}`
      }
      
      return columnDef
    })

    // 添加外键约束
    const foreignKeys = Object.entries(schema.columns)
      .filter(([, config]) => config.foreignKey)
      .map(([name, config]) => {
        const fk = config.foreignKey!
        let constraint = `FOREIGN KEY (${name}) REFERENCES ${fk.table}(${fk.column})`
        if (fk.onDelete) constraint += ` ON DELETE ${fk.onDelete}`
        if (fk.onUpdate) constraint += ` ON UPDATE ${fk.onUpdate}`
        return constraint
      })

    const allConstraints = [...columns, ...foreignKeys]
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${allConstraints.join(', ')})`
    
    await this.execute(sql)

    // 创建索引
    if (schema.indexes) {
      for (const [indexName, indexConfig] of Object.entries(schema.indexes)) {
        const unique = indexConfig.unique ? 'UNIQUE' : ''
        const indexSql = `CREATE ${unique} INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${indexConfig.columns.join(', ')})`
        await this.execute(indexSql)
      }
    }
  }

  /**
   * 删除表
   */
  async dropTable(tableName: string): Promise<void> {
    await this.execute(`DROP TABLE IF EXISTS ${tableName}`)
  }

  /**
   * 检查表是否存在
   */
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    )
    return result.length > 0
  }

  /**
   * 获取表结构
   */
  async getTableSchema(tableName: string): Promise<any[]> {
    return this.query(`PRAGMA table_info(${tableName})`)
  }

  /**
   * 备份数据库
   */
  async backup(filePath: string): Promise<void> {
    // 实现数据库备份逻辑
    // 这里需要根据具体的数据库实现
    throw new Error('Backup not implemented')
  }

  /**
   * 恢复数据库
   */
  async restore(filePath: string): Promise<void> {
    // 实现数据库恢复逻辑
    // 这里需要根据具体的数据库实现
    throw new Error('Restore not implemented')
  }

  /**
   * 创建系统表
   */
  private async createSystemTables(): Promise<void> {
    // 创建模块表
    await this.execute(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT NOT NULL,
        enabled BOOLEAN DEFAULT FALSE,
        config TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // 创建迁移历史表
    await this.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        description TEXT NOT NULL,
        executed_at TEXT NOT NULL
      )
    `)

    // 创建设置表
    await this.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        module_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  }

  /**
   * 获取当前数据库版本
   */
  private async getCurrentVersion(): Promise<number> {
    const result = await this.query(
      'SELECT MAX(version) as version FROM migrations'
    )
    return result[0]?.version || 0
  }

  /**
   * 运行迁移
   */
  private async runMigrations(): Promise<void> {
    const pendingMigrations = this.migrations.filter(
      migration => migration.version > this.currentVersion
    )

    for (const migration of pendingMigrations) {
      await this.transaction(async () => {
        // 执行迁移脚本
        for (const sql of migration.up) {
          await this.execute(sql)
        }

        // 记录迁移历史
        await this.execute(
          'INSERT INTO migrations (version, description, executed_at) VALUES (?, ?, ?)',
          [migration.version, migration.description, new Date().toISOString()]
        )
      })

      this.currentVersion = migration.version
    }
  }

  /**
   * 生成迁移脚本
   */
  private generateMigrations(moduleId: string, schema: DatabaseSchema): void {
    const migration: DatabaseMigration = {
      version: schema.version,
      description: `Create tables for module ${moduleId}`,
      up: [],
      down: []
    }

    // 生成创建表的SQL
    for (const [tableName, tableSchema] of Object.entries(schema.tables)) {
      const columns = Object.entries(tableSchema.columns).map(([name, config]) => {
        let columnDef = `${name} ${config.type}`
        
        if (config.primaryKey) columnDef += ' PRIMARY KEY'
        if (config.notNull) columnDef += ' NOT NULL'
        if (config.unique) columnDef += ' UNIQUE'
        if (config.defaultValue !== undefined) {
          columnDef += ` DEFAULT ${this.formatValue(config.defaultValue)}`
        }
        
        return columnDef
      })

      const foreignKeys = Object.entries(tableSchema.columns)
        .filter(([, config]) => config.foreignKey)
        .map(([name, config]) => {
          const fk = config.foreignKey!
          let constraint = `FOREIGN KEY (${name}) REFERENCES ${fk.table}(${fk.column})`
          if (fk.onDelete) constraint += ` ON DELETE ${fk.onDelete}`
          if (fk.onUpdate) constraint += ` ON UPDATE ${fk.onUpdate}`
          return constraint
        })

      const allConstraints = [...columns, ...foreignKeys]
      migration.up.push(`CREATE TABLE IF NOT EXISTS ${tableName} (${allConstraints.join(', ')})`)
      migration.down.push(`DROP TABLE IF EXISTS ${tableName}`)

      // 添加索引创建语句
      if (tableSchema.indexes) {
        for (const [indexName, indexConfig] of Object.entries(tableSchema.indexes)) {
          const unique = indexConfig.unique ? 'UNIQUE' : ''
          migration.up.push(`CREATE ${unique} INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${indexConfig.columns.join(', ')})`)
          migration.down.push(`DROP INDEX IF EXISTS ${indexName}`)
        }
      }
    }

    this.migrations.push(migration)
  }

  /**
   * 格式化值
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0'
    }
    return String(value)
  }
}
