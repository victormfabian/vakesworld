const SITE_URL = 'https://vakes.world'

const STATIC_PATHS = [
  '/',
  '/projects',
  '/products',
  '/shop',
  '/work-with-vakes',
  '/victormfabian',
  '/about',
  '/blog',
]

const slugify = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const escapeXml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const buildUrlSet = (paths) => {
  const entries = paths
    .map(
      (path) => `
  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>`
}

async function getBlogPostPaths() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return []
  }

  const endpoint = `${supabaseUrl}/rest/v1/site_content?id=eq.1&select=about_section`
  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    return []
  }

  const payload = await response.json()
  const aboutSection = payload?.[0]?.about_section || {}
  const posts = Array.isArray(aboutSection.blog_posts) ? aboutSection.blog_posts : []

  return posts
    .map((post, index) => {
      const rawSlug = (post?.slug || '').trim()
      const fallbackSlug = slugify(post?.title || '') || `post-${index + 1}`
      const slug = slugify(rawSlug) || fallbackSlug
      return slug ? `/blog/${slug}` : ''
    })
    .filter(Boolean)
}

export default async function handler(_req, res) {
  try {
    const blogPaths = await getBlogPostPaths()
    const allPaths = [...new Set([...STATIC_PATHS, ...blogPaths])]
    const xml = buildUrlSet(allPaths)

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=86400')
    res.status(200).send(xml)
  } catch (_error) {
    const xml = buildUrlSet(STATIC_PATHS)
    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.status(200).send(xml)
  }
}
