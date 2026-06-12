'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useEmployeesList } from '@/hooks/useEmployees';
import Pagination from '@/components/ui/Pagination';
import useCan from '@/hooks/useCan';

const PER_PAGE = 15;

const STATUS_MAP = {
  active: { label: 'Active', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  inactive: { label: 'Inactive', bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
  offboarded: { label: 'Offboarded', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  on_leave: { label: 'On Leave', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status || 'Unknown', bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-5 py-3.5">
          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 - (i % 3) * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

const BTN = {
  gray: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors',
  red: 'h-8 px-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-red-500 hover:bg-red-50 transition-colors',
};

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function EmployeesPageClient({ initialItems = [], initialMeta = null }) {
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(initialMeta?.current_page ?? 1);
  const searchRef = useRef(null);

  const canManage = useCan('employees.manage');

  const { data, isLoading, error } = useEmployeesList({
    page,
    search: appliedSearch,
    status: statusFilter,
    perPage: PER_PAGE,
  });

  const employees = data?.data || [];
  const meta = data?.meta || null;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    setAppliedSearch('');
    setStatusFilter('');
    setPage(1);
  };

  const fullName = (emp) => {
    const parts = [emp.first_name, emp.middle_name, emp.last_name].filter(Boolean);
    return parts.join(' ') || '—';
  };

  const displayEmployees = isLoading && employees.length === 0 ? initialItems : employees;
  const displayMeta = meta || initialMeta;
  const displayLoading = isLoading && displayEmployees.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage employees, contracts, and access</p>
        </div>
        {canManage && <Link href="/employees/create" className="btn-primary text-sm">New Employee</Link>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name..."
                className="input pl-9 pr-8 w-56"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-secondary text-sm">Search</button>
          </form>

          <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="offboarded">Offboarded</option>
          </select>

          {(appliedSearch || statusFilter) && (
            <button type="button" onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
              Clear all
            </button>
          )}
        </div>

        {displayMeta && <p className="text-sm text-gray-400"><span className="font-medium text-gray-700">{displayMeta.total ?? 0}</span> total</p>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {error && <div className="m-4 text-sm text-red-700">{error.message || 'Failed to load employees'}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : displayEmployees.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-sm text-gray-500">No employees found.</td></tr>
              ) : displayEmployees.map((emp, idx) => (
                <tr key={emp.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-gray-400">{((page - 1) * PER_PAGE) + idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <Link href={`/employees/${emp.uuid}`} className="font-medium text-gray-900 hover:text-primary-600">
                      {cap(fullName(emp))}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 font-mono">{emp.employee_number || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{emp.work_email || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{emp.work_phone || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 capitalize">{emp.employment_type?.replace('_', ' ') || '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={emp.employment_status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && <Link href={`/employees/${emp.uuid}/edit`} className={BTN.gray}>Edit</Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {displayMeta && <Pagination meta={displayMeta} onPageChange={setPage} />}
      </div>

    </div>
  );
}
