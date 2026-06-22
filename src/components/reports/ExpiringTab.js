'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const currencyFmt = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const SORTABLE_COLUMNS = [
  { key: 'contract_number', label: 'Contract #' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'property_name', label: 'Property' },
  { key: 'amount', label: 'Amount' },
  { key: 'end_date', label: 'End Date' },
];

const STATUS_META = {
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  draft: { label: 'Draft', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  expired: { label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200' },
  terminated: { label: 'Terminated', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function DaysBadge({ days }) {
  if (days === null || days === undefined) return <span className="text-gray-400">-</span>;

  let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (days <= 7) {
    colorClass = 'bg-red-50 text-red-700 border-red-200';
  } else if (days <= 30) {
    colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (days <= 60) {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {days}d
    </span>
  );
}

const SortHeader = React.memo(function SortHeader({ column, sort, onSort }) {
  const isActive = sort === column.key || sort === `-${column.key}`;
  const isDesc = sort === `-${column.key}`;

  const handleClick = useCallback(() => {
    if (!isActive) {
      onSort(column.key);
    } else if (!isDesc) {
      onSort(`-${column.key}`);
    } else {
      onSort('');
    }
  }, [column.key, isActive, isDesc, onSort]);

  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        {column.label}
        {isActive && (
          <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isDesc ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
          </svg>
        )}
      </div>
    </th>
  );
});

const ContractRow = React.memo(function ContractRow({ item }) {
  const statusMeta = STATUS_META[item.status] || { label: item.status, className: 'bg-gray-50 text-gray-600 border-gray-200' };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900">{item.contract_number}</span>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/customers/${item.customer_uuid}`}
          className="text-sm text-gray-700 hover:text-primary-600 transition-colors"
        >
          {item.customer_name}
        </Link>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/properties/${item.property_uuid}`}
          className="text-sm text-gray-700 hover:text-primary-600 transition-colors"
        >
          {item.property_name}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">Unit {item.unit_number}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{formatDate(item.end_date)}</span>
      </td>
      <td className="px-4 py-3">
        <DaysBadge days={item.days_to_expiry} />
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${statusMeta.className}`}>
          {statusMeta.label}
        </span>
      </td>
    </tr>
  );
});

function Pagination({ meta, data, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium">{meta.from}</span> to <span className="font-medium">{meta.to}</span> of{' '}
        <span className="font-medium">{meta.total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!data?.links?.prev}
          onClick={() => onPageChange(meta.current_page - 1)}
          className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="px-2 text-xs text-gray-500">
          Page {meta.current_page} of {meta.last_page}
        </span>
        <button
          type="button"
          disabled={!data?.links?.next}
          onClick={() => onPageChange(meta.current_page + 1)}
          className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ExpiringTab({ data, sort, onSort, page, onPageChange, search, onSearch }) {
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => { setLocalSearch(search); }, [search]);

  const items = data?.data || [];
  const meta = data?.meta;

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    onSearch(localSearch);
  }, [localSearch, onSearch]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contracts, customers, properties..."
              className="input text-sm w-full pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-3 py-1.5">Search</button>
        </form>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-4 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Days to expiry:</span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 60+ days</span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-400" /> 31-60 days</span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-orange-400" /> 8-30 days</span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-red-500" /> 1-7 days</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {SORTABLE_COLUMNS.map((col) => (
                <SortHeader key={col.key} column={col} sort={sort} onSort={onSort} />
              ))}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Left</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={SORTABLE_COLUMNS.length + 2} className="px-4 py-12 text-center text-sm text-gray-400">
                  No expiring contracts found.
                </td>
              </tr>
            ) : (
              items.map((item) => <ContractRow key={item.contract_uuid} item={item} />)
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} data={data} onPageChange={onPageChange} />
    </div>
  );
}

function formatCurrency(value) {
  if (value === undefined || value === null) return '-';
  return currencyFmt.format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return dateFmt.format(new Date(dateStr));
}

export default React.memo(ExpiringTab);
