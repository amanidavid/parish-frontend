'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MaintenanceService from '@/services/MaintenanceService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import useConfirmModal from '@/hooks/useConfirmModal';
import useUiStore from '@/store/uiStore';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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

const EMPTY_EXPENSE = { title: '', description: '', amount: '', expense_date: '' };

export default function MaintenanceJobDetailClient({ uuid }) {
  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);

  const [expenses, setExpenses] = useState([]);
  const [expensesMeta, setExpensesMeta] = useState(null);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesPage, setExpensesPage] = useState(1);

  const [modal, setModal] = useState({ open: false, mode: 'create', expense: null });
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const confirmModal = useConfirmModal();

  // ── Load job ──
  useEffect(() => {
    setJobLoading(true);
    MaintenanceService.jobsShow(uuid).then((res) => {
      setJob(res?.data ?? null);
      setJobLoading(false);
    });
  }, [uuid]);

  // ── Load expenses ──
  const loadExpenses = useCallback(async (pg) => {
    setExpensesLoading(true);
    const res = await MaintenanceService.expensesIndex({
      maintenance_job_uuid: uuid,
      per_page: 15,
      page: pg,
      sort: '-expense_date',
    });
    setExpenses(res?.data?.data ?? res?.data ?? []);
    setExpensesMeta(res?.data?.meta ?? res?.meta ?? null);
    setExpensesLoading(false);
  }, [uuid]);

  useEffect(() => { loadExpenses(1); }, [loadExpenses]);

  // ── Modal helpers ──
  const openCreate = useCallback(() => {
    setForm({ ...EMPTY_EXPENSE, expense_date: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setModal({ open: true, mode: 'create', expense: null });
  }, []);

  const openEdit = useCallback((expense) => {
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

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title?.trim()) errs.title = 'Title is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required';
    if (!form.expense_date) errs.expense_date = 'Date is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const body = { ...form, amount: Number(form.amount), maintenance_job_uuid: uuid };
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
  }, [form, modal, uuid, expensesPage, loadExpenses]);

  const handleDelete = useCallback(async () => {
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

  const handlePage = useCallback((pg) => {
    setExpensesPage(pg);
    loadExpenses(pg);
  }, [loadExpenses]);

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <Link href="/maintenance" className="mt-0.5 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          {jobLoading ? (
            <div className="h-5 bg-gray-200 rounded animate-pulse w-56" />
          ) : (
            <>
              <h1 className="text-base font-bold text-gray-900">{job?.title ?? 'Job Detail'}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {job?.property?.name ? `${job.property.name} · ` : ''}{fmtDate(job?.reported_date)}
              </p>
            </>
          )}
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2">+ Add Expense</button>
      </div>

      {/* Job info card */}
      {!jobLoading && job && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Title</p>
            <p className="text-sm font-semibold text-gray-900">{job.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Property</p>
            <p className="text-sm font-semibold text-gray-900">{job.property?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Reported Date</p>
            <p className="text-sm font-semibold text-gray-900">{fmtDate(job.reported_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-gray-600">{job.description || '—'}</p>
          </div>
        </div>
      )}

      {/* Expenses section */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Expenses</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="table-responsive"><table className="w-full text-sm border-collapse min-w-[500px]">
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
                  <td className="px-4 py-3 text-gray-700 font-semibold">
                    {Number(ex.amount ?? 0).toLocaleString()} {ex.currency ?? ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(ex.expense_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(ex)} className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">Edit</button>
                      <button onClick={() => confirmModal.prompt(ex)} className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {expensesMeta && expensesMeta.last_page > 1 && (
            <Pagination meta={expensesMeta} onPageChange={handlePage} />
          )}
        </div>
      </div>

      {/* Expense Form Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false, mode: 'create', expense: null })}
        title={modal.mode === 'create' ? 'New Expense' : 'Edit Expense'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
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
        onConfirm={handleDelete}
        onRetry={handleDelete}
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
