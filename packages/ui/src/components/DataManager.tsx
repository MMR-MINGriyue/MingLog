/**
 * 数据管理组件
 * Data Manager Component
 */

import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { useLocale } from '../hooks/useLocale';
import { Button } from './Button';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

interface DataManagerProps {
  onImportData: (data: any, format: 'json' | 'markdown' | 'csv') => Promise<void>;
  onExportData: (format: 'json' | 'markdown' | 'csv') => Promise<void>;
  onBackupData: () => Promise<void>;
  onRestoreData: (backupData: any) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const DataManager: React.FC<DataManagerProps> = ({
  onImportData,
  onExportData,
  onBackupData,
  onRestoreData,
  loading = false,
  className,
}) => {
  const { t } = useLocale();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importFormat, setImportFormat] = useState<'json' | 'markdown' | 'csv'>('json');
  const [exportFormat, setExportFormat] = useState<'json' | 'markdown' | 'csv'>('json');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      let data: any;

      switch (importFormat) {
        case 'json':
          data = JSON.parse(text);
          break;
        case 'markdown':
          data = { content: text, format: 'markdown' };
          break;
        case 'csv':
          data = { content: text, format: 'csv' };
          break;
        default:
          throw new Error('Unsupported format');
      }

      await onImportData(data, importFormat);
      setShowImportModal(false);
    } catch (error) {
      console.error('Import failed:', error);
      // 这里可以显示错误消息
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      await onExportData(exportFormat);
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      // 这里可以显示错误消息
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackup = async () => {
    setIsProcessing(true);
    try {
      await onBackupData();
    } catch (error) {
      console.error('Backup failed:', error);
      // 这里可以显示错误消息
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', description: '完整的数据结构，包含所有信息' },
    { value: 'markdown', label: 'Markdown', description: '纯文本格式，易于阅读和编辑' },
    { value: 'csv', label: 'CSV', description: '表格格式，适合数据分析' },
  ];

  return (
    <div className={clsx('space-y-6', className)}>
      {/* 数据导入导出 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('data.importExport')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {t('data.import')}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('data.importDescription')}
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowImportModal(true)}
              disabled={loading || isProcessing}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              }
            >
              {t('data.import')}
            </Button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {t('data.export')}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('data.exportDescription')}
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(true)}
              disabled={loading || isProcessing}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
            >
              {t('data.export')}
            </Button>
          </div>
        </div>
      </div>

      {/* 备份和恢复 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('data.backupRestore')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {t('data.backup')}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('data.backupDescription')}
            </p>
            <Button
              variant="secondary"
              onClick={handleBackup}
              disabled={loading || isProcessing}
              loading={isProcessing}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              }
            >
              {t('data.createBackup')}
            </Button>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {t('data.restore')}
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('data.restoreDescription')}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                // 这里可以打开文件选择对话框来选择备份文件
                console.log('Restore functionality to be implemented');
              }}
              disabled={loading || isProcessing}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              {t('data.restoreFromBackup')}
            </Button>
          </div>
        </div>
      </div>

      {/* 导入模态框 */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} size="md">
        <ModalHeader>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            {t('data.import')}
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('data.selectFormat')}
              </label>
              <div className="space-y-2">
                {formatOptions.map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="importFormat"
                      value={option.value}
                      checked={importFormat === option.value}
                      onChange={(e) => setImportFormat(e.target.value as any)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('data.selectFile')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={importFormat === 'json' ? '.json' : importFormat === 'markdown' ? '.md,.txt' : '.csv'}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowImportModal(false)}
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      {/* 导出模态框 */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} size="md">
        <ModalHeader>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {t('data.export')}
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('data.selectFormat')}
              </label>
              <div className="space-y-2">
                {formatOptions.map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="exportFormat"
                      value={option.value}
                      checked={exportFormat === option.value}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(false)}
              disabled={isProcessing}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              loading={isProcessing}
            >
              {t('data.export')}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default DataManager;
