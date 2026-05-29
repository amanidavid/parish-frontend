'use client';
import { useEffect, useState } from 'react';
import RoleService from '@/services/RoleService';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function normalizeText(value) {
  return typeof value === 'string' ? value : '';
}

function buildFormState(initial) {
  return {
    name: normalizeText(initial?.name),
    username: normalizeText(initial?.username || initial?.base_user?.username),
    phone: normalizeText(initial?.phone),
    email: normalizeText(initial?.email),
    password: '',
    status: initial?.status === 'suspended' ? 'suspended' : 'active',
    roles: Array.isArray(initial?.roles)
      ? initial.roles
          .map((role) => (typeof role === 'string' ? role : role?.name))
          .filter((roleName) => typeof roleName === 'string' && roleName !== '')
      : [],
  };
}

export default function StaffForm({ onSubmit, loading, submitLabel, initial }) {
  const [form, setForm] = useState(() => buildFormState(initial));
  const [errors, setErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    RoleService.list({ perPage: 100 })
      .then((data) => {
        if (data?.success) {
          setAvailableRoles(data.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: null }));
  };

  const toggleRole = (roleName) => {
    setForm((previous) => ({
      ...previous,
      roles: previous.roles.includes(roleName)
        ? previous.roles.filter((role) => role !== roleName)
        : [...previous.roles, roleName],
    }));
    setErrors((previous) => ({ ...previous, roles: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = ['Full name is required.'];
    if (!form.phone.trim()) nextErrors.phone = ['Phone is required.'];

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      status: form.status,
      roles: form.roles.length > 0 ? form.roles : ['viewer'],
    };

    if (form.username?.trim()) payload.username = form.username.trim();
    if (form.password?.trim()) payload.password = form.password.trim();

    const result = await onSubmit(payload);
    if (result?.errors) setErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Full Name</label>
          <input
            name="name"
            type="text"
            className="input text-sm"
            placeholder="e.g. John Smith"
            value={form.name}
            onChange={change}
          />
          <FieldError message={errors?.name?.[0]} />
        </div>

        <div>
          <label className="label">Phone</label>
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
          <label className="label">Email <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span></label>
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
          <label className="label">Username <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span></label>
          <input
            name="username"
            type="text"
            className="input text-sm"
            placeholder="Auto-generated if empty"
            value={form.username}
            onChange={change}
          />
          <FieldError message={errors?.username?.[0]} />
        </div>

        <div>
          <label className="label">
            Password <span className="ml-1 text-xs font-normal text-gray-400">({initial ? 'leave blank to keep current' : 'auto-generated if empty'})</span>
          </label>
          <input
            name="password"
            type="password"
            className="input text-sm"
            placeholder={initial ? '********' : 'Auto-generated if empty'}
            value={form.password}
            onChange={change}
          />
          <FieldError message={errors?.password?.[0]} />
        </div>

        <div>
          <label className="label">Status</label>
          <select name="status" className="input text-sm" value={form.status} onChange={change}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <FieldError message={errors?.status?.[0]} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className="label">Roles <span className="ml-1 text-xs font-normal text-gray-400">(select one or more)</span></label>
        {rolesLoading ? (
          <div className="flex items-center gap-2 py-2 text-sm text-gray-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
            </svg>
            Loading roles...
          </div>
        ) : availableRoles.length === 0 ? (
          <p className="py-2 text-sm text-gray-400">No roles available.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.name)}
                className={`h-8 rounded border px-3 text-xs font-medium transition-all ${
                  form.roles.includes(role.name)
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {role.name}
              </button>
            ))}
          </div>
        )}
        <FieldError message={errors?.roles?.[0] || errors?.['roles.*']?.[0]} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="submit" className="btn-primary text-sm" disabled={loading}>
          {loading && (
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
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
