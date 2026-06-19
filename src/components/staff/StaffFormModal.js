'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import StaffService from '@/services/StaffService';
import useUiStore from '@/store/uiStore';
import StaffForm from './StaffForm';

export default function StaffFormModal({ open, onClose, initial = null, onSaved }) {
  const isEdit = !!initial?.uuid;
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (form) => {
    setLoading(true);
    try {
      const data = isEdit
        ? await StaffService.update(initial.uuid, form)
        : await StaffService.store(form);

      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || (isEdit ? 'Staff updated.' : 'Staff created.'),
        });
        onSaved?.();
        onClose();
        return {};
      }

      useUiStore.getState().showModal({
        type: 'error',
        message: data?.message || (isEdit ? 'Failed to update staff.' : 'Failed to create staff.'),
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
      title={isEdit ? 'Edit Staff' : 'New Staff'}
      maxWidth="max-w-xl"
    >
      <StaffForm
        initial={initial}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel={isEdit ? 'Save Changes' : 'Create Staff'}
      />
    </Modal>
  );
}
