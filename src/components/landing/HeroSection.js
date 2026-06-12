import Link from 'next/link';
import { LANDING_CONFIG } from '@/constants/landing';
import LandingIcon from './LandingIcon';

/* Dashboard mockup component — purely CSS, no images */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

      {/* Main card */}
      <div className="relative bg-white rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-200/50 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <div className="inline-block px-3 py-1 rounded-md bg-white border border-gray-200 text-[10px] text-gray-400 font-mono">
              dashboard.zaba.app
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Properties', value: '24', color: 'bg-blue-50 text-blue-600' },
              { label: 'Occupied', value: '18', color: 'bg-green-50 text-green-600' },
              { label: 'Revenue', value: '8.2M', color: 'bg-primary-50 text-primary-600' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-100 p-3 bg-white">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
                <div className={`mt-1.5 h-1 rounded-full ${stat.color.split(' ')[0]}`}>
                  <div className={`h-full rounded-full ${stat.color.split(' ')[1].replace('text', 'bg')} opacity-60 w-3/4`} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-700">Monthly Revenue</span>
              <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">+12.5%</span>
            </div>
            <div className="flex items-end gap-1.5 h-16">
              {[40, 55, 45, 70, 60, 85, 75, 90, 65, 80, 95, 88].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-primary-500 to-primary-300 opacity-80" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                <span key={i} className="text-[8px] text-gray-300">{m}</span>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Recent Activity</p>
            <div className="space-y-2.5">
              {[
                { title: 'New tenant registered', time: '2m ago', icon: 'user' },
                { title: 'Maintenance request #1042', time: '15m ago', icon: 'wrench' },
                { title: 'Rent payment received', time: '1h ago', icon: 'check' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    {item.icon === 'user' && (
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    )}
                    {item.icon === 'wrench' && (
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    )}
                    {item.icon === 'check' && (
                      <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{item.title}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating badge — Revenue */}
      <div className="absolute -top-4 -right-4 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/40 p-3 animate-bounce" style={{ animationDuration: '3s' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">This Month</p>
            <p className="text-sm font-bold text-gray-900">TZS 8.2M</p>
          </div>
        </div>
      </div>

      {/* Floating badge — Users */}
      <div className="absolute -bottom-3 -left-3 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/40 p-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {['bg-blue-400', 'bg-purple-400', 'bg-green-400'].map((color, i) => (
              <div key={i} className={`w-7 h-7 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                {['JD', 'MK', 'AL'][i]}
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Active Staff</p>
            <p className="text-sm font-bold text-gray-900">18 Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Avatar stack for social proof */
function AvatarStack({ count = 5 }) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500'];
  return (
    <div className="flex -space-x-2">
      {colors.slice(0, count).map((color, i) => (
        <div key={i} className={`w-8 h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold`}>
          {String.fromCharCode(65 + i)}{String.fromCharCode(68 + i)}
        </div>
      ))}
    </div>
  );
}

export default function HeroSection() {
  const { hero, brand } = LANDING_CONFIG;

  return (
    <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-white to-blue-50/60" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-gradient-to-r from-primary-200/30 to-blue-200/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-100/40 to-purple-100/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-100/20 to-primary-100/15 rounded-full blur-3xl opacity-40" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")` }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-primary-100 px-3.5 py-1.5 mb-6 shadow-sm shadow-primary-100/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              <span className="text-xs font-semibold text-primary-700 tracking-wide uppercase">
                {brand.tagline}
              </span>
            </div>

            {/* Headline with gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]">
              <span className="bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 bg-clip-text text-transparent">
                {hero.headline}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-lg sm:text-xl text-gray-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3">
              <Link
                href={hero.ctaPrimary.href}
                className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-0.5"
              >
                {hero.ctaPrimary.label}
                <LandingIcon name="arrowRight" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href={hero.ctaSecondary.href}
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 transition-all"
              >
                {hero.ctaSecondary.label}
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
              <AvatarStack count={5} />
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-sm font-semibold text-gray-700 ml-1">4.9</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Trusted by 9000+ businesses across 4 countries</p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-gray-400">
              {[
                { label: 'Free to start', icon: 'check' },
                { label: 'No credit card', icon: 'check' },
                { label: 'Cloud-based', icon: 'check' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
