'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import ClientAuthService from '@/services/ClientAuthService';
import useUiStore from '@/store/uiStore';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { COUNTRY_CODES } from '@/constants/countryCodes';

/* ── Helpers ─────────────────────────────────────────────────────── */
function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  };
}

function joinName(first, last) {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

function stripCountryCode(phone = '', dialCode = '') {
  const p = phone.trim();
  if (dialCode && p.startsWith(dialCode)) {
    return p.slice(dialCode.length);
  }
  return p;
}

function Field({ label, children, error }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const nameParts = splitName(user?.name);

  const initialCountry = useMemo(() => {
    return COUNTRY_CODES.find((c) => c.dialCode === user?.country_code) || COUNTRY_CODES[0];
  }, [user?.country_code]);

  const [country, setCountry] = useState(initialCountry);

  /* ── Profile Form State ─────────────────────────────────────────── */
  const [profile, setProfile] = useState({
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    email: user?.email || '',
    phone: stripCountryCode(user?.phone, initialCountry.dialCode),
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  /* ── Password Form State ────────────────────────────────────────── */
  const [pw, setPw] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const showToast = useCallback((type, message) => {
    useUiStore.getState().showModal({ type, message });
  }, []);

  /* ── Profile Handlers ────────────────────────────────────────────── */
  const onProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    setProfileErrors((e) => ({ ...e, [name]: null }));
  };

  const handleCountryChange = useCallback((c) => {
    setCountry(c);
    setProfileErrors((e) => ({ ...e, phone: null, country_code: null }));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSaving(true);

    try {
      const payload = {
        name: joinName(profile.firstName, profile.lastName),
        email: profile.email.trim(),
        country_code: country.dialCode,
        phone: stripCountryCode(profile.phone, country.dialCode),
      };

      const data = await ClientAuthService.updateProfile(payload);
      if (data?.success) {
        showToast('success', data?.message || 'Profile updated successfully.');
        /* Update local auth store so header reflects changes immediately */
        updateUser({ ...user, ...payload });
      } else {
        if (data?.errors) setProfileErrors(data.errors);
        showToast('error', data?.message || 'Failed to update profile.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  /* ── Password Handlers ──────────────────────────────────────────── */
  const onPwChange = (e) => {
    const { name, value } = e.target;
    setPw((p) => ({ ...p, [name]: value }));
    setPwErrors((e) => ({ ...e, [name]: null }));
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwSaving(true);

    try {
      const data = await ClientAuthService.changePassword(pw);
      if (data?.success) {
        showToast('success', data?.message || 'Password changed successfully.');
        setPw({ current_password: '', password: '', password_confirmation: '' });
      } else {
        if (data?.errors) setPwErrors(data.errors);
        showToast('error', data?.message || 'Failed to change password.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setPwSaving(false);
    }
  };

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
      </div>

      {/* ── Basic Information ────────────────────────────────────────── */}
      <form onSubmit={handleProfileSave} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="First Name" error={profileErrors?.name?.[0]}>
            <input
              name="firstName"
              type="text"
              value={profile.firstName}
              onChange={onProfileChange}
              className="input text-sm"
              placeholder="First name"
              required
            />
          </Field>

          <Field label="Last Name" error={profileErrors?.name?.[0]}>
            <input
              name="lastName"
              type="text"
              value={profile.lastName}
              onChange={onProfileChange}
              className="input text-sm"
              placeholder="Last name"
            />
          </Field>

          <Field label="Email" error={profileErrors?.email?.[0]}>
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={onProfileChange}
              className="input text-sm"
              placeholder="email@example.com"
              required
            />
          </Field>

          <Field label="Phone Number" error={profileErrors?.phone?.[0]}>
            <div className="flex">
              <CountryCodePicker
                value={country.iso2}
                onChange={handleCountryChange}
              />
              <input
                name="phone"
                type="tel"
                value={profile.phone}
                onChange={onProfileChange}
                className="input rounded-l-none border-l-0 text-sm flex-1"
                placeholder="712 345 678"
                required
              />
            </div>
            {profileErrors?.country_code?.[0] && (
              <p className="mt-1 text-xs text-red-600">{profileErrors.country_code[0]}</p>
            )}
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={profileSaving}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {profileSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* ── Change Password ──────────────────────────────────────────── */}
      <form onSubmit={handlePwSave} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Change Password</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Current Password" error={pwErrors?.current_password?.[0]}>
            <input
              name="current_password"
              type="password"
              value={pw.current_password}
              onChange={onPwChange}
              className="input text-sm"
              placeholder="Enter current password"
              required
            />
          </Field>

          <div className="hidden sm:block" />

          <Field label="New Password" error={pwErrors?.password?.[0]}>
            <input
              name="password"
              type="password"
              value={pw.password}
              onChange={onPwChange}
              className="input text-sm"
              placeholder="Enter new password"
              required
            />
          </Field>

          <Field label="Confirm Password" error={pwErrors?.password_confirmation?.[0]}>
            <input
              name="password_confirmation"
              type="password"
              value={pw.password_confirmation}
              onChange={onPwChange}
              className="input text-sm"
              placeholder="Confirm new password"
              required
            />
          </Field>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pwSaving}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {pwSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
