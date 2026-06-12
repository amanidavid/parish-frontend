'use client';
import { useState } from 'react';
import { useEmployeeDocuments, useCreateDocument, useDeleteDocument } from '@/hooks/useEmployees';
import useUiStore from '@/store/uiStore';

export default function DocumentsTab({ uuid, canManage }) {
  const { data, isLoading } = useEmployeeDocuments(uuid);
  const docs = data?.data || [];
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ document_type: '', title: '', storage_disk: 'public', storage_path: '', mime_type: '', file_size: 0 });

  const handleSave = async () => {
    createDocument.mutate(
      { uuid, data: form },
      {
        onSuccess: () => {
          setAdding(false);
          setForm({ document_type: '', title: '', storage_disk: 'public', storage_path: '', mime_type: '', file_size: 0 });
          useUiStore.getState().showModal({ type: 'success', message: 'Document added.' });
        },
        onError: (err) => {
          useUiStore.getState().showModal({ type: 'error', message: err?.message || 'Failed to add document.' });
        },
      }
    );
  };

  const handleDelete = async (docUuid) => {
    if (!confirm('Delete this document?')) return;
    deleteDocument.mutate(
      { uuid, docUuid },
      {
        onSuccess: () => useUiStore.getState().showModal({ type: 'success', message: 'Document deleted.' }),
        onError: () => useUiStore.getState().showModal({ type: 'error', message: 'Failed to delete document.' }),
      }
    );
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex justify-end">
          {!adding ? (
            <button onClick={() => setAdding(true)} className="btn-primary text-sm">Add Document</button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4 w-full space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input className="input text-xs" placeholder="Document Type" value={form.document_type} onChange={(e) => setForm((p) => ({ ...p, document_type: e.target.value }))} />
                <input className="input text-xs" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                <input className="input text-xs" placeholder="Storage Path" value={form.storage_path} onChange={(e) => setForm((p) => ({ ...p, storage_path: e.target.value }))} />
                <input className="input text-xs" placeholder="MIME Type" value={form.mime_type} onChange={(e) => setForm((p) => ({ ...p, mime_type: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setAdding(false)} className="btn-secondary text-xs">Cancel</button>
                <button onClick={handleSave} disabled={createDocument.isPending} className="btn-primary text-xs">{createDocument.isPending ? 'Saving…' : 'Save'}</button>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Path</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MIME</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">Loading…</td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No documents.</td></tr>
              ) : docs.map((d) => (
                <tr key={d.uuid} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-600">{d.document_type}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{d.title}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 font-mono truncate max-w-[200px]">{d.storage_path}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{d.mime_type}</td>
                  <td className="px-5 py-3 text-right">
                    {canManage && <button onClick={() => handleDelete(d.uuid)} className="text-xs text-red-500 hover:text-red-700">Delete</button>}
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
