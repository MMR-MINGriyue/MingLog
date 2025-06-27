/**
 * 创建图谱对话框组件
 * Create Graph Modal Component
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { useLocale } from '../hooks/useLocale';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

interface CreateGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGraph: (name: string, path: string) => Promise<void>;
  loading?: boolean;
}

export const CreateGraphModal: React.FC<CreateGraphModalProps> = ({
  isOpen,
  onClose,
  onCreateGraph,
  loading = false,
}) => {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [errors, setErrors] = useState<{ name?: string; path?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 自动生成路径
  const generatePath = (graphName: string) => {
    return graphName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!path || path === generatePath(name)) {
      setPath(generatePath(value));
    }
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handlePathChange = (value: string) => {
    setPath(value);
    if (errors.path) {
      setErrors(prev => ({ ...prev, path: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: { name?: string; path?: string } = {};

    if (!name.trim()) {
      newErrors.name = t('graph.errors.nameRequired');
    } else if (name.trim().length < 2) {
      newErrors.name = t('graph.errors.nameTooShort');
    }

    if (!path.trim()) {
      newErrors.path = t('graph.errors.pathRequired');
    } else if (!/^[a-z0-9\u4e00-\u9fa5-]+$/.test(path.trim())) {
      newErrors.path = t('graph.errors.pathInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateGraph(name.trim(), path.trim());
      handleClose();
    } catch (error) {
      console.error('Failed to create graph:', error);
      // 这里可以显示错误消息
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setPath('');
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t('graph.createGraph')}
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="graph-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('graph.name')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="graph-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('graph.namePlaceholder')}
                error={errors.name}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="graph-path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('graph.path')} <span className="text-red-500">*</span>
              </label>
              <Input
                id="graph-path"
                type="text"
                value={path}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder={t('graph.pathPlaceholder')}
                error={errors.path}
                disabled={isSubmitting}
              />
              {errors.path && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.path}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('graph.pathHint')}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">{t('graph.createTips.title')}</p>
                  <ul className="space-y-1 text-xs">
                    <li>• {t('graph.createTips.tip1')}</li>
                    <li>• {t('graph.createTips.tip2')}</li>
                    <li>• {t('graph.createTips.tip3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!name.trim() || !path.trim()}
            >
              {t('graph.createGraph')}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default CreateGraphModal;
