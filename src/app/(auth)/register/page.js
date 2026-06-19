'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { DEFAULT_COUNTRY } from '@/constants/countryCodes';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function Field({ label, id, error, hint, children }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
  });
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
    setError(null);
  }, []);

  const handleCountryChange = useCallback((c) => {
    setCountry(c);
    setFieldErrors((prev) => ({ ...prev, phone: null }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          country_code: country.dialCode,
          email: form.email || undefined,
          password: form.password,
        }),
      });
      const regData = await regRes.json();

      if (!regRes.ok) {
        if (regData?.errors) setFieldErrors(regData.errors);
        setError(regData?.message);
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          country_code: country.dialCode,
          password: form.password,
        }),
      });
      const loginData = await loginRes.json();
      const challengeId = loginData?.data?.challenge_id;

      if (challengeId) {
        sessionStorage.setItem('last_auth_attempt', JSON.stringify({
          phone: form.phone,
          country_code: country.dialCode,
        }));
        router.push(`/verify-otp?cid=${challengeId}&from=register`);
      } else {
        router.push('/login');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
        <p className="text-gray-500 mt-2">Set up your property workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Field label="Full Name" id="name" error={fieldErrors?.name?.[0]}>
          <input id="name" name="name" type="text" className="input"
            placeholder="John Doe" value={form.name} onChange={handleChange} required />
        </Field>

        <Field label="Phone Number" id="phone" error={fieldErrors?.phone?.[0]} hint="Enter digits after country code">
          <div className="flex">
            <CountryCodePicker
              value={country.iso2}
              onChange={handleCountryChange}
              disabled={loading}
            />
            <input
              id="phone"
              name="phone"
              type="tel"
              className="input rounded-l-none border-l-0 flex-1"
              placeholder="xxxxxxxxx"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>
        </Field>

        <Field label="Email Address (optional)" id="email" error={fieldErrors?.email?.[0]}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input id="email" name="email" type="email" className="input pl-10"
              placeholder="john@example.com" value={form.email} onChange={handleChange} />
          </div>
        </Field>

        <Field label="Password" id="password" error={fieldErrors?.password?.[0]}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'}
              className="input pl-10 pr-10" placeholder="Min. 8 characters"
              value={form.password} onChange={handleChange} required minLength={8} />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </Field>

        <button type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all mt-2"
          style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          disabled={loading}>
          {loading ? <><Spinner /> Setting up account...</> : 'Create account'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
