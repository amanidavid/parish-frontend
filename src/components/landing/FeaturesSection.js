import { LANDING_CONFIG } from '@/constants/landing';
import LandingIcon from './LandingIcon';

export default function FeaturesSection() {
  const { features } = LANDING_CONFIG;

  return (
    <section id="features" className="relative py-14 sm:py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-gray-50/50 to-white" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-100/20 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-3xl opacity-40 -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3.5 py-1.5 mb-5">
            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-semibold text-primary-700 tracking-wide uppercase">Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 bg-clip-text text-transparent">
              One Platform
            </span>
            <br />
            <span className="text-gray-400 font-medium">Complete Property Control</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed">
            Track occupancy, collect rent, manage tenants, and monitor operations in real time
          </p>
        </div>

        {/* Uniform 3-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }) {
  return (
    <div className="group relative rounded-2xl border border-gray-100 bg-white p-7 hover:shadow-xl hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">
      {/* Number badge */}
      <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-300 group-hover:bg-primary-50 group-hover:text-primary-500 group-hover:border-primary-100 transition-colors">
        {String(index + 1).padStart(2, '0')}
      </div>

      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary-500/25">
        <LandingIcon name={feature.icon} className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-8">
        {feature.title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}
