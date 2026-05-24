'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiFetch from '@/lib/apiFetch';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function PropertyForm({ initial = {}, onSubmit, loading, submitLabel = 'Save' }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial.name || '',
    type_uuid: initial.type?.uuid || '',
    address_line: initial.address_line || '',
    postal_code: initial.postal_code || '',
    status: initial.status || 'active',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/app/property-types?per_page=100')
      .then((d) => setPropertyTypes(d?.data || []))
      .catch(() => { })
      .finally(() => setTypesLoading(false));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    const payload = {
      name: form.name,
      type_uuid: form.type_uuid || null,
      address_line: form.address_line || null,
      postal_code: form.postal_code || null,
      status: form.status,
    };
    const result = await onSubmit(payload);
    if (result?.errors) setFieldErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Property Name" required error={fieldErrors?.name?.[0]}>
          <input
            name="name"
            type="text"
            className="input"
            placeholder="e.g. Sunset Apartments"
            value={form.name}
            onChange={handleChange}
            required
          />
        </Field>

        <Field label="Property Type" error={fieldErrors?.type_uuid?.[0]}>
          <select
            name="type_uuid"
            className="input"
            value={form.type_uuid}
            onChange={handleChange}
            disabled={typesLoading}
          >
            <option value="">{typesLoading ? 'Loading...' : 'Select type (optional)'}</option>
            {propertyTypes.map((t) => (
              <option key={t.uuid} value={t.uuid}>{t.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Status" required error={fieldErrors?.status?.[0]}>
          <select name="status" className="input" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>

        <Field label="Address Line" error={fieldErrors?.address_line?.[0]}>
          <input
            name="address_line"
            type="text"
            className="input"
            placeholder="e.g. 123 Main Street"
            value={form.address_line}
            onChange={handleChange}
          />
        </Field>

        <Field label="Postal Code" error={fieldErrors?.postal_code?.[0]}>
          <input
            name="postal_code"
            type="text"
            className="input"
            placeholder="e.g. 10100"
            value={form.postal_code}
            onChange={handleChange}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading && <Spinner />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
