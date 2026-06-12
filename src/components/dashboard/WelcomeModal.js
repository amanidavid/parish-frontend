'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import PropertyService from '@/services/PropertyService';
import LocationService from '@/services/LocationService';
import apiFetch from '@/lib/apiFetch';

function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

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
  const [form, setForm] = useState({ name: '', type_uuid: '', address_line: '', country_uuid: '', region_uuid: '', district_uuid: '', ward_uuid: '' });

  const [propertyTypes, setPropertyTypes] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryResults, setCountryResults] = useState([]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countrySearchRef = useRef(null);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);

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

  /* Debounced country search */
  useEffect(() => {
    if (!open || !countryDropdownOpen) return;
    const timeout = setTimeout(() => {
      LocationService.countries(countrySearch)
        .then((d) => setCountryResults(Array.isArray(d?.data) ? d.data : []))
        .catch(() => { setCountryResults([]); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [countrySearch, countryDropdownOpen, open]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: null }));
    setServerError(null);
  }, []);

  const handleRegionChange = useCallback((e) => {
    const regionUuid = e.target.value;
    setForm((p) => ({ ...p, region_uuid: regionUuid, district_uuid: '', ward_uuid: '' }));
    setDistricts([]);
    setWards([]);
    if (!regionUuid) return;
    setDistrictsLoading(true);
    LocationService.districts(regionUuid)
      .then((d) => setDistricts(d?.data || []))
      .catch(() => { })
      .finally(() => setDistrictsLoading(false));
  }, []);

  const handleDistrictChange = useCallback((e) => {
    const districtUuid = e.target.value;
    setForm((p) => ({ ...p, district_uuid: districtUuid, ward_uuid: '' }));
    setWards([]);
    if (!districtUuid) return;
    setWardsLoading(true);
    LocationService.wards(districtUuid)
      .then((d) => setWards(d?.data || []))
      .catch(() => { })
      .finally(() => setWardsLoading(false));
  }, []);

  const selectCountry = useCallback((country) => {
    if (!country) {
      setForm((p) => ({ ...p, country_uuid: '', region_uuid: '', district_uuid: '', ward_uuid: '' }));
      setSelectedCountry(null);
      setCountrySearch('');
      setRegions([]);
      setDistricts([]);
      setWards([]);
      return;
    }
    setForm((p) => ({ ...p, country_uuid: country.uuid, region_uuid: '', district_uuid: '', ward_uuid: '' }));
    setSelectedCountry(country);
    setCountrySearch(country.name);
    setCountryDropdownOpen(false);
    setRegions([]);
    setDistricts([]);
    setWards([]);
    setErrors((prev) => ({ ...prev, country_uuid: null, region_uuid: null, district_uuid: null, ward_uuid: null }));
    setRegionsLoading(true);
    LocationService.regions(country.uuid)
      .then((d) => setRegions(d?.data || []))
      .catch(() => { })
      .finally(() => setRegionsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: ['Property name is required'] });
      return;
    }
    if (countrySearch.trim() && selectedCountry?.name !== countrySearch.trim()) {
      setErrors({ country_uuid: ['Please select a country from the dropdown list'] });
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const payload = {
        name: form.name.trim(),
        type_uuid: form.type_uuid || null,
        status: 'active',
        country_uuid: form.country_uuid || null,
        region_uuid: form.region_uuid || null,
        district_uuid: form.district_uuid || null,
        ward_uuid: form.ward_uuid || null,
        address_line: form.address_line || null,
      };
      console.log('[WelcomeModal] submit payload:', payload);
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

  /* Close country dropdown on outside click */
  useEffect(() => {
    function onDocClick(e) {
      if (countrySearchRef.current && !countrySearchRef.current.contains(e.target)) {
        setCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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
              Please fill in the details of your property to proceed 
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

              <Field label="Country" required error={errors?.country_uuid?.[0]}>
                <div className="relative" ref={countrySearchRef}>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => { setCountrySearch(e.target.value); setCountryDropdownOpen(true); }}
                    onFocus={() => setCountryDropdownOpen(true)}
                    autoComplete="off"
                  />
                  {countryDropdownOpen && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto mt-1 text-sm">
                      {countryResults.length === 0 ? (
                        <li className="px-3 py-2 text-gray-400">No results</li>
                      ) : (
                        countryResults.map((c) => (
                          <li
                            key={c.uuid}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectCountry(c)}
                          >
                            {c.name}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </Field>

              <Field label="Region" error={errors?.region_uuid?.[0]}>
                <select name="region_uuid" className="input" value={form.region_uuid}
                  onChange={handleRegionChange} disabled={!form.country_uuid || regionsLoading}>
                  <option value="">{!form.country_uuid ? 'Select country first' : regionsLoading ? 'Loading...' : 'Select region (optional)'}</option>
                  {regions.map((r) => <option key={r.uuid} value={r.uuid}>{capitalize(r.name)}</option>)}
                </select>
              </Field>

              <Field label="District" error={errors?.district_uuid?.[0]} hint="">
                <select name="district_uuid" className="input" value={form.district_uuid}
                  onChange={handleDistrictChange} disabled={!form.region_uuid || districtsLoading}>
                  <option value="">{!form.region_uuid ? 'Select region first' : districtsLoading ? 'Loading...' : 'Select district (optional)'}</option>
                  {districts.map((d) => <option key={d.uuid} value={d.uuid}>{capitalize(d.name)}</option>)}
                </select>
              </Field>

              <Field label="Ward" error={errors?.ward_uuid?.[0]} hint="">
                <select name="ward_uuid" className="input" value={form.ward_uuid}
                  onChange={handleChange} disabled={!form.district_uuid || wardsLoading}>
                  <option value="">{!form.district_uuid ? 'Select district first' : wardsLoading ? 'Loading...' : 'Select ward (optional)'}</option>
                  {wards.map((w) => <option key={w.uuid} value={w.uuid}>{capitalize(w.name)}</option>)}
                </select>
              </Field>

              <Field label="Address / Location" error={errors?.address_line?.[0]} hint="">
                <input name="address_line" type="text" className="input"
                  placeholder="e.g. 123 Main Street"
                  value={form.address_line} onChange={handleChange} />
              </Field>
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
