/**
 * 文件上传组件使用示例
 * 展示如何在实际项目中使用FileUploadComponent
 */

import React, { useState, useCallback } from 'react'
import { FileUploadComponent, FileUploadItem, FileUploadConfig } from './FileUploadComponent'
import { Button } from '../atoms/Button/Button'

export const FileUploadExample: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([])
  const [uploadConfig, setUploadConfig] = useState<FileUploadConfig>({
    acceptedTypes: ['image/*', 'application/pdf', 'text/*'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    multiple: true,
    autoUpload: true
  })

  // 处理上传完成
  const handleUploadComplete = useCallback((files: FileUploadItem[]) => {
    console.log('上传完成:', files)
    setUploadedFiles(prev => [...prev, ...files])
    
    // 这里可以调用API保存文件信息到数据库
    // await saveFilesToDatabase(files)
  }, [])

  // 处理上传进度
  const handleUploadProgress = useCallback((file: FileUploadItem) => {
    console.log(`文件 ${file.file.name} 上传进度: ${file.progress}%`)
  }, [])

  // 处理上传错误
  const handleUploadError = useCallback((file: FileUploadItem, error: string) => {
    console.error(`文件 ${file.file.name} 上传失败:`, error)
    
    // 这里可以显示用户友好的错误提示
    // showNotification('上传失败', error, 'error')
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback((files: File[]) => {
    console.log('选择了文件:', files.map(f => f.name))
  }, [])

  // 处理文件移除
  const handleFileRemove = useCallback((fileId: string) => {
    console.log('移除文件:', fileId)
  }, [])

  // 切换配置
  const toggleAutoUpload = useCallback(() => {
    setUploadConfig(prev => ({
      ...prev,
      autoUpload: !prev.autoUpload
    }))
  }, [])

  const changeMaxFiles = useCallback((maxFiles: number) => {
    setUploadConfig(prev => ({
      ...prev,
      maxFiles
    }))
  }, [])

  const changeFileTypes = useCallback((types: string[]) => {
    setUploadConfig(prev => ({
      ...prev,
      acceptedTypes: types
    }))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground-primary mb-2">
          文件上传组件示例
        </h1>
        <p className="text-foreground-secondary">
          演示文件上传组件的各种功能和配置选项
        </p>
      </div>

      {/* 配置面板 */}
      <div className="bg-surface-secondary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground-primary mb-4">
          配置选项
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 自动上传开关 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-primary">
              自动上传
            </label>
            <Button
              variant={uploadConfig.autoUpload ? 'primary' : 'outline'}
              onClick={toggleAutoUpload}
              size="sm"
            >
              {uploadConfig.autoUpload ? '已启用' : '已禁用'}
            </Button>
          </div>

          {/* 最大文件数量 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-primary">
              最大文件数量
            </label>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map(num => (
                <Button
                  key={num}
                  variant={uploadConfig.maxFiles === num ? 'primary' : 'outline'}
                  onClick={() => changeMaxFiles(num)}
                  size="sm"
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          {/* 文件类型 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground-primary">
              文件类型
            </label>
            <div className="space-y-1">
              <Button
                variant={uploadConfig.acceptedTypes?.includes('image/*') ? 'primary' : 'outline'}
                onClick={() => changeFileTypes(['image/*'])}
                size="sm"
                className="w-full"
              >
                仅图片
              </Button>
              <Button
                variant={uploadConfig.acceptedTypes?.includes('application/pdf') ? 'primary' : 'outline'}
                onClick={() => changeFileTypes(['application/pdf', 'text/*'])}
                size="sm"
                className="w-full"
              >
                文档
              </Button>
              <Button
                variant={uploadConfig.acceptedTypes?.length === 3 ? 'primary' : 'outline'}
                onClick={() => changeFileTypes(['image/*', 'application/pdf', 'text/*'])}
                size="sm"
                className="w-full"
              >
                全部
              </Button>
            </div>
          </div>
        </div>

        {/* 当前配置显示 */}
        <div className="mt-4 p-4 bg-surface-tertiary rounded-lg">
          <h3 className="text-sm font-medium text-foreground-primary mb-2">
            当前配置
          </h3>
          <pre className="text-xs text-foreground-secondary overflow-x-auto">
            {JSON.stringify(uploadConfig, null, 2)}
          </pre>
        </div>
      </div>

      {/* 文件上传组件 */}
      <div className="bg-surface-secondary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground-primary mb-4">
          文件上传
        </h2>
        
        <FileUploadComponent
          config={uploadConfig}
          onUploadComplete={handleUploadComplete}
          onUploadProgress={handleUploadProgress}
          onUploadError={handleUploadError}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          placeholder="拖拽文件到此处或点击选择文件进行上传"
        />
      </div>

      {/* 已上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="bg-surface-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground-primary mb-4">
            已上传文件 ({uploadedFiles.length})
          </h2>
          
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-surface-primary rounded-lg border border-border-secondary"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground-primary">
                    {file.file.name}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    大小: {(file.file.size / 1024).toFixed(2)} KB
                  </p>
                  {file.url && (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-brand-primary hover:underline"
                    >
                      查看文件
                    </a>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadedFiles(prev => prev.filter(f => f.id !== file.id))
                  }}
                >
                  移除
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadedFiles([])}
            >
              清空列表
            </Button>
            
            <Button
              variant="primary"
              onClick={() => {
                console.log('导出文件列表:', uploadedFiles)
                // 这里可以实现导出功能
              }}
            >
              导出列表
            </Button>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-surface-secondary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground-primary mb-4">
          使用说明
        </h2>
        
        <div className="space-y-4 text-sm text-foreground-secondary">
          <div>
            <h3 className="font-medium text-foreground-primary mb-2">基本功能</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>支持拖拽上传和点击选择文件</li>
              <li>实时显示上传进度</li>
              <li>文件类型和大小验证</li>
              <li>错误处理和重试机制</li>
              <li>文件列表管理</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground-primary mb-2">配置选项</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>acceptedTypes: 允许的文件类型</li>
              <li>maxFileSize: 最大文件大小限制</li>
              <li>maxFiles: 最大文件数量限制</li>
              <li>autoUpload: 是否自动开始上传</li>
              <li>multiple: 是否允许多文件选择</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-foreground-primary mb-2">事件回调</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>onUploadComplete: 上传完成回调</li>
              <li>onUploadProgress: 上传进度回调</li>
              <li>onUploadError: 上传错误回调</li>
              <li>onFileSelect: 文件选择回调</li>
              <li>onFileRemove: 文件移除回调</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUploadExample
