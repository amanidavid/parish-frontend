'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import MaintenanceService from '@/services/MaintenanceService';
import ReportService from '@/services/ReportService';
import useUiStore from '@/store/uiStore';

function fmtCurrency(n) {
  if (n === null || n === undefined || n === '') return '—';
  return Number(n).toLocaleString();
}

function getRangeDates(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  let start = new Date(today);

  switch (range) {
    case 'today':
      start = new Date(today);
      break;
    case 'last_7_days':
      start.setDate(today.getDate() - 6);
      break;
    case 'last_30_days':
      start.setDate(today.getDate() - 29);
      break;
    case 'this_month':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'this_year':
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case 'last_12_months':
      start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  }

  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function SummaryCard({ label, value, color = 'text-gray-900', bg = 'bg-gray-50', iconPath, loading, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${bg}`}>
          <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
        {trend != null && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-6 bg-gray-100 rounded animate-pulse w-16 mb-1" />
      ) : (
        <p className={`text-lg sm:text-xl font-bold break-words ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      )}
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

function BarChart({ data, loading, valueKey = 'recognized_contract_amount', labelKey = 'bucket_label' }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-72 flex items-center justify-center">
        <div className="animate-pulse flex gap-3 items-end h-48 w-full px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-72 flex items-center justify-center">
        <p className="text-sm text-gray-400">No chart data available</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    label: d[labelKey],
    value: Number(d[valueKey]) || 0,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg">
          {fmtCurrency(payload[0].value)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <ResponsiveContainer width="100%" height={260}>
        <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill="#3b82f6" />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

const SUMMARY_ICONS = {
  jobs: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  expenses: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  amount: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  today: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  month: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  year: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  contracts: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  active: 'M5 13l4 4L19 7',
  revenue: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  recognized: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_12_months', label: 'Last 12 Months' },
];

export default function ReportsTab({ propertyUuid }) {
  const yr = new Date().getFullYear();
  const [mainStartDate, setMainStartDate] = useState(`${yr}-01-01`);
  const [mainEndDate, setMainEndDate] = useState(`${yr}-12-31`);

  const [contractPeriod, setContractPeriod] = useState('month');
  const [contractRange, setContractRange] = useState('last_12_months');
  const [contractMetric, setContractMetric] = useState('recognized_contract_amount');
  const [contractCustomStart, setContractCustomStart] = useState(`${yr}-01-01`);
  const [contractCustomEnd, setContractCustomEnd] = useState(`${yr}-12-31`);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [contractData, setContractData] = useState(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [contractError, setContractError] = useState(null);

  // -- Load maintenance summary --
  const loadSummary = useCallback(async () => {
    if (!propertyUuid) { setSummary(null); setSummaryLoading(false); return; }
    setSummaryLoading(true);
    try {
      const res = await MaintenanceService.summaryReport({
        property_uuid: propertyUuid,
        start_date: mainStartDate,
        end_date: mainEndDate,
      });
      if (res?.success) {
        setSummary(res.data?.totals ?? res.data ?? null);
      }
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Failed to load summary report' });
    } finally {
      setSummaryLoading(false);
    }
  }, [propertyUuid, mainStartDate, mainEndDate]);

  // -- Load contract chart --
  const loadContractChart = useCallback(async () => {
    setContractLoading(true);
    setContractError(null);
    try {
      const payload = {
        propertyUuid,
        period: contractPeriod === 'custom' ? 'month' : contractPeriod,
        metric: contractMetric,
        groupBy: 'property',
        recognizedStatuses: ['active'],
      };
      if (contractPeriod === 'custom') {
        payload.startDate = contractCustomStart;
        payload.endDate = contractCustomEnd;
        payload.range = 'custom';
      } else {
        payload.range = contractRange;
      }
      const res = await ReportService.contractCollectionsChart(payload);
      if (res?.success && res.data) {
        setContractData(res.data);
      } else if (res?.summary || Array.isArray(res?.series)) {
        setContractData(res);
      } else {
        setContractData(null);
        setContractError(res?.message || 'No data returned from server');
      }
    } catch (err) {
      console.error('Contract chart error:', err);
      setContractData(null);
      setContractError(err.message || 'Failed to load contract report');
    } finally {
      setContractLoading(false);
    }
  }, [propertyUuid, contractPeriod, contractRange, contractMetric, contractCustomStart, contractCustomEnd]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadContractChart();
  }, [loadContractChart]);

  const maintenanceCards = summary ? [
    { label: 'Jobs', value: summary.jobs_count ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: SUMMARY_ICONS.jobs },
    { label: 'Expenses', value: summary.expenses_count ?? 0, color: 'text-purple-600', bg: 'bg-purple-50', icon: SUMMARY_ICONS.expenses },
    { label: 'Total Amount', value: fmtCurrency(summary.total_amount), color: 'text-green-600', bg: 'bg-green-50', icon: SUMMARY_ICONS.amount },
    { label: "Today's Amount", value: fmtCurrency(summary.today_amount), color: 'text-orange-600', bg: 'bg-orange-50', icon: SUMMARY_ICONS.today },
    { label: 'This Month', value: fmtCurrency(summary.this_month_amount), color: 'text-teal-600', bg: 'bg-teal-50', icon: SUMMARY_ICONS.month },
    { label: 'This Year', value: fmtCurrency(summary.this_year_amount), color: 'text-indigo-600', bg: 'bg-indigo-50', icon: SUMMARY_ICONS.year },
  ] : [];

  const contractSummary = contractData?.summary ?? null;
  const contractComparison = contractData?.comparison ?? null;
  const contractSeries = contractData?.series ?? [];

  const contractCards = [
    {
      label: 'Total Contracts',
      value: contractSummary?.contracts_count ?? 0,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: SUMMARY_ICONS.contracts,
    },
    {
      label: 'Recognized Contracts',
      value: contractSummary?.recognized_contracts_count ?? 0,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: SUMMARY_ICONS.active,
    },
    {
      label: contractMetric === 'total_contract_amount' ? 'Total Amount' : 'Revenue Collected',
      value: fmtCurrency(contractSummary?.[contractMetric]),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: SUMMARY_ICONS.revenue,
      trend: contractComparison?.change_percentage ?? null,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Maintenance Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Maintenance Summary</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
              <input type="date" value={mainStartDate} onChange={(e) => setMainStartDate(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
              <input type="date" value={mainEndDate} onChange={(e) => setMainEndDate(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
            <button
              onClick={() => { setMainStartDate(`${yr}-01-01`); setMainEndDate(`${yr}-12-31`); }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
              Reset
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(summaryLoading ? Array.from({ length: 6 }) : maintenanceCards).map((card, i) => (
            <SummaryCard
              key={i}
              label={summaryLoading ? '' : card.label}
              value={summaryLoading ? '' : card.value}
              color={summaryLoading ? '' : card.color}
              bg={summaryLoading ? '' : card.bg}
              iconPath={summaryLoading ? SUMMARY_ICONS.jobs : card.icon}
              loading={summaryLoading}
            />
          ))}
        </div>
      </div>

      {/* Contract Report */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Contract Report</h3>
          <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-0.5">
            {[
              { value: 'recognized_contract_amount', label: 'Revenue' },
              { value: 'total_contract_amount', label: 'Total' },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => setContractMetric(m.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${contractMetric === m.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contract Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
          {/* Period */}
          <div className="flex items-center gap-1">
            {[
              { value: 'day', label: 'Day' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
              { value: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setContractPeriod(p.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${contractPeriod === p.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200 hidden sm:block" />

          {/* Range or Custom Dates */}
          {contractPeriod === 'custom' ? (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={contractCustomStart}
                  onChange={(e) => setContractCustomStart(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={contractCustomEnd}
                  onChange={(e) => setContractCustomEnd(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={contractRange}
                onChange={(e) => setContractRange(e.target.value)}
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
          )}
        </div>

        {contractError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{contractError}</p>
          </div>
        )}

        {/* Contract Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(contractLoading ? Array.from({ length: 3 }) : contractCards).map((card, i) => (
            <SummaryCard
              key={i}
              label={contractLoading ? '' : card.label}
              value={contractLoading ? '' : card.value}
              color={contractLoading ? '' : card.color}
              bg={contractLoading ? '' : card.bg}
              iconPath={contractLoading ? SUMMARY_ICONS.contracts : card.icon}
              loading={contractLoading}
              trend={contractLoading ? null : card.trend}
            />
          ))}
        </div>

        {/* Bar Chart */}
        <BarChart data={contractSeries} loading={contractLoading} valueKey={contractMetric} />
      </div>

    </div>
  );
}
