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
  { key: 'name', label: 'Property' },
  { key: 'contracts_count', label: 'Contracts' },
  { key: 'total_contract_amount', label: 'Total Amount' },
  { key: 'active_contract_amount', label: 'Active Amount' },
  { key: 'latest_end_date', label: 'Latest End' },
];

const STATUS_DOT = {
  active: 'bg-emerald-500',
  draft: 'bg-gray-400',
  inactive: 'bg-gray-300',
};

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

const PropertyRow = React.memo(function PropertyRow({ item }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[item.property_status] || 'bg-gray-300'}`} />
          <Link
            href={`/properties/${item.property_uuid}`}
            className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
          >
            {item.property_name}
          </Link>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-700">{item.contracts_count}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.total_contract_amount)}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-emerald-700">{formatCurrency(item.active_contract_amount)}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">{item.latest_end_date ? formatDate(item.latest_end_date) : '-'}</span>
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

function ByPropertyTab({ data, sort, onSort, page, onPageChange, search, onSearch }) {
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
              placeholder="Search properties..."
              className="input text-sm w-full pl-9"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-secondary text-xs px-3 py-1.5">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {SORTABLE_COLUMNS.map((col) => (
                <SortHeader key={col.key} column={col} sort={sort} onSort={onSort} />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={SORTABLE_COLUMNS.length} className="px-4 py-12 text-center text-sm text-gray-400">
                  No properties found.
                </td>
              </tr>
            ) : (
              items.map((item) => <PropertyRow key={item.property_uuid} item={item} />)
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

export default React.memo(ByPropertyTab);
