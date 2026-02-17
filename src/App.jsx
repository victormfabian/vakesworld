import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  DEFAULT_ABOUT,
  DEFAULT_PORTALS,
  DEFAULT_PORTFOLIO,
  DEFAULT_SITE,
  DEFAULT_SUCCESS_KIT,
  DEFAULT_SHOP,
  DEFAULT_WORK_WITH_ME,
} from './contentDefaults'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const ADMIN_HASH = '#/admin'
const ADMIN_EMAIL = 'victorvakes@gmail.com'

const loadCachedJSON = (key) => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

const orderPortalsForHome = (items = []) =>
  [...items].sort((a, b) => {
    const aMeta = a?.meta?.toLowerCase() || ''
    const aTitle = a?.title?.toLowerCase() || ''
    const bMeta = b?.meta?.toLowerCase() || ''
    const bTitle = b?.title?.toLowerCase() || ''
    const aPriority =
      aMeta.includes('work with') || aTitle.includes('start a project')
        ? 0
        : aMeta.includes('service') || aTitle.includes('service')
          ? 1
          : 2
    const bPriority =
      bMeta.includes('work with') || bTitle.includes('start a project')
        ? 0
        : bMeta.includes('service') || bTitle.includes('service')
          ? 1
          : 2
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    const aOrder = Number.isFinite(a?.sort_order) ? a.sort_order : 999
    const bOrder = Number.isFinite(b?.sort_order) ? b.sort_order : 999
    return aOrder - bOrder
  })

export default function App() {
  const cachedSite = loadCachedJSON('vakes_site')
  const cachedPortals = loadCachedJSON('vakes_portals')
  const orderedCachedPortals =
    cachedPortals?.length ? orderPortalsForHome(cachedPortals) : []
  const [isAdminView, setIsAdminView] = useState(
    window.location.hash === ADMIN_HASH
  )
  const [site, setSite] = useState(
    cachedSite
      ? { ...DEFAULT_SITE, ...cachedSite }
      : {
          ...DEFAULT_SITE,
          hero_eyebrow: '',
          hero_tagline: '',
          hero_subline: '',
          logo_url: '',
          header_logo_url: '',
          instagram_url: '',
          tiktok_url: '',
          youtube_url: '',
          behance_url: '',
          dribbble_url: '',
          footer_text: '',
          about_section: DEFAULT_ABOUT,
          portfolio_section: DEFAULT_PORTFOLIO,
        }
  )
  const [portals, setPortals] = useState(orderedCachedPortals)
  const [draftSite, setDraftSite] = useState(
    cachedSite ? { ...DEFAULT_SITE, ...cachedSite } : DEFAULT_SITE
  )
  const [draftPortals, setDraftPortals] = useState(
    orderedCachedPortals.length ? orderedCachedPortals : DEFAULT_PORTALS
  )
  const [deletedPortalIds, setDeletedPortalIds] = useState([])
  const [session, setSession] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [shopAuthMode, setShopAuthMode] = useState('sign-in')
  const [shopAuthEmail, setShopAuthEmail] = useState('')
  const [shopAuthPassword, setShopAuthPassword] = useState('')
  const [shopAuthStatus, setShopAuthStatus] = useState('')
  const [shopAuthError, setShopAuthError] = useState('')
  const [shopAuthLoading, setShopAuthLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasLoadedContent, setHasLoadedContent] = useState(false)
  const [activeShopTab, setActiveShopTab] = useState('all')
  const [activeShopItem, setActiveShopItem] = useState(null)
  const [activeShopSize, setActiveShopSize] = useState('')
  const [activeCurrency, setActiveCurrency] = useState('NGN')
  const [activeSuccessKitTab, setActiveSuccessKitTab] = useState('all')
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const [activeServiceTab, setActiveServiceTab] = useState('all')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [timeFormat, setTimeFormat] = useState('24h')
  const location = useLocation()
  const navigate = useNavigate()
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    address: '',
    email: '',
    phone: '',
  })
  const [checkoutError, setCheckoutError] = useState('')
  const [checkoutStatus, setCheckoutStatus] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [activeAdminPanel, setActiveAdminPanel] = useState('content')
  const [workRequests, setWorkRequests] = useState([])
  const [workRequestsLoading, setWorkRequestsLoading] = useState(false)
  const [workForm, setWorkForm] = useState({
    service: '',
    name: '',
    industry: '',
    other: '',
    email: '',
    phone: '',
    message: '',
    agreement: false,
    date: '',
    time: '',
    timezone: '',
    meeting_mode: '',
  })
  const [workFormError, setWorkFormError] = useState('')
  const [workFormStatus, setWorkFormStatus] = useState('')
  const [workFormFieldErrors, setWorkFormFieldErrors] = useState({})
  const [workFormContext, setWorkFormContext] = useState('portal')
  const [portfolioCallOpen, setPortfolioCallOpen] = useState(false)
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [cardsVisible, setCardsVisible] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [activeNavCardIndex, setActiveNavCardIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
  const todayDate = new Date().toISOString().slice(0, 10)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [cursorActive, setCursorActive] = useState(false)

  const isSuccessKitPortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return (
      meta.includes('success kit') ||
      title.includes('success kit')
    )
  }

  const isShopPortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return meta.includes('shop') || title.includes('shop')
  }

  const isWorkWithMePortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return meta.includes('work with') || title.includes('start a project')
  }

  const isPortfolioPortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return meta.includes('portfolio') || title.includes('victor')
  }

  const isServicesPortal = (portal) => {
    if (
      isSuccessKitPortal(portal) ||
      isShopPortal(portal) ||
      isWorkWithMePortal(portal) ||
      isPortfolioPortal(portal)
    ) {
      return false
    }
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return (
      meta.includes('service') ||
      title.includes('service') ||
      (portal?.services && portal.services.length > 0)
    )
  }

  const orderPortals = (items = []) =>
    [...items].sort((a, b) => {
      const aPriority = isWorkWithMePortal(a) ? 0 : isServicesPortal(a) ? 1 : 2
      const bPriority = isWorkWithMePortal(b) ? 0 : isServicesPortal(b) ? 1 : 2
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      const aOrder = Number.isFinite(a?.sort_order) ? a.sort_order : 999
      const bOrder = Number.isFinite(b?.sort_order) ? b.sort_order : 999
      return aOrder - bOrder
    })

  const slugify = (value) =>
    (value || '')
      .toString()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  const isVideoUrl = (url) => /\.(mp4)(\?.*)?$/i.test(url || '')
  const getYouTubeEmbedUrl = (url) => {
    if (!url) {
      return ''
    }
    const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/)
    const longMatch = url.match(/[?&]v=([A-Za-z0-9_-]+)/)
    const id = shortMatch?.[1] || longMatch?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : ''
  }

  const resolveHeroMediaUrl = (url) => {
    if (!url) {
      return ''
    }
    return url
  }

  const formatDateValue = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseDateValue = (value) =>
    value ? new Date(`${value}T00:00:00`) : null

  const getCalendarDays = (monthDate) => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const startDay = firstOfMonth.getDay()
    const startDate = new Date(year, month, 1 - startDay)
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + index)
      return day
    })
  }

  const formatTimeLabel = (value) => {
    if (timeFormat === '24h') {
      return value
    }
    const [hourText, minuteText] = value.split(':')
    const hour = Number(hourText)
    const period = hour >= 12 ? 'PM' : 'AM'
    const adjusted = hour % 12 || 12
    return `${adjusted}:${minuteText} ${period}`
  }

  const getPortalIllustration = (portal) => {
    if (portal?.illustration_url) {
      return portal.illustration_url
    }
    if (isSuccessKitPortal(portal)) {
      return 'https://placehold.co/140x140/png?text=Kit'
    }
    if (isShopPortal(portal)) {
      return 'https://placehold.co/140x140/png?text=Shop'
    }
    if (isWorkWithMePortal(portal)) {
      return 'https://placehold.co/140x140/png?text=Work'
    }
    if (isServicesPortal(portal)) {
      return 'https://placehold.co/140x140/png?text=Services'
    }
    if (isPortfolioPortal(portal)) {
      return 'https://placehold.co/140x140/png?text=Portfolio'
    }
    return 'https://placehold.co/140x140/png?text=Idea'
  }

  const getServiceKey = (service, index) =>
    slugify(service?.title) || `service-${index + 1}`

  const DEFAULT_SERVICES =
    DEFAULT_PORTALS.find((portal) => portal?.services?.length)?.services || []

  const getServicesFromPortal = (portal) =>
    portal?.services?.length ? portal.services : DEFAULT_SERVICES

  const getServiceTabs = (services) => [
    { key: 'all', label: 'All' },
    ...services.map((service, index) => ({
      key: getServiceKey(service, index),
      label: service?.title || `Service ${index + 1}`,
    })),
  ]

  const portalRoutes = useMemo(
    () =>
      portals.map((portal, index) => {
        let slug = slugify(portal?.meta || portal?.title)
        if (isSuccessKitPortal(portal)) {
          slug = 'success-kit'
        } else if (isServicesPortal(portal)) {
          slug = 'services'
        } else if (isShopPortal(portal)) {
          slug = 'shop'
        } else if (isWorkWithMePortal(portal)) {
          slug = 'work-with-vakes'
        } else if (slug.includes('product')) {
          slug = 'products'
        } else if (isPortfolioPortal(portal)) {
          slug = 'victormfabian'
        } else if (!slug) {
          slug = `portal-${index + 1}`
        }
        return { portal, index, slug, path: `/${slug}` }
      }),
    [portals]
  )
  const hasPortfolioPortal = portalRoutes.some(
    (item) => item.slug === 'victormfabian'
  )

  const routeSlug = location.pathname.replace(/^\/+|\/+$/g, '')
  const routePortal = routeSlug
    ? portalRoutes.find((item) => item.slug === routeSlug) || null
    : null
  const activeContentPortal = routePortal?.portal || null
  const isAboutRoute = routeSlug === 'about'
  const isPortfolioRoute = routeSlug === 'victormfabian'
  const isPortfolioView =
    isPortfolioRoute || (routePortal && isPortfolioPortal(routePortal.portal))
  const portalsForRail = orderPortalsForHome(portals)
  const workPortalEntry = portalRoutes.find((item) =>
    isWorkWithMePortal(item.portal)
  )

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminView(window.location.hash === ADMIN_HASH)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])


  useEffect(() => {
    if (!supabase) {
      setSite(DEFAULT_SITE)
      setPortals(orderPortals(DEFAULT_PORTALS))
      setDraftSite(DEFAULT_SITE)
      setDraftPortals(orderPortals(DEFAULT_PORTALS))
      setHasLoadedContent(true)
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('vakes_site', JSON.stringify(DEFAULT_SITE))
          window.localStorage.setItem(
            'vakes_portals',
            JSON.stringify(DEFAULT_PORTALS)
          )
        } catch (error) {
          // Ignore storage failures.
        }
      }
      return
    }

    let isMounted = true

    const loadContent = async () => {
      setLoading(true)
      setError('')

      const { data: siteData, error: siteError } = await supabase
        .from('site_content')
        .select('*')
        .maybeSingle()

      const { data: portalData, error: portalError } = await supabase
        .from('portals')
        .select('*')
        .order('sort_order', { ascending: true })

      if (!isMounted) {
        return
      }

      if (siteError) {
        setError(siteError.message)
      }

      if (portalError) {
        setError(portalError.message)
      }

    const mergedSite = siteData ? { ...DEFAULT_SITE, ...siteData } : DEFAULT_SITE
    if (!mergedSite.behance_url && mergedSite.about_section?.behance_url) {
      mergedSite.behance_url = mergedSite.about_section.behance_url
    }
    if (!mergedSite.dribbble_url && mergedSite.about_section?.dribbble_url) {
      mergedSite.dribbble_url = mergedSite.about_section.dribbble_url
    }
    const mergedPortals = portalData?.length
      ? portalData.map((portal) => {
          const defaultMatch = DEFAULT_PORTALS.find(
            (item) => item.meta === portal.meta || item.title === portal.title
          )
          let nextPortal = portal
          if (!portal.services && defaultMatch?.services) {
            nextPortal = { ...nextPortal, services: defaultMatch.services }
          }
          if (!portal.success_kit && isSuccessKitPortal(portal)) {
            nextPortal = { ...nextPortal, success_kit: DEFAULT_SUCCESS_KIT }
          }
          if (!portal.shop && defaultMatch?.shop) {
            nextPortal = { ...nextPortal, shop: defaultMatch.shop }
          }
          if (!portal.work_form && defaultMatch?.work_form) {
            nextPortal = { ...nextPortal, work_form: defaultMatch.work_form }
          }
          if (!portal.illustration_url && defaultMatch?.illustration_url) {
            nextPortal = {
              ...nextPortal,
              illustration_url: defaultMatch.illustration_url,
            }
          }
          return nextPortal
        })
      : DEFAULT_PORTALS

      const orderedPortals = orderPortals(mergedPortals)
      setSite(mergedSite)
      setPortals(orderedPortals)
      setDraftSite(mergedSite)
      setDraftPortals(orderedPortals)
      setDeletedPortalIds([])
      setHasLoadedContent(true)
      setLoading(false)

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('vakes_site', JSON.stringify(mergedSite))
          window.localStorage.setItem(
            'vakes_portals',
            JSON.stringify(orderedPortals)
          )
        } catch (error) {
          // Ignore storage failures (private mode, quota).
        }
      }
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!window.matchMedia('(pointer: fine)').matches) {
      return
    }

    const cursor = document.querySelector('.custom-cursor')
    if (!cursor) {
      return
    }

    const handleMove = (event) => {
      cursor.style.setProperty('--cursor-x', `${event.clientX}px`)
      cursor.style.setProperty('--cursor-y', `${event.clientY}px`)
      if (!cursorVisible) {
        setCursorVisible(true)
      }
    }

    const handleEnter = () => setCursorVisible(true)
    const handleLeave = () => setCursorVisible(false)

    const handleHover = (event) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }
      const isClickable = target.closest(
        'a, button, input, textarea, select, [role="button"], .portal-card__title-link, .shop-card'
      )
      setCursorActive(Boolean(isClickable))
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mouseenter', handleEnter)
    window.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseover', handleHover)
    document.addEventListener('mouseout', handleHover)
    document.body.classList.add('has-custom-cursor')

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseenter', handleEnter)
      window.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseover', handleHover)
      document.removeEventListener('mouseout', handleHover)
      document.body.classList.remove('has-custom-cursor')
    }
  }, [cursorVisible])

  useEffect(() => {
    if (!supabase) {
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userEmail = session?.user?.email
    if (!userEmail) {
      return
    }

    setCheckoutForm((prevForm) =>
      prevForm.email ? prevForm : { ...prevForm, email: userEmail }
    )
    setShopAuthEmail((prevEmail) => prevEmail || userEmail)
  }, [session])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const setMeta = (name, content) => {
      if (!content) {
        return
      }
      let tag = document.querySelector(`meta[name="${name}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const setMetaProperty = (property, content) => {
      if (!content) {
        return
      }
      let tag = document.querySelector(`meta[property="${property}"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('property', property)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    const setCanonical = (href) => {
      if (!href) {
        return
      }
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        document.head.appendChild(link)
      }
      link.setAttribute('href', href)
    }

    const portfolioProfile = getPortfolioSection(site)
    const pageLabel = isAboutRoute
      ? 'About'
      : routePortal?.portal?.meta ||
        routePortal?.portal?.title ||
        (isPortfolioRoute ? portfolioProfile.name : '')
    const siteName = 'VAKES'
    const heroLine =
      site?.hero_tagline || site?.hero_subline || 'Creative systems and culture.'
    const pageTitle = pageLabel ? `${pageLabel} | ${siteName}` : siteName
    const portfolioDescription = `${portfolioProfile.title}. ${portfolioProfile.summary}`
    const pageDescription = pageLabel
      ? [
          isAboutRoute ? aboutSection?.bio : routePortal?.portal?.title,
          isPortfolioRoute ? portfolioDescription : heroLine,
        ]
          .filter(Boolean)
          .join(' ')
      : [site?.hero_tagline, site?.hero_subline].filter(Boolean).join(' ')

    const pageUrl = `${window.location.origin}${location.pathname || '/'}`

    document.title = pageTitle
    setMeta('description', pageDescription)
    setMetaProperty('og:title', pageTitle)
    setMetaProperty('og:description', pageDescription)
    setMetaProperty('og:url', pageUrl)
    setMetaProperty('twitter:title', pageTitle)
    setMetaProperty('twitter:description', pageDescription)
    setCanonical(pageUrl)
  }, [location.pathname, routePortal, site])

  useEffect(() => {
    if (isAdminView) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.2 }
    )

    const targets = document.querySelectorAll('[data-animate]')
    targets.forEach((el) => observer.observe(el))

    return () => {
      targets.forEach((el) => observer.unobserve(el))
      observer.disconnect()
    }
  }, [isAdminView, portals])

  useEffect(() => {
    if (activeContentPortal && isShopPortal(activeContentPortal)) {
      setActiveShopTab('all')
      setActiveShopItem(null)
      setActiveShopSize('')
      setActiveCurrency(getShop(activeContentPortal).currency || 'NGN')
      setCheckoutForm({
        fullName: '',
        address: '',
        email: '',
        phone: '',
      })
      setCheckoutError('')
      setCheckoutStatus('')
    }
  }, [activeContentPortal])

  useEffect(() => {
    if (
      activeContentPortal &&
      isWorkWithMePortal(activeContentPortal) &&
      !workForm.date
    ) {
      setWorkForm((prevForm) => ({ ...prevForm, date: todayDate }))
    }
  }, [activeContentPortal, todayDate, workForm.date])

  useEffect(() => {
    if (!workForm.date || !workForm.time) {
      return
    }

    if (workForm.date === todayDate && workForm.time < currentTime) {
      setWorkForm((prevForm) => ({ ...prevForm, time: '' }))
    }
  }, [workForm.date, workForm.time, todayDate, currentTime])

  useEffect(() => {
    if (!activeContentPortal || !isWorkWithMePortal(activeContentPortal)) {
      return
    }

    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })
      )
    }, 60000)

    return () => clearInterval(timer)
  }, [activeContentPortal])

  useEffect(() => {
    if (isAdminView) {
      return
    }

    const handleKeyDown = (event) => {
      const key = event.key?.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p')) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAdminView])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }, [location.pathname])

  useEffect(() => {
    setActiveShopItem(null)
  }, [location.pathname])

  const isAdminUser = useMemo(
    () => session?.user?.email?.toLowerCase() === ADMIN_EMAIL,
    [session]
  )

  useEffect(() => {
    if (!supabase || !isAdminView || !isAdminUser) {
      return
    }

    let isMounted = true

    const loadOrders = async () => {
      setOrdersLoading(true)
      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (ordersError) {
        setError(ordersError.message)
      } else {
        setOrders(data || [])
      }
      setOrdersLoading(false)
    }

    loadOrders()

    const loadWorkRequests = async () => {
      setWorkRequestsLoading(true)
      const { data, error: workError } = await supabase
        .from('work_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isMounted) {
        return
      }

      if (workError) {
        setError(workError.message)
      } else {
        setWorkRequests(data || [])
      }
      setWorkRequestsLoading(false)
    }

    loadWorkRequests()

    return () => {
      isMounted = false
    }
  }, [isAdminView, isAdminUser])

  const SUCCESS_KIT_SECTIONS = [
    { key: 'assets', label: 'Assets' },
    { key: 'tools', label: 'Tools' },
    { key: 'courses', label: 'Courses' },
  ]

  const getSuccessKit = (portal) =>
    portal.success_kit ? { ...DEFAULT_SUCCESS_KIT, ...portal.success_kit } : DEFAULT_SUCCESS_KIT

  const SHOP_TABS = [
    { key: 'all', label: 'All' },
    { key: 'art', label: 'Art' },
    { key: 'apparel', label: 'Apparel' },
    { key: 'accessories', label: 'Accessories' },
  ]

  const getShop = (portal) => {
    if (!portal.shop) {
      return DEFAULT_SHOP
    }
    return {
      ...DEFAULT_SHOP,
      ...portal.shop,
      items: portal.shop.items?.length
        ? portal.shop.items
        : DEFAULT_SHOP.items,
    }
  }

  const getWorkFormConfig = (portal) =>
    portal.work_form
      ? { ...DEFAULT_WORK_WITH_ME, ...portal.work_form }
      : DEFAULT_WORK_WITH_ME

  const SHOP_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR']

  const formatCurrencyAmount = (amount, currency) =>
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)

  const getAboutSection = (siteData) =>
    siteData.about_section
      ? { ...DEFAULT_ABOUT, ...siteData.about_section }
      : DEFAULT_ABOUT

  const aboutSection = getAboutSection(site)
  const behanceUrl = site.behance_url || aboutSection.behance_url
  const dribbbleUrl = site.dribbble_url || aboutSection.dribbble_url
  const heroMediaUrl = resolveHeroMediaUrl(site.logo_url)
  const headerLogoUrl = resolveHeroMediaUrl(site.header_logo_url)
  const todayDateObj = new Date()
  todayDateObj.setHours(0, 0, 0, 0)
  const selectedDateObj = parseDateValue(workForm.date)
  const calendarDays = useMemo(
    () => getCalendarDays(calendarMonth),
    [calendarMonth]
  )
  const monthLabel = calendarMonth.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const selectedDateLabel = selectedDateObj
    ? selectedDateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
      })
    : 'Select date'
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 9; hour <= 19; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 19 && minute > 0) {
          continue
        }
        slots.push(
          `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        )
      }
    }
    return slots
  }, [])

  const getPortfolioSection = (siteData) => {
    const section = siteData?.portfolio_section
      ? { ...DEFAULT_PORTFOLIO, ...siteData.portfolio_section }
      : DEFAULT_PORTFOLIO
    return {
      ...section,
      socials: section.socials
        ? { ...DEFAULT_PORTFOLIO.socials, ...section.socials }
        : DEFAULT_PORTFOLIO.socials,
      focus: section.focus?.length ? section.focus : DEFAULT_PORTFOLIO.focus,
      highlights: section.highlights?.length
        ? section.highlights
        : DEFAULT_PORTFOLIO.highlights,
      skills: section.skills?.length ? section.skills : DEFAULT_PORTFOLIO.skills,
      tools: section.tools?.length ? section.tools : DEFAULT_PORTFOLIO.tools,
      projects: section.projects?.length
        ? section.projects
        : DEFAULT_PORTFOLIO.projects,
      experience: section.experience?.length
        ? section.experience
        : DEFAULT_PORTFOLIO.experience,
      contact: section.contact
        ? { ...DEFAULT_PORTFOLIO.contact, ...section.contact }
        : DEFAULT_PORTFOLIO.contact,
    }
  }


  const normalizeServiceMedia = (service) => {
    const media = Array.isArray(service.media)
      ? service.media
      : typeof service.media === 'string' && service.media
        ? [service.media]
        : []
    const items = [service.image, ...media]
      .filter(Boolean)
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }
        if (typeof item === 'object') {
          return (item.url || item.src || '').trim()
        }
        return ''
      })
      .filter(Boolean)
    return [...new Set(items)]
  }

  const getItemAmount = (item, currency, rates) => {
    const baseValue =
      typeof item.price_ngn === 'number'
        ? item.price_ngn
        : Number.parseFloat(item.price_ngn || item.price || '0')
    if (!baseValue) {
      return 0
    }
    if (currency === 'NGN') {
      return baseValue
    }
    const rate = Number.parseFloat(rates?.[currency]) || 0
    if (!rate) {
      return 0
    }
    return baseValue / rate
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setError('')
    setStatus('')
    setLoading(true)

    if (authEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('This admin portal is restricted to a single account.')
      setLoading(false)
      return
    }

    const authPayload = { email: authEmail, password: authPassword }
    const authResponse = await supabase.auth.signInWithPassword(authPayload)

    if (authResponse.error) {
      setError(authResponse.error.message)
    } else {
      setStatus('Signed in.')
    }

    setLoading(false)
  }

  const handleShopAuthSubmit = async (event) => {
    event.preventDefault()
    if (!supabase) {
      setShopAuthError('Sign in is unavailable right now.')
      return
    }

    if (!shopAuthEmail.trim() || !shopAuthPassword.trim()) {
      setShopAuthError('Enter an email and password.')
      return
    }

    setShopAuthLoading(true)
    setShopAuthError('')
    setShopAuthStatus('')

    const payload = {
      email: shopAuthEmail.trim(),
      password: shopAuthPassword,
    }
    const authResponse =
      shopAuthMode === 'sign-up'
        ? await supabase.auth.signUp(payload)
        : await supabase.auth.signInWithPassword(payload)

    if (authResponse.error) {
      setShopAuthError(authResponse.error.message)
      setShopAuthLoading(false)
      return
    }

    if (shopAuthMode === 'sign-up' && !authResponse.data.session) {
      setShopAuthStatus('Check your email to confirm your account.')
    } else {
      setShopAuthStatus('Signed in.')
    }

    setShopAuthPassword('')
    setShopAuthLoading(false)
  }

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }
    await supabase.auth.signOut()
  }

  const handleShopSignOut = async () => {
    if (!supabase) {
      return
    }
    await supabase.auth.signOut()
    setShopAuthStatus('Signed out.')
  }

  const handleSaveAll = async () => {
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }

    setLoading(true)
    setError('')
    setStatus('')

    const trimmedPortals = draftPortals.map((portal) => ({
      ...portal,
      meta: portal.meta?.trim(),
      title: portal.title?.trim(),
      href: portal.href?.trim(),
    }))

    const hasEmpty = trimmedPortals.some(
      (portal) => !portal.meta || !portal.title
    )

    if (hasEmpty) {
      setError('Every portal needs a meta label and title.')
      setLoading(false)
      return
    }

    const sitePayload = {
      id: 1,
      hero_eyebrow: draftSite.hero_eyebrow,
      hero_tagline: draftSite.hero_tagline,
      hero_subline: draftSite.hero_subline,
      logo_url: draftSite.logo_url,
      header_logo_url: draftSite.header_logo_url,
      instagram_url: draftSite.instagram_url,
      tiktok_url: draftSite.tiktok_url,
      youtube_url: draftSite.youtube_url,
      behance_url: draftSite.behance_url,
      dribbble_url: draftSite.dribbble_url,
      footer_text: draftSite.footer_text,
      about_section: {
        ...DEFAULT_ABOUT,
        ...(draftSite.about_section || {}),
        behance_url:
          draftSite.behance_url || draftSite.about_section?.behance_url || '',
        dribbble_url:
          draftSite.dribbble_url || draftSite.about_section?.dribbble_url || '',
      },
      portfolio_section: draftSite.portfolio_section || DEFAULT_PORTFOLIO,
    }

    let { error: siteError } = await supabase
      .from('site_content')
      .upsert(sitePayload, { onConflict: 'id' })

    if (
      siteError &&
      (siteError.message.includes('behance_url') ||
        siteError.message.includes('dribbble_url') ||
        siteError.message.includes('header_logo_url'))
    ) {
      const { behance_url, dribbble_url, header_logo_url, ...payloadFallback } =
        sitePayload
      const fallbackResult = await supabase
        .from('site_content')
        .upsert(payloadFallback, { onConflict: 'id' })
      siteError = fallbackResult.error
      if (!siteError) {
        setStatus(
          'Saved without Behance/Dribbble columns. Add them to site_content to store those links.'
        )
      }
    }

    if (siteError) {
      setError(siteError.message)
      setLoading(false)
      return
    }

    const portalPayload = trimmedPortals.map((portal, index) => ({
      id: portal.id,
      meta: portal.meta,
      title: portal.title,
      href: portal.href || '#',
      illustration_url: portal.illustration_url || '',
      sort_order: index + 1,
      services: portal.services || null,
      success_kit: portal.success_kit || null,
      shop: portal.shop || null,
      work_form: portal.work_form || null,
    }))

    let { error: portalError } = await supabase
      .from('portals')
      .upsert(portalPayload, { onConflict: 'id' })

    if (portalError && portalError.message.includes('illustration_url')) {
      const fallbackPayload = portalPayload.map(
        ({ illustration_url, ...rest }) => rest
      )
      const fallbackResult = await supabase
        .from('portals')
        .upsert(fallbackPayload, { onConflict: 'id' })
      portalError = fallbackResult.error
      if (!portalError) {
        setStatus(
          'Saved without illustration_url column. Add it to portals table to store images.'
        )
      }
    }

    if (portalError) {
      setError(portalError.message)
      setLoading(false)
      return
    }

    if (deletedPortalIds.length) {
      const { error: deleteError } = await supabase
        .from('portals')
        .delete()
        .in('id', deletedPortalIds)

      if (deleteError) {
        setError(deleteError.message)
        setLoading(false)
        return
      }
    }

    setSite({ ...sitePayload })
    setPortals(portalPayload)
    setDraftSite({ ...sitePayload })
    setDraftPortals(portalPayload)
    setDeletedPortalIds([])
    setStatus('Saved.')
    setLoading(false)
  }

  const handlePortalChange = (index, field, value) => {
    const nextPortals = [...draftPortals]
    nextPortals[index] = { ...nextPortals[index], [field]: value }
    setDraftPortals(nextPortals)
  }

  const handleAddPortal = () => {
    setDraftPortals([
      ...draftPortals,
      { id: undefined, meta: '', title: '', href: '' },
    ])
  }

  const handleRemovePortal = (index) => {
    const nextPortals = [...draftPortals]
    const [removed] = nextPortals.splice(index, 1)

    if (removed?.id) {
      setDeletedPortalIds([...deletedPortalIds, removed.id])
    }

    setDraftPortals(nextPortals)
  }

  const handleServiceChange = (portalIndex, serviceIndex, field, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_SERVICES]
    services[serviceIndex] = { ...services[serviceIndex], [field]: value }
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleAddService = (portalIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_SERVICES]
    services.push({ title: '', description: '', image: '' })
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleRemoveService = (portalIndex, serviceIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_SERVICES]
    services.splice(serviceIndex, 1)
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleServiceMediaChange = (portalIndex, serviceIndex, mediaIndex, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_SERVICES]
    const service = services[serviceIndex]
    const media = Array.isArray(service.media) ? [...service.media] : []
    media[mediaIndex] = value
    services[serviceIndex] = { ...service, media }
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleAddServiceMedia = (portalIndex, serviceIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_SERVICES]
    const service = services[serviceIndex]
    const media = Array.isArray(service.media) ? [...service.media] : []
    media.push('')
    services[serviceIndex] = { ...service, media }
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleRemoveServiceMedia = (portalIndex, serviceIndex, mediaIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_SERVICES]
    const service = services[serviceIndex]
    const media = Array.isArray(service.media) ? [...service.media] : []
    media.splice(mediaIndex, 1)
    services[serviceIndex] = { ...service, media }
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const updatePortfolioSection = (nextSection) => {
    setDraftSite({
      ...draftSite,
      portfolio_section: { ...getPortfolioSection(draftSite), ...nextSection },
    })
  }

  const updatePortfolioContact = (field, value) => {
    const current = getPortfolioSection(draftSite)
    updatePortfolioSection({
      contact: { ...current.contact, [field]: value },
    })
  }

  const updatePortfolioSocial = (field, value) => {
    const current = getPortfolioSection(draftSite)
    updatePortfolioSection({
      socials: { ...current.socials, [field]: value },
    })
  }

  const updatePortfolioList = (field, value) => {
    updatePortfolioSection({ [field]: value })
  }

  const handlePortfolioHighlightChange = (index, field, value) => {
    const current = getPortfolioSection(draftSite)
    const highlights = [...current.highlights]
    highlights[index] = { ...highlights[index], [field]: value }
    updatePortfolioSection({ highlights })
  }

  const handleAddPortfolioHighlight = () => {
    const current = getPortfolioSection(draftSite)
    updatePortfolioSection({
      highlights: [...current.highlights, { label: '', value: '' }],
    })
  }

  const handleRemovePortfolioHighlight = (index) => {
    const current = getPortfolioSection(draftSite)
    const highlights = [...current.highlights]
    highlights.splice(index, 1)
    updatePortfolioSection({ highlights })
  }

  const handlePortfolioProjectChange = (index, field, value) => {
    const current = getPortfolioSection(draftSite)
    const projects = [...current.projects]
    projects[index] = { ...projects[index], [field]: value }
    updatePortfolioSection({ projects })
  }

  const handleAddPortfolioProject = () => {
    const current = getPortfolioSection(draftSite)
    updatePortfolioSection({
      projects: [
        ...current.projects,
        {
          title: '',
          description: '',
          impact: '',
          stack: '',
          media_url: '',
          media_type: 'image',
        },
      ],
    })
  }

  const handleRemovePortfolioProject = (index) => {
    const current = getPortfolioSection(draftSite)
    const projects = [...current.projects]
    projects.splice(index, 1)
    updatePortfolioSection({ projects })
  }

  const handlePortfolioExperienceChange = (index, field, value) => {
    const current = getPortfolioSection(draftSite)
    const experience = [...current.experience]
    experience[index] = { ...experience[index], [field]: value }
    updatePortfolioSection({ experience })
  }

  const handleAddPortfolioExperience = () => {
    const current = getPortfolioSection(draftSite)
    updatePortfolioSection({
      experience: [...current.experience, { role: '', scope: '' }],
    })
  }

  const handleRemovePortfolioExperience = (index) => {
    const current = getPortfolioSection(draftSite)
    const experience = [...current.experience]
    experience.splice(index, 1)
    updatePortfolioSection({ experience })
  }

  const preventContextMenu = (event) => {
    event.preventDefault()
  }

  const preventDragStart = (event) => {
    event.preventDefault()
  }

  const preventCopy = (event) => {
    event.preventDefault()
  }

  const handleStartProjectClick = () => {
    const target = portalRoutes.find((item) => isWorkWithMePortal(item.portal))
    if (!target) {
      return
    }
    navigate(target.path)
  }

  const handleSuccessKitChange = (
    portalIndex,
    sectionKey,
    itemIndex,
    field,
    value
  ) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const successKit = portal.success_kit
      ? { ...DEFAULT_SUCCESS_KIT, ...portal.success_kit }
      : { ...DEFAULT_SUCCESS_KIT }
    const sectionItems = successKit[sectionKey]
      ? [...successKit[sectionKey]]
      : []
    sectionItems[itemIndex] = { ...sectionItems[itemIndex], [field]: value }
    successKit[sectionKey] = sectionItems
    nextPortals[portalIndex] = { ...portal, success_kit: successKit }
    setDraftPortals(nextPortals)
  }

  const handleAddSuccessKitItem = (portalIndex, sectionKey) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const successKit = portal.success_kit
      ? { ...DEFAULT_SUCCESS_KIT, ...portal.success_kit }
      : { ...DEFAULT_SUCCESS_KIT }
    const sectionItems = successKit[sectionKey]
      ? [...successKit[sectionKey]]
      : []
    sectionItems.push({ title: '', tags: '', link: '' })
    successKit[sectionKey] = sectionItems
    nextPortals[portalIndex] = { ...portal, success_kit: successKit }
    setDraftPortals(nextPortals)
  }

  const handleRemoveSuccessKitItem = (portalIndex, sectionKey, itemIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const successKit = portal.success_kit
      ? { ...DEFAULT_SUCCESS_KIT, ...portal.success_kit }
      : { ...DEFAULT_SUCCESS_KIT }
    const sectionItems = successKit[sectionKey]
      ? [...successKit[sectionKey]]
      : []
    sectionItems.splice(itemIndex, 1)
    successKit[sectionKey] = sectionItems
    nextPortals[portalIndex] = { ...portal, success_kit: successKit }
    setDraftPortals(nextPortals)
  }

  const handleShopToggle = (portalIndex, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const shop = getShop(portal)
    nextPortals[portalIndex] = { ...portal, shop: { ...shop, enabled: value } }
    setDraftPortals(nextPortals)
  }

  const handleShopItemChange = (portalIndex, itemIndex, field, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const shop = getShop(portal)
    const items = shop.items ? [...shop.items] : []
    items[itemIndex] = { ...items[itemIndex], [field]: value }
    nextPortals[portalIndex] = { ...portal, shop: { ...shop, items } }
    setDraftPortals(nextPortals)
  }

  const handleShopConfigChange = (portalIndex, field, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const shop = getShop(portal)
    if (field === 'work_form') {
      nextPortals[portalIndex] = { ...portal, work_form: value }
    } else {
      nextPortals[portalIndex] = { ...portal, shop: { ...shop, [field]: value } }
    }
    setDraftPortals(nextPortals)
  }

  const handleAddShopItem = (portalIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const shop = getShop(portal)
    const items = shop.items ? [...shop.items] : []
    items.push({
      title: '',
      price_ngn: 0,
      image: '',
      images: [],
      description: '',
      sizes: [],
      category: 'art',
    })
    nextPortals[portalIndex] = { ...portal, shop: { ...shop, items } }
    setDraftPortals(nextPortals)
  }

  const handleRemoveShopItem = (portalIndex, itemIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const shop = getShop(portal)
    const items = shop.items ? [...shop.items] : []
    items.splice(itemIndex, 1)
    nextPortals[portalIndex] = { ...portal, shop: { ...shop, items } }
    setDraftPortals(nextPortals)
  }

  const handleOrderStatusChange = (orderId, value) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: value } : order
      )
    )
  }

  const handleOrderSave = async (orderId, status) => {
    if (!supabase) {
      return
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (updateError) {
      setError(updateError.message)
    }
  }

  const handleWorkRequestStatusChange = (requestId, value) => {
    setWorkRequests((prevRequests) =>
      prevRequests.map((request) =>
        request.id === requestId ? { ...request, status: value } : request
      )
    )
  }

  const handleWorkRequestSave = async (requestId, status) => {
    if (!supabase) {
      return
    }

    const { error: updateError } = await supabase
      .from('work_requests')
      .update({ status })
      .eq('id', requestId)

    if (updateError) {
      setError(updateError.message)
    }
  }

  const handleAdminNav = (sectionId) => {
    setActiveAdminPanel(sectionId)
  }

  const handleCheckoutSubmit = async () => {
    if (!activeShopItem) {
      return
    }

    if (!session?.user) {
      setCheckoutError('Sign in to checkout.')
      return
    }

    const hasAllFields =
      checkoutForm.fullName.trim() &&
      checkoutForm.address.trim() &&
      checkoutForm.email.trim() &&
      checkoutForm.phone.trim()

    if (!activeShopSize) {
      setCheckoutError('Select a size before checkout.')
      return
    }

    if (!hasAllFields) {
      setCheckoutError('Fill in all required fields.')
      return
    }

    if (!supabase) {
      setCheckoutError('Checkout is unavailable right now.')
      return
    }

    setCheckoutError('')
    setCheckoutStatus('Saving order...')

    const shop = getShop(activeContentPortal || {})
    const amount = getItemAmount(activeShopItem, activeCurrency, shop.currency_rates)

    if (amount <= 0) {
      setCheckoutStatus('')
      setCheckoutError('Set a valid NGN price and currency rates.')
      return
    }

    const { error: insertError } = await supabase.from('orders').insert({
      product_title: activeShopItem.title,
      product_category: activeShopItem.category || '',
      product_price: formatCurrencyAmount(amount, activeCurrency),
      product_image: activeShopItem.image || '',
      size: activeShopSize,
      customer_name: checkoutForm.fullName,
      customer_address: checkoutForm.address,
      customer_email: checkoutForm.email,
      customer_phone: checkoutForm.phone,
      currency: activeCurrency,
      amount,
      status: 'payment_pending',
    })

    if (insertError) {
      setCheckoutStatus('')
      setCheckoutError(insertError.message)
      return
    }

    setCheckoutStatus('Payment pending. We will reach out to complete payment.')
  }

  const handleWorkFormSubmit = async () => {
    const fieldErrors = {}
    if (workFormContext !== 'portfolio' && !workForm.service) {
      fieldErrors.service = true
    }
    if (!workForm.name.trim()) fieldErrors.name = true
    if (!workForm.industry) fieldErrors.industry = true
    if (!workForm.email.trim()) fieldErrors.email = true
    if (!workForm.phone.trim()) fieldErrors.phone = true
    if (!workForm.message.trim()) fieldErrors.message = true
    if (!workForm.agreement) fieldErrors.agreement = true
    if (!workForm.date) fieldErrors.date = true
    if (!workForm.time) fieldErrors.time = true
    if (!workForm.timezone) fieldErrors.timezone = true
    if (!workForm.meeting_mode) fieldErrors.meeting_mode = true
    if (Object.keys(fieldErrors).length) {
      setWorkFormFieldErrors(fieldErrors)
      setWorkFormError('Fill in all required fields.')
      return
    }

    const hasRequired =
      (workFormContext === 'portfolio' || workForm.service) &&
      workForm.name.trim() &&
      workForm.industry &&
      workForm.email.trim() &&
      workForm.phone.trim() &&
      workForm.message.trim() &&
      workForm.agreement &&
      workForm.date &&
      workForm.time &&
      workForm.timezone &&
      workForm.meeting_mode

    if (!supabase) {
      setWorkFormError('Submission is unavailable right now.')
      return
    }

    setWorkFormFieldErrors({})
    setWorkFormError('')
    setWorkFormStatus('Submitting...')

    const { error: insertError } = await supabase.from('work_requests').insert({
      service:
        workFormContext === 'portfolio' ? 'Portfolio Call' : workForm.service,
      name: workForm.name,
      industry: workForm.industry,
      other: workForm.other,
      email: workForm.email,
      phone: workForm.phone,
      message: workForm.message,
      agreement: workForm.agreement,
      date: workForm.date,
      time: workForm.time,
      timezone: workForm.timezone,
      meeting_mode: workForm.meeting_mode,
      status: 'new',
    })

    if (insertError) {
      setWorkFormStatus('')
      setWorkFormError(insertError.message)
      return
    }

    setWorkFormStatus('Request submitted. We will reach out soon.')
  }

  const renderServiceList = (portal) => {
    const services = getServicesFromPortal(portal)
    const tabs = getServiceTabs(services)
    const activeKey = tabs.some((tab) => tab.key === activeServiceTab)
      ? activeServiceTab
      : 'all'
    const filteredServices =
      activeKey === 'all'
        ? services
        : services.filter(
            (service, index) => getServiceKey(service, index) === activeKey
          )

    return (
      <div className="service-panel">
        <div className="service-tabs" role="tablist" aria-label="Services">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`service-tab${activeKey === tab.key ? ' is-active' : ''}`}
              onClick={() => setActiveServiceTab(tab.key)}
              role="tab"
              aria-selected={activeKey === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="service-list">
          {filteredServices.map((service, index) => {
            const serviceTitle = service?.title || `Service ${index + 1}`
            return (
              <div className="service-item" key={`${serviceTitle}-${index}`}>
                <div className="service-heading">{serviceTitle}</div>
                <div className="service-body">
                  {(() => {
                    const mediaItems = normalizeServiceMedia(service).slice().reverse()
                    if (!mediaItems.length) {
                      return null
                    }
                    return (
                      <div className="service-media-list">
                        {mediaItems.map((item, mediaIndex) => {
                          const youtubeUrl = getYouTubeEmbedUrl(item)
                          return (
                            <div
                              className="service-media-item"
                              key={`${serviceTitle}-${mediaIndex}`}
                              onContextMenu={preventContextMenu}
                              onCopy={preventCopy}
                              onCut={preventCopy}
                            >
                              {youtubeUrl ? (
                                <iframe
                                  src={youtubeUrl}
                                  title={serviceTitle}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              ) : isVideoUrl(item) ? (
                                <video
                                  src={item}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  controls
                                  controlsList="nodownload noplaybackrate noremoteplayback"
                                  disablePictureInPicture
                                  disableRemotePlayback
                                />
                              ) : (
                                <img
                                  src={item}
                                  alt={serviceTitle}
                                  onDragStart={preventDragStart}
                                  draggable={false}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                  {(service.description || portals.some(isWorkWithMePortal)) && (
                    <div className="service-description-row">
                      {service.description && (
                        <p className="service-description">{service.description}</p>
                      )}
                      {portals.some(isWorkWithMePortal) && (
                        <button
                          type="button"
                          className="service-cta"
                          onClick={handleStartProjectClick}
                        >
                          Start a project
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderShopAuthSection = () => (
    <div className="shop-auth">
      {!isSupabaseConfigured ? (
        <p className="shop-auth__note">Accounts are unavailable right now.</p>
      ) : session?.user ? (
        <div className="shop-auth__signed">
          <div>
            <div className="shop-auth__title">Account</div>
            <div className="shop-auth__user">{session.user.email}</div>
          </div>
          <button
            type="button"
            className="shop-auth__button"
            onClick={handleShopSignOut}
          >
            Sign out
          </button>
        </div>
      ) : (
        <form className="shop-auth__form" onSubmit={handleShopAuthSubmit}>
          <div className="shop-auth__header">
            <div className="shop-auth__title">Shop account</div>
            <div className="shop-auth__toggle">
              <button
                type="button"
                className={`shop-auth__toggle-btn${
                  shopAuthMode === 'sign-in' ? ' is-active' : ''
                }`}
                onClick={() => {
                  setShopAuthMode('sign-in')
                  setShopAuthError('')
                  setShopAuthStatus('')
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`shop-auth__toggle-btn${
                  shopAuthMode === 'sign-up' ? ' is-active' : ''
                }`}
                onClick={() => {
                  setShopAuthMode('sign-up')
                  setShopAuthError('')
                  setShopAuthStatus('')
                }}
              >
                Sign up
              </button>
            </div>
          </div>
          <div className="shop-auth__fields">
            <label className="shop-auth__label">
              Email
              <input
                className="shop-auth__input"
                type="email"
                value={shopAuthEmail}
                onChange={(event) => setShopAuthEmail(event.target.value)}
                required
                disabled={shopAuthLoading}
              />
            </label>
            <label className="shop-auth__label">
              Password
              <input
                className="shop-auth__input"
                type="password"
                value={shopAuthPassword}
                onChange={(event) => setShopAuthPassword(event.target.value)}
                minLength={6}
                required
                disabled={shopAuthLoading}
              />
            </label>
          </div>
          {shopAuthError && <p className="shop-auth__error">{shopAuthError}</p>}
          {shopAuthStatus && <p className="shop-auth__status">{shopAuthStatus}</p>}
          <button
            className="shop-auth__button"
            type="submit"
            disabled={shopAuthLoading}
          >
            {shopAuthMode === 'sign-up' ? 'Create account' : 'Sign in'}
          </button>
        </form>
      )}
    </div>
  )

  const renderPortfolioContent = () => {
    const profile = getPortfolioSection(site)
    return (
      <div className="portfolio">
        <div className="portfolio-mobile">
          <div className="portfolio-mobile__header">
            <div>
              <p className="portfolio-mobile__name">{profile.name}</p>
              <p className="portfolio-mobile__title">{profile.title}</p>
            </div>
          </div>
          <p className="portfolio-mobile__summary">{profile.summary}</p>
          <div className="portfolio-mobile__meta">
            <span>{profile.location}</span>
            <span>{profile.availability}</span>
          </div>
          <div className="portfolio-mobile__socials">
            {profile.socials.linkedin ? (
              <a href={profile.socials.linkedin} target="_blank" rel="noreferrer">
                <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                  <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-2 7h4v10h-4v-10zm7 0h3.8v1.4h.1c.5-.9 1.8-1.9 3.8-1.9 4.1 0 4.8 2.7 4.8 6.2v6.3h-4v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7h-4v-10z" />
                </svg>
                LinkedIn
              </a>
            ) : null}
            {profile.socials.github ? (
              <a href={profile.socials.github} target="_blank" rel="noreferrer">
                <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.2-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
                </svg>
                GitHub
              </a>
            ) : null}
            {profile.socials.twitter ? (
              <a href={profile.socials.twitter} target="_blank" rel="noreferrer">
                <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                  <path d="M18.3 3H21l-6.1 7 7.2 11h-5.6l-4.4-6.4-5.5 6.4H3.9l6.6-7.7L3.5 3h5.7l4 5.9L18.3 3zm-1 16h1.6L8.7 5h-1.7L17.3 19z" />
                </svg>
                X/Twitter
              </a>
            ) : null}
            {profile.socials.website ? (
              <a href={profile.socials.website} target="_blank" rel="noreferrer">
                <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-2.7a15.5 15.5 0 0 0-1.4-5 8.1 8.1 0 0 1 4.1 5zm-6.9-7.1c1 1.4 1.8 3.3 2.2 5.1H9.8c.4-1.8 1.2-3.7 2.2-5.1zM4.9 13h2.7c.3 1.9.9 3.6 1.4 5a8.1 8.1 0 0 1-4.1-5zm2.7-2H4.9a8.1 8.1 0 0 1 4.1-5c-.5 1.4-1.1 3.1-1.4 5zm4.4 9.1c-1-1.4-1.8-3.3-2.2-5.1h4.4c-.4 1.8-1.2 3.7-2.2 5.1zM14.2 13H9.8c-.1-.6-.1-1.3-.1-2s0-1.4.1-2h4.4c.1.6.1 1.3.1 2s0 1.4-.1 2zm.8 5c.5-1.4 1.1-3.1 1.4-5h2.7a8.1 8.1 0 0 1-4.1 5zm1.4-7c.1-.6.1-1.3.1-2s0-1.4-.1-2h2.7a8.1 8.1 0 0 1 0 4h-2.7z" />
                </svg>
                Website
              </a>
            ) : null}
          </div>
          <a
            className="portfolio-mobile__cta"
            href="#"
            onClick={(event) => {
              event.preventDefault()
              setWorkFormContext('portfolio')
              setWorkForm((prevForm) => ({
                ...prevForm,
                service: 'Portfolio Call',
              }))
              setPortfolioCallOpen(true)
            }}
          >
            Let's Work
          </a>
          <div className="portfolio-mobile__accordions">
            <details className="portfolio-accordion" open>
              <summary>Focus</summary>
              <ul>
                {profile.focus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
            <details className="portfolio-accordion">
              <summary>Highlights</summary>
              <div className="portfolio-accordion__stats">
                {profile.highlights.map((item) => (
                  <div key={item.label}>
                    <div className="portfolio-accordion__value">{item.value}</div>
                    <div className="portfolio-accordion__label">{item.label}</div>
                  </div>
                ))}
              </div>
            </details>
            <details className="portfolio-accordion">
              <summary>Skills & Tools</summary>
              <div className="portfolio-accordion__tags">
                {[...profile.skills, ...profile.tools].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="portfolio-desktop">
          <div className="portfolio-hero-row">
            <div className="portfolio-hero">
              <div className="portfolio-hero__primary">
                <div className="portfolio-hero__top">
                  <div className="portfolio-hero__identity">
                    <p className="portfolio-hero__kicker">Profile</p>
                    <p className="portfolio-hero__title">{profile.title}</p>
                  </div>
                </div>
              </div>
              <p className="portfolio-hero__summary">{profile.summary}</p>
              <div className="portfolio-hero__meta">
                <span>{profile.location}</span>
                <span>{profile.availability}</span>
              </div>
              <div className="portfolio-hero__socials">
                {profile.socials.linkedin ? (
                  <a href={profile.socials.linkedin} target="_blank" rel="noreferrer">
                    <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zm-2 7h4v10h-4v-10zm7 0h3.8v1.4h.1c.5-.9 1.8-1.9 3.8-1.9 4.1 0 4.8 2.7 4.8 6.2v6.3h-4v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7h-4v-10z" />
                    </svg>
                    LinkedIn
                  </a>
                ) : null}
                {profile.socials.github ? (
                  <a href={profile.socials.github} target="_blank" rel="noreferrer">
                    <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.2-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7c-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.5 9.5 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7a3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
                    </svg>
                    GitHub
                  </a>
                ) : null}
                {profile.socials.twitter ? (
                  <a href={profile.socials.twitter} target="_blank" rel="noreferrer">
                    <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                      <path d="M18.3 3H21l-6.1 7 7.2 11h-5.6l-4.4-6.4-5.5 6.4H3.9l6.6-7.7L3.5 3h5.7l4 5.9L18.3 3zm-1 16h1.6L8.7 5h-1.7L17.3 19z" />
                    </svg>
                    X/Twitter
                  </a>
                ) : null}
                {profile.socials.website ? (
                  <a href={profile.socials.website} target="_blank" rel="noreferrer">
                    <svg className="portfolio-social__icon" viewBox="0 0 24 24">
                      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-2.7a15.5 15.5 0 0 0-1.4-5 8.1 8.1 0 0 1 4.1 5zm-6.9-7.1c1 1.4 1.8 3.3 2.2 5.1H9.8c.4-1.8 1.2-3.7 2.2-5.1zM4.9 13h2.7c.3 1.9.9 3.6 1.4 5a8.1 8.1 0 0 1-4.1-5zm2.7-2H4.9a8.1 8.1 0 0 1 4.1-5c-.5 1.4-1.1 3.1-1.4 5zm4.4 9.1c-1-1.4-1.8-3.3-2.2-5.1h4.4c-.4 1.8-1.2 3.7-2.2 5.1zM14.2 13H9.8c-.1-.6-.1-1.3-.1-2s0-1.4.1-2h4.4c.1.6.1 1.3.1 2s0 1.4-.1 2zm.8 5c.5-1.4 1.1-3.1 1.4-5h2.7a8.1 8.1 0 0 1-4.1 5zm1.4-7c.1-.6.1-1.3.1-2s0-1.4-.1-2h2.7a8.1 8.1 0 0 1 0 4h-2.7z" />
                    </svg>
                    Website
                  </a>
                ) : null}
              </div>
            </div>
            <div className="portfolio-hero__secondary">
              <div className="portfolio-hero__focus">
                <h3>Focus</h3>
                <ul>
                  {profile.focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="portfolio-hero__callout">
                <p>Let us build decision systems that scale with your business.</p>
                <a
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    setWorkFormContext('portfolio')
                    setWorkForm((prevForm) => ({
                      ...prevForm,
                      service: 'Portfolio Call',
                    }))
                    setPortfolioCallOpen(true)
                  }}
                >
                  Let's Work
                </a>
              </div>
            </div>
            <div className="portfolio-highlights">
              {profile.highlights.map((item) => (
                <div className="portfolio-card" key={item.label}>
                  <div className="portfolio-card__text">
                    <div className="portfolio-card__value">{item.value}</div>
                    <div className="portfolio-card__label">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="portfolio-grid">
            <div className="portfolio-panel">
              <h3>Core skills</h3>
              <div className="portfolio-tags">
                {profile.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
            <div className="portfolio-panel">
              <h3>Tool stack</h3>
              <div className="portfolio-tags">
                {profile.tools.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="portfolio-projects">
          <div className="portfolio-section__header">
            <h3>Selected projects</h3>
            <p>Strategy, analytics, and digital systems that move metrics.</p>
          </div>
          <div className="portfolio-projects__grid">
            {profile.projects.map((project) => (
              <article className="portfolio-project" key={project.title}>
                <h4>{project.title}</h4>
                <p>{project.description}</p>
                <div className="portfolio-project__impact">{project.impact}</div>
                <div className="portfolio-project__stack">{project.stack}</div>
              </article>
            ))}
          </div>
        </div>

        <div className="portfolio-experience">
          <div className="portfolio-section__header">
            <h3>Experience</h3>
            <p>Hybrid roles across analytics, product, and creative technology.</p>
          </div>
          <div className="portfolio-experience__grid">
            {profile.experience.map((item) => (
              <div className="portfolio-panel" key={item.role}>
                <h4>{item.role}</h4>
                <p>{item.scope}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="portfolio-cta">
          <div>
            <h3>{profile.contact.cta}</h3>
            <p>
              Need dashboards, analytics, or a digital system that scales? Let us
              talk.
            </p>
          </div>
          <a
            className="portfolio-cta__button"
            href={`mailto:${profile.contact.email}`}
          >
            Contact Victor
          </a>
        </div>
      </div>
    )
  }

  const renderPortalContent = (portal, portalIndex) => (
    <>
      {isSuccessKitPortal(portal) && (
        <div className="kit-sections">
          <div className="kit-tabs" role="tablist" aria-label="Success kit tabs">
            {[{ key: 'all', label: 'All' }, ...SUCCESS_KIT_SECTIONS].map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`kit-tab${activeSuccessKitTab === tab.key ? ' is-active' : ''}`}
                onClick={() => setActiveSuccessKitTab(tab.key)}
                role="tab"
                aria-selected={activeSuccessKitTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {SUCCESS_KIT_SECTIONS.filter((section) =>
            activeSuccessKitTab === 'all' ? true : section.key === activeSuccessKitTab
          ).map((section) => {
            const items = getSuccessKit(portal)[section.key] || []
            return (
              <div className="kit-section" key={section.key}>
                <h3 className="kit-title">{section.label}</h3>
                <ul className="kit-list">
                  {items.map((item, itemIndex) => (
                    <li className="kit-item" key={`${section.key}-${itemIndex}`}>
                      {item.link ? (
                        <a
                          className="kit-item__title kit-item__link"
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <div className="kit-item__title">{item.title}</div>
                      )}
                      {item.tags && (
                        <div className="kit-item__tags">
                          {item.tags.split(',').map((tag) => (
                            <span className="kit-item__tag" key={tag.trim()}>
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
      {isServicesPortal(portal) && renderServiceList(portal)}
      {isShopPortal(portal) && renderShopAuthSection()}
      {isShopPortal(portal) && (
        <div className="shop-section">
          <div className="shop-label">Currency</div>
          <select
            className="shop-select"
            value={activeCurrency}
            onChange={(event) => setActiveCurrency(event.target.value)}
            aria-label="Currency"
          >
            {SHOP_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
          <div className="shop-label">Category</div>
          <div className="shop-tabs" role="tablist" aria-label="Shop categories">
            {SHOP_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`shop-tab${activeShopTab === tab.key ? ' is-active' : ''}`}
                onClick={() => setActiveShopTab(tab.key)}
                role="tab"
                aria-selected={activeShopTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {getShop(portal).enabled ? (
            <div className="shop-grid">
              {getShop(portal).items
                .filter((item) =>
                  activeShopTab === 'all' ? true : item.category === activeShopTab
                )
                .map((item, itemIndex) => (
                  <div className="shop-card" key={`${item.title}-${itemIndex}`}>
                    <div className="shop-card__title">{item.title}</div>
                    <div className="shop-card__price">
                      {formatCurrencyAmount(
                        getItemAmount(
                          item,
                          activeCurrency,
                          getShop(portal).currency_rates
                        ),
                        activeCurrency
                      )}
                    </div>
                    <button
                      className="shop-card__cta"
                      type="button"
                      onClick={() => {
                        setActiveShopItem(item)
                        setActiveShopSize('')
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="shop-closed">Shop is currently closed.</p>
          )}
        </div>
      )}
      {isWorkWithMePortal(portal) && (
        <div className="work-form">
          <div className="work-form__grid">
            <label
              className={`work-form__label${workFormFieldErrors.name ? ' work-form__label--error' : ''}`}
            >
              Name
              <input
                className={`work-form__input${workFormFieldErrors.name ? ' work-form__input--error' : ''}`}
                value={workForm.name}
                onChange={(event) =>
                  updateWorkFormField('name', event.target.value)
                }
                required
              />
              {workFormFieldErrors.name && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
            <label
              className={`work-form__label${workFormFieldErrors.email ? ' work-form__label--error' : ''}`}
            >
              Email
              <input
                className={`work-form__input${workFormFieldErrors.email ? ' work-form__input--error' : ''}`}
                type="email"
                value={workForm.email}
                onChange={(event) =>
                  updateWorkFormField('email', event.target.value)
                }
                required
              />
              {workFormFieldErrors.email && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
            <label
              className={`work-form__label${workFormFieldErrors.phone ? ' work-form__label--error' : ''}`}
            >
              Phone number
              <input
                className={`work-form__input${workFormFieldErrors.phone ? ' work-form__input--error' : ''}`}
                value={workForm.phone}
                onChange={(event) =>
                  updateWorkFormField('phone', event.target.value)
                }
                required
              />
              {workFormFieldErrors.phone && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
            {workFormContext !== 'portfolio' && (
              <label
                className={`work-form__label${workFormFieldErrors.service ? ' work-form__label--error' : ''}`}
              >
                Service
                <select
                  className={`work-form__input${workFormFieldErrors.service ? ' work-form__input--error' : ''}`}
                  value={workForm.service}
                  onChange={(event) =>
                    updateWorkFormField('service', event.target.value)
                  }
                  required
                >
                  <option value="">Select</option>
                  {getWorkFormConfig(portal).services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {workFormFieldErrors.service && (
                  <span className="work-form__hint">Required</span>
                )}
              </label>
            )}
            <label
              className={`work-form__label${workFormFieldErrors.industry ? ' work-form__label--error' : ''}`}
            >
              Profession / Industry
              <select
                className={`work-form__input${workFormFieldErrors.industry ? ' work-form__input--error' : ''}`}
                value={workForm.industry}
                onChange={(event) =>
                  updateWorkFormField('industry', event.target.value)
                }
                required
              >
                <option value="">Select</option>
                {getWorkFormConfig(portal).industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {workFormFieldErrors.industry && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
            <label className="work-form__label">
              Other
              <input
                className="work-form__input"
                value={workForm.other}
                onChange={(event) =>
                  updateWorkFormField('other', event.target.value)
                }
              />
            </label>
            <label
              className={`work-form__label work-form__label--full${workFormFieldErrors.message ? ' work-form__label--error' : ''}`}
            >
              Message
              <textarea
                className={`work-form__input${workFormFieldErrors.message ? ' work-form__input--error' : ''}`}
                value={workForm.message}
                onChange={(event) =>
                  updateWorkFormField('message', event.target.value)
                }
                rows={4}
                required
              />
              {workFormFieldErrors.message && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
          </div>
          <div className="schedule-card">
            <div className="schedule-card__header">
              <div className="schedule-card__title">Booking date</div>
              <div className="schedule-card__nav">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <span>{monthLabel}</span>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
            </div>
            <div className="schedule-calendar">
              <div className="schedule-calendar__weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="schedule-calendar__grid">
                {calendarDays.map((day, index) => {
                  const inMonth = day.getMonth() === calendarMonth.getMonth()
                  const isPast = day < todayDateObj
                  const value = formatDateValue(day)
                  const isSelected = workForm.date === value
                  const isToday = formatDateValue(day) === todayDate
                  return (
                    <button
                      key={`${value}-${index}`}
                      type="button"
                      className={`schedule-day${
                        inMonth ? '' : ' schedule-day--outside'
                      }${isSelected ? ' schedule-day--selected' : ''}${
                        isToday ? ' schedule-day--today' : ''
                      }`}
                      onClick={() => updateWorkFormField('date', value)}
                      disabled={!inMonth || isPast}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
              {workFormFieldErrors.date && (
                <div className="schedule-card__error">Required</div>
              )}
            </div>
            <div className="schedule-times">
              <div className="schedule-times__header">
                <div className="schedule-times__label">{selectedDateLabel}</div>
                <div className="schedule-times__toggle">
                  <button
                    type="button"
                    className={timeFormat === '12h' ? 'is-active' : ''}
                    onClick={() => setTimeFormat('12h')}
                  >
                    12h
                  </button>
                  <button
                    type="button"
                    className={timeFormat === '24h' ? 'is-active' : ''}
                    onClick={() => setTimeFormat('24h')}
                  >
                    24h
                  </button>
                </div>
              </div>
              <div className="schedule-times__list">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`schedule-time${
                      workForm.time === slot ? ' is-active' : ''
                    }`}
                    onClick={() => updateWorkFormField('time', slot)}
                  >
                    {formatTimeLabel(slot)}
                  </button>
                ))}
              </div>
              {workFormFieldErrors.time && (
                <div className="schedule-card__error">Required</div>
              )}
            </div>
            <label
              className={`work-form__label${
                workFormFieldErrors.timezone ? ' work-form__label--error' : ''
              }`}
            >
              Timezone
              <select
                className={`work-form__input${
                  workFormFieldErrors.timezone ? ' work-form__input--error' : ''
                }`}
                value={workForm.timezone}
                onChange={(event) =>
                  updateWorkFormField('timezone', event.target.value)
                }
                required
              >
                <option value="">Select</option>
                {getWorkFormConfig(portal).timezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
              {workFormFieldErrors.timezone && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
          </div>
          <div className="work-form__grid">
            <label
              className={`work-form__label${workFormFieldErrors.meeting_mode ? ' work-form__label--error' : ''}`}
            >
              Mode of meeting
              <select
                className={`work-form__input${workFormFieldErrors.meeting_mode ? ' work-form__input--error' : ''}`}
                value={workForm.meeting_mode}
                onChange={(event) =>
                  updateWorkFormField('meeting_mode', event.target.value)
                }
                required
              >
                <option value="">Select</option>
                {getWorkFormConfig(portal).meeting_modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              {workFormFieldErrors.meeting_mode && (
                <span className="work-form__hint">Required</span>
              )}
            </label>
          </div>
          {workFormError && <p className="work-form__error">{workFormError}</p>}
          {workFormStatus && <p className="work-form__status">{workFormStatus}</p>}
          <label
            className={`work-form__label work-form__label--full work-form__checkbox${workFormFieldErrors.agreement ? ' work-form__label--error' : ''}`}
          >
            <input
              className={`work-form__input${workFormFieldErrors.agreement ? ' work-form__input--error' : ''}`}
              type="checkbox"
              checked={workForm.agreement}
              onChange={(event) =>
                updateWorkFormField('agreement', event.target.checked)
              }
              required
            />
            <span>{getWorkFormConfig(portal).agreement_label}</span>
            {workFormFieldErrors.agreement && (
              <span className="work-form__hint">Required</span>
            )}
          </label>
          <button
            type="button"
            className="work-form__submit"
            onClick={handleWorkFormSubmit}
          >
            Book call
          </button>
        </div>
      )}
      {portal.href && portal.href !== '#' && (
        <a className="modal__link" href={portal.href} target="_blank" rel="noreferrer">
          Open link
        </a>
      )}
    </>
  );

  const updateWorkFormField = (field, value) => {
    setWorkForm((prevForm) => ({ ...prevForm, [field]: value }))
    setWorkFormFieldErrors((prevErrors) => {
      if (!prevErrors[field]) {
        return prevErrors
      }
      const nextErrors = { ...prevErrors }
      delete nextErrors[field]
      return nextErrors
    })
  }

  if (isAdminView) {
    return (
      <div className="page mx-auto max-w-3xl px-5 pb-10 pt-9 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="admin">
          <div className="admin__header">
            <div>
              <p className="admin__kicker">Admin Portal</p>
              <h1 className="admin__title font-display">Content Control</h1>
            </div>
            <div className="admin__actions">
              <button
                type="button"
                className="admin__button admin__button--ghost"
                onClick={() => {
                  window.location.hash = ''
                }}
              >
                View site
              </button>
              {session && (
                <button
                  type="button"
                  className="admin__button admin__button--ghost"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="admin__alert">
              Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to enable
              login.
            </div>
          )}

          {error && <div className="admin__alert admin__alert--error">{error}</div>}
          {status && (
            <div className="admin__alert admin__alert--success">{status}</div>
          )}

          {!session ? (
            <form className="admin__panel" onSubmit={handleAuthSubmit}>
              <div className="admin__grid">
                <label className="admin__label">
                  Email
                  <input
                    className="admin__input"
                    type="email"
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                  />
                </label>
                <label className="admin__label">
                  Password
                  <input
                    className="admin__input"
                    type="password"
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="admin__actions">
                <button
                  className="admin__button"
                  type="submit"
                  disabled={loading || !isSupabaseConfigured}
                >
                  Sign in
                </button>
              </div>
            </form>
          ) : !isAdminUser ? (
            <div className="admin__panel">
              <div className="admin__alert admin__alert--error">
                This account does not have admin access.
              </div>
              <div className="admin__actions">
                <button
                  type="button"
                  className="admin__button admin__button--ghost"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="admin__panel">
              <div className="admin__nav">
                <button
                  type="button"
                  onClick={() => handleAdminNav('content')}
                  className={activeAdminPanel === 'content' ? 'is-active' : ''}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminNav('navigation')}
                  className={activeAdminPanel === 'navigation' ? 'is-active' : ''}
                >
                  Navigation
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminNav('orders')}
                  className={activeAdminPanel === 'orders' ? 'is-active' : ''}
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => handleAdminNav('requests')}
                  className={activeAdminPanel === 'requests' ? 'is-active' : ''}
                >
                  Requests
                </button>
              </div>

              {activeAdminPanel === 'content' && (
                <div className="admin__section admin__section--panel">
                  <h2 className="admin__subtitle">Hero Content</h2>
                  <div className="admin__grid">
                  <label className="admin__label">
                    Eyebrow
                    <input
                      className="admin__input"
                      value={draftSite.hero_eyebrow}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          hero_eyebrow: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Tagline
                    <input
                      className="admin__input"
                      value={draftSite.hero_tagline}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          hero_tagline: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Subline
                    <input
                      className="admin__input"
                      value={draftSite.hero_subline}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          hero_subline: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Logo URL
                    <input
                      className="admin__input"
                      value={draftSite.logo_url}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          logo_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Header Logo URL
                    <input
                      className="admin__input"
                      value={draftSite.header_logo_url}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          header_logo_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Footer Text
                    <input
                      className="admin__input"
                      value={draftSite.footer_text}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          footer_text: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Instagram URL
                    <input
                      className="admin__input"
                      value={draftSite.instagram_url}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          instagram_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    TikTok URL
                    <input
                      className="admin__input"
                      value={draftSite.tiktok_url}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          tiktok_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    YouTube URL
                    <input
                      className="admin__input"
                      value={draftSite.youtube_url}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          youtube_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Behance URL
                    <input
                      className="admin__input"
                      value={draftSite.behance_url || ''}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          behance_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Dribbble URL
                    <input
                      className="admin__input"
                      value={draftSite.dribbble_url || ''}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          dribbble_url: event.target.value,
                        })
                      }
                    />
                  </label>
                  </div>
                  <div className="admin__section">
                <h2 className="admin__subtitle">About VAKES</h2>
                <div className="admin__grid">
                  <label className="admin__label">
                    Image URL
                    <input
                      className="admin__input"
                      value={getAboutSection(draftSite).image_url || ''}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            image_url: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Bio
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={getAboutSection(draftSite).bio || ''}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            bio: event.target.value,
                          },
                        })
                      }
                      rows={4}
                    />
                  </label>
                  <label className="admin__label">
                    Email
                    <input
                      className="admin__input"
                      value={getAboutSection(draftSite).email || ''}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            email: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Phone
                    <input
                      className="admin__input"
                      value={getAboutSection(draftSite).phone || ''}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            phone: event.target.value,
                          },
                        })
                      }
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Team (one per line)
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={(getAboutSection(draftSite).team || []).join('\n')}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            team: event.target.value
                              .split('\n')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      rows={3}
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Partners (one per line)
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={(getAboutSection(draftSite).partners || []).join('\n')}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            partners: event.target.value
                              .split('\n')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      rows={3}
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Blog links (one per line)
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={(getAboutSection(draftSite).blog_links || []).join('\n')}
                      onChange={(event) =>
                        setDraftSite({
                          ...draftSite,
                          about_section: {
                            ...getAboutSection(draftSite),
                            blog_links: event.target.value
                              .split('\n')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      rows={3}
                    />
                  </label>
                </div>
              </div>
              <div className="admin__section">
                <h2 className="admin__subtitle">Portfolio</h2>
                <div className="admin__grid">
                  <label className="admin__label">
                    Name
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).name || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ name: event.target.value })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Title
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).title || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ title: event.target.value })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Location
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).location || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ location: event.target.value })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Availability
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).availability || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ availability: event.target.value })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Profile Image URL
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).image_url || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ image_url: event.target.value })
                      }
                    />
                  </label>
                  <label className="admin__label">
                    CV PDF URL
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).cv_url || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ cv_url: event.target.value })
                      }
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Summary
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={getPortfolioSection(draftSite).summary || ''}
                      onChange={(event) =>
                        updatePortfolioSection({ summary: event.target.value })
                      }
                      rows={3}
                    />
                  </label>
                  <label className="admin__label">
                    Contact Email
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).contact.email || ''}
                      onChange={(event) =>
                        updatePortfolioContact('email', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin__label">
                    CTA Headline
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).contact.cta || ''}
                      onChange={(event) =>
                        updatePortfolioContact('cta', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin__label">
                    LinkedIn URL
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).socials.linkedin || ''}
                      onChange={(event) =>
                        updatePortfolioSocial('linkedin', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin__label">
                    GitHub URL
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).socials.github || ''}
                      onChange={(event) =>
                        updatePortfolioSocial('github', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin__label">
                    X/Twitter URL
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).socials.twitter || ''}
                      onChange={(event) =>
                        updatePortfolioSocial('twitter', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin__label">
                    Website URL
                    <input
                      className="admin__input"
                      value={getPortfolioSection(draftSite).socials.website || ''}
                      onChange={(event) =>
                        updatePortfolioSocial('website', event.target.value)
                      }
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Focus Areas (one per line)
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={(getPortfolioSection(draftSite).focus || []).join('\n')}
                      onChange={(event) =>
                        updatePortfolioList(
                          'focus',
                          event.target.value
                            .split('\n')
                            .map((item) => item.trim())
                            .filter(Boolean)
                        )
                      }
                      rows={3}
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Skills (one per line)
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={(getPortfolioSection(draftSite).skills || []).join('\n')}
                      onChange={(event) =>
                        updatePortfolioList(
                          'skills',
                          event.target.value
                            .split('\n')
                            .map((item) => item.trim())
                            .filter(Boolean)
                        )
                      }
                      rows={3}
                    />
                  </label>
                  <label className="admin__label admin__label--full">
                    Tools (one per line)
                    <textarea
                      className="admin__input admin__input--textarea"
                      value={(getPortfolioSection(draftSite).tools || []).join('\n')}
                      onChange={(event) =>
                        updatePortfolioList(
                          'tools',
                          event.target.value
                            .split('\n')
                            .map((item) => item.trim())
                            .filter(Boolean)
                        )
                      }
                      rows={3}
                    />
                  </label>
                </div>
                <div className="admin__section-header">
                  <h3 className="admin__subtitle">Highlights</h3>
                  <button
                    type="button"
                    className="admin__button admin__button--ghost"
                    onClick={handleAddPortfolioHighlight}
                  >
                    Add highlight
                  </button>
                </div>
                <div className="admin__list">
                  {getPortfolioSection(draftSite).highlights.map((item, index) => (
                    <div className="admin__card" key={`portfolio-highlight-${index}`}>
                      <div className="admin__grid">
                        <label className="admin__label">
                          Label
                          <input
                            className="admin__input"
                            value={item.label || ''}
                            onChange={(event) =>
                              handlePortfolioHighlightChange(
                                index,
                                'label',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label">
                          Value
                          <input
                            className="admin__input"
                            value={item.value || ''}
                            onChange={(event) =>
                              handlePortfolioHighlightChange(
                                index,
                                'value',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label">
                          Icon URL (SVG)
                          <input
                            className="admin__input"
                            value={item.icon_url || ''}
                            onChange={(event) =>
                              handlePortfolioHighlightChange(
                                index,
                                'icon_url',
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="admin__button admin__button--ghost"
                        onClick={() => handleRemovePortfolioHighlight(index)}
                      >
                        Remove highlight
                      </button>
                    </div>
                  ))}
                </div>
                <div className="admin__section-header">
                  <h3 className="admin__subtitle">Projects</h3>
                  <button
                    type="button"
                    className="admin__button admin__button--ghost"
                    onClick={handleAddPortfolioProject}
                  >
                    Add project
                  </button>
                </div>
                <div className="admin__list">
                  {getPortfolioSection(draftSite).projects.map((project, index) => (
                    <div className="admin__card" key={`portfolio-project-${index}`}>
                      <div className="admin__grid">
                        <label className="admin__label">
                          Title
                          <input
                            className="admin__input"
                            value={project.title || ''}
                            onChange={(event) =>
                              handlePortfolioProjectChange(
                                index,
                                'title',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label">
                          Stack
                          <input
                            className="admin__input"
                            value={project.stack || ''}
                            onChange={(event) =>
                              handlePortfolioProjectChange(
                                index,
                                'stack',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label admin__label--full">
                          Description
                          <textarea
                            className="admin__input admin__input--textarea"
                            value={project.description || ''}
                            onChange={(event) =>
                              handlePortfolioProjectChange(
                                index,
                                'description',
                                event.target.value
                              )
                            }
                            rows={3}
                          />
                        </label>
                        <label className="admin__label admin__label--full">
                          Impact
                          <textarea
                            className="admin__input admin__input--textarea"
                            value={project.impact || ''}
                            onChange={(event) =>
                              handlePortfolioProjectChange(
                                index,
                                'impact',
                                event.target.value
                              )
                            }
                            rows={2}
                          />
                        </label>
                        <label className="admin__label admin__label--full">
                          Media URL
                          <input
                            className="admin__input"
                            value={project.media_url || ''}
                            onChange={(event) =>
                              handlePortfolioProjectChange(
                                index,
                                'media_url',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label">
                          Media Type
                          <select
                            className="admin__input"
                            value={project.media_type || 'image'}
                            onChange={(event) =>
                              handlePortfolioProjectChange(
                                index,
                                'media_type',
                                event.target.value
                              )
                            }
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="youtube">YouTube</option>
                          </select>
                        </label>
                      </div>
                      <button
                        type="button"
                        className="admin__button admin__button--ghost"
                        onClick={() => handleRemovePortfolioProject(index)}
                      >
                        Remove project
                      </button>
                    </div>
                  ))}
                </div>
                <div className="admin__section-header">
                  <h3 className="admin__subtitle">Experience</h3>
                  <button
                    type="button"
                    className="admin__button admin__button--ghost"
                    onClick={handleAddPortfolioExperience}
                  >
                    Add role
                  </button>
                </div>
                <div className="admin__list">
                  {getPortfolioSection(draftSite).experience.map((item, index) => (
                    <div className="admin__card" key={`portfolio-exp-${index}`}>
                      <div className="admin__grid">
                        <label className="admin__label">
                          Role
                          <input
                            className="admin__input"
                            value={item.role || ''}
                            onChange={(event) =>
                              handlePortfolioExperienceChange(
                                index,
                                'role',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label admin__label--full">
                          Scope
                          <textarea
                            className="admin__input admin__input--textarea"
                            value={item.scope || ''}
                            onChange={(event) =>
                              handlePortfolioExperienceChange(
                                index,
                                'scope',
                                event.target.value
                              )
                            }
                            rows={2}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        className="admin__button admin__button--ghost"
                        onClick={() => handleRemovePortfolioExperience(index)}
                      >
                        Remove role
                      </button>
                    </div>
                  ))}
                </div>
                  </div>
                </div>
              )}

              {activeAdminPanel === 'navigation' && (
                <div className="admin__section admin__section--panel">
                <div className="admin__section-header">
                  <h2 className="admin__subtitle">Navigation Cards</h2>
                  <button
                    type="button"
                    className="admin__button admin__button--ghost"
                    onClick={handleAddPortal}
                  >
                    Add card
                  </button>
                </div>
                <div className="admin__tabs">
                  {draftPortals.map((portal, index) => (
                    <button
                      type="button"
                      key={`${portal.id}-${index}`}
                      className={activeNavCardIndex === index ? 'is-active' : ''}
                      onClick={() => setActiveNavCardIndex(index)}
                    >
                      {portal.meta || `Card ${index + 1}`}
                    </button>
                  ))}
                </div>
                <div className="admin__portal-list">
                  {draftPortals
                    .filter((_portal, index) => index === activeNavCardIndex)
                    .map((portal) => {
                      const portalIndex = activeNavCardIndex
                      return (
                    <div className="admin__section admin__section--panel" key={`${portal.id}-${portalIndex}`}>
                      <div className="admin__section-header">
                        <h3 className="admin__subtitle">
                          {portal.meta || `Card ${portalIndex + 1}`}
                        </h3>
                      </div>
                      <div className="admin__card">
                      <div className="admin__grid admin__grid--two">
                        <label className="admin__label">
                          Meta
                          <input
                            className="admin__input"
                            value={portal.meta || ''}
                            onChange={(event) =>
                              handlePortalChange(
                                portalIndex,
                                'meta',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label">
                          Title
                          <input
                            className="admin__input"
                            value={portal.title || ''}
                            onChange={(event) =>
                              handlePortalChange(
                                portalIndex,
                                'title',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label admin__label--full">
                          Link
                          <input
                            className="admin__input"
                            value={portal.href || ''}
                            onChange={(event) =>
                              handlePortalChange(
                                portalIndex,
                                'href',
                                event.target.value
                              )
                            }
                          />
                        </label>
                        <label className="admin__label admin__label--full">
                          Illustration URL
                          <input
                            className="admin__input"
                            value={portal.illustration_url || ''}
                            onChange={(event) =>
                              handlePortalChange(
                                portalIndex,
                                'illustration_url',
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </div>
                      {isServicesPortal(portal) && (
                        <div className="admin__services">
                          <div className="admin__section-header">
                            <h3 className="admin__subtitle">Services List</h3>
                            <button
                              type="button"
                              className="admin__button admin__button--ghost"
                              onClick={() => handleAddService(portalIndex)}
                            >
                              Add service
                            </button>
                          </div>
                          <div className="admin__list">
                            {(portal.services?.length
                              ? portal.services
                              : DEFAULT_SERVICES
                            ).map((service, serviceIndex) => (
                              <div
                                className="admin__card"
                                key={`${portal.id}-service-${serviceIndex}`}
                              >
                                <div className="admin__grid">
                                  <label className="admin__label">
                                    Service Title
                                    <input
                                      className="admin__input"
                                      value={service.title || ''}
                                      onChange={(event) =>
                                        handleServiceChange(
                                          portalIndex,
                                          serviceIndex,
                                          'title',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Image URL
                                    <input
                                      className="admin__input"
                                      value={service.image || ''}
                                      onChange={(event) =>
                                        handleServiceChange(
                                          portalIndex,
                                          serviceIndex,
                                          'image',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Media URLs
                                  </label>
                                  <div className="admin__list">
                                    {(service.media || []).map((item, mediaIndex) => (
                                      <div
                                        className="admin__media-row"
                                        key={`${portal.id}-service-${serviceIndex}-${mediaIndex}`}
                                      >
                                        <input
                                          className="admin__input"
                                          value={item}
                                          onChange={(event) =>
                                            handleServiceMediaChange(
                                              portalIndex,
                                              serviceIndex,
                                              mediaIndex,
                                              event.target.value
                                            )
                                          }
                                        />
                                        <button
                                          type="button"
                                          className="admin__button admin__button--ghost"
                                          onClick={() =>
                                            handleRemoveServiceMedia(
                                              portalIndex,
                                              serviceIndex,
                                              mediaIndex
                                            )
                                          }
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      className="admin__button admin__button--ghost"
                                      onClick={() =>
                                        handleAddServiceMedia(portalIndex, serviceIndex)
                                      }
                                    >
                                      Add media
                                    </button>
                                  </div>
                                  <label className="admin__label">
                                    Description
                                    <textarea
                                      className="admin__input admin__input--textarea"
                                      value={service.description || ''}
                                      onChange={(event) =>
                                        handleServiceChange(
                                          portalIndex,
                                          serviceIndex,
                                          'description',
                                          event.target.value
                                        )
                                      }
                                      rows={3}
                                    />
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  className="admin__button admin__button--ghost"
                                  onClick={() =>
                                    handleRemoveService(portalIndex, serviceIndex)
                                  }
                                >
                                  Remove service
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {isSuccessKitPortal(portal) && (
                        <div className="admin__services">
                          {SUCCESS_KIT_SECTIONS.map((section) => {
                            const items = getSuccessKit(portal)[section.key] || []
                            return (
                              <div className="admin__section" key={section.key}>
                                <div className="admin__section-header">
                                  <h3 className="admin__subtitle">{section.label}</h3>
                                  <button
                                    type="button"
                                    className="admin__button admin__button--ghost"
                                    onClick={() =>
                                      handleAddSuccessKitItem(portalIndex, section.key)
                                    }
                                  >
                                    Add item
                                  </button>
                                </div>
                                <div className="admin__list">
                                  {items.map((item, itemIndex) => (
                                    <div
                                      className="admin__card"
                                      key={`${portal.id}-${section.key}-${itemIndex}`}
                                    >
                                      <div className="admin__grid">
                                        <label className="admin__label">
                                          Title
                                          <input
                                            className="admin__input"
                                            value={item.title || ''}
                                            onChange={(event) =>
                                              handleSuccessKitChange(
                                                portalIndex,
                                                section.key,
                                                itemIndex,
                                                'title',
                                                event.target.value
                                              )
                                            }
                                          />
                                        </label>
                                        <label className="admin__label">
                                          Tags (comma separated)
                                          <input
                                            className="admin__input"
                                            value={item.tags || ''}
                                            onChange={(event) =>
                                              handleSuccessKitChange(
                                                portalIndex,
                                                section.key,
                                                itemIndex,
                                                'tags',
                                                event.target.value
                                              )
                                            }
                                          />
                                        </label>
                                        <label className="admin__label">
                                          Link
                                          <input
                                            className="admin__input"
                                            value={item.link || ''}
                                            onChange={(event) =>
                                              handleSuccessKitChange(
                                                portalIndex,
                                                section.key,
                                                itemIndex,
                                                'link',
                                                event.target.value
                                              )
                                            }
                                          />
                                        </label>
                                        <label className="admin__label">
                                          Tags (comma separated)
                                        </label>
                                      </div>
                                      <button
                                        type="button"
                                        className="admin__button admin__button--ghost"
                                        onClick={() =>
                                          handleRemoveSuccessKitItem(
                                            portalIndex,
                                            section.key,
                                            itemIndex
                                          )
                                        }
                                      >
                                        Remove item
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {isShopPortal(portal) && (
                        <div className="admin__services">
                          <div className="admin__section-header">
                            <h3 className="admin__subtitle">Shop Settings</h3>
                            <label className="admin__toggle">
                              <input
                                type="checkbox"
                                checked={getShop(portal).enabled}
                                onChange={(event) =>
                                  handleShopToggle(portalIndex, event.target.checked)
                                }
                              />
                              <span>Shop open</span>
                            </label>
                          </div>
                          <div className="admin__grid">
                            <label className="admin__label">
                              Default Currency
                              <select
                                className="admin__input"
                                value={getShop(portal).currency || 'NGN'}
                                onChange={(event) =>
                                  handleShopConfigChange(
                                    portalIndex,
                                    'currency',
                                    event.target.value
                                  )
                                }
                              >
                                <option value="NGN">NGN</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </label>
                            <label className="admin__label">
                              NGN per USD
                              <input
                                className="admin__input"
                                value={getShop(portal).currency_rates?.USD ?? ''}
                                onChange={(event) =>
                                  handleShopConfigChange(
                                    portalIndex,
                                    'currency_rates',
                                    {
                                      ...getShop(portal).currency_rates,
                                      USD:
                                        Number.parseFloat(event.target.value) || 0,
                                    }
                                  )
                                }
                              />
                            </label>
                            <label className="admin__label">
                              NGN per GBP
                              <input
                                className="admin__input"
                                value={getShop(portal).currency_rates?.GBP ?? ''}
                                onChange={(event) =>
                                  handleShopConfigChange(
                                    portalIndex,
                                    'currency_rates',
                                    {
                                      ...getShop(portal).currency_rates,
                                      GBP:
                                        Number.parseFloat(event.target.value) || 0,
                                    }
                                  )
                                }
                              />
                            </label>
                            <label className="admin__label">
                              NGN per EUR
                              <input
                                className="admin__input"
                                value={getShop(portal).currency_rates?.EUR ?? ''}
                                onChange={(event) =>
                                  handleShopConfigChange(
                                    portalIndex,
                                    'currency_rates',
                                    {
                                      ...getShop(portal).currency_rates,
                                      EUR:
                                        Number.parseFloat(event.target.value) || 0,
                                    }
                                  )
                                }
                              />
                            </label>
                          </div>
                          <div className="admin__section-header">
                            <h3 className="admin__subtitle">Products</h3>
                            <button
                              type="button"
                              className="admin__button admin__button--ghost"
                              onClick={() => handleAddShopItem(portalIndex)}
                            >
                              Add product
                            </button>
                          </div>
                          <div className="admin__list">
                            {getShop(portal).items.map((item, itemIndex) => (
                              <div
                                className="admin__card"
                                key={`${portal.id}-shop-${itemIndex}`}
                              >
                                <div className="admin__grid">
                                  <label className="admin__label">
                                    Title
                                    <input
                                      className="admin__input"
                                      value={item.title || ''}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'title',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Price (NGN)
                                    <input
                                      className="admin__input"
                                      value={item.price_ngn ?? ''}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'price_ngn',
                                          Number.parseFloat(event.target.value) || 0
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Image URL
                                    <input
                                      className="admin__input"
                                      value={item.image || ''}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'image',
                                          event.target.value
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Gallery Images (comma separated)
                                    <input
                                      className="admin__input"
                                      value={(item.images || []).join(', ')}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'images',
                                          event.target.value
                                            .split(',')
                                            .map((value) => value.trim())
                                            .filter(Boolean)
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Sizes (comma separated)
                                    <input
                                      className="admin__input"
                                      value={(item.sizes || []).join(', ')}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'sizes',
                                          event.target.value
                                            .split(',')
                                            .map((value) => value.trim())
                                            .filter(Boolean)
                                        )
                                      }
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Description
                                    <textarea
                                      className="admin__input admin__input--textarea"
                                      value={item.description || ''}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'description',
                                          event.target.value
                                        )
                                      }
                                      rows={3}
                                    />
                                  </label>
                                  <label className="admin__label">
                                    Category
                                    <select
                                      className="admin__input"
                                      value={item.category || 'art'}
                                      onChange={(event) =>
                                        handleShopItemChange(
                                          portalIndex,
                                          itemIndex,
                                          'category',
                                          event.target.value
                                        )
                                      }
                                    >
                                      <option value="art">Art</option>
                                      <option value="apparel">Apparel</option>
                                      <option value="accessories">Accessories</option>
                                    </select>
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  className="admin__button admin__button--ghost"
                                  onClick={() => handleRemoveShopItem(portalIndex, itemIndex)}
                                >
                                  Remove product
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {isWorkWithMePortal(portal) && (
                        <div className="admin__services">
                          <div className="admin__section-header">
                            <h3 className="admin__subtitle">Work With Me Form</h3>
                          </div>
                          <div className="admin__grid">
                            <label className="admin__label">
                              Services (comma separated)
                              <input
                                className="admin__input"
                                value={(getWorkFormConfig(portal).services || []).join(
                                  ', '
                                )}
                                onChange={(event) =>
                                  handleShopConfigChange(portalIndex, 'work_form', {
                                    ...getWorkFormConfig(portal),
                                    services: event.target.value
                                      .split(',')
                                      .map((value) => value.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </label>
                            <label className="admin__label">
                              Industries (comma separated)
                              <input
                                className="admin__input"
                                value={(getWorkFormConfig(portal).industries || []).join(
                                  ', '
                                )}
                                onChange={(event) =>
                                  handleShopConfigChange(portalIndex, 'work_form', {
                                    ...getWorkFormConfig(portal),
                                    industries: event.target.value
                                      .split(',')
                                      .map((value) => value.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </label>
                            <label className="admin__label">
                              Meeting Modes (comma separated)
                              <input
                                className="admin__input"
                                value={(
                                  getWorkFormConfig(portal).meeting_modes || []
                                ).join(', ')}
                                onChange={(event) =>
                                  handleShopConfigChange(portalIndex, 'work_form', {
                                    ...getWorkFormConfig(portal),
                                    meeting_modes: event.target.value
                                      .split(',')
                                      .map((value) => value.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </label>
                            <label className="admin__label">
                              Timezones (comma separated)
                              <input
                                className="admin__input"
                                value={(getWorkFormConfig(portal).timezones || []).join(
                                  ', '
                                )}
                                onChange={(event) =>
                                  handleShopConfigChange(portalIndex, 'work_form', {
                                    ...getWorkFormConfig(portal),
                                    timezones: event.target.value
                                      .split(',')
                                      .map((value) => value.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </label>
                            <label className="admin__label">
                              Agreement Text
                              <input
                                className="admin__input"
                                value={getWorkFormConfig(portal).agreement_label || ''}
                                onChange={(event) =>
                                  handleShopConfigChange(portalIndex, 'work_form', {
                                    ...getWorkFormConfig(portal),
                                    agreement_label: event.target.value,
                                  })
                                }
                              />
                            </label>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        className="admin__button admin__button--ghost"
                        onClick={() => handleRemovePortal(portalIndex)}
                      >
                        Remove
                      </button>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
              )}

              {activeAdminPanel === 'orders' && (
                <div className="admin__section admin__section--panel">
                  <div className="admin__section-header">
                    <h2 className="admin__subtitle">Orders</h2>
                    {ordersLoading && <span className="admin__kicker">Loading...</span>}
                  </div>
                <div className="admin__table">
                  <div className="admin__table-header">
                    <span>Customer</span>
                    <span>Product</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>
                  {!ordersLoading && (!orders || orders.length === 0) && (
                    <div className="admin__table-row">
                      <div className="admin__table-meta">No orders yet.</div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  )}
                  {(orders || []).map((order) => (
                    <div className="admin__table-row" key={order.id}>
                      <div>
                        <div>{order.customer_name}</div>
                        <div className="admin__table-meta">{order.customer_email}</div>
                        <div className="admin__table-meta">{order.customer_phone}</div>
                        <div className="admin__table-meta">{order.customer_address}</div>
                      </div>
                      <div>
                        <div>{order.product_title}</div>
                        <div className="admin__table-meta">
                          {order.product_price} · {order.size}
                        </div>
                      </div>
                      <div>
                        <select
                          className="admin__input"
                          value={order.status || 'payment_pending'}
                          onChange={(event) =>
                            handleOrderStatusChange(order.id, event.target.value)
                          }
                        >
                          <option value="payment_pending">Payment pending</option>
                          <option value="paid">Paid</option>
                          <option value="fulfillment">Fulfillment</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="admin__table-actions">
                        <button
                          type="button"
                          className="admin__button admin__button--ghost"
                          onClick={() => handleOrderSave(order.id, order.status)}
                        >
                          Save
                        </button>
                        <a
                          className="admin__button admin__button--ghost"
                          href={`mailto:${order.customer_email}`}
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {activeAdminPanel === 'requests' && (
                <div className="admin__section admin__section--panel">
                  <div className="admin__section-header">
                    <h2 className="admin__subtitle">Work Requests</h2>
                    {workRequestsLoading && (
                      <span className="admin__kicker">Loading...</span>
                    )}
                  </div>
                  <div className="admin__table">
                    <div className="admin__table-header">
                      <span>Name</span>
                      <span>Request</span>
                      <span>Status</span>
                      <span>Actions</span>
                    </div>
                    {!workRequestsLoading &&
                      (!workRequests || workRequests.length === 0) && (
                        <div className="admin__table-row">
                          <div className="admin__table-meta">No requests yet.</div>
                          <div></div>
                          <div></div>
                          <div></div>
                        </div>
                      )}
                    {(workRequests || []).map((request) => (
                      <div className="admin__table-row" key={request.id}>
                        <div>
                          <div>{request.name}</div>
                          <div className="admin__table-meta">{request.email}</div>
                          <div className="admin__table-meta">{request.phone}</div>
                        </div>
                        <div>
                          <div>{request.service}</div>
                          <div className="admin__table-meta">
                            {request.industry}
                            {request.other ? ` · ${request.other}` : ''}
                          </div>
                          <div className="admin__table-meta">
                            {request.date} · {request.time} · {request.timezone}
                          </div>
                        </div>
                        <div>
                          <select
                            className="admin__input"
                            value={request.status || 'new'}
                            onChange={(event) =>
                              handleWorkRequestStatusChange(
                                request.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="new">New</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                        <div className="admin__table-actions">
                          <button
                            type="button"
                            className="admin__button admin__button--ghost"
                            onClick={() =>
                              handleWorkRequestSave(request.id, request.status)
                            }
                          >
                            Save
                          </button>
                          <a
                            className="admin__button admin__button--ghost"
                            href={`mailto:${request.email}`}
                          >
                            Email
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="admin__actions">
                <button
                  type="button"
                  className="admin__button"
                  onClick={handleSaveAll}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save all changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAboutSection = (showTitle = true) => (
    <section className="home-about">
      {showTitle && (
        <div className="home-section__header">
          <h2 className="home-section__title home-section__title--scribble font-title">
            About VAKES
          </h2>
        </div>
      )}
      <div className="home-about__grid">
        {aboutSection.image_url ? (
          <div className="home-about__media">
            <img
              src={aboutSection.image_url}
              alt="VAKES studio"
              onContextMenu={preventContextMenu}
              onDragStart={preventDragStart}
              onCopy={preventCopy}
              onCut={preventCopy}
              draggable={false}
            />
          </div>
        ) : null}
        <div className="home-about__content">
          <p className="home-about__bio">{aboutSection.bio}</p>
          <div className="home-about__meta">
            <div>
              <p className="home-about__label">Team</p>
              <ul>
                {(aboutSection.team || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="home-about__label">Partners</p>
              <ul>
                {(aboutSection.partners || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          {(aboutSection.blog_links || []).length > 0 && (
            <div className="home-about__links">
              <p className="home-about__label">Journal</p>
              <ul>
                {aboutSection.blog_links.map((link) => (
                  <li key={link}>
                    <a href={link} target="_blank" rel="noreferrer">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="home-about__socials">
            <p className="home-about__label">Socials</p>
            <ul>
              {site.instagram_url && (
                <li>
                  <a href={site.instagram_url} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6zm0 1.8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm4.6-.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
                    </svg>
                    Instagram
                  </a>
                </li>
              )}
              {site.tiktok_url && (
                <li>
                  <a href={site.tiktok_url} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M14 3a6.2 6.2 0 0 0 4.4 1.8V7a7.9 7.9 0 0 1-4.4-1.4v7.2a5.8 5.8 0 1 1-5-5.7v2.3a3.5 3.5 0 1 0 2.7 3.4V3h2.3z" />
                    </svg>
                    TikTok
                  </a>
                </li>
              )}
              {site.youtube_url && (
                <li>
                  <a href={site.youtube_url} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C17.9 5 12 5 12 5s-5.9 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9A28.5 28.5 0 0 0 2 12a28.5 28.5 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.8.3 7.7.3 7.7.3s5.9 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28.5 28.5 0 0 0 22 12a28.5 28.5 0 0 0-.4-4.8zM10 15.4V8.6L15.6 12 10 15.4z" />
                    </svg>
                    YouTube
                  </a>
                </li>
              )}
              {behanceUrl && (
                <li>
                  <a href={behanceUrl} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.8 11.4c1.5-.1 2.6-1 2.6-2.6 0-2-1.4-3-4-3H2v12h5.7c2.8 0 4.6-1.2 4.6-3.6 0-2-1.2-3.1-2.5-3.4zM4.4 7.6h2.6c1.1 0 1.8.4 1.8 1.4 0 1.1-.7 1.5-1.9 1.5H4.4V7.6zm2.8 8.2H4.4v-3.4h2.9c1.3 0 2.2.6 2.2 1.7 0 1.3-.9 1.7-2.2 1.7zM19.1 9.2c-2.3 0-4 1.6-4 4.3 0 2.8 1.6 4.4 4.2 4.4 2 0 3.3-1 3.7-2.6h-2c-.2.5-.7.9-1.7.9-1.2 0-1.9-.7-2-2h5.9c.1-2.9-1.3-5-4.1-5zm-2 3.4c.1-1 .8-1.7 1.9-1.7 1.1 0 1.7.6 1.8 1.7h-3.7zM16.6 6.5h4.8V5.2h-4.8v1.3z" />
                    </svg>
                    Behance
                  </a>
                </li>
              )}
              {dribbbleUrl && (
                <li>
                  <a href={dribbbleUrl} target="_blank" rel="noreferrer">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 5.3a8.3 8.3 0 0 1 1.8 4.7 14.5 14.5 0 0 0-6-.1c-.2-.5-.4-.9-.6-1.4a10.7 10.7 0 0 0 4.8-3.2ZM12 3.8a8.1 8.1 0 0 1 5.2 1.9 9.2 9.2 0 0 1-4.4 2.8A36.9 36.9 0 0 0 9.6 4a8.2 8.2 0 0 1 2.4-.2Zm-4.2 1a35.5 35.5 0 0 1 3.2 4.4A30.8 30.8 0 0 1 3.8 10 8.3 8.3 0 0 1 7.8 4.8ZM3.7 12a8.7 8.7 0 0 1 .1-1.3 33.6 33.6 0 0 0 8.1-1.1c.2.4.4.8.6 1.2a13.7 13.7 0 0 0-5.7 6.6A8.3 8.3 0 0 1 3.7 12Zm8.3 8.3a8.1 8.1 0 0 1-4.2-1.2 11.8 11.8 0 0 1 5.3-6.1 24.6 24.6 0 0 1 1.4 5.3 8.1 8.1 0 0 1-2.5 2Zm4-.9a26.3 26.3 0 0 0-1.2-4.7 12.7 12.7 0 0 1 5 .2 8.3 8.3 0 0 1-3.8 4.5Z" />
                    </svg>
                    Dribbble
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div className="home-about__contact">
            <a href={`mailto:${aboutSection.email}`}>{aboutSection.email}</a>
            <span>{aboutSection.phone}</span>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div
      className="page page--light mx-auto max-w-none px-5 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:px-16 xl:px-20"
    >
      {!isPortfolioView && (
        <section className="page-header">
          <div className="page-topbar">
            {!routePortal && !isPortfolioRoute && headerLogoUrl && (
              <div className="page-topbar__logo">
                <img src={headerLogoUrl} alt="VAKES" />
              </div>
            )}
            {!routePortal && !isPortfolioRoute && !isAboutRoute && (
              <button
                type="button"
                className="page-topbar__menu"
                onClick={() => setCardsVisible((prev) => !prev)}
              >
                {cardsVisible ? '✕ Close' : '☰ Menu'}
              </button>
            )}
            {routePortal && (
              <Link
                className="page-topbar__back"
                to="/"
                onClick={() => window.location.assign('/')}
              >
                Back to home
              </Link>
            )}
          </div>
        </section>
      )}
      {isPortfolioView && getPortfolioSection(site).cv_url && (
        <div className="page-topbar">
          <a
            className="page-topbar__cv"
            href={getPortfolioSection(site).cv_url}
            onClick={(event) => {
              event.preventDefault()
              setResumeOpen(true)
            }}
          >
            Resume
          </a>
        </div>
      )}
      {!routePortal && !isPortfolioRoute && !isAboutRoute && (
        <div className="home-layout">
          <section className={`home-hero${cardsVisible ? '' : ' home-hero--cards-hidden'}`}>
            <div className="home-hero__panel">
              <div className="hero-wrap">
                <header className="hero-card">
                  <div className="hero-card__inner flex flex-col items-center text-center">
                  <h1 className="hero-card__eyebrow font-title">
                    {site.hero_eyebrow}
                  </h1>
                  <p className="hero-card__tagline">{site.hero_tagline}</p>
                  {heroMediaUrl ? (
                    <div className="hero-media mt-4">
                      {getYouTubeEmbedUrl(heroMediaUrl) ? (
                      <div
                        className="hero-video"
                        onContextMenu={preventContextMenu}
                        onCopy={preventCopy}
                        onCut={preventCopy}
                      >
                        <iframe
                          src={getYouTubeEmbedUrl(heroMediaUrl)}
                          title="VAKES"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : isVideoUrl(heroMediaUrl) ? (
                      <video
                        className="hero-logo"
                        src={heroMediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controlsList="nodownload noplaybackrate noremoteplayback"
                        disablePictureInPicture
                        disableRemotePlayback
                        onContextMenu={preventContextMenu}
                        onCopy={preventCopy}
                        onCut={preventCopy}
                      />
                    ) : (
                      <div>
                        <img
                          src={heroMediaUrl}
                          alt="VAKES"
                          className="hero-logo"
                          onContextMenu={preventContextMenu}
                          onDragStart={preventDragStart}
                          onCopy={preventCopy}
                          onCut={preventCopy}
                          draggable={false}
                        />
                      </div>
                    )}
                  </div>
                  ) : null}
                  <p className="hero-card__subline">{site.hero_subline}</p>
                </div>
                <div className="hero__confetti" aria-hidden="true"></div>
                </header>
              </div>
            </div>
            <div className={`home-hero__cards${cardsVisible ? ' is-visible' : ' is-hidden'}`}>
              <aside className="hero-rail">
                <nav className="portal-grid mt-6 sm:mt-8" aria-label="Primary">
                  {portalsForRail.map((portal, index) => {
                    const route = portalRoutes.find((item) => item.portal === portal)
                    const content = (
                      <>
                        <div className="portal-card__text">
                          <div className="portal-card__meta">{portal.meta}</div>
                          <h2 className="portal-card__title font-title">
                            {portal.title}
                          </h2>
                        </div>
                        <span className="portal-card__glow" aria-hidden="true"></span>
                      </>
                    )

                    if (isWorkWithMePortal(portal)) {
                      return (
                        <button
                          key={portal.id ?? portal.meta ?? index}
                          type="button"
                          data-animate
                          className="reveal portal-card portal-card--button"
                          onClick={() => {
                            setWorkFormContext('portal')
                            setWorkFormError('')
                            setWorkFormStatus('')
                            setWorkFormFieldErrors({})
                            setWorkModalOpen(true)
                          }}
                        >
                          {content}
                        </button>
                      )
                    }

                    if (portal.href && portal.href !== '#') {
                      return (
                        <a
                          key={portal.id ?? portal.meta ?? index}
                          data-animate
                          href={portal.href}
                          className="reveal portal-card"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {content}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={portal.id ?? portal.meta ?? index}
                        data-animate
                        to={route?.path || '/'}
                        className="reveal portal-card"
                      >
                        {content}
                      </Link>
                    )
                  })}
                  <Link data-animate to="/about" className="reveal portal-card">
                    <div className="portal-card__text">
                      <div className="portal-card__meta">About</div>
                      <h2 className="portal-card__title font-title">About VAKES</h2>
                    </div>
                    <span className="portal-card__glow" aria-hidden="true"></span>
                  </Link>
                </nav>
              </aside>
            </div>
          </section>
        </div>
      )}

      {routePortal && (
        <section
          className={`portal-page${
            isServicesPortal(routePortal.portal)
              ? ' portal-page--services'
              : ''
          }${
            isPortfolioPortal(routePortal.portal) ? ' portal-page--portfolio' : ''
          }${
            isWorkWithMePortal(routePortal.portal) ? ' portal-page--work' : ''
          }`}
        >
          <div className="portal-page__header">
            {!isPortfolioPortal(routePortal.portal) && (
              <p className="portal-page__meta">{routePortal.portal.meta}</p>
            )}
            <h1 className="portal-page__title font-title">
              {isPortfolioPortal(routePortal.portal)
                ? getPortfolioSection(site).name
                : routePortal.portal.title}
            </h1>
          </div>
          <div className="portal-page__body">
            {renderPortalContent(routePortal.portal, routePortal.index)}
          </div>
        </section>
      )}

      {isAboutRoute && !routePortal && (
        <section className="portal-page portal-page--about">
          <div className="portal-page__header">
            <p className="portal-page__meta">About</p>
            <h1 className="portal-page__title font-title">About VAKES</h1>
          </div>
          <div className="portal-page__body">{renderAboutSection(false)}</div>
        </section>
      )}

      {isPortfolioRoute && !routePortal && (
        <section className="portal-page portal-page--portfolio">
          <div className="portal-page__header">
            <h1 className="portal-page__title font-title">
              {getPortfolioSection(site).name}
            </h1>
          </div>
          <div className="portal-page__body">{renderPortfolioContent()}</div>
        </section>
      )}

      {portfolioCallOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            setPortfolioCallOpen(false)
            setWorkFormContext('portal')
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Book a call"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={() => {
                setPortfolioCallOpen(false)
                setWorkFormContext('portal')
              }}
              aria-label="Close modal"
            >
              Close
            </button>
            <p className="modal__meta">Portfolio</p>
            <h2 className="modal__title">Book a Call</h2>
            <div className="work-form">
              <div className="work-form__grid">
                <label
                  className={`work-form__label${workFormFieldErrors.name ? ' work-form__label--error' : ''}`}
                >
                  Name
                  <input
                    className={`work-form__input${workFormFieldErrors.name ? ' work-form__input--error' : ''}`}
                    value={workForm.name}
                    onChange={(event) =>
                      updateWorkFormField('name', event.target.value)
                    }
                    required
                  />
                  {workFormFieldErrors.name && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
                <label
                  className={`work-form__label${workFormFieldErrors.email ? ' work-form__label--error' : ''}`}
                >
                  Email
                  <input
                    className={`work-form__input${workFormFieldErrors.email ? ' work-form__input--error' : ''}`}
                    type="email"
                    value={workForm.email}
                    onChange={(event) =>
                      updateWorkFormField('email', event.target.value)
                    }
                    required
                  />
                  {workFormFieldErrors.email && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
                <label
                  className={`work-form__label${workFormFieldErrors.phone ? ' work-form__label--error' : ''}`}
                >
                  Phone number
                  <input
                    className={`work-form__input${workFormFieldErrors.phone ? ' work-form__input--error' : ''}`}
                    value={workForm.phone}
                    onChange={(event) =>
                      updateWorkFormField('phone', event.target.value)
                    }
                    required
                  />
                  {workFormFieldErrors.phone && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
                <label
                  className={`work-form__label${workFormFieldErrors.industry ? ' work-form__label--error' : ''}`}
                >
                  Profession / Industry
                  <select
                    className={`work-form__input${workFormFieldErrors.industry ? ' work-form__input--error' : ''}`}
                    value={workForm.industry}
                    onChange={(event) =>
                      updateWorkFormField('industry', event.target.value)
                    }
                    required
                  >
                    <option value="">Select</option>
                    {getWorkFormConfig(activeContentPortal || {}).industries.map(
                      (industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      )
                    )}
                  </select>
                  {workFormFieldErrors.industry && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
                <label
                  className={`work-form__label work-form__label--full${workFormFieldErrors.message ? ' work-form__label--error' : ''}`}
                >
                  Message
                  <textarea
                    className={`work-form__input${workFormFieldErrors.message ? ' work-form__input--error' : ''}`}
                    value={workForm.message}
                    onChange={(event) =>
                      updateWorkFormField('message', event.target.value)
                    }
                    rows={4}
                    required
                  />
                  {workFormFieldErrors.message && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
              </div>
              <div className="schedule-card">
                <div className="schedule-card__header">
                  <div className="schedule-card__title">Booking date</div>
                  <div className="schedule-card__nav">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                        )
                      }
                      aria-label="Previous month"
                    >
                      ‹
                    </button>
                    <span>{monthLabel}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth(
                          (prev) =>
                            new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                        )
                      }
                      aria-label="Next month"
                    >
                      ›
                    </button>
                  </div>
                </div>
                <div className="schedule-calendar">
                  <div className="schedule-calendar__weekdays">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                      (day) => (
                        <span key={day}>{day}</span>
                      )
                    )}
                  </div>
                  <div className="schedule-calendar__grid">
                    {calendarDays.map((day, index) => {
                      const inMonth = day.getMonth() === calendarMonth.getMonth()
                      const isPast = day < todayDateObj
                      const value = formatDateValue(day)
                      const isSelected = workForm.date === value
                      const isToday = formatDateValue(day) === todayDate
                      return (
                        <button
                          key={`${value}-${index}`}
                          type="button"
                          className={`schedule-day${
                            inMonth ? '' : ' schedule-day--outside'
                          }${isSelected ? ' schedule-day--selected' : ''}${
                            isToday ? ' schedule-day--today' : ''
                          }`}
                          onClick={() => updateWorkFormField('date', value)}
                          disabled={!inMonth || isPast}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                  {workFormFieldErrors.date && (
                    <div className="schedule-card__error">Required</div>
                  )}
                </div>
                <div className="schedule-times">
                  <div className="schedule-times__header">
                    <div className="schedule-times__label">{selectedDateLabel}</div>
                    <div className="schedule-times__toggle">
                      <button
                        type="button"
                        className={timeFormat === '12h' ? 'is-active' : ''}
                        onClick={() => setTimeFormat('12h')}
                      >
                        12h
                      </button>
                      <button
                        type="button"
                        className={timeFormat === '24h' ? 'is-active' : ''}
                        onClick={() => setTimeFormat('24h')}
                      >
                        24h
                      </button>
                    </div>
                  </div>
                  <div className="schedule-times__list">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`schedule-time${
                          workForm.time === slot ? ' is-active' : ''
                        }`}
                        onClick={() => updateWorkFormField('time', slot)}
                      >
                        {formatTimeLabel(slot)}
                      </button>
                    ))}
                  </div>
                  {workFormFieldErrors.time && (
                    <div className="schedule-card__error">Required</div>
                  )}
                </div>
                <label
                  className={`work-form__label${
                    workFormFieldErrors.timezone ? ' work-form__label--error' : ''
                  }`}
                >
                  Timezone
                  <select
                    className={`work-form__input${
                      workFormFieldErrors.timezone ? ' work-form__input--error' : ''
                    }`}
                    value={workForm.timezone}
                    onChange={(event) =>
                      updateWorkFormField('timezone', event.target.value)
                    }
                    required
                  >
                    <option value="">Select</option>
                    {getWorkFormConfig(activeContentPortal || {}).timezones.map(
                      (timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      )
                    )}
                  </select>
                  {workFormFieldErrors.timezone && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
              </div>
              <div className="work-form__grid">
                <label
                  className={`work-form__label${
                    workFormFieldErrors.meeting_mode ? ' work-form__label--error' : ''
                  }`}
                >
                  Mode of meeting
                  <select
                    className={`work-form__input${
                      workFormFieldErrors.meeting_mode
                        ? ' work-form__input--error'
                        : ''
                    }`}
                    value={workForm.meeting_mode}
                    onChange={(event) =>
                      updateWorkFormField('meeting_mode', event.target.value)
                    }
                    required
                  >
                    <option value="">Select</option>
                    {getWorkFormConfig(activeContentPortal || {}).meeting_modes.map(
                      (mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      )
                    )}
                  </select>
                  {workFormFieldErrors.meeting_mode && (
                    <span className="work-form__hint">Required</span>
                  )}
                </label>
              </div>
              {workFormError && <p className="work-form__error">{workFormError}</p>}
              {workFormStatus && (
                <p className="work-form__status">{workFormStatus}</p>
              )}
              <label
                className={`work-form__label work-form__checkbox${workFormFieldErrors.agreement ? ' work-form__label--error' : ''}`}
              >
                <input
                  className={`work-form__input${workFormFieldErrors.agreement ? ' work-form__input--error' : ''}`}
                  type="checkbox"
                  checked={workForm.agreement}
                  onChange={(event) =>
                    updateWorkFormField('agreement', event.target.checked)
                  }
                  required
                />
                <span>
                  {getWorkFormConfig(activeContentPortal || {}).agreement_label}
                </span>
                {workFormFieldErrors.agreement && (
                  <span className="work-form__hint">Required</span>
                )}
              </label>
              <button
                type="button"
                className="work-form__submit"
                onClick={handleWorkFormSubmit}
              >
                Book call
              </button>
            </div>
          </div>
        </div>
      )}

      {workModalOpen && workPortalEntry && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setWorkModalOpen(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Work with VAKES"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={() => setWorkModalOpen(false)}
            >
              Close
            </button>
            <div className="modal__meta">Work with VAKES</div>
            <div className="modal__title">Start a Project</div>
            <div className="modal__body">
              {renderPortalContent(workPortalEntry.portal, workPortalEntry.index)}
            </div>
          </div>
        </div>
      )}

      {resumeOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setResumeOpen(false)}
        >
          <div
            className="modal resume-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Resume"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={() => setResumeOpen(false)}
              aria-label="Close resume"
            >
              Close
            </button>
            <p className="modal__meta">Resume</p>
            <h2 className="modal__title">Victor M Fabian</h2>
            <div className="resume-modal__frame">
              <iframe
                src={getPortfolioSection(site).cv_url}
                title="Resume"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {aboutModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setAboutModalOpen(false)}
        >
          <div
            className="modal about-modal"
            role="dialog"
            aria-modal="true"
            aria-label="About VAKES"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={() => setAboutModalOpen(false)}
              aria-label="Close modal"
            >
              Close
            </button>
            <p className="modal__meta">About</p>
            <h2 className="modal__title">VAKES</h2>
            <div className="about-modal__content">
              {getAboutSection(site).image_url ? (
                <div className="about-modal__media">
                  <img
                    src={getAboutSection(site).image_url}
                    alt="About VAKES"
                    onContextMenu={preventContextMenu}
                    onDragStart={preventDragStart}
                    onCopy={preventCopy}
                    onCut={preventCopy}
                    draggable={false}
                  />
                </div>
              ) : null}
              <div className="about-modal__details">
                {getAboutSection(site).bio && (
                  <p className="about-modal__bio">
                    {getAboutSection(site).bio}
                  </p>
                )}
                <div className="about-modal__grid">
                  <div>
                    <h3>Team</h3>
                    <ul>
                      {(getAboutSection(site).team || []).map((member) => (
                        <li key={member}>{member}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Partners</h3>
                    <ul>
                      {(getAboutSection(site).partners || []).map((partner) => (
                        <li key={partner}>{partner}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Blog</h3>
                    <ul>
                      {(getAboutSection(site).blog_links || []).map((link) => (
                        <li key={link}>
                          <a href={link} target="_blank" rel="noreferrer">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Contact</h3>
                    <ul>
                      {getAboutSection(site).email && (
                        <li>
                          <a href={`mailto:${getAboutSection(site).email}`}>
                            {getAboutSection(site).email}
                          </a>
                        </li>
                      )}
                      {getAboutSection(site).phone && (
                        <li>
                          <a href={`tel:${getAboutSection(site).phone}`}>
                            {getAboutSection(site).phone}
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeShopItem && activeContentPortal && isShopPortal(activeContentPortal) && (
        <div
          className="shop-detail-backdrop"
          role="presentation"
          onClick={() => {
            setActiveShopItem(null)
            setActiveShopSize('')
            setCheckoutForm({
              fullName: '',
              address: '',
              email: '',
              phone: '',
            })
            setCheckoutError('')
            setCheckoutStatus('')
          }}
        >
          <div
            className="shop-detail"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="shop-detail__close"
              onClick={() => {
                setActiveShopItem(null)
                setActiveShopSize('')
                setCheckoutForm({
                  fullName: '',
                  address: '',
                  email: '',
                  phone: '',
                })
                setCheckoutError('')
                setCheckoutStatus('')
              }}
            >
              Close
            </button>
            <div
              className="shop-detail__media"
              onContextMenu={preventContextMenu}
              onCopy={preventCopy}
              onCut={preventCopy}
            >
              {(activeShopItem.images?.length
                ? activeShopItem.images
                : activeShopItem.image
                  ? [activeShopItem.image]
                  : []
              ).map((src, index) => (
                <img
                  src={src}
                  alt={activeShopItem.title}
                  key={`${src}-${index}`}
                  onContextMenu={preventContextMenu}
                  onDragStart={preventDragStart}
                  onCopy={preventCopy}
                  onCut={preventCopy}
                  draggable={false}
                />
              ))}
            </div>
            <div className="shop-detail__info">
              <div className="shop-detail__title">{activeShopItem.title}</div>
              <div className="shop-detail__price">
                {formatCurrencyAmount(
                  getItemAmount(
                    activeShopItem,
                    activeCurrency,
                    getShop(activeContentPortal).currency_rates
                  ),
                  activeCurrency
                )}
              </div>
              {activeShopItem.description && (
                <p className="shop-detail__description">
                  {activeShopItem.description}
                </p>
              )}
              {activeShopItem.sizes?.length ? (
                <div className="shop-detail__sizes">
                  {activeShopItem.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={activeShopSize === size ? 'is-active' : ''}
                      onClick={() => setActiveShopSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="shop-detail__form">
                <label className="shop-detail__label">
                  Full name
                  <input
                    value={checkoutForm.fullName}
                    onChange={(event) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        fullName: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label className="shop-detail__label">
                  Delivery address
                  <input
                    value={checkoutForm.address}
                    onChange={(event) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        address: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label className="shop-detail__label">
                  Email address
                  <input
                    type="email"
                    value={checkoutForm.email}
                    onChange={(event) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        email: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label className="shop-detail__label">
                  Phone number
                  <input
                    value={checkoutForm.phone}
                    onChange={(event) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        phone: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                {checkoutError && (
                  <p className="shop-detail__error">{checkoutError}</p>
                )}
                {checkoutStatus && (
                  <p className="shop-detail__status">{checkoutStatus}</p>
                )}
                {!session?.user && (
                  <p className="shop-detail__hint">Sign in to place an order.</p>
                )}
                <button
                  className="shop-detail__checkout"
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={!activeShopSize || !session?.user}
                >
                  {session?.user ? 'Proceed to checkout' : 'Sign in to checkout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`custom-cursor${cursorVisible ? ' is-visible' : ''}${
          cursorActive ? ' is-active' : ''
        }`}
        aria-hidden="true"
      >
      </div>

      <footer className="mt-9 text-center text-[0.75rem] text-black/70">
        {site.footer_text}
      </footer>
    </div>
  )
}

