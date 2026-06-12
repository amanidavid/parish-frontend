'use client';
import { useState } from 'react';
import { useEmployeeContracts, useCreateContract, useDeleteContract } from '@/hooks/useEmployees';
import useUiStore from '@/store/uiStore';

export default function ContractsTab({ uuid, canManage }) {
  const { data, isLoading } = useEmployeeContracts(uuid);
  const contracts = data?.data || [];
  const createContract = useCreateContract();
  const deleteContract = useDeleteContract();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ contract_type: '', start_date: '', end_date: '', status: 'active', terms: '' });

  const handleSave = async () => {
    createContract.mutate(
      { uuid, data: form },
      {
        onSuccess: () => {
          setAdding(false);
          setForm({ contract_type: '', start_date: '', end_date: '', status: 'active', terms: '' });
          useUiStore.getState().showModal({ type: 'success', message: 'Contract added.' });
        },
        onError: (err) => {
          useUiStore.getState().showModal({ type: 'error', message: err?.message || 'Failed to add contract.' });
        },
      }
    );
  };

  const handleDelete = async (cUuid) => {
    if (!confirm('Delete this contract?')) return;
    deleteContract.mutate(
      { uuid, contractUuid: cUuid },
      {
        onSuccess: () => useUiStore.getState().showModal({ type: 'success', message: 'Contract deleted.' }),
        onError: () => useUiStore.getState().showModal({ type: 'error', message: 'Failed to delete contract.' }),
      }
    );
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex justify-end">
          {!adding ? (
            <button onClick={() => setAdding(true)} className="btn-primary text-sm">Add Contract</button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4 w-full space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input className="input text-xs" placeholder="Contract Type" value={form.contract_type} onChange={(e) => setForm((p) => ({ ...p, contract_type: e.target.value }))} />
                <input className="input text-xs" type="date" placeholder="Start Date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
                <input className="input text-xs" type="date" placeholder="End Date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
                <select className="input text-xs" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
                <input className="input text-xs" placeholder="Terms" value={form.terms} onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setAdding(false)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={handleSave} disabled={createContract.isPending} className="btn-primary text-xs">{createContract.isPending ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Terms</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">Loading…</td></tr>
              ) : contracts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-sm text-gray-400">No contracts.</td></tr>
              ) : contracts.map((c) => (
                <tr key={c.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-600">{c.contract_type}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{c.start_date || '—'}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{c.end_date || '—'}</td>
                  <td className="px-5 py-3 text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${c.status === 'active' ? 'bg-green-50 text-green-700' : c.status === 'expired' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 truncate max-w-[200px]">{c.terms || '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {canManage && <button onClick={() => handleDelete(c.uuid)} className="text-xs text-red-500 hover:text-red-700">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
