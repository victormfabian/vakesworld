export const DEFAULT_ABOUT = {
  image_url: '',
  bio: 'VAKES World is a creative studio blending art, technology, and culture.',
  team: ['Creative Director', 'Design Lead', 'Engineering'],
  partners: ['Collaborators', 'Studios', 'Brands'],
  blog_links: [],
  email: 'hello@vakes.world',
  phone: '+234 000 000 0000',
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
  footer_text: '(c) VAKES World',
  about_section: DEFAULT_ABOUT,
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
]
