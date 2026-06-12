'use client';
import { useState, useEffect } from 'react';
import { useEmployeeProfile, useUpdateProfile } from '@/hooks/useEmployees';
import useUiStore from '@/store/uiStore';

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export default function ProfileTab({ uuid, canManage }) {
  const { data: profileData, isLoading } = useEmployeeProfile(uuid);
  const profile = profileData?.data;
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ contacts: [], addresses: [], emergency_contacts: [], identifiers: [] });

  useEffect(() => {
    if (profile) {
      setForm({
        contacts: profile.contacts?.length ? profile.contacts : [{ type: 'phone', label: 'personal', value: '', is_primary: true }],
        addresses: profile.addresses?.length ? profile.addresses : [{ type: 'home', country: '', region: '', city: '', postal_code: '', address_line: '', is_primary: true }],
        emergency_contacts: profile.emergency_contacts?.length ? profile.emergency_contacts : [{ full_name: '', relationship: '', phone: '', email: '', is_primary: true }],
        identifiers: profile.identifiers?.length ? profile.identifiers : [{ type: '', identifier_value: '', issued_on: '', expires_on: '' }],
      });
    }
  }, [profile]);

  const updateArray = (field, idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === idx ? { ...item, [key]: value } : item)),
    }));
  };

  const addItem = (field, template) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], template] }));
  };

  const removeItem = (field, idx) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    updateProfile.mutate(
      { uuid, data: form },
      {
        onSuccess: () => {
          setEditing(false);
          useUiStore.getState().showModal({ type: 'success', message: 'Profile updated.' });
        },
        onError: (err) => {
          useUiStore.getState().showModal({ type: 'error', message: err?.message || 'Failed to update profile.' });
        },
      }
    );
  };

  if (isLoading) {
    return <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">Loading profile…</div>;
  }

  if (!profile && !editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">
        No profile data available.
        {canManage && (
          <button onClick={() => setEditing(true)} className="btn-primary text-sm ml-3">Create Profile</button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {canManage && !editing && (
        <div className="flex justify-end">
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm">Edit Profile</button>
        </div>
      )}
      {canManage && editing && (
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} className="btn-primary text-sm" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      )}

      <SectionCard title="Contacts" editing={editing} onAdd={() => addItem('contacts', { type: 'phone', label: '', value: '', is_primary: false })}>
        {form.contacts.map((c, i) => (
          editing ? (
            <EditRow key={i}>
              <select className="input text-xs w-28" value={c.type} onChange={(e) => updateArray('contacts', i, 'type', e.target.value)}>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
              </select>
              <input className="input text-xs flex-1" placeholder="Label" value={c.label} onChange={(e) => updateArray('contacts', i, 'label', e.target.value)} />
              <input className="input text-xs flex-1" placeholder="Value" value={c.value} onChange={(e) => updateArray('contacts', i, 'value', e.target.value)} />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="checkbox" checked={c.is_primary} onChange={(e) => updateArray('contacts', i, 'is_primary', e.target.checked)} /> Primary</label>
              <button onClick={() => removeItem('contacts', i)} className="text-red-500 text-xs">Remove</button>
            </EditRow>
          ) : (
            <ReadRow key={i}>
              <span className="font-medium text-gray-700">{cap(c.type)}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-600">{c.label}</span>
              <span className="text-gray-400 mx-2">·</span>
              <span className="text-gray-900">{c.value}</span>
              {c.is_primary && <span className="ml-2 text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded">Primary</span>}
            </ReadRow>
          )
        ))}
        {form.contacts.length === 0 && <EmptyRow>No contacts.</EmptyRow>}
      </SectionCard>

      <SectionCard title="Addresses" editing={editing} onAdd={() => addItem('addresses', { type: 'home', country: '', region: '', city: '', postal_code: '', address_line: '', is_primary: false })}>
        {form.addresses.map((a, i) => (
          editing ? (
            <EditRow key={i}>
              <input className="input text-xs" placeholder="Type" value={a.type} onChange={(e) => updateArray('addresses', i, 'type', e.target.value)} />
              <input className="input text-xs" placeholder="Country" value={a.country} onChange={(e) => updateArray('addresses', i, 'country', e.target.value)} />
              <input className="input text-xs" placeholder="Region" value={a.region} onChange={(e) => updateArray('addresses', i, 'region', e.target.value)} />
              <input className="input text-xs" placeholder="City" value={a.city} onChange={(e) => updateArray('addresses', i, 'city', e.target.value)} />
              <input className="input text-xs" placeholder="Postal Code" value={a.postal_code} onChange={(e) => updateArray('addresses', i, 'postal_code', e.target.value)} />
              <input className="input text-xs sm:col-span-2" placeholder="Address Line" value={a.address_line} onChange={(e) => updateArray('addresses', i, 'address_line', e.target.value)} />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="checkbox" checked={a.is_primary} onChange={(e) => updateArray('addresses', i, 'is_primary', e.target.checked)} /> Primary</label>
              <button onClick={() => removeItem('addresses', i)} className="text-red-500 text-xs">Remove</button>
            </EditRow>
          ) : (
            <ReadRow key={i}>
              <p className="font-medium text-gray-800">{a.address_line}, {a.city}, {a.region}, {a.country} {a.postal_code}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cap(a.type)} {a.is_primary && '· Primary'}</p>
            </ReadRow>
          )
        ))}
        {form.addresses.length === 0 && <EmptyRow>No addresses.</EmptyRow>}
      </SectionCard>

      <SectionCard title="Emergency Contacts" editing={editing} onAdd={() => addItem('emergency_contacts', { full_name: '', relationship: '', phone: '', email: '', is_primary: false })}>
        {form.emergency_contacts.map((ec, i) => (
          editing ? (
            <EditRow key={i}>
              <input className="input text-xs" placeholder="Full Name" value={ec.full_name} onChange={(e) => updateArray('emergency_contacts', i, 'full_name', e.target.value)} />
              <input className="input text-xs" placeholder="Relationship" value={ec.relationship} onChange={(e) => updateArray('emergency_contacts', i, 'relationship', e.target.value)} />
              <input className="input text-xs" placeholder="Phone" value={ec.phone} onChange={(e) => updateArray('emergency_contacts', i, 'phone', e.target.value)} />
              <input className="input text-xs" placeholder="Email" value={ec.email} onChange={(e) => updateArray('emergency_contacts', i, 'email', e.target.value)} />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="checkbox" checked={ec.is_primary} onChange={(e) => updateArray('emergency_contacts', i, 'is_primary', e.target.checked)} /> Primary</label>
              <button onClick={() => removeItem('emergency_contacts', i)} className="text-red-500 text-xs">Remove</button>
            </EditRow>
          ) : (
            <ReadRow key={i}>
              <p className="font-medium text-gray-800">{ec.full_name} <span className="text-gray-400">({ec.relationship})</span></p>
              <p className="text-xs text-gray-500">{ec.phone} {ec.email && `· ${ec.email}`} {ec.is_primary && <span className="ml-1 text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded">Primary</span>}</p>
            </ReadRow>
          )
        ))}
        {form.emergency_contacts.length === 0 && <EmptyRow>No emergency contacts.</EmptyRow>}
      </SectionCard>

      <SectionCard title="Identifiers" editing={editing} onAdd={() => addItem('identifiers', { type: '', identifier_value: '', issued_on: '', expires_on: '' })}>
        {form.identifiers.map((idf, i) => (
          editing ? (
            <EditRow key={i}>
              <input className="input text-xs" placeholder="Type" value={idf.type} onChange={(e) => updateArray('identifiers', i, 'type', e.target.value)} />
              <input className="input text-xs sm:col-span-2" placeholder="Identifier Value" value={idf.identifier_value} onChange={(e) => updateArray('identifiers', i, 'identifier_value', e.target.value)} />
              <input className="input text-xs" type="date" placeholder="Issued On" value={idf.issued_on || ''} onChange={(e) => updateArray('identifiers', i, 'issued_on', e.target.value)} />
              <input className="input text-xs" type="date" placeholder="Expires On" value={idf.expires_on || ''} onChange={(e) => updateArray('identifiers', i, 'expires_on', e.target.value)} />
              <button onClick={() => removeItem('identifiers', i)} className="text-red-500 text-xs">Remove</button>
            </EditRow>
          ) : (
            <ReadRow key={i}>
              <p className="font-medium text-gray-800">{cap(idf.type)}</p>
              <p className="text-xs text-gray-500">{idf.identifier_value} {idf.issued_on && `· Issued: ${idf.issued_on}`} {idf.expires_on && `· Expires: ${idf.expires_on}`}</p>
            </ReadRow>
          )
        ))}
        {form.identifiers.length === 0 && <EmptyRow>No identifiers.</EmptyRow>}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children, editing, onAdd }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</p>
        {editing && <button onClick={onAdd} className="text-xs text-primary-600 hover:underline">+ Add</button>}
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function EditRow({ children }) {
  return <div className="px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">{children}</div>;
}

function ReadRow({ children }) {
  return <div className="px-6 py-3 text-sm">{children}</div>;
}

function EmptyRow({ children }) {
  return <p className="px-6 py-4 text-sm text-gray-400">{children}</p>;
}
