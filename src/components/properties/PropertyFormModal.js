'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import PropertyService from '@/services/PropertyService';
import useUiStore from '@/store/uiStore';
import PropertyForm from './PropertyForm';

export default function PropertyFormModal({ open, onClose, initial = null, onSaved }) {
  const isEdit = !!initial?.uuid;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = isEdit
        ? await PropertyService.update(initial.uuid, form)
        : await PropertyService.store(form);

      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || (isEdit ? 'Property updated.' : 'Property created.'),
        });
        onSaved?.();
        onClose();
        return {};
      }

      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || (isEdit ? 'Failed to update property.' : 'Failed to create property.'),
      });
      return { errors: data?.errors || {} };
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
      return {};
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Property' : 'New Property'}
      maxWidth="max-w-2xl"
    >
      <PropertyForm
        initial={initial}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel={isEdit ? 'Save Changes' : 'Create Property'}
      />
    </Modal>
  );
}
