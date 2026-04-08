import { useState, useEffect, useMemo, useCallback } from 'react'
import { readCities } from '../api/cities'
import { readListings } from '../api/listings'
import Navbar from '../components/Navbar'
import MapVisualizer from '../components/MapVisualizer'
import CreateListing from '../components/CreateListing'
import MapListingCard from '../components/MapListingCard'
import { buildCityMapModel } from '../utils/cityMapData'
import { filterListings } from '../utils/listingFilters'
import '../styles/map.css'

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

function Home() {
  const [points, setPoints] = useState([])
  const [allListings, setAllListings] = useState([])
  const [listingsByCityKey, setListingsByCityKey] = useState({})
  const [selectedState, setSelectedState] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({ city: '', price: '', transactionType: '' })
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
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
    const base = !selectedState?.mapKey
      ? allListings
      : listingsByCityKey[selectedState.mapKey] ?? []
    return filterListings(base, { searchQuery, filters })
  }, [selectedState, allListings, listingsByCityKey, searchQuery, filters])

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
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        filters={filters}
        onFilterChange={setFilters}
        autoNavigateToGridOnEnter={false}
      />
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
