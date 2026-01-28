export const DEFAULT_ABOUT = {
  image_url: '',
  bio: 'VAKES is a creative studio blending art, technology, and culture.',
  team: ['Creative Director', 'Design Lead', 'Engineering'],
  partners: ['Collaborators', 'Studios', 'Brands'],
  blog_links: [],
  email: 'hello@vakes.world',
  phone: '+234 000 000 0000',
}

export const DEFAULT_PORTFOLIO = {
  name: 'Victor M Fabian',
  title: 'Data Analyst & Digital Technologist',
  location: 'Remote / Global',
  summary:
    'I translate complex data into clear strategy, dashboards, and digital products that ship.',
  availability: 'Available for select collaborations',
  image_url: '',
  socials: {
    linkedin: '',
    github: '',
    twitter: '',
    website: '',
  },
  cv_url: '',
  focus: [
    'Product analytics and KPI design',
    'Business intelligence dashboards',
    'Automation and data ops',
    'Digital systems and web experiences',
  ],
  highlights: [
    { label: 'Projects shipped', value: '40+', icon_url: '' },
    { label: 'Industries', value: 'Tech, Retail, Creative', icon_url: '' },
    { label: 'Tools', value: 'SQL, Python, Power BI', icon_url: '' },
    { label: 'Clients', value: 'Founders & teams', icon_url: '' },
  ],
  skills: [
    'Data modeling',
    'SQL + Postgres',
    'Python analytics',
    'Power BI + Looker',
    'A/B testing',
    'Funnel analysis',
    'Automation',
    'Dashboard UX',
  ],
  tools: [
    'SQL',
    'Python',
    'Power BI',
    'Looker Studio',
    'Supabase',
    'Figma',
    'Google Analytics',
    'Notion',
  ],
  projects: [
    {
      title: 'Growth Control Room',
      description:
        'Built a KPI cockpit for a DTC brand, unifying sales, ads, and retention.',
      impact: 'Reduced reporting time from 6 hours to 30 minutes.',
      stack: 'SQL, Power BI, GA4',
      media_url: '',
      media_type: 'image',
    },
    {
      title: 'Revenue Forecast Engine',
      description:
        'Created a forecasting model with scenario sliders for finance and ops.',
      impact: 'Improved cash planning confidence and weekly alignment.',
      stack: 'Python, Sheets, Looker Studio',
      media_url: '',
      media_type: 'image',
    },
    {
      title: 'Creator Analytics Suite',
      description:
        'Designed a creator dashboard tracking content ROI and audience growth.',
      impact: 'Enabled data-backed programming and sponsorship pricing.',
      stack: 'Supabase, SQL, Figma',
      media_url: '',
      media_type: 'image',
    },
  ],
  experience: [
    {
      role: 'Data Analyst / Digital Technologist',
      scope: 'BI systems, product analytics, automation',
    },
    {
      role: 'Creative Technologist',
      scope: 'Data storytelling, brand intelligence, web systems',
    },
  ],
  contact: {
    email: 'hello@vakes.world',
    cta: 'Let us build your data engine.',
  },
}

export const DEFAULT_SITE = {
  id: 1,
  hero_eyebrow: 'Curated Creative Universe',
  hero_tagline: 'Pioneering Visions',
  hero_subline: 'Art. Technology. Culture.',
  logo_url: '/src/assets/vakes-logo.png',
  instagram_url: 'https://www.instagram.com/vakesworld',
  tiktok_url: 'https://www.tiktok.com/@vakesworld',
  youtube_url: 'https://www.youtube.com/@vakesworld',
  footer_text: '(c) VAKES',
  about_section: DEFAULT_ABOUT,
  portfolio_section: DEFAULT_PORTFOLIO,
}

export const DEFAULT_SUCCESS_KIT = {
  assets: [
    {
      title: 'Brand Kit Templates',
      tags: 'templates, identity, brand',
      link: '',
    },
    {
      title: 'Social Media Pack',
      tags: 'content, social, layouts',
      link: '',
    },
  ],
  tools: [
    {
      title: 'Creator Stack',
      tags: 'apps, workflow, publishing',
      link: '',
    },
    {
      title: 'Productivity System',
      tags: 'planning, checklists, ops',
      link: '',
    },
  ],
  courses: [
    {
      title: 'Brand Strategy Basics',
      tags: 'positioning, messaging',
      link: '',
    },
    {
      title: 'UI/UX Launchpad',
      tags: 'ui/ux, product',
      link: '',
    },
  ],
}

export const DEFAULT_SHOP = {
  enabled: true,
  currency: 'NGN',
  currency_rates: {
    USD: 1500,
    GBP: 1900,
    EUR: 1700,
  },
  items: [
    {
      title: 'Gallery Print',
      price_ngn: 120000,
      image: '',
      images: [],
      description: '',
      sizes: ['S', 'M', 'L'],
      category: 'art',
    },
    {
      title: 'Studio Hoodie',
      price_ngn: 85000,
      image: '',
      images: [],
      description: '',
      sizes: ['S', 'M', 'L', 'XL'],
      category: 'clothing',
    },
    {
      title: 'Canvas Tote',
      price_ngn: 38000,
      image: '',
      images: [],
      description: '',
      sizes: ['One Size'],
      category: 'accessories',
    },
  ],
}

export const DEFAULT_WORK_WITH_ME = {
  services: ['Branding', 'Digital Art', 'UI/UX Design', 'Web & App Dev'],
  industries: ['Creative', 'Tech', 'Retail', 'Hospitality', 'Other'],
  meeting_modes: ['Google Meet', 'Zoom', 'WhatsApp'],
  timezones: ['Africa/Lagos', 'Europe/London', 'America/New_York', 'UTC'],
  agreement_label: 'I agree to be contacted about this request.',
}

export const DEFAULT_PORTALS = [
  {
    id: 1,
    meta: 'Services',
    title: 'Creative Systems',
    href: '#',
    sort_order: 1,
    services: [
      {
        title: 'Branding',
        description: 'Identity systems, strategy, and visual direction.',
        image: '',
        media: [],
      },
      {
        title: 'Digital Art',
        description: 'Illustration, motion, and immersive visuals.',
        image: '',
        media: [],
      },
      {
        title: 'UI/UX Design',
        description: 'Product interfaces, flows, and usability systems.',
        image: '',
        media: [],
      },
      {
        title: 'Web & App Dev',
        description: 'Full-stack builds, integrations, and launches.',
        image: '',
        media: [],
      },
    ],
  },
  {
    id: 2,
    meta: 'Products & Ideas',
    title: 'Apps & SaaS',
    href: '#',
    sort_order: 2,
  },
  {
    id: 3,
    meta: 'Shop',
    title: 'Objects & Editions',
    href: '#',
    sort_order: 3,
    shop: DEFAULT_SHOP,
  },
  {
    id: 4,
    meta: 'Work With VAKES',
    title: 'Start a Project',
    href: '#',
    sort_order: 4,
    work_form: DEFAULT_WORK_WITH_ME,
  },
  {
    id: 5,
    meta: 'Portfolio',
    title: 'Victor M Fabian',
    href: '#',
    sort_order: 5,
  },
]
