'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { DEFAULT_COUNTRY } from '@/constants/countryCodes';
import useAuthStore from '@/store/authStore';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('phone');
  const [form, setForm] = useState({ phone: '', email: '', password: '' });
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: null }));
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

    const payload = mode === 'phone'
      ? { phone: form.phone, country_code: country.dialCode, password: form.password }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const authErrors = data?.errors?.auth;
        if (authErrors?.length) {
          setError(authErrors[0]);
        } else if (data?.errors) {
          setFieldErrors(data.errors);
          setError(data?.message);
        } else {
          setError(data?.message);
        }
        return;
      }
      const { user, tenant, tenants, services } = data?.data || {};
      if (user) {
        const tenantUuid = tenant?.tenant_uuid || tenants?.[0]?.tenant_uuid || null;
        /* Use backend services if available; otherwise fall back to DEMO_SERVICES for testing */
        const DEMO_SERVICES = [
          { id: 'properties', label: 'Property Management', active: true },
          /* { id: 'lodge', label: 'Lodge Management', active: true }, */
          /* { id: 'restaurant', label: 'Restaurant POS', active: true }, */
        ];
        const userServices = services?.length > 0 ? services : DEMO_SERVICES;
        /* Demo: toggle between 'full' and 'limited' to test both views */
        const DEMO_SCOPE = 'full'; // change to 'limited' to test restricted view
        const DEMO_ASSIGNMENTS = DEMO_SCOPE === 'limited'
          ? { properties: ['prop-001', 'prop-002'] }
          : {};
        const scopedServices = DEMO_SCOPE === 'limited'
          ? userServices.filter((s) => Object.keys(DEMO_ASSIGNMENTS).includes(s.id))
          : userServices;
        setAuth(user, tenantUuid, scopedServices, DEMO_SCOPE, DEMO_ASSIGNMENTS);
        /* Live version: always land on properties page */
        router.push('/properties');
      } else {
        setError(data?.message || 'Unexpected response');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 mt-2">Sign in to your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

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
                id="phone" name="phone" type="tel"
                className="input rounded-l-none border-l-0 flex-1"
                placeholder="xxxxxxxxx"
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
                id="email" name="email" type="email"
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

        <div>
          <label className="label mb-1" htmlFor="password">Password</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input id="password" name="password" type={showPassword ? 'text' : 'password'}
              className="input pl-10 pr-10" placeholder="••••••••"
              value={form.password} onChange={handleChange} required minLength={6} />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
          {fieldErrors?.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>}
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
          </div>
        </div>

        <button type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white transition-all"
          style={{ background: loading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          disabled={loading}>
          {loading ? <><Spinner /> Signing in...</> : 'Sign in'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">Create account</Link>
        </p>
      </form>
    </div>
  );
}
