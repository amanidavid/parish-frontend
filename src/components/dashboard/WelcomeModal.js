'use client';
import { useState, useEffect, useCallback } from 'react';
import PropertyService from '@/services/PropertyService';
import LocationService from '@/services/LocationService';
import apiFetch from '@/lib/apiFetch';
import { COUNTRY_CODES } from '@/constants/countryCodes';

const TANZANIA_ISO2 = 'TZ';

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="label">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function WelcomeModal({ open, userName, onCreated, onSkip }) {
  const [form, setForm] = useState({ name: '', type_uuid: '', address_line: '', region_uuid: '', district_uuid: '' });
  const [countryIso2, setCountryIso2] = useState(TANZANIA_ISO2);
  const isTanzania = countryIso2 === TANZANIA_ISO2;

  const [propertyTypes, setPropertyTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!open) return;
    apiFetch('/api/v1/app/property-types?per_page=100')
      .then((d) => setPropertyTypes(d?.data || []))
      .catch(() => { })
      .finally(() => setTypesLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !isTanzania) return;
    setRegionsLoading(true);
    LocationService.regions()
      .then((d) => setRegions(d?.data || []))
      .catch(() => { })
      .finally(() => setRegionsLoading(false));
  }, [open, isTanzania]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
    setServerError(null);
  }, []);

  const handleRegionChange = useCallback((e) => {
    const regionUuid = e.target.value;
    setForm((p) => ({ ...p, region_uuid: regionUuid, district_uuid: '' }));
    setDistricts([]);
    if (!regionUuid) return;
    setDistrictsLoading(true);
    LocationService.districts(regionUuid)
      .then((d) => setDistricts(d?.data || []))
      .catch(() => { })
      .finally(() => setDistrictsLoading(false));
  }, []);

  const handleCountryChange = useCallback((e) => {
    setCountryIso2(e.target.value);
    setForm((p) => ({ ...p, region_uuid: '', district_uuid: '', address_line: '' }));
    setDistricts([]);
    setErrors({});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: ['Property name is required'] });
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const payload = {
        name: form.name.trim(),
        type_uuid: form.type_uuid || null,
        status: 'active',
        ...(isTanzania
          ? { district_uuid: form.district_uuid || null }
          : { address_line: form.address_line || null }
        ),
      };
      const data = await PropertyService.store(payload);
      if (data?.success) {
        onCreated(data.data);
      } else {
        if (data?.errors) setErrors(data.errors);
        setServerError(data?.message || 'Failed to create property.');
      }
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,15,30,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative overflow-hidden px-7 pt-7 pb-6 text-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />
          <div className="relative">
            <div className="text-3xl mb-2">??</div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {userName ? `Welcome, ${userName.split(' ')[0]}!` : 'Welcome!'}
            </h2>
            <p className="text-indigo-200 text-xs mt-1">
              Each workspace represents one property. Fill in your property details below.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-7 py-5 space-y-4">
            {serverError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Property Name" required error={errors?.name?.[0]}>
                <input name="name" type="text" className="input" placeholder="e.g. Sunset Apartments"
                  value={form.name} onChange={handleChange} autoFocus required />
              </Field>

              <Field label="Type" error={errors?.type_uuid?.[0]}>
                <select name="type_uuid" className="input" value={form.type_uuid} onChange={handleChange} disabled={typesLoading}>
                  <option value="">{typesLoading ? 'Loading...' : 'Select type (optional)'}</option>
                  {propertyTypes.map((t) => (
                    <option key={t.uuid} value={t.uuid}>{t.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Country" required hint="Location fields adjust based on country" error={errors?.country?.[0]}>
                <select className="input" value={countryIso2} onChange={handleCountryChange}>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.iso2} value={c.iso2}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </Field>

              {isTanzania ? (
                <>
                  <Field label="Region" error={errors?.region_uuid?.[0]}>
                    <select name="region_uuid" className="input" value={form.region_uuid}
                      onChange={handleRegionChange} disabled={regionsLoading}>
                      <option value="">{regionsLoading ? 'Loading...' : 'Select region (optional)'}</option>
                      {regions.map((r) => <option key={r.uuid} value={r.uuid}>{r.name}</option>)}
                    </select>
                  </Field>
                  <Field label="District" error={errors?.district_uuid?.[0]} hint="Country and region are derived from the selected district when the property is saved.">
                    <select name="district_uuid" className="input" value={form.district_uuid}
                      onChange={handleChange} disabled={!form.region_uuid || districtsLoading}>
                      <option value="">{!form.region_uuid ? 'Select region first' : districtsLoading ? 'Loading...' : 'Select district (optional)'}</option>
                      {districts.map((d) => <option key={d.uuid} value={d.uuid}>{d.name}</option>)}
                    </select>
                  </Field>
                </>
              ) : (
                <Field label="Location" error={errors?.address_line?.[0]} hint="Street address or area">
                  <input name="address_line" type="text" className="input"
                    placeholder="e.g. 123 Main Street"
                    value={form.address_line} onChange={handleChange} />
                </Field>
              )}
            </div>
          </div>

          <div className="px-7 pb-6 space-y-2 shrink-0">
            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity"
              style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', opacity: saving ? 0.7 : 1 }}>
              {saving && <Spinner />}
              {saving ? 'Saving...' : 'Save Property Details'}
            </button>
            <button type="button" onClick={onSkip} disabled={saving}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Set up later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
