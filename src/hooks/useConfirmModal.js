import { useState, useCallback } from 'react';

export default function useConfirmModal() {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  /** Open the modal with the item to act upon */
  const prompt = useCallback((selectedItem) => {
    setItem(selectedItem);
    setResult(null);
    setLoading(false);
    setOpen(true);
  }, []);

  /** Close and reset all state */
  const close = useCallback(() => {
    setOpen(false);
    setResult(null);
    setItem(null);
  }, []);

  /**
   * Run an async action while automatically managing loading + result states.
   * @param {Function} asyncFn - async function receiving (item) => Promise<res>
   * @param {Object} options - { successMessage, errorMessage }
   * @returns {Promise<Object|null>} the raw response or null on catch
   */
  const execute = useCallback(async (asyncFn, options = {}) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await asyncFn(item);
      const success = res?.success ?? true;
      if (success) {
        setResult({ type: 'success', message: options.successMessage || 'Action completed successfully.' });
      } else {
        setResult({ type: 'error', message: res?.message || options.errorMessage || 'Action failed.' });
      }
      return res;
    } catch (err) {
      setResult({ type: 'error', message: err?.message || options.errorMessage || 'Network error.' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [item]);

  return { open, item, loading, result, prompt, close, execute };
}
