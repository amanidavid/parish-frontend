'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { DEFAULT_COUNTRY } from '@/constants/countryCodes';
import { OTP_RESEND_SECONDS } from '@/constants/auth';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [mode, setMode] = useState('phone');
  const [challengeId, setChallengeId] = useState('');

  const [form, setForm] = useState({
    phone: '',
    email: '',
    code: '',
    password: '',
    password_confirmation: '',
  });
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [canRequestAgain, setCanRequestAgain] = useState(false);

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
    setError(null);
  }, []);

  const handleCountryChange = useCallback((c) => {
    setCountry(c);
    setFieldErrors((prev) => ({ ...prev, phone: null }));
  }, []);

  useEffect(() => {
    if (resetCooldown <= 0) { setCanRequestAgain(true); return; }
    const t = setTimeout(() => setResetCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCooldown]);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const payload =
      mode === 'phone'
        ? { country_code: country.dialCode, phone: form.phone.trim() }
        : { email: form.email.trim() };

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        const authErrors = data?.errors?.auth;
        if (authErrors?.length) {
          setError(authErrors[0]);
        } else if (data?.errors) {
          setFieldErrors(data.errors);
          setError(data?.message || 'Failed to send OTP');
        } else {
          setError(data?.message || 'Failed to send OTP');
        }
        return;
      }

      const cid = data?.data?.challenge_id;
      if (cid) {
        setChallengeId(cid);
        setStep('reset');
        setResetCooldown(OTP_RESEND_SECONDS);
        setCanRequestAgain(false);
        setSuccessMessage(data?.message || 'OTP sent');
      } else {
        // Account not found — backend returns success with null data
        setSuccessMessage(data?.message || 'If the account exists, an OTP has been sent');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    if (form.password !== form.password_confirmation) {
      setFieldErrors({ password_confirmation: ['Passwords do not match'] });
      setLoading(false);
      return;
    }

    const payload = {
      challenge_id: challengeId,
      code: form.code.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
    };

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        if (data?.errors) setFieldErrors(data.errors);
        setError(data?.message || 'Failed to reset password');
        return;
      }

      setSuccessMessage(data?.message || 'Password reset successful');
      setTimeout(() => router.push('/login'), 1500);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Forgot password?</h2>
        <p className="text-gray-500 mt-2">
          {step === 'request'
            ? 'Request a reset OTP for your workspace account'
            : 'Enter the OTP and set a new password'}
        </p>
      </div>

      {/* Alert banners */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5">
          <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-5">
          <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequest} className="space-y-5">
          {/* Mode toggle */}
          <div className="bg-gray-50 rounded-xl p-1 flex gap-1">
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'phone'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </button>
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'email'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          </div>

          {mode === 'phone' ? (
            <div>
              <label className="label" htmlFor="phone">Phone Number</label>
              <div className="flex">
                <CountryCodePicker value={country.iso2} onChange={handleCountryChange} disabled={loading} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input rounded-l-none border-l-0 flex-1"
                  placeholder="712 345 678"
                  value={form.phone}
                  onChange={handleChange}
                  required={mode === 'phone'}
                />
              </div>
              {fieldErrors?.phone && <p className="mt-1 text-xs text-red-600">{fieldErrors.phone[0]}</p>}
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required={mode === 'email'}
                />
              </div>
              {fieldErrors?.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all"
            style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            disabled={loading}
          >
            {loading ? <><Spinner /> Sending OTP...</> : 'Send OTP'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="text-blue-600 font-semibold hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-5">
          {/* OTP */}
          <div>
            <label className="label" htmlFor="code">OTP Code</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="input pl-10 tracking-widest"
                placeholder="000000"
                value={form.code}
                onChange={handleChange}
                required
                maxLength={6}
              />
            </div>
            {fieldErrors?.code && <p className="mt-1 text-xs text-red-600">{fieldErrors.code[0]}</p>}
            {fieldErrors?.otp && <p className="mt-1 text-xs text-red-600">{fieldErrors.otp[0]}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="label" htmlFor="password">New Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
            {fieldErrors?.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label" htmlFor="password_confirmation">Confirm Password</label>
            <div className="relative">
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showConfirm ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={form.password_confirmation}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
            {fieldErrors?.password_confirmation && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password_confirmation[0]}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all"
            style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            disabled={loading}
          >
            {loading ? <><Spinner /> Resetting...</> : 'Reset Password'}
          </button>

          <p className="text-center text-sm text-gray-500">
            {!canRequestAgain ? (
              <span className="text-gray-400">Resend OTP in {resetCooldown}s</span>
            ) : (
              <>
                Didn&apos;t receive the code?{' '}
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Request again
                </button>
              </>
            )}
          </p>
        </form>
      )}
    </div>
  );
}
