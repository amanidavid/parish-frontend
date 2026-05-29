/**
 * LocationService - cascading location API (country -> region -> district).
 * Each method accepts a parent UUID to filter its children.
 */
import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/locations';

const LocationService = {
  async countries(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}&per_page=20` : '?per_page=300';
    return apiFetch(`${BASE}/countries${qs}`);
  },

  async regions(countryUuid) {
    const qs = countryUuid ? `?country_uuid=${countryUuid}&per_page=100&status=active` : '?per_page=100&status=active';
    return apiFetch(`${BASE}/regions${qs}`);
  },

  async districts(regionUuid) {
    const qs = regionUuid ? `?region_uuid=${regionUuid}&per_page=100&status=active` : '?per_page=100&status=active';
    return apiFetch(`${BASE}/districts${qs}`);
  },

  async wards(districtUuid) {
    const qs = districtUuid ? `?district_uuid=${districtUuid}&per_page=100&status=active` : '?per_page=100&status=active';
    return apiFetch(`${BASE}/wards${qs}`);
  },
};

export default LocationService;
