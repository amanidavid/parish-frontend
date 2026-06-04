'use client';
import { useState } from 'react';
import ClientAuthService from '@/services/ClientAuthService';
import useUiStore from '@/store/uiStore';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function SettingsPage() {
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      const data = await ClientAuthService.changePassword(form);
      if (data?.success) {
        useUiStore.getState().showModal({
          type: 'success',
          message: data?.message || 'Password changed successfully.',
        });
        setForm({ current_password: '', password: '', password_confirmation: '' });
      } else {
        if (data?.errors) setErrors(data.errors);
        useUiStore.getState().showModal({
          type: 'error',
          message: data?.message || 'Request failed. Please check your input and try again.',
        });
      }
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Update Password</h1>
        <p className="text-sm text-gray-400 mt-0.5">Change your account password</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Change Password</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Current Password <span className="text-red-500">*</span></label>
            <input
              name="current_password"
              type="password"
              className="input text-sm"
              placeholder="Enter your current password"
              value={form.current_password}
              onChange={change}
              required
            />
            <FieldError message={errors?.current_password?.[0]} />
          </div>

          <div>
            <label className="label">New Password <span className="text-red-500">*</span></label>
            <input
              name="password"
              type="password"
              className="input text-sm"
              placeholder="Enter your new password"
              value={form.password}
              onChange={change}
              required
            />
            <FieldError message={errors?.password?.[0]} />
          </div>

          <div>
            <label className="label">Confirm New Password <span className="text-red-500">*</span></label>
            <input
              name="password_confirmation"
              type="password"
              className="input text-sm"
              placeholder="Re-enter your new password"
              value={form.password_confirmation}
              onChange={change}
              required
            />
            <FieldError message={errors?.password_confirmation?.[0]} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setForm({ current_password: '', password: '', password_confirmation: '' })}
              className="btn-secondary text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-sm" disabled={saving}>
              {saving && (
                <svg className="animate-spin w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                </svg>
              )}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
