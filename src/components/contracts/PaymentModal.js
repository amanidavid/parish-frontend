'use client';
import { useState } from 'react';
import ContractService from '@/services/ContractService';
import Modal from '@/components/ui/Modal';

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
    </svg>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function PaymentModal({ open, onClose, onSaved, contract }) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSaving(true);
    try {
      const data = await ContractService.recordPayment(contract.uuid, {
        amount_paid: amount !== '' ? parseFloat(amount) : 0,
        payment_date: paymentDate || undefined,
        notes: notes || undefined,
      });
      if (data?.success) {
        onSaved(data.data, data?.message);
        // reset
        setAmount('');
        setPaymentDate('');
        setNotes('');
        onClose();
      } else {
        if (data?.errors) setErrors(data.errors);
        setServerError(data?.message || 'Failed to record payment.');
      }
    } catch {
      setServerError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Contract summary */}
        {contract && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-1">
            <p className="text-xs text-gray-500">Contract</p>
            <p className="text-sm font-semibold text-gray-900">{contract.contract_number}</p>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Outstanding</span>
              <span className="font-medium text-gray-900">
                {contract.outstanding_balance != null
                  ? `${contract.currency || 'TZS'} ${Number(contract.outstanding_balance).toLocaleString()}`
                  : '—'}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="label">Amount Paid <span className="text-red-500">*</span></label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input text-sm"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
          <FieldError message={errors?.amount_paid?.[0]} />
        </div>

        <div>
          <label className="label">Payment Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className="input text-sm appearance-none min-h-[2.5rem]"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <FieldError message={errors?.payment_date?.[0]} />
        </div>

        <div>
          <label className="label">Notes <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
          <textarea
            className="input text-sm resize-none"
            rows={2}
            placeholder="Payment notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <FieldError message={errors?.notes?.[0]} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary text-sm" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving && <Spinner />}
            Record Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
