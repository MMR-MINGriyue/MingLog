import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, ModalBody, ModalFooter } from '@minglog/ui';
import type { Page } from '@minglog/core';

interface PageSettingsProps {
  page: Page;
  onUpdatePage: (updates: Partial<Page>) => Promise<void>;
  onDeletePage: () => Promise<void>;
  onClose: () => void;
}

export const PageSettings: React.FC<PageSettingsProps> = ({
  page,
  onUpdatePage,
  onDeletePage,
  onClose,
}) => {
  const [title, setTitle] = useState(page.title || page.name);
  const [tags, setTags] = useState(page.tags.join(', '));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitle(page.title || page.name);
    setTags(page.tags.join(', '));
  }, [page]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsUpdating(true);
    setError('');

    try {
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await onUpdatePage({
        title: title.trim() || page.name,
        tags: tagArray,
      });

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update page');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      await onDeletePage();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete page');
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Page Settings"
      size="md"
    >
      <form onSubmit={handleUpdate}>
        <ModalBody className="space-y-4">
          <div>
            <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              id="pageTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
              disabled={isUpdating || isDeleting}
            />
          </div>

          <div>
            <label htmlFor="pageTags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <Input
              id="pageTags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
              disabled={isUpdating || isDeleting}
            />
          </div>

          <div className="text-sm text-gray-500">
            <div><strong>Name:</strong> {page.name}</div>
            <div><strong>Created:</strong> {new Date(page.createdAt).toLocaleDateString()}</div>
            <div><strong>Updated:</strong> {new Date(page.updatedAt).toLocaleDateString()}</div>
            {page.isJournal && <div><strong>Type:</strong> Journal Page</div>}
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <div>
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUpdating || isDeleting}
                  size="sm"
                >
                  Delete Page
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    size="sm"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isUpdating || isDeleting}
          >
            Close
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isUpdating || isDeleting}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
