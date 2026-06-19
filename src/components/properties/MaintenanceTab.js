'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MaintenanceService from '@/services/MaintenanceService';
import FloorService from '@/services/FloorService';
import UnitService from '@/services/UnitService';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
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

const EMPTY_FORM = { property_floor_uuid: '', unit_uuid: '', title: '', description: '', reported_date: '' };

export default function MaintenanceTab({ propertyUuid }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const [modal, setModal] = useState({ open: false, mode: 'create', job: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const confirmModal = useConfirmModal();

  const loadJobs = useCallback(async (pg) => {
    setLoading(true);
    try {
      const res = await MaintenanceService.jobsIndex({
        property_uuid: propertyUuid,
        per_page: 15,
        page: pg,
        sort: '-reported_date',
      });
      if (res?.success) {
        setJobs(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        setMeta(res.data?.meta || res.meta || null);
      }
    } catch {
      useUiStore.getState().showModal({ type: 'error', message: 'Failed to load maintenance jobs' });
    } finally {
      setLoading(false);
    }
  }, [propertyUuid]);

  useEffect(() => { loadJobs(1); }, [loadJobs]);

  // Load floors for this property
  useEffect(() => {
    FloorService.listAll(propertyUuid).then((res) => {
      setFloors(res?.data?.data ?? res?.data ?? []);
    });
  }, [propertyUuid]);

  // Load units when floor changes
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
    setModal({ open: true, mode: 'create', job: null });
  }, []);

  const openEdit = useCallback((job) => {
    const floorUuid = job.property_floor?.uuid || '';
    const unitUuid = job.unit?.uuid || '';
    setForm({
      property_floor_uuid: floorUuid,
      unit_uuid: unitUuid,
      title: job.title || '',
      description: job.description || '',
      reported_date: job.reported_date || '',
    });
    setErrors({});
    setModal({ open: true, mode: 'edit', job });
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
      : await MaintenanceService.jobsUpdate(modal.job.uuid, body);
    setSubmitting(false);
    if (res?.success) {
      setModal({ open: false, mode: 'create', job: null });
      loadJobs(page);
      useUiStore.getState().showModal({
        type: 'success',
        message: res?.message || (modal.mode === 'create' ? 'Job created successfully.' : 'Job updated successfully.'),
      });
    } else {
      setErrors(res?.errors ?? { title: res?.message ?? 'Something went wrong' });
      useUiStore.getState().showModal({
        type: 'error',
        message: res?.message || (modal.mode === 'create' ? 'Failed to create job.' : 'Failed to update job.'),
      });
    }
  }, [form, modal, propertyUuid, page, loadJobs]);

  const handleDelete = useCallback(async () => {
    const res = await confirmModal.execute(
      (job) => MaintenanceService.jobsDestroy(job.uuid, { showLoader: false }),
      { successMessage: 'Job deleted successfully.', errorMessage: 'Failed to delete job.' }
    );
    if (res?.success) {
      loadJobs(page);
      useUiStore.getState().showModal({ type: 'success', message: 'Job deleted successfully.' });
    } else {
      useUiStore.getState().showModal({ type: 'error', message: res?.message || 'Failed to delete job.' });
    }
  }, [confirmModal, page, loadJobs]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">Maintenance jobs for this property</p>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="btn-primary text-xs px-3 py-1.5">+ New Job</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="table-responsive">
          <table className="w-full text-sm border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reported</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-40" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-24" /></td>
                  <td className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse w-12 ml-auto" /></td>
                </tr>
              ))}
              {!loading && jobs.length === 0 && (
                <tr><td colSpan={3} className="text-center py-12 text-gray-400 text-sm">No maintenance jobs found</td></tr>
              )}
              {!loading && jobs.map((job) => (
                <tr key={job.uuid} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{job.title}</p>
                    {job.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{job.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(job.reported_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/maintenance/${job.uuid}?return_to=${encodeURIComponent(`/properties/${propertyUuid}?tab=maintenance`)}`}
                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                      >
                        View
                      </Link>
                      <button onClick={() => openEdit(job)} className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">Edit</button>
                      <button onClick={() => confirmModal.prompt(job)} className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => { setPage(page - 1); loadJobs(page - 1); }}
              disabled={page <= 1}
              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">Page {page} of {meta.last_page}</span>
            <button
              onClick={() => { setPage(page + 1); loadJobs(page + 1); }}
              disabled={page >= meta.last_page}
              className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={() => { if (!submitting) setModal({ open: false, mode: 'create', job: null }); }}
        title={modal.mode === 'create' ? 'New Maintenance Job' : 'Edit Maintenance Job'} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Property">
            <input type="text" value="Current Property" disabled
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed" />
          </FormField>
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
