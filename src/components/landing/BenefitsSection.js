import { LANDING_CONFIG } from '@/constants/landing';
import LandingIcon from './LandingIcon';

export default function BenefitsSection() {
  const { benefits, whyChoose } = LANDING_CONFIG;

  return (
    <section id="benefits" className="relative py-14 sm:py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-100/20 to-blue-100/20 rounded-full blur-3xl opacity-60 -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-primary-100 px-3.5 py-1.5 mb-5 shadow-sm">
            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-primary-700 tracking-wide uppercase">Why Us</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 bg-clip-text text-transparent">
              {whyChoose.headline}
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed">
            {whyChoose.subheadline}
          </p>
        </div>

        {/* Benefits cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-gray-100 bg-white p-7 hover:shadow-xl hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary-500/25">
                <LandingIcon name={benefit.icon} className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
