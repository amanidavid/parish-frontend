'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiFetch from '@/lib/apiFetch';
import LocationService from '@/services/LocationService';
import { COUNTRY_CODES } from '@/constants/countryCodes';

const TANZANIA_ISO2 = 'TZ';

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

  const initialCountryIso2 = (initial.location?.country?.code || initial.country_iso2 || TANZANIA_ISO2).toUpperCase();
  const initRegionRef = useRef(initial.location?.region?.uuid || '');

  const [form, setForm] = useState({
    name: initial.name || '',
    type_uuid: initial.type?.uuid || '',
    address_line: initial.address_line || '',
    region_uuid: initRegionRef.current,
    district_uuid: initial.location?.district?.uuid || '',
  });

  const [countryIso2, setCountryIso2] = useState(initialCountryIso2);
  const isTanzania = countryIso2 === TANZANIA_ISO2;

  const [fieldErrors, setFieldErrors] = useState({});
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/v1/app/property-types?per_page=100')
      .then((d) => setPropertyTypes(d?.data || []))
      .catch(() => { })
      .finally(() => setTypesLoading(false));
  }, []);

  useEffect(() => {
    if (!isTanzania) return;
    setRegionsLoading(true);
    LocationService.regions()
      .then((d) => setRegions(d?.data || []))
      .catch(() => { })
      .finally(() => setRegionsLoading(false));
  }, [isTanzania]);

  useEffect(() => {
    const regionUuid = initRegionRef.current;
    if (!regionUuid) return;

    setDistrictsLoading(true);
    LocationService.districts(regionUuid)
      .then((d) => setDistricts(d?.data || []))
      .catch(() => { })
      .finally(() => setDistrictsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
  }, []);

  const handleRegionChange = useCallback((e) => {
    const regionUuid = e.target.value;
    setForm((prev) => ({ ...prev, region_uuid: regionUuid, district_uuid: '' }));
    setDistricts([]);
    setFieldErrors((prev) => ({ ...prev, region_uuid: null, district_uuid: null }));
    if (!regionUuid) return;
    setDistrictsLoading(true);
    LocationService.districts(regionUuid)
      .then((d) => setDistricts(d?.data || []))
      .catch(() => { })
      .finally(() => setDistrictsLoading(false));
  }, []);

  const handleCountryChange = useCallback((e) => {
    const iso2 = e.target.value;
    setCountryIso2(iso2);
    setForm((prev) => ({ ...prev, region_uuid: '', district_uuid: '', address_line: '' }));
    setDistricts([]);
    setFieldErrors({});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = {
      name: form.name,
      type_uuid: form.type_uuid || null,
      status: 'active',
      ...(isTanzania
        ? { district_uuid: form.district_uuid || null }
        : { address_line: form.address_line || null }
      ),
    };
    const result = await onSubmit(payload);
    if (result?.errors) setFieldErrors(result.errors);
  };

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
          <Field label="Country" required error={fieldErrors?.country?.[0]} hint="Location fields adjust based on country">
            <select className="input" value={countryIso2} onChange={handleCountryChange}>
              {COUNTRY_CODES.map((c) => (
                <option key={c.iso2} value={c.iso2}>{c.flag} {c.name}</option>
              ))}
            </select>
          </Field>

          {isTanzania ? (
            <>
              <Field label="Region" error={fieldErrors?.region_uuid?.[0]}>
                <select
                  name="region_uuid"
                  className="input"
                  value={form.region_uuid}
                  onChange={handleRegionChange}
                  disabled={regionsLoading}
                >
                  <option value="">{regionsLoading ? 'Loading...' : 'Select region (optional)'}</option>
                  {regions.map((r) => (
                    <option key={r.uuid} value={r.uuid}>{r.name}</option>
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
                  onChange={handleChange}
                  disabled={!form.region_uuid || districtsLoading}
                >
                  <option value="">
                    {!form.region_uuid ? 'Select region first' : districtsLoading ? 'Loading...' : 'Select district (optional)'}
                  </option>
                  {districts.map((d) => (
                    <option key={d.uuid} value={d.uuid}>{d.name}</option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
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
          )}
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
