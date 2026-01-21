import React, { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_PORTALS,
  DEFAULT_SITE,
  DEFAULT_SUCCESS_KIT,
  DEFAULT_SHOP,
  DEFAULT_WORK_WITH_ME,
} from './contentDefaults'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const ADMIN_HASH = '#/admin'
const ADMIN_EMAIL = 'victorvakes@gmail.com'

export default function App() {
  const [isAdminView, setIsAdminView] = useState(
    window.location.hash === ADMIN_HASH
  )
  const [site, setSite] = useState(DEFAULT_SITE)
  const [portals, setPortals] = useState(DEFAULT_PORTALS)
  const [draftSite, setDraftSite] = useState(DEFAULT_SITE)
  const [draftPortals, setDraftPortals] = useState(DEFAULT_PORTALS)
  const [deletedPortalIds, setDeletedPortalIds] = useState([])
  const [session, setSession] = useState(null)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasLoadedContent, setHasLoadedContent] = useState(false)
  const [activePortal, setActivePortal] = useState(null)
  const [activePortalIndex, setActivePortalIndex] = useState(null)
  const [activeShopTab, setActiveShopTab] = useState('all')
  const [activeShopItem, setActiveShopItem] = useState(null)
  const [activeShopSize, setActiveShopSize] = useState('')
  const [activeCurrency, setActiveCurrency] = useState('NGN')
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
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
  const todayDate = new Date().toISOString().slice(0, 10)
  const defaultLogoUrl = new URL('./assets/vakes-logo.png', import.meta.url).href
  const [heroMediaLoaded, setHeroMediaLoaded] = useState(false)
  const [serviceCarouselIndex, setServiceCarouselIndex] = useState({})

  const isSuccessKitPortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return meta.includes('success kit') || title.includes('success kit')
  }

  const isShopPortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return (
      meta.includes('shop') ||
      title.includes('shop') ||
      portal?.sort_order === 3 ||
      portal?.id === 3
    )
  }

  const isWorkWithMePortal = (portal) => {
    const meta = portal?.meta?.toLowerCase() || ''
    const title = portal?.title?.toLowerCase() || ''
    return meta.includes('work with') || title.includes('start a project')
  }

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
    if (!url || url.startsWith('/src/assets/')) {
      return defaultLogoUrl
    }
    return url
  }

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
      setPortals(DEFAULT_PORTALS)
      setDraftSite(DEFAULT_SITE)
      setDraftPortals(DEFAULT_PORTALS)
      setHasLoadedContent(true)
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
      const mergedPortals = portalData?.length
        ? portalData.map((portal) => {
            const defaultMatch =
              DEFAULT_PORTALS.find(
                (item) => item.meta === portal.meta || item.title === portal.title
              ) ||
              (portal.sort_order === 1
                ? DEFAULT_PORTALS[0]
                : portal.sort_order === 3
                  ? DEFAULT_PORTALS[2]
                  : null)
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
            return nextPortal
          })
        : DEFAULT_PORTALS

      setSite(mergedSite)
      setPortals(mergedPortals)
      setDraftSite(mergedSite)
      setDraftPortals(mergedPortals)
      setDeletedPortalIds([])
      setHasLoadedContent(true)
      setLoading(false)
    }

    loadContent()

    return () => {
      isMounted = false
    }
  }, [])

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
    if (!activePortal) {
      return
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActivePortal(null)
        setActivePortalIndex(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePortal])

  useEffect(() => {
    if (activePortal && isShopPortal(activePortal)) {
      setActiveShopTab('all')
      setActiveShopItem(null)
      setActiveShopSize('')
      setActiveCurrency(getShop(activePortal).currency || 'NGN')
      setCheckoutForm({
        fullName: '',
        address: '',
        email: '',
        phone: '',
      })
      setCheckoutError('')
      setCheckoutStatus('')
    }
  }, [activePortal])

  useEffect(() => {
    setHeroMediaLoaded(false)
  }, [site.logo_url])

  useEffect(() => {
    if (activePortal && isWorkWithMePortal(activePortal) && !workForm.date) {
      setWorkForm((prevForm) => ({ ...prevForm, date: todayDate }))
    }
  }, [activePortal, todayDate, workForm.date])

  useEffect(() => {
    if (!workForm.date || !workForm.time) {
      return
    }

    if (workForm.date === todayDate && workForm.time < currentTime) {
      setWorkForm((prevForm) => ({ ...prevForm, time: '' }))
    }
  }, [workForm.date, workForm.time, todayDate, currentTime])

  useEffect(() => {
    if (!activePortal || !isWorkWithMePortal(activePortal)) {
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
  }, [activePortal])

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

  const isServicesPortal = (_portal, index) => index === 0

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
    { key: 'clothing', label: 'Clothing' },
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

  const handleSignOut = async () => {
    if (!supabase) {
      return
    }
    await supabase.auth.signOut()
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
      instagram_url: draftSite.instagram_url,
      tiktok_url: draftSite.tiktok_url,
      youtube_url: draftSite.youtube_url,
      footer_text: draftSite.footer_text,
    }

    const { error: siteError } = await supabase
      .from('site_content')
      .upsert(sitePayload, { onConflict: 'id' })

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
      sort_order: index + 1,
      services: portal.services || null,
      success_kit: portal.success_kit || null,
      shop: portal.shop || null,
      work_form: portal.work_form || null,
    }))

    const { error: portalError } = await supabase
      .from('portals')
      .upsert(portalPayload, { onConflict: 'id' })

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

  const handlePortalClick = (portal, index, event) => {
    event.preventDefault()
    setActivePortal(portal)
    setActivePortalIndex(index)
  }

  const handleServiceChange = (portalIndex, serviceIndex, field, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_PORTALS[0].services]
    services[serviceIndex] = { ...services[serviceIndex], [field]: value }
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleAddService = (portalIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_PORTALS[0].services]
    services.push({ title: '', description: '', image: '' })
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleRemoveService = (portalIndex, serviceIndex) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_PORTALS[0].services]
    services.splice(serviceIndex, 1)
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleServiceMediaChange = (portalIndex, serviceIndex, mediaIndex, value) => {
    const nextPortals = [...draftPortals]
    const portal = nextPortals[portalIndex]
    const services =
      portal.services?.length ? [...portal.services] : [...DEFAULT_PORTALS[0].services]
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
      portal.services?.length ? [...portal.services] : [...DEFAULT_PORTALS[0].services]
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
      portal.services?.length ? [...portal.services] : [...DEFAULT_PORTALS[0].services]
    const service = services[serviceIndex]
    const media = Array.isArray(service.media) ? [...service.media] : []
    media.splice(mediaIndex, 1)
    services[serviceIndex] = { ...service, media }
    nextPortals[portalIndex] = { ...portal, services }
    setDraftPortals(nextPortals)
  }

  const handleServiceCarouselScroll = (event, direction) => {
    const track = event.currentTarget
      .closest('.service-carousel')
      ?.querySelector('.service-carousel__track')
    if (!track) {
      return
    }
    const width = track.clientWidth
    track.scrollBy({ left: width * direction, behavior: 'smooth' })
  }

  const handleServiceCarouselStep = (key, total, direction) => {
    setServiceCarouselIndex((prevState) => {
      const current = prevState[key] ?? 0
      const next = (current + direction + total) % total
      return { ...prevState, [key]: next }
    })
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

    const shop = getShop(activePortal || {})
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
    const hasRequired =
      workForm.service &&
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

    if (!hasRequired) {
      setWorkFormError('Fill in all required fields.')
      return
    }

    if (!supabase) {
      setWorkFormError('Submission is unavailable right now.')
      return
    }

    setWorkFormError('')
    setWorkFormStatus('Submitting...')

    const { error: insertError } = await supabase.from('work_requests').insert({
      service: workForm.service,
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
                <div className="admin__list">
                  {draftPortals.map((portal, index) => (
                    <div className="admin__card" key={`${portal.id}-${index}`}>
                      <div className="admin__grid admin__grid--two">
                        <label className="admin__label">
                          Meta
                          <input
                            className="admin__input"
                            value={portal.meta || ''}
                            onChange={(event) =>
                              handlePortalChange(
                                index,
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
                                index,
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
                                index,
                                'href',
                                event.target.value
                              )
                            }
                          />
                        </label>
                      </div>
                      {isServicesPortal(portal, index) && (
                        <div className="admin__services">
                          <div className="admin__section-header">
                            <h3 className="admin__subtitle">Services List</h3>
                            <button
                              type="button"
                              className="admin__button admin__button--ghost"
                              onClick={() => handleAddService(index)}
                            >
                              Add service
                            </button>
                          </div>
                          <div className="admin__list">
                            {(portal.services?.length
                              ? portal.services
                              : DEFAULT_PORTALS[0].services
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
                                          index,
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
                                          index,
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
                                              index,
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
                                              index,
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
                                        handleAddServiceMedia(index, serviceIndex)
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
                                          index,
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
                                    handleRemoveService(index, serviceIndex)
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
                                      handleAddSuccessKitItem(index, section.key)
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
                                                index,
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
                                                index,
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
                                                index,
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
                                            index,
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
                                  handleShopToggle(index, event.target.checked)
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
                                    index,
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
                                    index,
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
                                    index,
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
                                    index,
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
                              onClick={() => handleAddShopItem(index)}
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
                                          index,
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
                                          index,
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
                                          index,
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
                                          index,
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
                                          index,
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
                                          index,
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
                                          index,
                                          itemIndex,
                                          'category',
                                          event.target.value
                                        )
                                      }
                                    >
                                      <option value="art">Art</option>
                                      <option value="clothing">Clothing</option>
                                      <option value="accessories">Accessories</option>
                                    </select>
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  className="admin__button admin__button--ghost"
                                  onClick={() => handleRemoveShopItem(index, itemIndex)}
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
                                  handleShopConfigChange(index, 'work_form', {
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
                                  handleShopConfigChange(index, 'work_form', {
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
                                  handleShopConfigChange(index, 'work_form', {
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
                                  handleShopConfigChange(index, 'work_form', {
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
                                  handleShopConfigChange(index, 'work_form', {
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
                        onClick={() => handleRemovePortal(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
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

  return (
    <div className="page mx-auto max-w-3xl px-5 pb-10 pt-9 sm:px-6 sm:pb-16 sm:pt-12">
      {!isAdminView && (!hasLoadedContent || !heroMediaLoaded) && (
        <div className="page-loading-indicator" aria-label="Loading">
          <svg
            className="page-loading-indicator__triangle"
            viewBox="0 0 48 42"
            aria-hidden="true"
          >
            <path d="M24 2 L46 40 H2 Z" />
          </svg>
        </div>
      )}
      <header className="hero-card">
        <div className="hero-card__inner flex flex-col items-center text-center">
          <p className="hero-card__eyebrow">{site.hero_eyebrow}</p>
          <div className="mt-4">
            {getYouTubeEmbedUrl(resolveHeroMediaUrl(site.logo_url)) ? (
              <div className="hero-video">
                <iframe
                  src={getYouTubeEmbedUrl(resolveHeroMediaUrl(site.logo_url))}
                  title="VAKES World"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setHeroMediaLoaded(true)}
                ></iframe>
              </div>
            ) : isVideoUrl(resolveHeroMediaUrl(site.logo_url)) ? (
              <video
                className="hero-logo h-auto w-[220px] max-w-full"
                src={resolveHeroMediaUrl(site.logo_url)}
                autoPlay
                loop
                muted
                playsInline
                onLoadedData={() => setHeroMediaLoaded(true)}
                onError={() => setHeroMediaLoaded(true)}
              />
            ) : (
              <img
                src={resolveHeroMediaUrl(site.logo_url)}
                alt="VAKES World"
                className="hero-logo h-auto w-[220px] max-w-full"
                onLoad={() => setHeroMediaLoaded(true)}
                onError={() => setHeroMediaLoaded(true)}
              />
            )}
          </div>
          <p className="hero-card__tagline">{site.hero_tagline}</p>
          <p className="hero-card__subline">{site.hero_subline}</p>
          <div className="hero-socials" aria-label="Social links">
            <a
              className="hero-socials__link"
              href={site.instagram_url || '#'}
              aria-label="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
                className="hero-socials__icon"
              >
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6zm0 1.8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm4.6-.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z" />
              </svg>
            </a>
            <a
              className="hero-socials__link"
              href={site.tiktok_url || '#'}
              aria-label="TikTok"
            >
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
                className="hero-socials__icon"
              >
                <path d="M14 3a6.2 6.2 0 0 0 4.4 1.8V7a7.9 7.9 0 0 1-4.4-1.4v7.2a5.8 5.8 0 1 1-5-5.7v2.3a3.5 3.5 0 1 0 2.7 3.4V3h2.3z" />
              </svg>
            </a>
            <a
              className="hero-socials__link"
              href={site.youtube_url || '#'}
              aria-label="YouTube"
            >
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
                className="hero-socials__icon"
              >
                <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C17.9 5 12 5 12 5s-5.9 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9A28.5 28.5 0 0 0 2 12a28.5 28.5 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.8.3 7.7.3 7.7.3s5.9 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28.5 28.5 0 0 0 22 12a28.5 28.5 0 0 0-.4-4.8zM10 15.4V8.6L15.6 12 10 15.4z" />
              </svg>
            </a>
          </div>
        </div>
        <div className="hero__confetti" aria-hidden="true"></div>
      </header>

      <nav className="portal-grid mt-6 sm:mt-8" aria-label="Primary">
        {(hasLoadedContent ? portals : []).map((portal, index) => (
          <a
            key={portal.id ?? portal.meta}
            data-animate
            href={portal.href}
            className="reveal portal-card"
            onClick={(event) => handlePortalClick(portal, index, event)}
          >
            <div className="portal-card__meta">{portal.meta}</div>
            <h2 className="portal-card__title font-title">{portal.title}</h2>
            <span className="portal-card__glow" aria-hidden="true"></span>
          </a>
        ))}
      </nav>

      {activePortal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => {
            setActivePortal(null)
            setActivePortalIndex(null)
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={activePortal.title}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal__close"
              onClick={() => {
                setActivePortal(null)
                setActivePortalIndex(null)
              }}
              aria-label="Close modal"
            >
              Close
            </button>
            <p className="modal__meta">{activePortal.meta}</p>
            <h2 className="modal__title">{activePortal.title}</h2>
            {activePortalIndex === 0 && (
              <div className="service-list">
                {(activePortal.services?.length
                  ? activePortal.services
                  : DEFAULT_PORTALS[0].services
                ).map((service, index) => (
                  <details className="service-item" key={`${service.title}-${index}`}>
                    <summary className="service-summary">
                      <span>{service.title}</span>
                    </summary>
                    <div className="service-body">
                      {(() => {
                        const mediaItems = normalizeServiceMedia(service)
                        if (!mediaItems.length) {
                          return null
                        }
                        const key = `${service.title}-${index}`
                        const currentIndex = serviceCarouselIndex[key] ?? 0
                        const currentItem = mediaItems[currentIndex]
                        const youtubeUrl = getYouTubeEmbedUrl(currentItem)
                        return (
                          <div className="service-carousel">
                            <div className="service-carousel__viewport">
                              <div className="service-carousel__item">
                                {!currentItem ? (
                                  <div className="service-carousel__placeholder">
                                    Media unavailable
                                  </div>
                                ) : youtubeUrl ? (
                                  <iframe
                                    src={youtubeUrl}
                                    title={service.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                ) : isVideoUrl(currentItem) ? (
                                  <video
                                    src={currentItem}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls
                                  />
                                ) : (
                                  <img src={currentItem} alt={service.title} />
                                )}
                              </div>
                            </div>
                            {mediaItems.length > 1 && (
                              <div className="service-carousel__controls">
                                {currentIndex > 0 ? (
                                  <button
                                    type="button"
                                    className="service-carousel__nav"
                                    onClick={() =>
                                      handleServiceCarouselStep(
                                        key,
                                        mediaItems.length,
                                        -1
                                      )
                                    }
                                    aria-label="Previous media"
                                  >
                                    &larr;
                                  </button>
                                ) : (
                                  <span className="service-carousel__spacer"></span>
                                )}
                                <div className="service-carousel__count">
                                  {currentIndex + 1} / {mediaItems.length}
                                </div>
                                {currentIndex < mediaItems.length - 1 ? (
                                  <button
                                    type="button"
                                    className="service-carousel__nav"
                                    onClick={() =>
                                      handleServiceCarouselStep(
                                        key,
                                        mediaItems.length,
                                        1
                                      )
                                    }
                                    aria-label="Next media"
                                  >
                                    &rarr;
                                  </button>
                                ) : (
                                  <span className="service-carousel__spacer"></span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                      {service.description && (
                        <p className="service-description">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
            {isSuccessKitPortal(activePortal) && (
              <div className="kit-sections">
                {SUCCESS_KIT_SECTIONS.map((section) => {
                  const items = getSuccessKit(activePortal)[section.key] || []
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
            {isShopPortal(activePortal) && (
              <div className="shop-panel">
                <div className="shop-label">Currency</div>
                <div className="shop-currency">
                  {SHOP_CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      className={`shop-currency__button${
                        activeCurrency === currency ? ' is-active' : ''
                      }`}
                      onClick={() => setActiveCurrency(currency)}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
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
                {getShop(activePortal).enabled ? (
                  <div className="shop-grid">
                    {getShop(activePortal).items
                      .filter((item) =>
                        activeShopTab === 'all' ? true : item.category === activeShopTab
                      )
                      .map((item, itemIndex) => (
                        <div className="shop-card" key={`${item.title}-${itemIndex}`}>
                          <div className="shop-card__media">
                            {item.image ? (
                              <img src={item.image} alt={item.title} />
                            ) : (
                              <div className="shop-card__placeholder">Image</div>
                            )}
                          </div>
                          <div className="shop-card__title">{item.title}</div>
                      <div className="shop-card__price">
                        {formatCurrencyAmount(
                          getItemAmount(
                            item,
                            activeCurrency,
                            getShop(activePortal).currency_rates
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
            {isWorkWithMePortal(activePortal) && (
              <div className="work-form">
                <div className="work-form__grid">
                  <label className="work-form__label">
                    Service
                    <select
                      value={workForm.service}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, service: event.target.value })
                      }
                      required
                    >
                      <option value="">Select</option>
                      {getWorkFormConfig(activePortal).services.map((service) => (
                        <option key={service} value={service}>
                          {service}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="work-form__label">
                    Name
                    <input
                      value={workForm.name}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, name: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="work-form__label">
                    Profession / Industry
                    <select
                      value={workForm.industry}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, industry: event.target.value })
                      }
                      required
                    >
                      <option value="">Select</option>
                      {getWorkFormConfig(activePortal).industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="work-form__label">
                    Other
                    <input
                      value={workForm.other}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, other: event.target.value })
                      }
                    />
                  </label>
                  <label className="work-form__label">
                    Email
                    <input
                      type="email"
                      value={workForm.email}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, email: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="work-form__label">
                    Phone number
                    <input
                      value={workForm.phone}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, phone: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="work-form__label work-form__label--full">
                    Message
                    <textarea
                      value={workForm.message}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, message: event.target.value })
                      }
                      rows={4}
                      required
                    />
                  </label>
                  <label className="work-form__label work-form__label--full work-form__checkbox">
                    <input
                      type="checkbox"
                      checked={workForm.agreement}
                      onChange={(event) =>
                        setWorkForm({
                          ...workForm,
                          agreement: event.target.checked,
                        })
                      }
                      required
                    />
                    <span>{getWorkFormConfig(activePortal).agreement_label}</span>
                  </label>
                </div>
                <div className="work-form__grid">
                  <label className="work-form__label">
                    Booking date
                    <input
                      type="date"
                      min={todayDate}
                      value={workForm.date}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, date: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="work-form__label">
                    Time
                    <input
                      type="time"
                      min={workForm.date === todayDate ? currentTime : undefined}
                      value={workForm.time}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, time: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label className="work-form__label">
                    Timezone
                    <select
                      value={workForm.timezone}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, timezone: event.target.value })
                      }
                      required
                    >
                      <option value="">Select</option>
                      {getWorkFormConfig(activePortal).timezones.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="work-form__label">
                    Mode of meeting
                    <select
                      value={workForm.meeting_mode}
                      onChange={(event) =>
                        setWorkForm({ ...workForm, meeting_mode: event.target.value })
                      }
                      required
                    >
                      <option value="">Select</option>
                      {getWorkFormConfig(activePortal).meeting_modes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {workFormError && <p className="work-form__error">{workFormError}</p>}
                {workFormStatus && (
                  <p className="work-form__status">{workFormStatus}</p>
                )}
                <button
                  type="button"
                  className="work-form__submit"
                  onClick={handleWorkFormSubmit}
                >
                  Book call
                </button>
              </div>
            )}
            {activeShopItem && (
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
                  <div className="shop-detail__media">
                    {(activeShopItem.images?.length
                      ? activeShopItem.images
                      : activeShopItem.image
                        ? [activeShopItem.image]
                        : []
                    ).map((src, index) => (
                      <img src={src} alt={activeShopItem.title} key={`${src}-${index}`} />
                    ))}
                  </div>
                  <div className="shop-detail__info">
                    <div className="shop-detail__title">{activeShopItem.title}</div>
                    <div className="shop-detail__price">
                      {formatCurrencyAmount(
                        getItemAmount(
                          activeShopItem,
                          activeCurrency,
                          getShop(activePortal).currency_rates
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
                        Email
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
                      <button
                        className="shop-detail__checkout"
                        type="button"
                        onClick={handleCheckoutSubmit}
                        disabled={!activeShopSize}
                      >
                        Proceed to checkout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activePortal.href && activePortal.href !== '#' && (
              <a
                className="modal__link"
                href={activePortal.href}
                target="_blank"
                rel="noreferrer"
              >
                Open link
              </a>
            )}
          </div>
        </div>
      )}

      <footer className="mt-9 text-center text-[0.75rem] text-white/70">
        {site.footer_text}
      </footer>
    </div>
  )
}

