/**
 * LocationService - cascading location API (country -> region -> district).
 * Each method accepts a parent UUID to filter its children.
 */
import apiFetch from '@/lib/apiFetch';

const BASE = '/api/v1/app/locations';

const LocationService = {
  async countries() {
    return apiFetch(`${BASE}/countries?per_page=100&status=active`);
  },

  async regions(countryUuid) {
    const qs = countryUuid ? `?country_uuid=${countryUuid}&per_page=100&status=active` : '?per_page=100&status=active';
    return apiFetch(`${BASE}/regions${qs}`);
  },

  async districts(regionUuid) {
    const qs = regionUuid ? `?region_uuid=${regionUuid}&per_page=100&status=active` : '?per_page=100&status=active';
    return apiFetch(`${BASE}/districts${qs}`);
  },
};

export default LocationService;
