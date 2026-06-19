'use client';
import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';

/* Build nav groups — only global workspace items */
function buildNavGroups() {
  return [
    {
      group: 'Workspace',
      items: [
        {
          href: '/staff',
          label: 'Staff',
          permission: 'staff.manage',
          icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        },
        {
          href: '/subscription',
          label: 'Subscription',
          icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
        },
        {
          href: '/access-control',
          label: 'Access Control',
          permission: 'roles.manage',
          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        },
      ],
    },
  ];
}

function NavIcon({ d }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {d.split(' M').map((segment, i) => (
        <path
          key={i}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d={i === 0 ? segment : 'M' + segment}
        />
      ))}
    </svg>
  );
}

function NavItem({ item, active, open }) {
  return (
    <Link
      href={item.href}
      title={!open ? item.label : undefined}
      className={[
        'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg mb-0.5 transition-all duration-150 group',
        active
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
      ].join(' ')}
    >
      <span className={active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}>
        <NavIcon d={item.icon} />
      </span>
      {open && (
        <span className={`text-sm font-medium whitespace-nowrap flex-1 ${active ? 'text-primary-700' : 'text-gray-600 group-hover:text-gray-900'
          }`}>
          {item.label}
        </span>
      )}
      {open && active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
      )}
    </Link>
  );
}

export default function Sidebar({ open }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const permissions = useAuthStore((s) => s.permissions);

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { });
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  /* Filter nav groups based on permissions */
  const hasPermission = useCallback((name) => {
    return permissions.some((p) => p.name === name);
  }, [permissions]);

  const visibleGroups = useMemo(() => {
    const groups = buildNavGroups();
    return groups.map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
    })).filter((section) => section.items.length > 0);
  }, [hasPermission]);

  return (
    <aside
      className={[
        'flex flex-col bg-white border-r border-gray-200 h-full transition-all duration-300 shrink-0',
        'fixed inset-y-0 left-0 z-40',
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        'md:relative md:inset-auto md:z-auto md:translate-x-0 md:shadow-none',
      ].join(' ')}
      style={{ width: open ? '240px' : '68px' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-100 h-16 shrink-0 ${open ? 'px-5 gap-3' : 'px-0 justify-center'
        }`}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        {open && (
          <span className="font-bold text-gray-900 text-[15px] whitespace-nowrap tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME || 'ZABA'}
          </span>
        )}
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-3">
        {visibleGroups.map((section) => (
          <div key={section.group} className="mb-4">
            {open && (
              <p className="px-5 mb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {section.group}
              </p>
            )}
            {!open && section.group !== 'Main' && (
              <div className="mx-4 border-t border-gray-100 mb-2" />
            )}
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                open={open}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom logout */}
      <div className="shrink-0 border-t border-gray-100 p-2">
        <button
          onClick={handleLogout}
          title={!open ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors group ${!open ? 'justify-center' : ''
            }`}
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {open && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
