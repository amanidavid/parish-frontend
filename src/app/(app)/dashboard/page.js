'use client';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import ReportService from '@/services/ReportService';
import WelcomeModal from '@/components/dashboard/WelcomeModal';

/* ─── Tiny sparkline SVG ─── */
const Sparkline = memo(function Sparkline({ values = [], color = '#2563eb', filled = false }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 80, h = 32, pad = 2;
  const pts = values.map((v, i) => [
    pad + (i / (values.length - 1)) * (w - pad * 2),
    pad + (1 - v / max) * (h - pad * 2),
  ]);
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      {filled && <path d={area} fill={color} fillOpacity="0.12" />}
      <path d={d} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

/* ─── Summary stat card ─── */
const StatCard = memo(function StatCard({ label, value, sub, color, bg, icon, sparkData, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        {sparkData && <Sparkline values={sparkData} color={color} filled />}
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-16 bg-gray-100 rounded" />
          <div className="h-3.5 w-24 bg-gray-100 rounded" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      )}
    </div>
  );
});

/* ─── Occupancy ring ─── */
const OccupancyRing = memo(function OccupancyRing({ rate = 0, size = 88 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * (rate / 100);
  const color = rate >= 80 ? '#059669' : rate >= 60 ? '#d97706' : '#dc2626';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827">
        {rate}%
      </text>
    </svg>
  );
});

/* ─── Mini bar for unit breakdown ─── */
const UnitBar = memo(function UnitBar({ occupied, vacant, maintenance, total }) {
  const occ = total ? Math.round((occupied / total) * 100) : 0;
  const vac = total ? Math.round((vacant / total) * 100) : 0;
  const maint = total ? Math.round((maintenance / total) * 100) : 0;
  return (
    <div className="flex rounded-full overflow-hidden h-1.5 w-full bg-gray-100">
      <div style={{ width: `${occ}%`, background: '#059669' }} />
      <div style={{ width: `${maint}%`, background: '#d97706' }} />
      <div style={{ width: `${vac}%`, background: '#e5e7eb' }} />
    </div>
  );
});

/* ─── Status badge ─── */
const Badge = memo(function Badge({ rate }) {
  const color = rate >= 80 ? 'bg-emerald-50 text-emerald-700' : rate >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{rate}%</span>;
});

/* ─── SVG arc helper (avoids full-circle degeneracy) ─── */
function arcPath(cx, cy, r, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep >= 2 * Math.PI - 0.001) {
    /* Full circle — arc command can't draw 360°, return null to use <circle> instead */
    return null;
  }
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = sweep > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/* ─── Contract status donut chart ─── */
const ContractPieChart = memo(function ContractPieChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-28 h-28 rounded-full bg-gray-100 animate-pulse" />
        <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const items = [
    { label: 'Active', value: data.active || 0, color: '#059669' },
    { label: 'Expired', value: data.expired || 0, color: '#dc2626' },
    { label: 'Draft', value: data.draft || 0, color: '#d97706' },
    { label: 'Terminated', value: data.terminated || 0, color: '#6b7280' },
    { label: 'Renewed', value: data.renewed || 0, color: '#2563eb' },
  ].filter((i) => i.value > 0);

  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No contract data available</p>;
  }

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 24) / 2;
  const innerR = r * 0.58;
  const strokeW = r - innerR;

  let angle = -Math.PI / 2;
  const segments = items.map((item) => {
    const frac = item.value / total;
    const endAngle = angle + frac * 2 * Math.PI;
    const path = arcPath(cx, cy, r, angle, endAngle);
    angle = endAngle;
    return { ...item, path, isFull: !path };
  });

  return (
    <div className="flex flex-col items-center h-full justify-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => (
          s.isFull ? (
            /* Full circle — use ring stroke */
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={(r + innerR) / 2}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeW}
            />
          ) : (
            <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
          )
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#6b7280">
          Contracts
        </text>
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <span className="text-gray-400 font-medium">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
});

/* ─── Skeleton rows ─── */
function SkeletonRows({ count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-3.5 bg-gray-100 rounded" style={{ width: j === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  ));
}

/* ─── Page ─── */
export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setNewUser = useAuthStore((s) => s.setNewUser);

  const [summary, setSummary] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    ReportService.dashboardOverview({ signal: controller.signal })
      .then((d) => {
        if (controller.signal.aborted) return;
        if (d?.success) {
          setSummary(d.data.summary);
          setProperties(d.data.property_breakdown?.data || []);
        } else {
          setError(d?.message || 'Failed to load dashboard');
        }
      })
      .catch(() => { if (!controller.signal.aborted) setError('Network error'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const handlePropertyCreated = useCallback((property) => {
    setNewUser(false);
    router.push(`/properties/${property.uuid}`);
  }, [setNewUser, router]);

  const handleSkip = useCallback(() => setNewUser(false), [setNewUser]);

  /* Aggregate contract statuses across all properties */
  const contractStats = useMemo(
    () =>
      properties.reduce(
        (acc, p) => {
          const c = p.contracts || {};
          acc.active += c.active || 0;
          acc.expired += c.expired || 0;
          acc.draft += c.draft || 0;
          acc.terminated += c.terminated || 0;
          acc.renewed += c.renewed || 0;
          return acc;
        },
        { active: 0, expired: 0, draft: 0, terminated: 0, renewed: 0 }
      ),
    [properties]
  );

  /* Compute global occupancy rate */
  const globalOcc = useMemo(
    () => (summary && summary.total_units > 0 ? Math.round((summary.occupied_units / summary.total_units) * 100) : 0),
    [summary]
  );

  /* Fake sparkline data derived from property list for visual richness */
  const spark = useMemo(
    () => ({
      properties: [6, 7, 8, 8, 10, 11, 12],
      units: [200, 210, 220, 230, 240, 245, summary?.total_units || 248],
      customers: [150, 155, 160, 168, 175, 180, summary?.total_customers || 186],
      contracts: [120, 130, 140, 150, 160, 168, summary?.total_contracts || 173],
    }),
    [summary]
  );

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    []
  );

  return (
    <div className="space-y-6">
      <WelcomeModal open={isNewUser} userName={user?.name} onCreated={handlePropertyCreated} onSkip={handleSkip} />

      {/* ── Welcome banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5 text-white flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)' }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white opacity-5" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white opacity-5" />
        <div className="relative">
          <p className="text-xs font-medium text-indigo-200 uppercase tracking-widest">{today}</p>
          <h1 className="text-xl font-bold mt-0.5">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
          </h1>
          <p className="text-sm text-indigo-200 mt-1">Here's your workspace overview</p>
        </div>
        <Link
          href="/properties/create"
          className="relative hidden sm:inline-flex items-center gap-2 bg-white text-indigo-700 rounded-xl px-4 py-2 text-sm font-semibold shadow hover:shadow-md transition shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Properties" value={loading ? '—' : summary?.total_properties ?? '—'}
          sub={loading ? '' : `${summary?.total_units ?? 0} total units`}
          color="#2563eb" bg="#eff6ff" loading={loading} sparkData={spark.properties}
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
        <StatCard
          label="Occupied Units" value={loading ? '—' : summary?.occupied_units ?? '—'}
          sub={loading ? '' : `${summary?.vacant_units ?? 0} vacant`}
          color="#059669" bg="#ecfdf5" loading={loading} sparkData={spark.units}
          icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
        <StatCard
          label="Customers" value={loading ? '—' : summary?.total_customers ?? '—'}
          sub="Active tenants"
          color="#7c3aed" bg="#f5f3ff" loading={loading} sparkData={spark.customers}
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <StatCard
          label="Active Contracts" value={loading ? '—' : summary?.total_contracts ?? '—'}
          sub={loading ? '' : `${summary?.total_staff ?? 0} staff members`}
          color="#d97706" bg="#fffbeb" loading={loading} sparkData={spark.contracts}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </div>

      {/* ── Occupancy overview + quick links ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Occupancy overview card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Overall Occupancy</p>
            {!loading && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${globalOcc >= 80 ? 'bg-emerald-50 text-emerald-700' : globalOcc >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                {globalOcc}%
              </span>
            )}
          </div>

          {/* Ring + mini stats */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse shrink-0" />
            ) : (
              <OccupancyRing rate={globalOcc} size={88} />
            )}

            {/* Mini breakdown */}
            {!loading && summary && (
              <div className="flex-1 space-y-2.5">
                {/* Occupied */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Occupied
                    </span>
                    <span className="font-bold text-gray-900">{summary.occupied_units}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${summary.total_units ? Math.round((summary.occupied_units / summary.total_units) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                {/* Vacant */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                      Vacant
                    </span>
                    <span className="font-bold text-gray-900">{summary.vacant_units}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-300"
                      style={{ width: `${summary.total_units ? Math.round((summary.vacant_units / summary.total_units) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Total units footer */}
          {!loading && summary && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <span className="text-xs text-gray-500">Total units</span>
              <span className="text-sm font-bold text-gray-900">{summary.total_units}</span>
            </div>
          )}
        </div>

        {/* Contract status donut chart */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Contract Status</p>
          <ContractPieChart data={contractStats} loading={loading} />
        </div>
      </div>

      {/* ── Property breakdown table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Property Breakdown</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sorted by vacant units — active properties only</p>
          </div>
          <Link href="/properties" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Property</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Units</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Occupied</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Vacant</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribution</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Occupancy</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Contracts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRows count={5} />
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium text-sm">No properties yet</p>
                        <p className="text-gray-400 text-xs mt-0.5">Add your first property to see data here</p>
                      </div>
                      <Link href="/properties/create" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Property
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.property_uuid} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <Link href={`/properties/${p.property_uuid}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {p.property_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-medium text-gray-700">{p.total_units}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-emerald-700 font-medium">{p.occupied_units}</td>
                    <td className="px-4 py-3.5 text-right text-sm text-rose-600 font-medium">{p.vacant_units}</td>
                    <td className="px-4 py-3.5 w-32">
                      <UnitBar
                        occupied={p.occupied_units}
                        vacant={p.vacant_units}
                        maintenance={p.maintenance_units}
                        total={p.total_units}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Badge rate={p.occupancy_rate} />
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm text-gray-600">{p.contracts?.active ?? p.contracts?.total ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
