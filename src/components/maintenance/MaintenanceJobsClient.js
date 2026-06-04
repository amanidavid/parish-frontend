'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import MaintenanceService from '@/services/MaintenanceService';
import PropertyService from '@/services/PropertyService';
import FloorService from '@/services/FloorService';
import UnitService from '@/services/UnitService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import useConfirmModal from '@/hooks/useConfirmModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function FormField({ label, children, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EMPTY_FORM = { property_uuid: '', property_floor_uuid: '', unit_uuid: '', title: '', description: '', reported_date: '' };

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCards({ totals, loading }) {
  const yr = new Date().getFullYear();
  const cards = [
    { label: `Jobs (${yr})`, value: totals?.jobs_count ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: `Expenses (${yr})`, value: totals?.expenses_count ?? 0, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Amount', value: fmtAmt(totals?.total_amount), color: 'text-green-600', bg: 'bg-green-50' },
    { label: "Today's Amount", value: fmtAmt(totals?.today_amount), color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'This Month', value: fmtAmt(totals?.this_month_amount), color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'This Year', value: fmtAmt(totals?.this_year_amount), color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${c.bg} mb-3`}>
            <svg className={`w-4 h-4 ${c.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          {loading ? (
            <div className="h-6 bg-gray-100 rounded animate-pulse w-16 mb-1" />
          ) : (
            <p className={`text-xl font-bold ${c.color}`}>{typeof c.value === 'number' ? c.value.toLocaleString() : c.value}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── By Property Report Tab ───────────────────────────────────────────────────
function ByPropertyTab({ startDate, endDate }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async (pg) => {
    setLoading(true);
    const res = await MaintenanceService.byPropertyReport({
      per_page: 15,
      page: pg,
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    });
    setRows(res?.data?.data ?? []);
    setMeta(res?.data?.meta ?? null);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { setPage(1); load(1); }, [load]);

  const handlePage = useCallback((pg) => { setPage(pg); load(pg); }, [load]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jobs</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expenses</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Amount</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Latest Expense</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-b border-gray-50">
              {Array.from({ length: 5 }, (__, j) => (
                <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
              ))}
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No property data found</td></tr>
          )}
          {!loading && rows.map((row) => (
            <tr key={row.property_uuid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{row.property_name}</p>
                <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${row.property_status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {row.property_status}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-blue-600">{Number(row.jobs_count).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-gray-600">{Number(row.expenses_count).toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmtAmt(row.total_amount)}</td>
              <td className="px-4 py-3 text-gray-500">{fmtDate(row.latest_expense_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta && meta.last_page > 1 && <Pagination meta={meta} onPageChange={handlePage} />}
    </div>
  );
}

// ─── Recent Expenses Report Tab ───────────────────────────────────────────────
function RecentExpensesTab({ startDate, endDate }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debRef = useRef(null);

  const load = useCallback(async (pg, q) => {
    setLoading(true);
    const res = await MaintenanceService.recentExpensesReport({
      per_page: 15,
      page: pg,
      ...(q ? { search: q } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    });
    setRows(res?.data?.data ?? []);
    setMeta(res?.data?.meta ?? null);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { setPage(1); setSearch(''); load(1, ''); }, [load]);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setPage(1); load(1, val); }, 350);
  }, [load]);

  const handlePage = useCallback((pg) => { setPage(pg); load(pg, search); }, [search, load]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search expenses…" value={search} onChange={handleSearch}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expense</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }, (_, i) => (
              <tr key={i} className="border-b border-gray-50">
                {Array.from({ length: 5 }, (__, j) => (
                  <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                ))}
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">No recent expenses found</td></tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.expense_uuid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{row.title}</p>
                  {row.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{row.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.maintenance_job?.uuid ? (
                    <Link href={`/maintenance/${row.maintenance_job.uuid}`} className="text-sm text-primary-600 hover:underline font-medium">
                      {row.maintenance_job.title}
                    </Link>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">{row.property?.name || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmtAmt(row.amount)}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(row.expense_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {meta && meta.last_page > 1 && <Pagination meta={meta} onPageChange={handlePage} />}
      </div>
    </div>
  );
}

// ─── Jobs Tab ─────────────────────────────────────────────────────────────────
function JobsTab({ startDate, endDate }) {
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debRef = useRef(null);

  const [properties, setProperties] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [modal, setModal] = useState({ open: false, mode: 'create', job: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const confirmModal = useConfirmModal();

  // ── Load jobs ──
  const loadJobs = useCallback(async (pg, q) => {
    setLoading(true);
    const res = await MaintenanceService.jobsIndex({
      per_page: 15,
      page: pg,
      ...(q ? { search: q } : {}),
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    });
    setJobs(res?.data?.data ?? res?.data ?? []);
    setMeta(res?.data?.meta ?? res?.meta ?? null);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { setPage(1); setSearch(''); loadJobs(1, ''); }, [loadJobs]);

  // ── Load properties for form ──
  useEffect(() => {
    PropertyService.index({ per_page: 100 }).then((res) => {
      setProperties(res?.data?.data ?? res?.data ?? []);
    });
  }, []);

  // ── Handlers ──
  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setPage(1); loadJobs(1, val); }, 350);
  }, [loadJobs]);

  const handlePage = useCallback((pg) => {
    setPage(pg);
    loadJobs(pg, search);
  }, [search, loadJobs]);

  // ── Modal helpers ──
  const openCreate = useCallback(() => {
    setForm({ ...EMPTY_FORM, reported_date: new Date().toISOString().slice(0, 10) });
    setFloors([]);
    setUnits([]);
    setErrors({});
    setModal({ open: true, mode: 'create', job: null });
  }, []);

  const openEdit = useCallback(async (job) => {
    const propertyUuid = job.property?.uuid || '';
    const floorUuid = job.property_floor?.uuid || '';
    const unitUuid = job.unit?.uuid || '';
    setForm({
      property_uuid: propertyUuid,
      property_floor_uuid: floorUuid,
      unit_uuid: unitUuid,
      title: job.title || '',
      description: job.description || '',
      reported_date: job.reported_date || '',
    });
    setFloors([]);
    setUnits([]);
    // Pre-load floors/units when editing a job that already has them
    if (propertyUuid) {
      const fRes = await FloorService.listAll(propertyUuid);
      const floorList = fRes?.data?.data ?? fRes?.data ?? [];
      setFloors(floorList);
      if (floorUuid) {
        const uRes = await UnitService.listByFloor(floorUuid, { perPage: 100 });
        setUnits(uRes?.data?.data ?? uRes?.data ?? []);
      }
    }
    setErrors({});
    setModal({ open: true, mode: 'edit', job });
  }, []);

  const updateField = useCallback((field, value) => {
    setForm((p) => {
      const next = { ...p, [field]: value };
      // Cascade: clear downstream selections when parent changes
      if (field === 'property_uuid') { next.property_floor_uuid = ''; next.unit_uuid = ''; }
      if (field === 'property_floor_uuid') { next.unit_uuid = ''; }
      return next;
    });
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }, []);

  // Load floors when property changes
  useEffect(() => {
    if (!form.property_uuid) { setFloors([]); setUnits([]); return; }
    FloorService.listAll(form.property_uuid).then((res) => {
      setFloors(res?.data?.data ?? res?.data ?? []);
    });
  }, [form.property_uuid]);

  // Load units when floor changes
  useEffect(() => {
    if (!form.property_floor_uuid) { setUnits([]); return; }
    UnitService.listByFloor(form.property_floor_uuid, { perPage: 100 }).then((res) => {
      setUnits(res?.data?.data ?? res?.data ?? []);
    });
  }, [form.property_floor_uuid]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (!form.reported_date) errs.reported_date = 'Reported date is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const res = modal.mode === 'create'
      ? await MaintenanceService.jobsStore(form)
      : await MaintenanceService.jobsUpdate(modal.job.uuid, form);
    setSubmitting(false);
    if (res?.success) {
      setModal({ open: false, mode: 'create', job: null });
      loadJobs(page, search);
    } else {
      setErrors(res?.errors ?? { title: res?.message ?? 'Something went wrong' });
    }
  }, [form, modal, page, search, loadJobs]);

  const handleDelete = useCallback(async () => {
    const res = await confirmModal.execute(
      (job) => MaintenanceService.jobsDestroy(job.uuid, { showLoader: false }),
      { successMessage: 'Job deleted successfully.', errorMessage: 'Failed to delete job.' }
    );
    if (res?.success) {
      loadJobs(page, search);
    }
  }, [confirmModal, page, search, loadJobs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search jobs…" value={search} onChange={handleSearch} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2 shrink-0">+ New Job</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Job</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reported</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }, (_, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-48" /></td>
                <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-32" /></td>
                <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
                <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-16 ml-auto" /></td>
              </tr>
            ))}
            {!loading && jobs.length === 0 && (
              <tr><td colSpan={4} className="text-center py-16 text-gray-400 text-sm">No maintenance jobs found</td></tr>
            )}
            {!loading && jobs.map((job) => (
              <tr key={job.uuid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/maintenance/${job.uuid}`} className="font-medium text-gray-900 hover:text-primary-600 transition-colors">
                    {job.title}
                  </Link>
                  {job.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{job.description}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm">{job.property?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{fmtDate(job.reported_date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/maintenance/${job.uuid}`} className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">View</Link>
                    <button onClick={() => openEdit(job)} className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">Edit</button>
                    <button onClick={() => confirmModal.prompt(job)} className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meta && meta.last_page > 1 && <Pagination meta={meta} onPageChange={handlePage} />}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', job: null })}
        title={modal.mode === 'create' ? 'New Maintenance Job' : 'Edit Maintenance Job'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Property" error={errors.property_uuid}>
            <select value={form.property_uuid} onChange={(e) => updateField('property_uuid', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">Select property (optional)</option>
              {properties.map((p) => (
                <option key={p.uuid} value={p.uuid}>{p.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Floor" error={errors.property_floor_uuid}>
            <select value={form.property_floor_uuid} onChange={(e) => updateField('property_floor_uuid', e.target.value)}
              disabled={!form.property_uuid || floors.length === 0}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">{floors.length === 0 && form.property_uuid ? 'No floors found' : 'Select floor (optional)'}</option>
              {floors.map((f) => (
                <option key={f.uuid} value={f.uuid}>Floor {f.floor_number}{f.name ? ` — ${f.name}` : ''}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Unit" error={errors.unit_uuid}>
            <select value={form.unit_uuid} onChange={(e) => updateField('unit_uuid', e.target.value)}
              disabled={!form.property_floor_uuid || units.length === 0}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">{units.length === 0 && form.property_floor_uuid ? 'No units found' : 'Select unit (optional)'}</option>
              {units.map((u) => (
                <option key={u.uuid} value={u.uuid}>{u.unit_number}{u.name ? ` — ${u.name}` : ''}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Title" error={errors.title}>
            <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Renovation after tenant move-out" />
          </FormField>
          <FormField label="Description">
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[80px] resize-y"
              placeholder="Describe the maintenance work…" />
          </FormField>
          <FormField label="Reported Date" error={errors.reported_date}>
            <input type="date" value={form.reported_date} onChange={(e) => updateField('reported_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', job: null })} disabled={submitting} className="btn-secondary text-sm py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm py-2">
              {submitting ? 'Saving…' : modal.mode === 'create' ? 'Create Job' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.close}
        onConfirm={handleDelete}
        onRetry={handleDelete}
        title="Delete Job"
        message={`Delete "${confirmModal.item?.title}"? This will also remove all related expenses.`}
        confirmLabel="Delete"
        danger
        loading={confirmModal.loading}
        result={confirmModal.result}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'jobs', label: 'Jobs' },
  { key: 'by_property', label: 'By Property' },
  { key: 'recent_expenses', label: 'Recent Expenses' },
];

export default function MaintenanceJobsClient() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [totals, setTotals] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const yr = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${yr}-01-01`);
  const [endDate, setEndDate] = useState(`${yr}-12-31`);

  useEffect(() => {
    setSummaryLoading(true);
    MaintenanceService.summaryReport({
      ...(startDate ? { start_date: startDate } : {}),
      ...(endDate ? { end_date: endDate } : {}),
    }).then((res) => {
      setTotals(res?.data?.totals ?? null);
      setSummaryLoading(false);
    });
  }, [startDate, endDate]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-base font-bold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage maintenance jobs and expenses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <button
            onClick={() => { setStartDate(`${yr}-01-01`); setEndDate(`${yr}-12-31`); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
            Reset
          </button>
        </div>
      </div>

      <SummaryCards totals={totals} loading={summaryLoading} />

      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'jobs' && <JobsTab startDate={startDate} endDate={endDate} />}
      {activeTab === 'by_property' && <ByPropertyTab startDate={startDate} endDate={endDate} />}
      {activeTab === 'recent_expenses' && <RecentExpensesTab startDate={startDate} endDate={endDate} />}
    </div>
  );
}
