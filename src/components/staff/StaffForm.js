'use client';
import { useState, useEffect } from 'react';
import RoleService from '@/services/RoleService';

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function StaffForm({ onSubmit, loading, submitLabel, initial }) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    status: 'active',
    roles: [],
  });
  const [errors, setErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        username: initial.base_user?.username || '',
        phone: initial.phone || '',
        email: initial.email || '',
        password: '',
        status: initial.status || 'active',
        roles: (initial.roles || []).map((r) => r.name),
      });
    }
  }, [initial]);

  useEffect(() => {
    setRolesLoading(true);
    RoleService.list({ perPage: 100 })
      .then((data) => { if (data?.success) setAvailableRoles(data.data || []); })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
  };

  const toggleRole = (roleName) => {
    setForm((p) => ({
      ...p,
      roles: p.roles.includes(roleName)
        ? p.roles.filter((r) => r !== roleName)
        : [...p.roles, roleName],
    }));
    setErrors((p) => ({ ...p, roles: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full Name <span className="text-red-500">*</span></label>
          <input
            name="name"
            type="text"
            className="input text-sm"
            placeholder="e.g. John Smith"
            value={form.name}
            onChange={change}
            required
          />
          <FieldError message={errors?.name?.[0]} />
        </div>

        <div>
          <label className="label">Phone <span className="text-red-500">*</span></label>
          <input
            name="phone"
            type="text"
            className="input text-sm"
            placeholder="+255 ..."
            value={form.phone}
            onChange={change}
            required
          />
          <FieldError message={errors?.phone?.[0]} />
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
          <label className="label">Username <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span></label>
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
            Password <span className="text-xs text-gray-400 font-normal ml-1">({initial ? 'leave blank to keep current' : 'auto-generated if empty'})</span>
          </label>
          <input
            name="password"
            type="password"
            className="input text-sm"
            placeholder={initial ? '••••••••' : 'Auto-generated if empty'}
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

      {/* Roles */}
      <div className="border-t border-gray-100 pt-4">
        <label className="label">Roles <span className="text-xs text-gray-400 font-normal ml-1">(select one or more)</span></label>
        {rolesLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
            </svg>
            Loading roles...
          </div>
        ) : availableRoles.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No roles available.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => toggleRole(role.name)}
                className={`h-8 px-3 rounded text-xs font-medium border transition-all ${
                  form.roles.includes(role.name)
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
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
