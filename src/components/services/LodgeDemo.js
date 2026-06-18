'use client';
import { useMemo } from 'react';
import { SERVICE_REGISTRY } from '@/modules/services/serviceRegistry';

const DEMO_LODGES = [
  { id: 1, name: 'Serena Lodge', location: 'Arusha, Tanzania', rooms: 24, bookings: 8, occupancy: 75, status: 'active' },
  { id: 2, name: 'Ngorongoro Crater Lodge', location: 'Ngorongoro, Tanzania', rooms: 32, bookings: 12, occupancy: 82, status: 'active' },
  { id: 3, name: 'Kilimanjaro View Camp', location: 'Moshi, Tanzania', rooms: 15, bookings: 3, occupancy: 45, status: 'maintenance' },
];

const DEMO_BOOKINGS = [
  { id: 'BKG-001', guest: 'John Smith', lodge: 'Serena Lodge', checkIn: '2025-06-20', checkOut: '2025-06-25', status: 'confirmed' },
  { id: 'BKG-002', guest: 'Maria Garcia', lodge: 'Serena Lodge', checkIn: '2025-06-21', checkOut: '2025-06-23', status: 'checked-in' },
  { id: 'BKG-003', guest: 'David Chen', lodge: 'Ngorongoro Crater Lodge', checkIn: '2025-06-22', checkOut: '2025-06-28', status: 'confirmed' },
  { id: 'BKG-004', guest: 'Sarah Johnson', lodge: 'Ngorongoro Crater Lodge', checkIn: '2025-06-19', checkOut: '2025-06-24', status: 'checked-out' },
  { id: 'BKG-005', guest: 'Michael Brown', lodge: 'Serena Lodge', checkIn: '2025-06-23', checkOut: '2025-06-26', status: 'pending' },
];

function StatCard({ label, value, sub, color, bg }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    'checked-in': 'bg-blue-50 text-blue-700 border-blue-200',
    'checked-out': 'bg-gray-50 text-gray-600 border-gray-200',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${styles[status] || styles.pending}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

export default function LodgeDemo() {
  const config = SERVICE_REGISTRY.lodge;

  const stats = useMemo(() => ({
    lodges: DEMO_LODGES.filter((l) => l.status === 'active').length,
    rooms: DEMO_LODGES.reduce((sum, l) => sum + l.rooms, 0),
    bookings: DEMO_BOOKINGS.filter((b) => b.status !== 'checked-out').length,
    occupancy: Math.round(DEMO_LODGES.reduce((sum, l) => sum + l.occupancy, 0) / DEMO_LODGES.length),
  }), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lodge Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage lodges, rooms, bookings and housekeeping</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)` }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Lodges" value={stats.lodges} color={config.color} bg={config.bg} />
        <StatCard label="Total Rooms" value={stats.rooms} color={config.color} bg={config.bg} />
        <StatCard label="Active Bookings" value={stats.bookings} color={config.color} bg={config.bg} sub="This week" />
        <StatCard label="Occupancy Rate" value={`${stats.occupancy}%`} color={config.color} bg={config.bg} sub="Average" />
      </div>

      {/* Lodges Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Lodges</h2>
          <span className="text-xs text-gray-400">{DEMO_LODGES.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Lodge</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Rooms</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bookings</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_LODGES.map((lodge) => (
                <tr key={lodge.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{lodge.name}</td>
                  <td className="px-4 py-3 text-gray-500">{lodge.location}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{lodge.rooms}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{lodge.bookings}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium" style={{ color: config.color }}>{lodge.occupancy}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lodge.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Bookings</h2>
          <span className="text-xs text-gray-400">{DEMO_BOOKINGS.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Guest</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Lodge</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Check-in</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Check-out</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_BOOKINGS.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{booking.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{booking.guest}</td>
                  <td className="px-4 py-3 text-gray-500">{booking.lodge}</td>
                  <td className="px-4 py-3 text-gray-500">{booking.checkIn}</td>
                  <td className="px-4 py-3 text-gray-500">{booking.checkOut}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
