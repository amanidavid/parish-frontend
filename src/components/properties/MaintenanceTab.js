'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import MaintenanceService from '@/services/MaintenanceService';
import FloorService from '@/services/FloorService';
import UnitService from '@/services/UnitService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import ActionMenu from '@/components/ui/ActionMenu';
import useConfirmModal from '@/hooks/useConfirmModal';
import useUiStore from '@/store/uiStore';
import { usePropertyAccess } from '@/contexts/PropertyAccessContext';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmount(n, currency = '') {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return `${Number(n).toLocaleString()} ${currency}`;
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

const STATUS_META = {
  open: { label: 'Open', dot: 'bg-amber-500', numColor: 'text-amber-600' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-500', numColor: 'text-blue-600' },
  closed: { label: 'Closed', dot: 'bg-emerald-500', numColor: 'text-emerald-600' },
};

const EMPTY_FORM = {
  property_floor_uuid: '',
  unit_uuid: '',
  title: '',
  description: '',
  status: 'open',
  reported_date: '',
};

const EMPTY_EXPENSE = { title: '', description: '', amount: '', expense_date: '' };

/* ─── Inline Repair Detail (expenses) ─────────────────────────────────── */
function RepairDetail({ repairUuid, propertyUuid, onBack }) {
  const [repair, setRepair] = useState(null);
  const [repairLoading, setRepairLoading] = useState(true);

  const access = usePropertyAccess();
  const workspaceBlocked = access?.workspace?.allowed === false;
  const propertyBlocked = access?.property_subscription?.allowed === false;
  const opsBlocked = workspaceBlocked || propertyBlocked;
  const opsMessage = workspaceBlocked
    ? access?.workspace?.message
    : (propertyBlocked ? access?.property_subscription?.message : '');

  const [expenses, setExpenses] = useState([]);
  const [expensesMeta, setExpensesMeta] = useState(null);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesPage, setExpensesPage] = useState(1);

  const [modal, setModal] = useState({ open: false, mode: 'create', expense: null });
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const confirmModal = useConfirmModal();

  useEffect(() => {
    setRepairLoading(true);
    MaintenanceService.jobsShow(repairUuid).then((res) => {
      setRepair(res?.data ?? null);
      setRepairLoading(false);
    });
  }, [repairUuid]);

  const loadExpenses = useCallback(async (pg) => {
    setExpensesLoading(true);
    const res = await MaintenanceService.expensesIndex({
      maintenance_job_uuid: repairUuid,
      per_page: 15,
      page: pg,
      sort: '-expense_date',
    });
    setExpenses(res?.data?.data ?? res?.data ?? []);
    setExpensesMeta(res?.data?.meta ?? res?.meta ?? null);
    setExpensesLoading(false);
  }, [repairUuid]);

  useEffect(() => { loadExpenses(1); }, [loadExpenses]);

  const openCreateExpense = useCallback(() => {
    setForm({ ...EMPTY_EXPENSE, expense_date: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setModal({ open: true, mode: 'create', expense: null });
  }, []);

  const openEditExpense = useCallback((expense) => {
    setForm({
      title: expense.title || '',
      description: expense.description || '',
      amount: expense.amount?.toString() || '',
      expense_date: expense.expense_date || '',
    });
    setErrors({});
    setModal({ open: true, mode: 'edit', expense });
  }, []);

  const updateField = useCallback((field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }, []);

  const handleSubmitExpense = useCallback(async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required';
    if (!form.expense_date) errs.expense_date = 'Date is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const body = { ...form, amount: Number(form.amount), maintenance_job_uuid: repairUuid };
    const res = modal.mode === 'create'
      ? await MaintenanceService.expensesStore(body)
      : await MaintenanceService.expensesUpdate(modal.expense.uuid, body);
    setSubmitting(false);
    if (res?.success) {
      setModal({ open: false, mode: 'create', expense: null });
      loadExpenses(expensesPage);
      useUiStore.getState().showModal({
        type: 'success',
        message: res?.message || (modal.mode === 'create' ? 'Expense added successfully.' : 'Expense updated successfully.'),
      });
    } else {
      setErrors(res?.errors ?? { title: res?.message ?? 'Something went wrong' });
      useUiStore.getState().showModal({
        type: 'error',
        message: res?.message || (modal.mode === 'create' ? 'Failed to add expense.' : 'Failed to update expense.'),
      });
    }
  }, [form, modal, repairUuid, expensesPage, loadExpenses]);

  const handleDeleteExpense = useCallback(async () => {
    const res = await confirmModal.execute(
      (expense) => MaintenanceService.expensesDestroy(expense.uuid, { showLoader: false }),
      { successMessage: 'Expense deleted successfully.', errorMessage: 'Failed to delete expense.' }
    );
    if (res?.success) {
      loadExpenses(expensesPage);
      useUiStore.getState().showModal({ type: 'success', message: 'Expense deleted successfully.' });
    } else {
      useUiStore.getState().showModal({ type: 'error', message: res?.message || 'Failed to delete expense.' });
    }
  }, [confirmModal, expensesPage, loadExpenses]);

  const statusInfo = STATUS_META[repair?.status] || STATUS_META.open;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-0.5 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          {repairLoading ? (
            <div className="h-5 bg-gray-200 rounded animate-pulse w-56" />
          ) : (
            <>
              <h1 className="text-base font-bold text-gray-900">{repair?.title ?? 'Repair Detail'}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {repair?.property?.name ? `${repair.property.name} · ` : ''}{fmtDate(repair?.reported_date)}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {expensesMeta && (
            <span className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{expensesMeta.total ?? 0}</span> expenses
            </span>
          )}
          <button
            onClick={openCreateExpense}
            disabled={opsBlocked}
            title={opsBlocked ? opsMessage : undefined}
            className="btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >New Expense</button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Expenses</h2>
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expensesLoading && Array.from({ length: 4 }, (_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-40" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-16 ml-auto" /></td>
                  </tr>
                ))}
                {!expensesLoading && expenses.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400 text-sm">No expenses recorded yet</td></tr>
                )}
                {!expensesLoading && expenses.map((ex) => (
                  <tr key={ex.uuid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{ex.title}</p>
                      {ex.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{ex.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{fmtAmount(ex.amount, ex.currency)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(ex.expense_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        actions={[
                          { label: 'Edit', onClick: () => openEditExpense(ex), disabled: opsBlocked },
                          { label: 'Delete', onClick: () => confirmModal.prompt(ex), danger: true, disabled: opsBlocked },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expensesMeta && expensesMeta.last_page > 1 && (
            <Pagination meta={expensesMeta} onPageChange={(pg) => { setExpensesPage(pg); loadExpenses(pg); }} />
          )}
        </div>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', expense: null })}
        title={modal.mode === 'create' ? 'New Expense' : 'Edit Expense'} maxWidth="max-w-md">
        <form onSubmit={handleSubmitExpense} className="space-y-4">
          <FormField label="Title" error={errors.title}>
            <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. Paint materials" />
          </FormField>
          <FormField label="Description">
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[60px] resize-y"
              placeholder="Optional notes…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount" error={errors.amount}>
              <input type="number" min={0} step="0.01" value={form.amount} onChange={(e) => updateField('amount', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="0.00" />
            </FormField>
            <FormField label="Expense Date" error={errors.expense_date}>
              <input type="date" value={form.expense_date} onChange={(e) => updateField('expense_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', expense: null })} disabled={submitting} className="btn-secondary text-sm py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm py-2">
              {submitting ? 'Saving…' : modal.mode === 'create' ? 'Add Expense' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.close}
        onConfirm={handleDeleteExpense}
        onRetry={handleDeleteExpense}
        title="Delete Expense"
        message={`Delete "${confirmModal.item?.title}"?`}
        confirmLabel="Delete"
        danger
        loading={confirmModal.loading}
        result={confirmModal.result}
      />
    </div>
  );
}

/* ─── Main MaintenanceTab ─────────────────────────────────────────────── */
export default function MaintenanceTab({ propertyUuid }) {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [totalExpenses, setTotalExpenses] = useState(0);

  const [modal, setModal] = useState({ open: false, mode: 'create', repair: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const confirmModal = useConfirmModal();

  const access = usePropertyAccess();
  const workspaceBlocked = access?.workspace?.allowed === false;
  const propertyBlocked = access?.property_subscription?.allowed === false;
  const opsBlocked = workspaceBlocked || propertyBlocked;
  const opsMessage = workspaceBlocked
    ? access?.workspace?.message
    : (propertyBlocked ? access?.property_subscription?.message : '');

  const [viewRepairUuid, setViewRepairUuid] = useState(null);

  const loadRepairs = useCallback(async (pg) => {
    if (!propertyUuid) { setRepairs([]); setMeta(null); setLoading(false); return; }
    setLoading(true);
    try {
      const params = {
        property_uuid: propertyUuid,
        per_page: 15,
        page: pg,
        sort: '-reported_date',
      };
      if (statusFilter) params.status = statusFilter;
      const res = await MaintenanceService.jobsIndex(params);
      if (res?.success) {
        setRepairs(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setMeta(res.data?.meta || res.meta || null);
      }
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Failed to load maintenance repairs' });
    } finally {
      setLoading(false);
    }
  }, [propertyUuid, statusFilter]);

  useEffect(() => { loadRepairs(1); }, [loadRepairs]);

  useEffect(() => {
    if (!propertyUuid) { setTotalExpenses(0); return; }
    MaintenanceService.summaryReport({ property_uuid: propertyUuid }).then((res) => {
      const total = res?.data?.total_expenses ?? res?.data?.total_amount ?? res?.total_expenses ?? 0;
      setTotalExpenses(Number(total) || 0);
    }).catch(() => setTotalExpenses(0));
  }, [propertyUuid]);

  useEffect(() => {
    if (!propertyUuid) { setFloors([]); return; }
    FloorService.listAll(propertyUuid).then((res) => {
      setFloors(res?.data?.data ?? res?.data ?? []);
    });
  }, [propertyUuid]);

  useEffect(() => {
    if (!form.property_floor_uuid) { setUnits([]); return; }
    UnitService.listByFloor(form.property_floor_uuid, { perPage: 100 }).then((res) => {
      setUnits(res?.data?.data ?? res?.data ?? []);
    });
  }, [form.property_floor_uuid]);

  const openCreate = useCallback(() => {
    setForm({ ...EMPTY_FORM, reported_date: new Date().toISOString().slice(0, 10), property_floor_uuid: '', unit_uuid: '' });
    setErrors({});
    setUnits([]);
    setModal({ open: true, mode: 'create', repair: null });
  }, []);

  const openEdit = useCallback((repair) => {
    const floorUuid = repair.property_floor?.uuid || '';
    const unitUuid = repair.unit?.uuid || '';
    setForm({
      property_floor_uuid: floorUuid,
      unit_uuid: unitUuid,
      title: repair.title || '',
      description: repair.description || '',
      status: repair.status || 'open',
      reported_date: repair.reported_date || '',
    });
    setErrors({});
    setModal({ open: true, mode: 'edit', repair });
  }, []);

  const updateField = useCallback((field, value) => {
    setForm((p) => {
      const next = { ...p, [field]: value };
      if (field === 'property_floor_uuid') { next.unit_uuid = ''; }
      return next;
    });
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const body = { ...form, property_uuid: propertyUuid };
    const res = modal.mode === 'create'
      ? await MaintenanceService.jobsStore(body)
      : await MaintenanceService.jobsUpdate(modal.repair.uuid, body);
    setSubmitting(false);
    if (res?.success) {
      setModal({ open: false, mode: 'create', repair: null });
      loadRepairs(page);
      useUiStore.getState().showModal({
        type: 'success',
        message: res?.message || (modal.mode === 'create' ? 'Repair created successfully.' : 'Repair updated successfully.'),
      });
    } else {
      setErrors(res?.errors ?? { title: res?.message ?? 'Something went wrong' });
      useUiStore.getState().showModal({
        type: 'error',
        message: res?.message || (modal.mode === 'create' ? 'Failed to create repair.' : 'Failed to update repair.'),
      });
    }
  }, [form, modal, propertyUuid, page, loadRepairs]);

  const handleDelete = useCallback(async () => {
    const res = await confirmModal.execute(
      (repair) => MaintenanceService.jobsDestroy(repair.uuid, { showLoader: false }),
      { successMessage: 'Repair deleted successfully.', errorMessage: 'Failed to delete repair.' }
    );
    if (res?.success) {
      loadRepairs(page);
      useUiStore.getState().showModal({ type: 'success', message: 'Repair deleted successfully.' });
    } else {
      useUiStore.getState().showModal({ type: 'error', message: res?.message || 'Failed to delete repair.' });
    }
  }, [confirmModal, page, loadRepairs]);

  const repairSummary = useMemo(() => {
    const counts = { total: repairs.length, open: 0, in_progress: 0, closed: 0 };
    repairs.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    return counts;
  }, [repairs]);

  if (viewRepairUuid) {
    return (
      <RepairDetail
        repairUuid={viewRepairUuid}
        propertyUuid={propertyUuid}
        onBack={() => setViewRepairUuid(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          {statusFilter && (
            <button type="button" onClick={() => { setStatusFilter(''); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Clear</button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            disabled={opsBlocked}
            title={opsBlocked ? opsMessage : undefined}
            className="btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Repair
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && repairs.length > 0 && (
        <div className="relative">
          <div
            className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              {
                key: 'total',
                label: 'Total Repairs',
                numColor: 'text-gray-900',
                iconBg: 'bg-gray-50',
                iconColor: 'text-gray-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                ),
              },
              {
                key: 'open',
                label: 'Open',
                numColor: 'text-amber-600',
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                key: 'in_progress',
                label: 'In Progress',
                numColor: 'text-blue-600',
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
              },
              {
                key: 'closed',
                label: 'Closed',
                numColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-500',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                key: 'expenses',
                label: 'Total Expenses',
                numColor: 'text-primary-600',
                iconBg: 'bg-primary-50',
                iconColor: 'text-primary-500',
                value: fmtAmount(totalExpenses),
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
              },
            ].map(({ key, label, numColor, iconBg, iconColor, icon, value }) => (
              <div
                key={key}
                className="shrink-0 w-[150px] sm:flex-1 snap-start bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-sm transition-all px-4 py-3.5 flex items-center gap-3"
              >
                <div className={`shrink-0 w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}>
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className={`${numColor} text-lg font-bold leading-tight tabular-nums`}>{value ?? repairSummary[key]}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5 truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#f8fafc] to-transparent sm:hidden" />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reported</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-40" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-16" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-12 ml-auto" /></td>
                </tr>
              ))}
              {!loading && repairs.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400 text-sm">No maintenance repairs found</td></tr>
              )}
              {!loading && repairs.map((repair) => {
                const st = STATUS_META[repair.status] || STATUS_META.open;
                return (
                  <tr key={repair.uuid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{repair.title}</p>
                      {repair.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{repair.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${st.numColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(repair.reported_date)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewRepairUuid(repair.uuid)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                        >
                          View
                        </button>
                        <ActionMenu
                          actions={[
                            { label: 'Edit', onClick: () => openEdit(repair), disabled: opsBlocked },
                            { label: 'Delete', onClick: () => confirmModal.prompt(repair), danger: true, disabled: opsBlocked },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => { setPage(page - 1); loadRepairs(page - 1); }}
              disabled={page <= 1}
              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">Page {page} of {meta.last_page}</span>
            <button
              onClick={() => { setPage(page + 1); loadRepairs(page + 1); }}
              disabled={page >= meta.last_page}
              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={() => { if (!submitting) setModal({ open: false, mode: 'create', repair: null }); }}
        title={modal.mode === 'create' ? 'New Repair' : 'Edit Repair'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Floor">
            <select value={form.property_floor_uuid} onChange={(e) => updateField('property_floor_uuid', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="">{floors.length === 0 ? 'No floors found' : 'Select floor (optional)'}</option>
              {floors.map((f) => (
                <option key={f.uuid} value={f.uuid}>Floor {f.floor_number}{f.name ? ` — ${f.name}` : ''}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Unit">
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
              placeholder="e.g. Renovation" />
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </FormField>
          <FormField label="Description">
            <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[60px] resize-y"
              placeholder="Describe the work…" />
          </FormField>
          <FormField label="Reported Date" error={errors.reported_date}>
            <input type="date" value={form.reported_date} onChange={(e) => updateField('reported_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', repair: null })} disabled={submitting} className="btn-secondary text-sm py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm py-2">
              {submitting ? 'Saving…' : modal.mode === 'create' ? 'Create Repair' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModal.open}
        onClose={confirmModal.close}
        onConfirm={handleDelete}
        onRetry={handleDelete}
        title="Delete Repair"
        message={`Delete "${confirmModal.item?.title}"? This will also remove all related expenses.`}
        confirmLabel="Delete"
        danger
        loading={confirmModal.loading}
        result={confirmModal.result}
      />
    </div>
  );
}
