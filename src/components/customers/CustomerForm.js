'use client';
import { useState, useEffect } from 'react';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function CustomerForm({ onSubmit, loading, submitLabel, initial, propertyUuid = '' }) {
  const [form, setForm] = useState({
    customer_type: 'individual',
    display_name: '',
    email: '',
    phone: '',
    status: 'active',
    notes: '',
    business_name: '',
    registration_number: '',
    tax_identifier: '',
    contact_person_name: '',
    contact_person_phone: '',
    address_line: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initial) {
      setForm({
        customer_type: initial.customer_type || 'individual',
        display_name: initial.display_name || '',
        email: initial.email || '',
        phone: initial.phone || '',
        status: initial.status || 'active',
        notes: initial.notes || '',
        business_name: initial.business_detail?.business_name || '',
        registration_number: initial.business_detail?.registration_number || '',
        tax_identifier: initial.business_detail?.tax_identifier || '',
        contact_person_name: initial.business_detail?.contact_person_name || '',
        contact_person_phone: initial.business_detail?.contact_person_phone || '',
        address_line: initial.business_detail?.address_line || '',
      });
    }
  }, [initial]);

  const isBusiness = form.customer_type === 'business';

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      customer_type: form.customer_type,
      display_name: form.display_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
      ...(propertyUuid ? { property_uuid: propertyUuid } : {}),
    };

    if (isBusiness) {
      payload.business_details = {
        business_name: form.business_name.trim(),
        registration_number: form.registration_number.trim() || null,
        tax_identifier: form.tax_identifier.trim() || null,
        contact_person_name: form.contact_person_name.trim() || null,
        contact_person_phone: form.contact_person_phone.trim() || null,
        address_line: form.address_line.trim() || null,
      };
    }

    const result = await onSubmit(payload);
    if (result?.errors) setErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Type Toggle */}
      <div>
        <label className="label">Customer Type <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2 mt-1">
          {[
            { value: 'individual', label: 'Individual' },
            { value: 'business', label: 'Business' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, customer_type: opt.value }))}
              className={`h-9 px-4 rounded text-sm font-medium border transition-all ${form.customer_type === opt.value
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <FieldError message={errors?.customer_type?.[0]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Display Name <span className="text-red-500">*</span></label>
          <input
            name="display_name"
            type="text"
            className="input text-sm"
            placeholder="e.g. John Doe or Acme Corp"
            value={form.display_name}
            onChange={change}
            required
          />
          <FieldError message={errors?.display_name?.[0]} />
        </div>

        <div>
          <label className="label">Email <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
          <input
            name="email"
            type="email"
            className="input text-sm"
            placeholder="email@example.com"
            value={form.email}
            onChange={change}
          />
          <FieldError message={errors?.email?.[0]} />
        </div>

        <div>
          <label className="label">Phone <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
          <input
            name="phone"
            type="text"
            className="input text-sm"
            placeholder="+255 ..."
            value={form.phone}
            onChange={change}
          />
          <FieldError message={errors?.phone?.[0]} />
        </div>

        <div>
          <label className="label">Status</label>
          <select name="status" className="input text-sm" value={form.status} onChange={change}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <FieldError message={errors?.status?.[0]} />
        </div>
      </div>

      {/* Business Details */}
      {isBusiness && (
        <div className="border-t border-gray-100 pt-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Business Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Business Name <span className="text-red-500">*</span></label>
              <input
                name="business_name"
                type="text"
                className="input text-sm"
                placeholder="Registered business name"
                value={form.business_name}
                onChange={change}
                required={isBusiness}
              />
              <FieldError message={errors?.['business_details.business_name']?.[0] || errors?.business_details?.[0]} />
            </div>

            <div>
              <label className="label">Registration Number <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
              <input
                name="registration_number"
                type="text"
                className="input text-sm"
                placeholder="e.g. BRELA-12345"
                value={form.registration_number}
                onChange={change}
              />
              <FieldError message={errors?.['business_details.registration_number']?.[0]} />
            </div>

            <div>
              <label className="label">Tax Identifier <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
              <input
                name="tax_identifier"
                type="text"
                className="input text-sm"
                placeholder="TIN number"
                value={form.tax_identifier}
                onChange={change}
              />
              <FieldError message={errors?.['business_details.tax_identifier']?.[0]} />
            </div>

            <div>
              <label className="label">Contact Person <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
              <input
                name="contact_person_name"
                type="text"
                className="input text-sm"
                placeholder="Name of contact person"
                value={form.contact_person_name}
                onChange={change}
              />
              <FieldError message={errors?.['business_details.contact_person_name']?.[0]} />
            </div>

            <div>
              <label className="label">Contact Phone <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
              <input
                name="contact_person_phone"
                type="text"
                className="input text-sm"
                placeholder="Contact person phone"
                value={form.contact_person_phone}
                onChange={change}
              />
              <FieldError message={errors?.['business_details.contact_person_phone']?.[0]} />
            </div>

            <div className="sm:col-span-2">
              <label className="label">Address <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
              <input
                name="address_line"
                type="text"
                className="input text-sm"
                placeholder="Business address"
                value={form.address_line}
                onChange={change}
              />
              <FieldError message={errors?.['business_details.address_line']?.[0]} />
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <label className="label">Notes <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
        <textarea
          name="notes"
          className="input text-sm resize-none"
          rows={3}
          placeholder="Additional notes about this customer..."
          value={form.notes}
          onChange={change}
        />
        <FieldError message={errors?.notes?.[0]} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary text-sm" disabled={loading}>
          {loading && (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
            </svg>
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
