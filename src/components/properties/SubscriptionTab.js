'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import SubscriptionService from '@/services/SubscriptionService';
import Pagination from '@/components/ui/Pagination';

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
    </svg>
  );
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtAmt(amount, currency = 'TZS') {
  if (amount === null || amount === undefined) return '—';
  const n = Number(amount);
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/* ------------------------------------------------------------------ */
function SubscriptionTab({ propertyUuid }) {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentMeta, setPaymentMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -- Fetch cost-breakdown for this property -- */
  const loadSubscription = useCallback(async () => {
    if (!propertyUuid) { setData(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await SubscriptionService.propertyCostBreakdown(propertyUuid);
      if (res?.success) {
        setData(res.data || null);
      } else {
        setError(res?.message || 'Failed to load subscription data');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [propertyUuid]);

  /* -- Fetch payment history -- */
  const loadPayments = useCallback(async (pg) => {
    if (!propertyUuid) { setPayments([]); setPaymentMeta(null); setPayLoading(false); return; }
    setPayLoading(true);
    try {
      const res = await SubscriptionService.propertyPayments(propertyUuid, {
        sort: '-payment_date',
        page: pg,
        perPage: 15,
      });
      if (res?.success) {
        setPayments(res.data?.data || res.data || []);
        setPaymentMeta(res.meta || null);
      }
    } catch {
      // silently fail for payments — main error shown for subscription
    } finally {
      setPayLoading(false);
    }
  }, [propertyUuid]);

  useEffect(() => { loadSubscription(); }, [loadSubscription]);
  useEffect(() => { loadPayments(page); }, [loadPayments, page]);

  /* -- Read directly from API response (grouped OR flat) -- */
  const hasGrouped = !!data?.summary_cards;
  const summary = hasGrouped ? (data.summary_cards || {}) : (data || {});
  const details = hasGrouped ? (data.subscription_details || {}) : (data || {});
  const paymentState = data?.payment_state || {};

  const subscriptionStatus = summary.subscription_status || '—';
  const currentPeriod =
    summary.current_period ||
    data?.current_period_label ||
    (data?.current_period_starts_on ? `${fmtDate(data.current_period_starts_on)} – ${fmtDate(data.current_period_ends_on)}` : '—');
  const totalPaidCents = summary.total_paid_amount_cents;
  const paymentsCount = summary.payments_count ?? 0;
  const monthlyPriceCents = summary.monthly_price_cents;
  const currency = summary.currency || 'TZS';

  const billingInterval = details.billing_interval || '—';
  const unitRange = details.unit_range || '—';
  const activatedOn = fmtDate(details.activated_on);
  const lastPaidOn = fmtDate(details.last_paid_on);
  const expiredOn = fmtDate(details.expired_on);
  const isExpiredOrInactive = subscriptionStatus === 'expired' || subscriptionStatus === 'inactive';

  /* -- Next billing cycle preview (usage / unit-band changes) -- */
  const billingPreview = data?.next_billing_preview || null;
  const priceChangeCents = billingPreview?.price_change_cents ?? 0;
  const hasPriceChange = !!billingPreview?.has_price_change;
  const isIncrease = hasPriceChange && priceChangeCents > 0;
  const isDecrease = hasPriceChange && priceChangeCents < 0;
  const unitsExceedRule = !!billingPreview?.units_exceed_current_rule;
  const previewCurrency = billingPreview?.currency || currency;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm gap-2">
        <Spinner /> Loading subscription...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <p className="text-sm text-rose-700 font-semibold">{error}</p>
        <button onClick={loadSubscription} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Retry
        </button>
      </div>
    );
  }

  const isActive = paymentState.can_operate_today && !paymentState.payment_required_now;
  const needsPayment = paymentState.payment_required_now;

  return (
    <div className="space-y-6">
      {/* ===== Hero Status Banner ===== */}
      {(isActive || needsPayment) && (
        <div className={`relative overflow-hidden rounded-2xl ring-1 shadow-sm ${needsPayment
          ? 'bg-gradient-to-br from-rose-50 via-white to-rose-50/40 ring-rose-200/70'
          : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50/40 ring-emerald-200/70'
          }`}>
          <div className={`absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-30 ${needsPayment ? 'bg-rose-300' : 'bg-emerald-300'}`} />
          <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ring-1 ${needsPayment ? 'bg-rose-500 text-white ring-rose-400/50' : 'bg-emerald-500 text-white ring-emerald-400/50'
                }`}>
                {needsPayment ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`text-base font-bold ${needsPayment ? 'text-rose-900' : 'text-emerald-900'}`}>
                    {needsPayment ? 'Payment Required' : 'Subscription Active'}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${needsPayment ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${needsPayment ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                    {needsPayment ? 'Action needed' : 'Operational'}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${needsPayment ? 'text-rose-700/90' : 'text-emerald-700/90'}`}>
                  {needsPayment
                    ? (paymentState.payment_required_reason || 'Property subscription has expired.')
                    : 'This property is fully operational and all features are unlocked.'}
                </p>
                {currentPeriod !== '—' && (
                  <p className="text-xs text-gray-500 mt-1.5">Current period · <span className="font-medium text-gray-700">{currentPeriod}</span></p>
                )}
              </div>
            </div>

            {/* Price + due block */}
            <div className={`shrink-0 sm:text-right sm:border-l sm:pl-5 ${needsPayment ? 'sm:border-rose-200/70' : 'sm:border-emerald-200/70'}`}>
              {monthlyPriceCents != null && (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Monthly</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{fmtAmt(monthlyPriceCents, currency)}</p>
                </>
              )}
              {paymentState.payment_due_on && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/70 ring-1 ring-black/5 text-gray-600">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {needsPayment ? 'Due' : 'Next due'} {fmtDate(paymentState.payment_due_on)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Next Billing Preview ===== */}
      {billingPreview && (
        <div className={`overflow-hidden rounded-2xl ring-1 shadow-sm ${isIncrease ? 'ring-amber-200/70 bg-gradient-to-br from-amber-50/60 to-white'
          : isDecrease ? 'ring-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-white'
            : 'ring-gray-200/70 bg-white'
          }`}>
          <div className="px-6 pt-5 pb-4 flex items-start gap-3">
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${isIncrease ? 'bg-amber-100 text-amber-600 ring-amber-200'
              : isDecrease ? 'bg-emerald-100 text-emerald-600 ring-emerald-200'
                : 'bg-gray-100 text-gray-500 ring-gray-200'
              }`}>
              {isIncrease ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              ) : isDecrease ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">
                  {isIncrease ? 'Next Payment Will Increase'
                    : isDecrease ? 'Next Payment Will Reduce'
                      : 'Next Payment Unchanged'}
                </h3>
                {unitsExceedRule && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    New unit band
                  </span>
                )}
              </div>
              {billingPreview.message && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{billingPreview.message}</p>
              )}
            </div>
          </div>

          {/* Price comparison strip */}
          <div className="px-6 pb-5">
            <div className="rounded-xl bg-white ring-1 ring-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Current</p>
                  <p className="text-lg font-bold text-gray-700 tabular-nums">{fmtAmt(billingPreview.current_monthly_price_cents, previewCurrency)}</p>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Projected</p>
                  <p className={`text-lg font-bold tabular-nums ${isIncrease ? 'text-amber-600' : isDecrease ? 'text-emerald-600' : 'text-gray-900'}`}>{fmtAmt(billingPreview.projected_monthly_price_cents, previewCurrency)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasPriceChange && priceChangeCents !== 0 && (
                  <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg tabular-nums ${isIncrease ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {priceChangeCents > 0 ? '+' : '−'}{fmtAmt(Math.abs(priceChangeCents), previewCurrency)}
                  </span>
                )}
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Effective</p>
                  <p className="text-sm font-semibold text-gray-800">{fmtDate(billingPreview.payment_due_on)}</p>
                </div>
              </div>
            </div>

            {(billingPreview.current_billing_rule || billingPreview.projected_billing_rule || billingPreview.current_registered_units_total != null) && (
              <div className="flex items-center gap-2 mt-3 text-xs flex-wrap">
                {billingPreview.current_billing_rule && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 ring-1 ring-gray-100 text-gray-500">
                    Current band <span className="font-semibold text-gray-700">{billingPreview.current_billing_rule.range_start}–{billingPreview.current_billing_rule.range_end}</span>
                  </span>
                )}
                {billingPreview.projected_billing_rule && (
                  <>
                    <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 ring-1 ring-amber-100 text-amber-700">
                      Next band <span className="font-semibold">{billingPreview.projected_billing_rule.range_start}–{billingPreview.projected_billing_rule.range_end}</span>
                    </span>
                  </>
                )}
                {billingPreview.current_registered_units_total != null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 ring-1 ring-gray-100 text-gray-500 ml-auto">
                    Registered units <span className="font-semibold text-gray-700">{billingPreview.current_registered_units_total}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Payment History ===== */}
      <div className="bg-white ring-1 ring-gray-200/70 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Payment History</h3>
          </div>
          {payments.length > 0 && (
            <span className="text-xs text-gray-500">
              Latest <span className="font-semibold text-gray-700">{fmtDate(payments[0].payment_date)}</span>
            </span>
          )}
        </div>

        {payLoading ? (
          <div className="flex items-center justify-center py-14 text-gray-400 text-sm gap-2">
            <Spinner /> Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 ring-1 ring-gray-100 text-gray-300 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <p className="text-sm text-gray-600 font-semibold">No payments yet</p>
            <p className="text-xs text-gray-400 mt-1">Payments will appear here once made.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit Range</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Last Paid On</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Coverage</th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Months</th>
                    <th className="text-right px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p.uuid} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-xs">{unitRange}</span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600">{lastPaidOn}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-gray-500 text-xs">
                          {fmtDate(p.coverage_starts_on)}
                          <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          {fmtDate(p.coverage_ends_on)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 tabular-nums">{p.months_paid || 0}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-gray-900 tabular-nums">
                        {fmtAmt(p.total_amount_cents, p.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paymentMeta && (paymentMeta.last_page > 1 || paymentMeta.total > 15) && (
              <div className="px-6 py-3 border-t border-gray-100">
                <Pagination
                  currentPage={paymentMeta.current_page || page}
                  lastPage={paymentMeta.last_page || 1}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default memo(SubscriptionTab);
