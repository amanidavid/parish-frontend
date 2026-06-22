'use client';
import React from 'react';

const currencyFmt = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const STATUS_META = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  draft: { label: 'Draft', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  expired: { label: 'Expired', color: 'bg-red-50 text-red-700 border-red-200' },
  terminated: { label: 'Terminated', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const KpiCard = React.memo(function KpiCard({ label, value, subtext, accent }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold mt-2 break-words ${accent}`}>{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
});

const StatusRow = React.memo(function StatusRow({ item, grandTotal }) {
  const meta = STATUS_META[item.status] || { label: item.status, color: 'bg-gray-50 text-gray-600 border-gray-200' };
  const percent = grandTotal > 0
    ? Math.min(100, Math.round((item.total_contract_amount / grandTotal) * 100))
    : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="w-28 shrink-0">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${meta.color}`}>
          {meta.label}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{item.contracts_count} contracts</span>
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.total_contract_amount)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
});

function SummaryTab({ data }) {
  const totals = data?.totals;
  const byStatus = data?.by_status || [];

  const kpiCards = totals ? [
    { label: 'Total Contracts', value: totals.contracts_count, subtext: 'Across all properties', accent: 'text-gray-900' },
    { label: 'Total Amount', value: formatCurrency(totals.total_contract_amount), subtext: 'Cumulative contract value', accent: 'text-primary-700' },
    { label: 'Active Contracts', value: totals.active_contracts_count, subtext: formatCurrency(totals.active_contract_amount), accent: 'text-emerald-700' },
    { label: 'Draft', value: totals.draft_contracts_count, subtext: 'Pending activation', accent: 'text-gray-600' },
    { label: 'Expired', value: totals.expired_contracts_count, subtext: 'Ended contracts', accent: 'text-red-700' },
    { label: 'Terminated', value: totals.terminated_contracts_count, subtext: 'Cancelled early', accent: 'text-orange-700' },
  ] : null;

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-400">No summary data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpiCards?.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Status Breakdown</p>
        {byStatus.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No contract data found for the selected filters.</p>
        ) : (
          <div className="space-y-4">
            {byStatus.map((item) => (
              <StatusRow key={item.status} item={item} grandTotal={totals?.total_contract_amount ?? 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '-';
  return currencyFmt.format(value);
}

export default React.memo(SummaryTab);
