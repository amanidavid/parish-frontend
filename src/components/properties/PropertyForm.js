'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiFetch from '@/lib/apiFetch';
import LocationService from '@/services/LocationService';

function capitalize(str) {
  if (!str || typeof str !== 'string') return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function SectionHeader({ title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">{title}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
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

  const initCountryUuid = initial.location?.country?.uuid || '';
  const initRegionRef = useRef(initial.location?.region?.uuid || '');
  const initDistrictRef = useRef(initial.location?.district?.uuid || '');

  const [form, setForm] = useState({
    name: initial.name || '',
    type_uuid: initial.type?.uuid || '',
    address_line: initial.address_line || '',
    country_uuid: initCountryUuid,
    region_uuid: initRegionRef.current,
    district_uuid: initDistrictRef.current,
    ward_uuid: initial.location?.ward?.uuid || '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [countrySearch, setCountrySearch] = useState(initial.location?.country?.name || '');
  const [selectedCountry, setSelectedCountry] = useState(initial.location?.country || null);
  const [countryResults, setCountryResults] = useState([]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countrySearchRef = useRef(null);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);

  /* Load property types */
  useEffect(() => {
    apiFetch('/api/v1/app/property-types?per_page=100')
      .then((d) => setPropertyTypes(d?.data || []))
      .catch(() => { })
      .finally(() => setTypesLoading(false));
  }, []);

  /* Debounced country search */
  useEffect(() => {
    if (!countryDropdownOpen) return;
    const timeout = setTimeout(() => {
      LocationService.countries(countrySearch)
        .then((d) => setCountryResults(Array.isArray(d?.data) ? d.data : []))
        .catch(() => { setCountryResults([]); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [countrySearch, countryDropdownOpen]);

  /* Load regions on edit (when country is pre-selected) */
  useEffect(() => {
    const countryUuid = initCountryUuid;
    if (!countryUuid) return;

    setRegionsLoading(true);
    LocationService.regions(countryUuid)
      .then((d) => setRegions(d?.data || []))
      .catch(() => { })
      .finally(() => setRegionsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Load districts on edit (when region is pre-selected) */
  useEffect(() => {
    const regionUuid = initRegionRef.current;
    if (!regionUuid) return;

    setDistrictsLoading(true);
    LocationService.districts(regionUuid)
      .then((d) => setDistricts(d?.data || []))
      .catch(() => { })
      .finally(() => setDistrictsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Load wards on edit (when district is pre-selected) */
  useEffect(() => {
    const districtUuid = initDistrictRef.current;
    if (!districtUuid) return;

    setWardsLoading(true);
    LocationService.wards(districtUuid)
      .then((d) => setWards(d?.data || []))
      .catch(() => { })
      .finally(() => setWardsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleRegionChange = useCallback((e) => {
    const regionUuid = e.target.value;
    setForm((prev) => ({ ...prev, region_uuid: regionUuid, district_uuid: '', ward_uuid: '' }));
    setDistricts([]);
    setWards([]);
    setFieldErrors((prev) => ({ ...prev, region_uuid: null, district_uuid: null, ward_uuid: null }));
    if (!regionUuid) return;
    setDistrictsLoading(true);
    LocationService.districts(regionUuid)
      .then((d) => setDistricts(d?.data || []))
      .catch(() => { })
      .finally(() => setDistrictsLoading(false));
  }, []);

  const handleDistrictChange = useCallback((e) => {
    const districtUuid = e.target.value;
    setForm((prev) => ({ ...prev, district_uuid: districtUuid, ward_uuid: '' }));
    setWards([]);
    setFieldErrors((prev) => ({ ...prev, district_uuid: null, ward_uuid: null }));
    if (!districtUuid) return;
    setWardsLoading(true);
    LocationService.wards(districtUuid)
      .then((d) => setWards(d?.data || []))
      .catch(() => { })
      .finally(() => setWardsLoading(false));
  }, []);

  const selectCountry = useCallback((country) => {
    if (!country) {
      setForm((prev) => ({ ...prev, country_uuid: '', region_uuid: '', district_uuid: '', ward_uuid: '' }));
      setSelectedCountry(null);
      setCountrySearch('');
      setRegions([]);
      setDistricts([]);
      setWards([]);
      return;
    }
    setForm((prev) => ({ ...prev, country_uuid: country.uuid, region_uuid: '', district_uuid: '', ward_uuid: '' }));
    setSelectedCountry(country);
    setCountrySearch(country.name);
    setCountryDropdownOpen(false);
    setRegions([]);
    setDistricts([]);
    setWards([]);
    setFieldErrors((prev) => ({ ...prev, country_uuid: null, region_uuid: null, district_uuid: null, ward_uuid: null }));
    setRegionsLoading(true);
    LocationService.regions(country.uuid)
      .then((d) => setRegions(d?.data || []))
      .catch(() => { })
      .finally(() => setRegionsLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    /* Validate country was actually selected from dropdown, not just typed */
    if (countrySearch.trim() && selectedCountry?.name !== countrySearch.trim()) {
      setFieldErrors({ country_uuid: ['Please select a country from the dropdown list'] });
      return;
    }

    const payload = {
      name: form.name,
      type_uuid: form.type_uuid || null,
      status: 'active',
      country_uuid: form.country_uuid || null,
      region_uuid: form.region_uuid || null,
      district_uuid: form.district_uuid || null,
      ward_uuid: form.ward_uuid || null,
      address_line: form.address_line || null,
    };
    console.log('[PropertyForm] submit payload:', payload);
    const result = await onSubmit(payload);
    if (result?.errors) setFieldErrors(result.errors);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <SectionHeader title="Property Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
          </div>

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
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader title="Location" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country" required error={fieldErrors?.country_uuid?.[0]}>
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

          <Field label="Region" error={fieldErrors?.region_uuid?.[0]}>
            <select
              name="region_uuid"
              className="input"
              value={form.region_uuid}
              onChange={handleRegionChange}
              disabled={!form.country_uuid || regionsLoading}
            >
              <option value="">{!form.country_uuid ? 'Select country first' : regionsLoading ? 'Loading...' : 'Select region (optional)'}</option>
              {regions.map((r) => (
                <option key={r.uuid} value={r.uuid}>{capitalize(r.name)}</option>
              ))}
            </select>
          </Field>

          <Field
            label="District"
            error={fieldErrors?.district_uuid?.[0]}
            hint="Country and region are derived from the selected district when the property is saved."
          >
            <select
              name="district_uuid"
              className="input"
              value={form.district_uuid}
              onChange={handleDistrictChange}
              disabled={!form.region_uuid || districtsLoading}
            >
              <option value="">
                {!form.region_uuid ? 'Select region first' : districtsLoading ? 'Loading...' : 'Select district (optional)'}
              </option>
              {districts.map((d) => (
                <option key={d.uuid} value={d.uuid}>{capitalize(d.name)}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Ward"
            error={fieldErrors?.ward_uuid?.[0]}
            hint="Neighbourhood / sub-district area"
          >
            <select
              name="ward_uuid"
              className="input"
              value={form.ward_uuid}
              onChange={handleChange}
              disabled={!form.district_uuid || wardsLoading}
            >
              <option value="">
                {!form.district_uuid ? 'Select district first' : wardsLoading ? 'Loading...' : 'Select ward (optional)'}
              </option>
              {wards.map((w) => (
                <option key={w.uuid} value={w.uuid}>{capitalize(w.name)}</option>
              ))}
            </select>
          </Field>

          <Field label="Address / Location" error={fieldErrors?.address_line?.[0]} hint="Street address or area">
            <input
              name="address_line"
              type="text"
              className="input"
              placeholder="e.g. 123 Main Street, Nairobi"
              value={form.address_line}
              onChange={handleChange}
            />
          </Field>
        </div>
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
