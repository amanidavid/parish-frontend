import { LANDING_CONFIG } from '@/constants/landing';
import LandingIcon from './LandingIcon';

export default function ContactSection() {
  const { contact, brand } = LANDING_CONFIG;

  return (
    <section id="contact" className="relative py-14 sm:py-20 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-primary-50/20 to-blue-50/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-r from-primary-200/20 to-blue-200/20 rounded-full blur-3xl opacity-50 -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-white border border-primary-100 px-3.5 py-1.5 mb-5 shadow-sm">
            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold text-primary-700 tracking-wide uppercase">Contact</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-gray-900 via-primary-700 to-primary-600 bg-clip-text text-transparent">
              {contact.headline}
            </span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed">
            {contact.subheadline}
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {/* Email */}
          <a
            href={`mailto:${contact.email}`}
            className="group flex flex-col items-center text-center rounded-2xl border border-gray-100/80 bg-white/80 backdrop-blur-sm p-8 hover:bg-white hover:shadow-xl hover:shadow-primary-100/30 hover:border-primary-200/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary-500/25">
              <LandingIcon name="mail" className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Email</h3>
            <p className="text-sm text-gray-500 break-all">{contact.email}</p>
          </a>

          {/* Phone */}
          <a
            href={contact.callLink}
            className="group flex flex-col items-center text-center rounded-2xl border border-gray-100/80 bg-white/80 backdrop-blur-sm p-8 hover:bg-white hover:shadow-xl hover:shadow-primary-100/30 hover:border-primary-200/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-primary-500/25">
              <LandingIcon name="phone" className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Phone</h3>
            <p className="text-sm text-gray-500">{contact.phone}</p>
          </a>

          {/* WhatsApp */}
          <a
            href={contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center text-center rounded-2xl border border-gray-100/80 bg-white/80 backdrop-blur-sm p-8 hover:bg-white hover:shadow-xl hover:shadow-primary-100/30 hover:border-primary-200/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/25">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">WhatsApp</h3>
            <p className="text-sm text-gray-500">Chat with us</p>
          </a>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Prefer to visit? Our team at <span className="font-semibold text-gray-600">{brand.fullName}</span> is ready to assist you.
          </p>
        </div>
      </div>
    </section>
  );
}
