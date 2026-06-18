'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { SERVICE_REGISTRY } from '@/modules/services/serviceRegistry';

/* Demo assigned properties for limited users */
const DEMO_ASSIGNED_PROPERTIES = [
  {
    uuid: 'prop-001',
    name: 'Sunset Apartments',
    location: 'Dar es Salaam, Tanzania',
    units: 8,
    occupied: 6,
    contracts: 3,
    floors: 2,
    image: 'bg-gradient-to-br from-orange-100 to-amber-50',
  },
  {
    uuid: 'prop-002',
    name: 'Greenview Estate',
    location: 'Arusha, Tanzania',
    units: 4,
    occupied: 3,
    contracts: 1,
    floors: 1,
    image: 'bg-gradient-to-br from-green-100 to-emerald-50',
  },
];

const DEMO_ASSIGNED_LODGES = [
  {
    uuid: 'lodge-001',
    name: 'Serena Lodge',
    location: 'Arusha, Tanzania',
    rooms: 24,
    bookings: 8,
    occupancy: 75,
    status: 'active',
    image: 'bg-gradient-to-br from-violet-100 to-purple-50',
  },
];

function StatPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 bg-white rounded-md border border-gray-100">
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function PropertyCard({ property }) {
  const router = useRouter();
  const occupancyRate = Math.round((property.occupied / property.units) * 100);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-24 ${property.image} flex items-center justify-center`}>
        <svg className="w-10 h-10 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{property.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{property.location}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Occupancy</span>
              <span className="font-medium text-gray-900">{occupancyRate}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${occupancyRate}%`, backgroundColor: '#2563eb' }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{property.units} units</span>
          <span>{property.contracts} contracts</span>
          <span>{property.floors} floors</span>
        </div>
        <button
          onClick={() => router.push(`/properties/${property.uuid}`)}
          className="w-full mt-3 py-2 text-xs font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
        >
          Manage Property
        </button>
      </div>
    </div>
  );
}

function LodgeCard({ lodge }) {
  const router = useRouter();
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-24 ${lodge.image} flex items-center justify-center`}>
        <svg className="w-10 h-10 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{lodge.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{lodge.location}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Occupancy</span>
              <span className="font-medium text-gray-900">{lodge.occupancy}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${lodge.occupancy}%`, backgroundColor: '#7c3aed' }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>{lodge.rooms} rooms</span>
          <span>{lodge.bookings} bookings</span>
          <span className="capitalize">{lodge.status}</span>
        </div>
        <button
          onClick={() => router.push(`/lodges`)}
          className="w-full mt-3 py-2 text-xs font-medium text-violet-600 bg-violet-50 rounded-md hover:bg-violet-100 transition-colors"
        >
          Manage Lodge
        </button>
      </div>
    </div>
  );
}

export default function MyWorkspace() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const scope = useAuthStore((s) => s.scope);
  const assignments = useAuthStore((s) => s.assignments);
  const services = useAuthStore((s) => s.services);

  /* Determine which service the user is scoped to */
  const scopedServices = useMemo(() => {
    if (scope !== 'limited') return services || [];
    /* If limited and has service-level assignments, filter */
    const serviceIds = Object.keys(assignments || {});
    if (serviceIds.length > 0) {
      return (services || []).filter((s) => serviceIds.includes(s.id));
    }
    return services || [];
  }, [scope, assignments, services]);

  /* Lookup assigned resources per service */
  const assignedProperties = assignments?.properties?.length > 0
    ? DEMO_ASSIGNED_PROPERTIES.filter((p) => assignments.properties.includes(p.uuid))
    : DEMO_ASSIGNED_PROPERTIES;

  const assignedLodges = assignments?.lodge?.length > 0
    ? DEMO_ASSIGNED_LODGES.filter((l) => assignments.lodge.includes(l.uuid))
    : DEMO_ASSIGNED_LODGES;

  const hasProperties = scopedServices.some((s) => s.id === 'properties');
  const hasLodge = scopedServices.some((s) => s.id === 'lodge');

  /* Summary stats */
  const totalProperties = hasProperties ? assignedProperties.length : 0;
  const totalUnits = hasProperties ? assignedProperties.reduce((s, p) => s + p.units, 0) : 0;
  const totalLodges = hasLodge ? assignedLodges.length : 0;
  const totalRooms = hasLodge ? assignedLodges.reduce((s, l) => s + l.rooms, 0) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'there'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          You have limited access. Here are your assigned properties and services.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-3">
        {hasProperties && (
          <>
            <StatPill label="My Properties" value={totalProperties} color="#2563eb" />
            <StatPill label="My Units" value={totalUnits} color="#2563eb" />
          </>
        )}
        {hasLodge && (
          <>
            <StatPill label="My Lodges" value={totalLodges} color="#7c3aed" />
            <StatPill label="My Rooms" value={totalRooms} color="#7c3aed" />
          </>
        )}
      </div>

      {/* My Properties Section */}
      {hasProperties && assignedProperties.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">My Properties</h2>
            <button
              onClick={() => router.push('/properties')}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View All →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedProperties.map((property) => (
              <PropertyCard key={property.uuid} property={property} />
            ))}
          </div>
        </div>
      )}

      {/* My Lodges Section */}
      {hasLodge && assignedLodges.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">My Lodges</h2>
            <button
              onClick={() => router.push('/lodges')}
              className="text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              View All →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedLodges.map((lodge) => (
              <LodgeCard key={lodge.uuid} lodge={lodge} />
            ))}
          </div>
        </div>
      )}

      {/* No assignments warning */}
      {(!hasProperties || assignedProperties.length === 0) && (!hasLodge || assignedLodges.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="w-10 h-10 text-yellow-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-sm font-semibold text-yellow-800">No resources assigned</h3>
          <p className="text-xs text-yellow-600 mt-1">Contact your administrator to be assigned to properties or lodges.</p>
        </div>
      )}
    </div>
  );
}
