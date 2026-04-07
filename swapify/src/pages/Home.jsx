import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { readCities } from '../api/cities'
import { readListings } from '../api/listings'
import { readUsers, updateUser } from '../api/users'
import { updateListing } from '../api/listings'
import Navbar from '../components/Navbar'
import MapVisualizer from '../components/MapVisualizer'
import CreateListing from '../components/CreateListing'
import { HeartIcon } from '../components/post'
import { getListingImageUrls } from '../utils/images'
import { formatGeoLocation } from '../utils/geo'
import { buildCityMapModel } from '../utils/cityMapData'
import '../styles/map.css'

// Global like queue to serialize operations
let likeQueue = Promise.resolve()

const queueLikeOperation = async (operation) => {
  likeQueue = likeQueue.then(() => operation())
  return likeQueue;
}

const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase()

const toUsersArray = (usersResponse) => {
  const bucket = usersResponse?.User
  if (bucket) {
    return Object.values(bucket)
  }
  return []
}

const resolveSavedPostIds = (user) => {
  if (!user) {
    return []
  }
  const savedField = user?.saved_listings
  if (!Array.isArray(savedField)) {
    return []
  }
  return savedField.map((item) => String(item || '').trim()).filter(Boolean)
}

const getViewerIdentity = () => {
  const username = String(localStorage.getItem('swapify.username') || '').trim()
  const email = String(localStorage.getItem('swapify.email') || '').trim()

  return {
    username,
    email,
    normalizedUsername: normalizeIdentifier(username),
    normalizedEmail: normalizeIdentifier(email),
  }
}

const getAuthState = () => {
  const isLoggedIn = localStorage.getItem('swapify.authenticated') === 'true'
  const username = localStorage.getItem('swapify.username') || ''
  const email = localStorage.getItem('swapify.email') || ''

  return {
    isLoggedIn,
    username,
    email,
  }
}

function parseCities(citiesData) {
  if (Array.isArray(citiesData)) return citiesData
  if (citiesData && citiesData.Cities) return Object.values(citiesData.Cities)
  return []
}

function parseListings(listingsData) {
  if (listingsData && listingsData.Listings) {
    return Object.values(listingsData.Listings)
  }
  if (Array.isArray(listingsData)) return listingsData
  return []
}

function MapListingCard({ listing }) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const pendingLikedRef = useRef(null)
  const isSyncingRef = useRef(false)
  
  const images = getListingImageUrls(listing)
  const numericPrice = Number(listing.price)
  const hasPrice = Number.isFinite(numericPrice) && numericPrice > 0
  const formattedPrice = hasPrice
    ? `$${numericPrice.toLocaleString(undefined, {
      minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`
    : 'Free'

  // Load liked state on mount
  useEffect(() => {
    const loadLikedState = async () => {
      try {
        const username = localStorage.getItem('swapify.username')
        const email = localStorage.getItem('swapify.email')
        
        if (!username && !email) {
          setLiked(false)
          return
        }

        const usersResponse = await readUsers()
        const usersArray = usersResponse?.User ? Object.values(usersResponse.User) : []
        
        const viewerIdentifier = String(username || email).trim().toLowerCase()
        const matchedUser = usersArray.find((user) => {
          const userUsername = String(user?.username || '').trim().toLowerCase()
          const userEmail = String(user?.email || '').trim().toLowerCase()
          return userUsername === viewerIdentifier || userEmail === viewerIdentifier
        })

        if (matchedUser && Array.isArray(matchedUser.saved_listings)) {
          const isLiked = matchedUser.saved_listings.includes(String(listing._id))
          setLiked(isLiked)
        }
      } catch (err) {
        console.error('Failed to load liked state:', err)
      }
    }

    loadLikedState()
  }, [listing._id])

  const syncLikeToBackend = useCallback(async ({ listingId, nextLiked }) => {
    const normalizedListingId = String(listingId || '').trim()
    if (!normalizedListingId) {
      return
    }

    const viewer = getViewerIdentity()
    const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail
    if (!viewerKey) {
      return
    }

    try {
      const usersResponse = await readUsers()
      const users = toUsersArray(usersResponse)

      const matchedUser = users.find((candidate) => {
        const candidateUsername = normalizeIdentifier(candidate?.username)
        const candidateEmail = normalizeIdentifier(candidate?.email)

        return (
          (viewer.normalizedUsername && candidateUsername === viewer.normalizedUsername) ||
          (viewer.normalizedEmail && candidateEmail === viewer.normalizedEmail)
        )
      })

      if (!matchedUser) {
        return
      }

      const currentSaved = resolveSavedPostIds(matchedUser)
      const nextSaved = nextLiked
        ? Array.from(new Set([...currentSaved, normalizedListingId]))
        : currentSaved.filter((savedId) => savedId !== normalizedListingId)

      const userIdentifierForUpdate = matchedUser?.username

      if (userIdentifierForUpdate) {
        await updateUser(userIdentifierForUpdate, {
          saved_listings: nextSaved,
        })
      }

      // Calculate new like count
      const numLikes = users.reduce((count, candidate) => {
        const candidateSaved = resolveSavedPostIds(candidate)
        const candidateUsername = normalizeIdentifier(candidate?.username)
        const candidateEmail = normalizeIdentifier(candidate?.email)
        const matchedUsername = normalizeIdentifier(matchedUser?.username)
        const matchedEmail = normalizeIdentifier(matchedUser?.email)

        const isMatchedUser =
          (matchedUsername && candidateUsername === matchedUsername) ||
          (matchedEmail && candidateEmail === matchedEmail)

        const effectiveSaved = isMatchedUser ? nextSaved : candidateSaved

        return effectiveSaved.includes(normalizedListingId) ? count + 1 : count
      }, 0)

      await updateListing(normalizedListingId, {
        num_likes: numLikes,
      })

      // Notify SavedItems page that likes changed
      window.dispatchEvent(new CustomEvent('swapify:saved-items-updated'))
    } catch (err) {
      console.error('Failed to sync like to backend:', err)
    }
  }, [])

  const processPendingLikeSync = useCallback(async () => {
    if (isSyncingRef.current || !listing._id) {
      return
    }

    isSyncingRef.current = true
    setIsUpdating(true)

    try {
      while (pendingLikedRef.current !== null) {
        const targetLiked = pendingLikedRef.current
        pendingLikedRef.current = null

        const listingId = String(listing._id)

        try {
          await queueLikeOperation(async () => {
            await syncLikeToBackend({ listingId, nextLiked: targetLiked })
          })
          // Notify SavedItems page that likes changed
          window.dispatchEvent(new CustomEvent('swapify:saved-items-updated'))
        } catch (backendErr) {
          console.error('Failed to sync like with backend:', backendErr)
          if (pendingLikedRef.current === null) {
            setLiked(!targetLiked)
          }
        }
      }
    } finally {
      isSyncingRef.current = false
      setIsUpdating(false)
    }
  }, [listing._id, syncLikeToBackend])

  const handleLike = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const viewer = getViewerIdentity()
    const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail
    if (!viewerKey) {
      navigate('/login', { state: { fromLike: true } })
      return
    }

    const nextLiked = !liked
    setLiked(nextLiked)
    pendingLikedRef.current = nextLiked
    void processPendingLikeSync()
  }

  return (
    <div className="map-listing-card-wrapper">
      <Link to={`/post/${listing._id}`} className="map-listing-card">
        <div className="map-listing-card-image-wrapper">
          {images.length > 0 ? (
            <img className="map-listing-card-img" src={images[0]} alt={listing.title} />
          ) : (
            <div className="map-listing-card-img-placeholder">📦</div>
          )}
        </div>
        <div className="map-listing-card-info">
          <p className="map-listing-card-title">{listing.title}</p>
          <p className="map-listing-card-location">{formatGeoLocation(listing)}</p>
          <p className="map-listing-card-price">{formattedPrice}</p>
        </div>
      </Link>
      <button
        className={`map-listing-like-button ${liked ? 'liked' : ''} ${isUpdating ? 'syncing' : ''}`}
        onClick={handleLike}
        title={liked ? 'Unlike' : 'Like'}
        disabled={isUpdating}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <HeartIcon />
      </button>
    </div>
  )
}

function Home() {
  const [points, setPoints] = useState([])
  const [allListings, setAllListings] = useState([])
  const [listingsByCityKey, setListingsByCityKey] = useState({})
  const [selectedState, setSelectedState] = useState(null)
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false)
  const [authState, setAuthState] = useState(getAuthState)

  // useCallback to memoize the applyMapData function
  const applyMapData = useCallback((cities, listings) => {
    setAllListings(listings)
    const { points: pts, listingsByCityKey: byKey } = buildCityMapModel(cities, listings)
    setPoints(pts)
    setListingsByCityKey(byKey)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [citiesData, listingsData] = await Promise.all([
          readCities(),
          readListings(),
        ])
        const cities = parseCities(citiesData)
        const listings = parseListings(listingsData)
        applyMapData(cities, listings)
      } catch (err) {
        console.error('Failed to load map data:', err)
      }
    }

    load()
  }, [applyMapData])

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(getAuthState())
    }

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('focus', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('focus', syncAuthState)
    }
  }, [])

  const sidebarListings = useMemo(() => {
    if (!selectedState?.mapKey) return allListings
    return listingsByCityKey[selectedState.mapKey] ?? []
  }, [selectedState, allListings, listingsByCityKey])

  const handleStateClick = (point) => {
    setSelectedState((prev) => (prev?.mapKey === point.mapKey ? null : point))
  }

  const handleListingCreated = async () => {
    // Reload the data after a listing is created
    try {
      const [citiesData, listingsData] = await Promise.all([
        readCities(),
        readListings(),
      ])
      const cities = parseCities(citiesData)
      const listings = parseListings(listingsData)
      applyMapData(cities, listings)
      
      // Small delay to ensure UI updates before closing modal
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error('Failed to reload map data:', err)
    }
  }

  const sidebarTitle = selectedState?.mapKey
    ? `${selectedState.label}, ${selectedState.subtitle}`
    : 'All Listings'

  return (
    <main className="map-page">
      <Navbar />
      <div className="map-body">
        <aside className="map-sidebar">
          <div className="map-sidebar-header">
            <h3>{sidebarTitle}</h3>
            <p>
              {sidebarListings.length} listing
              {sidebarListings.length !== 1 ? 's' : ''}
            </p>
            {selectedState && (
              <button type="button" onClick={() => setSelectedState(null)}>
                Show all
              </button>
            )}
          </div>
          <div className="map-sidebar-listings">
            {sidebarListings.length > 0 ? (
              sidebarListings.map((listing) => (
                <MapListingCard key={listing._id} listing={listing} />
              ))
            ) : (
              <p style={{ padding: '12px', color: '#94a3b8', fontSize: '0.875rem' }}>
                No listings in this area.
              </p>
            )}
          </div>
        </aside>
        <MapVisualizer
          points={points}
          selectedState={selectedState}
          onStateClick={handleStateClick}
        />
      </div>

      <button
        type="button"
        className="floating-help-button"
        onClick={() => setIsHelpOpen(true)}
        aria-label="Open icon guide"
        title="Transaction types"
      >
        ?
      </button>

      {authState.isLoggedIn && (
        <button
          className="floating-add-button"
          onClick={() => setIsCreateListingOpen(true)}
          aria-label="Create new listing"
        >
          +
        </button>
      )}

      <CreateListing
        isOpen={isCreateListingOpen}
        onClose={() => setIsCreateListingOpen(false)}
        onSuccess={handleListingCreated}
        isLoggedIn={authState.isLoggedIn}
        currentUserIdentifier={authState.username || authState.email}
      />
    </main>
  )
}

export default Home
