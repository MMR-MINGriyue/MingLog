import React, { useState } from 'react';
import { Button, Input, Modal, ModalBody, ModalFooter } from '@minglog/ui';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePage: (name: string, isJournal: boolean) => Promise<void>;
}

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  onCreatePage,
}) => {
  const [pageName, setPageName] = useState('');
  const [isJournal, setIsJournal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pageName.trim()) {
      setError('Page name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await onCreatePage(pageName.trim(), isJournal);
      setPageName('');
      setIsJournal(false);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create page');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setPageName('');
      setIsJournal(false);
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Page"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-4">
          <div>
            <label htmlFor="pageName" className="block text-sm font-medium text-gray-700 mb-1">
              Page Name
            </label>
            <Input
              id="pageName"
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="Enter page name..."
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="flex items-center">
            <input
              id="isJournal"
              type="checkbox"
              checked={isJournal}
              onChange={(e) => setIsJournal(e.target.checked)}
              disabled={isCreating}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isJournal" className="ml-2 block text-sm text-gray-700">
              Journal page
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isCreating || !pageName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Page'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
