'use client';
import { Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useCan from '@/hooks/useCan';
import OverviewTab from '@/components/employees/OverviewTab';
import ProfileTab from '@/components/employees/ProfileTab';
import AccessTab from '@/components/employees/AccessTab';
import DocumentsTab from '@/components/employees/DocumentsTab';
import ContractsTab from '@/components/employees/ContractsTab';

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

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'access', label: 'Access' },
  { id: 'documents', label: 'Documents' },
  { id: 'contracts', label: 'Contracts' },
];

function EmployeeDetailContent() {
  const { uuid } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const { data, isLoading } = useEmployee(uuid);
  const employee = data?.data;
  const canManage = useCan('employees.manage');

  const setTab = (tabId) => {
    router.replace(`/employees/${uuid}?tab=${tabId}`, { scroll: false });
  };

  const fullName = [employee?.first_name, employee?.middle_name, employee?.last_name].filter(Boolean).join(' ') || '—';

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-5 bg-gray-100 rounded animate-pulse w-32" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-5">
        <Link href="/employees" className="btn-secondary">Back to Employees</Link>
        <p className="text-sm text-gray-500">Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/employees" className="hover:text-gray-800 transition-colors">Employees</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium truncate max-w-xs">{cap(fullName)}</span>
        </nav>
        <Link href="/employees" className="btn-secondary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Employees
        </Link>
      </div>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center shrink-0 text-base font-semibold text-primary-600 uppercase">
              {employee?.first_name?.charAt(0) || '?'}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900">{cap(fullName)}</h1>
                <StatusBadge status={employee?.employment_status} />
              </div>
              <p className="text-sm text-gray-500 font-mono">{employee?.employee_number || '—'}</p>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Link href={`/employees/${uuid}/edit`} className="btn-secondary text-sm">Edit</Link>
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            { label: 'Email', value: employee?.work_email },
            { label: 'Phone', value: employee?.work_phone },
            { label: 'Type', value: cap(employee?.employment_type?.replace('_', ' ')) },
            { label: 'Hire Date', value: employee?.hire_date ? new Date(employee.hire_date).toLocaleDateString('en-GB') : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="px-6 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-sm font-medium text-gray-800 truncate">{value !== undefined && value !== null ? value : <span className="text-gray-300">—</span>}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={[
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && <OverviewTab employee={employee} />}
        {activeTab === 'profile' && <ProfileTab uuid={uuid} canManage={canManage} />}
        {activeTab === 'access' && <AccessTab uuid={uuid} canManage={canManage} />}
        {activeTab === 'documents' && <DocumentsTab uuid={uuid} canManage={canManage} />}
        {activeTab === 'contracts' && <ContractsTab uuid={uuid} canManage={canManage} />}
      </div>

    </div>
  );
}

export default function EmployeeDetailClient() {
  return (
    <Suspense fallback={<div className="space-y-5"><div className="h-5 bg-gray-100 rounded animate-pulse w-32" /><div className="h-32 bg-gray-100 rounded animate-pulse" /></div>}>
      <EmployeeDetailContent />
    </Suspense>
  );
}
