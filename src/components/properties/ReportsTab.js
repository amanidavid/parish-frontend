'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import ReportService from '@/services/ReportService';
import useUiStore from '@/store/uiStore';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function fmtCurrency(n) {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString();
}

/* ─── Summary Card ──────────────────────────────────────────────────────── */
function SummaryCard({ label, value, color = 'text-gray-900', bg = 'bg-gray-50', iconPath, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg}`}>
          <svg className={`w-5 h-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath} />
          </svg>
        </div>
      </div>
      {loading ? (
        <div className="h-7 bg-gray-100 rounded animate-pulse w-24 mb-1" />
      ) : (
        <p className={`text-xl sm:text-2xl font-bold tracking-tight ${color}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      )}
      <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
    </div>
  );
}

/* ─── Chart ───────────────────────────────────────────────────────────── */
function RevenueChart({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-80 flex items-center justify-center">
        <div className="animate-pulse flex gap-3 items-end h-52 w-full px-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${15 + Math.random() * 55}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d.bucket_label || d.month?.toString() || '',
    value: Number(d.revenue_collected ?? d.amount) || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-xl">
          <p className="text-gray-300 mb-0.5">{label}</p>
          <p className="text-sm font-semibold">{fmtCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
      <div className="min-w-[640px]">
        <ResponsiveContainer width="100%" height={280}>
          <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={55}
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={28} fill="#0d9488" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const ICONS = {
  contracts: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  revenue: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  expenses: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  remaining: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  debts: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
};

const RANGE_OPTIONS = [
  { value: '3_months', label: '3 Months' },
  { value: '6_months', label: '6 Months' },
  { value: '12_months', label: '12 Months' },
  { value: 'custom', label: 'Custom' },
];

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function ReportsTab({ propertyUuid, visible }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [range, setRange] = useState('12_months');
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(null);

  /* Load summary cards */
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const payload = { propertyUuid, range };
      if (range === 'custom') {
        payload.startDate = customStart;
        payload.endDate = customEnd;
      }
      const res = await ReportService.contractSummaryCards(payload);
      if (res?.success) {
        setSummary(res.data?.summary_cards ?? null);
      } else {
        setSummary(null);
        useUiStore.getState().showModal({ type: 'error', message: res?.message || 'Failed to load summary' });
      }
    } catch {
      setSummary(null);
      useUiStore.getState().showModal({ type: 'error', message: 'Network error loading summary' });
    } finally {
      setSummaryLoading(false);
    }
  }, [propertyUuid, range, customStart, customEnd]);

  /* Load monthly chart */
  const loadChart = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);
    try {
      const res = await ReportService.contractMonthlyActiveAmountChart({
        propertyUuid,
        window: 'last_12_months',
      });
      if (res?.success) {
        setChartData(res.data ?? null);
      } else {
        setChartData(null);
        setChartError(res?.message || 'Failed to load chart');
      }
    } catch {
      setChartData(null);
      setChartError('Network error loading chart');
    } finally {
      setChartLoading(false);
    }
  }, [propertyUuid]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadChart(); }, [loadChart]);

  /* Silent refresh (background refetch without loading spinners) */
  const refreshSummary = useCallback(async () => {
    try {
      const payload = { propertyUuid, range };
      if (range === 'custom') {
        payload.startDate = customStart;
        payload.endDate = customEnd;
      }
      const res = await ReportService.contractSummaryCards(payload);
      if (res?.success) setSummary(res.data?.summary_cards ?? null);
    } catch { /* silently fail */ }
  }, [propertyUuid, range, customStart, customEnd]);

  const refreshChart = useCallback(async () => {
    try {
      const res = await ReportService.contractMonthlyActiveAmountChart({
        propertyUuid,
        window: 'last_12_months',
      });
      if (res?.success) setChartData(res.data ?? null);
    } catch { /* silently fail */ }
  }, [propertyUuid]);

  /* Refetch when tab becomes visible again after being hidden */
  const hasBeenVisible = useRef(false);
  useEffect(() => {
    if (visible) {
      if (hasBeenVisible.current) {
        refreshSummary();
        refreshChart();
      }
      hasBeenVisible.current = true;
    }
  }, [visible, refreshSummary, refreshChart]);

  const cards = summary ? [
    {
      label: 'Total Contracts',
      value: summary.total_contracts ?? 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: ICONS.contracts,
    },
    {
      label: 'Revenue Collected',
      value: fmtCurrency(summary.revenue_collected),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: ICONS.revenue,
    },
    {
      label: 'Total Expenses',
      value: fmtCurrency(summary.total_expenses),
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      icon: ICONS.expenses,
    },
    {
      label: 'Remaining',
      value: fmtCurrency(summary.remaining),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      icon: ICONS.remaining,
    },
    {
      label: 'Remaining Debts',
      value: fmtCurrency(summary.remaining_debts),
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: ICONS.debts,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-gray-800">Revenue Report</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {range === 'custom' && (
            <>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            </>
          )}
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(summaryLoading ? Array.from({ length: 5 }) : cards).map((card, i) => (
          <SummaryCard
            key={i}
            label={summaryLoading ? '' : card.label}
            value={summaryLoading ? '' : card.value}
            color={summaryLoading ? '' : card.color}
            bg={summaryLoading ? '' : card.bg}
            iconPath={summaryLoading ? ICONS.contracts : card.icon}
            loading={summaryLoading}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Revenue Past 12 Months</h3>
        </div>
        {chartError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{chartError}</p>
          </div>
        )}
        <RevenueChart data={Array.isArray(chartData) ? chartData : (chartData?.series ?? [])} loading={chartLoading} />
      </div>
    </div>
  );
}
