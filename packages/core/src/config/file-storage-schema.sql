-- 文件存储数据库模式
-- 定义文件存储相关的数据库表结构

-- 文件表
CREATE TABLE IF NOT EXISTS files (
  -- 基础字段
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  thumbnail_path TEXT,
  
  -- 元数据字段
  description TEXT DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]', -- JSON数组
  category TEXT,
  custom_fields TEXT NOT NULL DEFAULT '{}', -- JSON对象
  
  -- 权限字段
  permissions TEXT NOT NULL DEFAULT '{}', -- JSON对象
  
  -- 特定类型元数据
  image_metadata TEXT DEFAULT NULL, -- JSON对象，图片特定信息
  video_metadata TEXT DEFAULT NULL, -- JSON对象，视频特定信息
  audio_metadata TEXT DEFAULT NULL, -- JSON对象，音频特定信息
  document_metadata TEXT DEFAULT NULL, -- JSON对象，文档特定信息
  
  -- 时间戳字段
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT,
  
  -- 索引
  UNIQUE(checksum, name) -- 防止相同内容的文件重复存储
);

-- 文件关联表
CREATE TABLE IF NOT EXISTS file_associations (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'document', 'block', 'task', 'project', 'note'
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'attachment', 'embed', 'reference', 'thumbnail', 'cover'
  metadata TEXT DEFAULT '{}', -- JSON对象，关联特定元数据
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  UNIQUE(file_id, type, target_id, relationship) -- 防止重复关联
);

-- 文件版本表（用于版本控制）
CREATE TABLE IF NOT EXISTS file_versions (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  size INTEGER NOT NULL,
  change_description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  UNIQUE(file_id, version_number)
);

-- 文件访问日志表
CREATE TABLE IF NOT EXISTS file_access_logs (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'view', 'download', 'edit', 'delete'
  user_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 文件分享表
CREATE TABLE IF NOT EXISTS file_shares (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  share_type TEXT NOT NULL, -- 'public', 'private', 'password'
  password_hash TEXT, -- 如果是密码保护分享
  expires_at DATETIME,
  max_downloads INTEGER,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- 创建索引以提高查询性能

-- 文件表索引
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category);
CREATE INDEX IF NOT EXISTS idx_files_size ON files(size);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_updated_at ON files(updated_at);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON files(checksum);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);

-- 文件关联表索引
CREATE INDEX IF NOT EXISTS idx_file_associations_file_id ON file_associations(file_id);
CREATE INDEX IF NOT EXISTS idx_file_associations_type ON file_associations(type);
CREATE INDEX IF NOT EXISTS idx_file_associations_target_id ON file_associations(target_id);
CREATE INDEX IF NOT EXISTS idx_file_associations_relationship ON file_associations(relationship);

-- 文件版本表索引
CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_created_at ON file_versions(created_at);

-- 文件访问日志表索引
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_action ON file_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON file_access_logs(created_at);

-- 文件分享表索引
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON file_shares(expires_at);

-- 创建触发器以自动更新时间戳

-- 文件表更新时间戳触发器
CREATE TRIGGER IF NOT EXISTS update_files_timestamp 
  AFTER UPDATE ON files
  FOR EACH ROW
BEGIN
  UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- 创建视图以简化常用查询

-- 文件详情视图（包含关联信息）
CREATE VIEW IF NOT EXISTS file_details AS
SELECT 
  f.*,
  COUNT(fa.id) as association_count,
  GROUP_CONCAT(DISTINCT fa.type) as association_types,
  COUNT(fv.id) as version_count,
  MAX(fv.version_number) as latest_version
FROM files f
LEFT JOIN file_associations fa ON f.id = fa.file_id
LEFT JOIN file_versions fv ON f.id = fv.file_id
GROUP BY f.id;

-- 文件统计视图
CREATE VIEW IF NOT EXISTS file_statistics AS
SELECT 
  COUNT(*) as total_files,
  SUM(size) as total_size,
  COUNT(DISTINCT type) as unique_types,
  COUNT(DISTINCT category) as unique_categories,
  AVG(size) as average_size,
  MIN(created_at) as earliest_file,
  MAX(created_at) as latest_file
FROM files
WHERE JSON_EXTRACT(custom_fields, '$.deleted') IS NULL OR JSON_EXTRACT(custom_fields, '$.deleted') = 0;

-- 分类统计视图
CREATE VIEW IF NOT EXISTS category_statistics AS
SELECT 
  COALESCE(category, 'uncategorized') as category,
  COUNT(*) as file_count,
  SUM(size) as total_size,
  AVG(size) as average_size,
  MIN(created_at) as earliest_file,
  MAX(created_at) as latest_file
FROM files
WHERE JSON_EXTRACT(custom_fields, '$.deleted') IS NULL OR JSON_EXTRACT(custom_fields, '$.deleted') = 0
GROUP BY category;

-- 类型统计视图
CREATE VIEW IF NOT EXISTS type_statistics AS
SELECT 
  type,
  COUNT(*) as file_count,
  SUM(size) as total_size,
  AVG(size) as average_size,
  MIN(created_at) as earliest_file,
  MAX(created_at) as latest_file
FROM files
WHERE JSON_EXTRACT(custom_fields, '$.deleted') IS NULL OR JSON_EXTRACT(custom_fields, '$.deleted') = 0
GROUP BY type;

-- 最近访问的文件视图
CREATE VIEW IF NOT EXISTS recent_files AS
SELECT 
  f.*,
  MAX(fal.created_at) as last_accessed
FROM files f
LEFT JOIN file_access_logs fal ON f.id = fal.file_id
WHERE JSON_EXTRACT(f.custom_fields, '$.deleted') IS NULL OR JSON_EXTRACT(f.custom_fields, '$.deleted') = 0
GROUP BY f.id
ORDER BY last_accessed DESC, f.created_at DESC;

-- 热门文件视图（按访问次数）
CREATE VIEW IF NOT EXISTS popular_files AS
SELECT 
  f.*,
  COUNT(fal.id) as access_count,
  MAX(fal.created_at) as last_accessed
FROM files f
LEFT JOIN file_access_logs fal ON f.id = fal.file_id
WHERE JSON_EXTRACT(f.custom_fields, '$.deleted') IS NULL OR JSON_EXTRACT(f.custom_fields, '$.deleted') = 0
GROUP BY f.id
ORDER BY access_count DESC, f.created_at DESC;

-- 插入示例数据（可选，用于测试）
/*
INSERT INTO files (
  id, name, original_name, type, size, path, checksum,
  description, tags, category, permissions
) VALUES (
  'file_example_1',
  'example.txt',
  'example.txt',
  'text/plain',
  1024,
  '/storage/2024/01/15/file_example_1.txt',
  'sha256_hash_example',
  '示例文本文件',
  '["示例", "测试"]',
  'documents',
  '{"is_public": false, "allow_download": true, "allow_preview": true}'
);

INSERT INTO file_associations (
  id, file_id, type, target_id, relationship
) VALUES (
  'assoc_example_1',
  'file_example_1',
  'document',
  'doc_123',
  'attachment'
);
*/
