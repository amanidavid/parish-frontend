const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'ZABA PMS';
const WORDS = APP_NAME.split(' ');
const SHORT_NAME = WORDS[0] || 'ZABA';

export const LANDING_CONFIG = {
  showLanding: true,

  brand: {
    name: SHORT_NAME,
    fullName: APP_NAME,
    tagline: 'By Levanda',
  },

  hero: {
    headline: 'The Smarter Way to Manage Property',
    subheadline:
      'Manage properties, units, tenants, leases, maintenance requests, and rent collection from one powerful platform.',
    ctaPrimary: { label: 'Get Started Free', href: '/login' },
    ctaSecondary: { label: 'Learn More', href: '#features' },
  },

  features: [
    {
      title: 'Property & Unit Management',
      description: 'Track all your buildings, units, and occupancy status in real-time.',
      icon: 'building',
    },
    {
      title: 'Tenant & Customer Management',
      description: 'Store tenant profiles, contact details, and full rental history.',
      icon: 'users',
    },
    {
      title: 'Maintenance Tracking',
      description: 'Create, assign, and monitor work orders from start to finish.',
      icon: 'wrench',
    },
    {
      title: 'Contracts & Leases',
      description: 'Manage lease agreements, renewals, and payment schedules.',
      icon: 'fileText',
    },
    {
      title: 'Financial Reports',
      description: 'Get instant insights on revenue, occupancy, and outstanding payments.',
      icon: 'barChart',
    },
    {
      title: 'Role-Based Access',
      description: 'Secure, permission-based access control for your entire team.',
      icon: 'shield',
    },
  ],

  benefits: [
    {
      title: 'Save Time',
      description: 'Automate repetitive tasks and reduce manual record-keeping.',
      icon: 'clock',
    },
    {
      title: 'Access Anywhere',
      description: 'Manage your properties from any device, anytime, anywhere.',
      icon: 'globe',
    },
    {
      title: 'Secure & Reliable',
      description: 'Your data is safely stored in the cloud with enterprise-grade security.',
      icon: 'lock',
    },
    {
      title: 'All-in-One Account',
      description: 'Run multiple properties under a single unified dashboard.',
      icon: 'layers',
    },
    {
      title: 'Daily Insights',
      description: 'Receive automated reports on occupancy, revenue, and more.',
      icon: 'bell',
    },
    {
      title: 'Easy to Use',
      description: 'No technical expertise required. Simple, intuitive interface.',
      icon: 'smile',
    },
  ],

  whyChoose: {
    headline: `Why choose ${SHORT_NAME}?`,
    subheadline: 'Built to save you time, reduce stress, and help your property business grow.',
  },

  contact: {
    headline: 'Get in Touch',
    subheadline: 'Have questions? We are here to help.',
    email: 'customercare@levanda.co.tz',
    phone: '+255 656 040 073',
    whatsapp: 'https://wa.me/+255656040073',
    callLink: 'tel:+255656040073',
    socials: [
      { name: 'Facebook', href: 'https://web.facebook.com/levandapos' },
      { name: 'Instagram', href: 'https://www.instagram.com/levanda_pos/' },
      { name: 'TikTok', href: 'https://www.tiktok.com/@levanda_pos' },
    ],
  },

  footer: {
    copyright: '© Levanda Technologies. All rights reserved.',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Register', href: '/register' },
    ],
  },
};
