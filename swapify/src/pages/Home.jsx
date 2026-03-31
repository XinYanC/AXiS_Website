import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { readStates } from '../api/states'
import { readCities } from '../api/cities'
import { readListings } from '../api/listings'
import Navbar from '../components/Navbar'
import MapVisualizer from '../components/MapVisualizer'
import CreateListing from '../components/CreateListing'
import STATE_COORDS from '../utils/stateCoordinates'
import { getListingImageUrls } from '../utils/images'
import '../styles/map.css'

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

function MapListingCard({ listing }) {
  const images = getListingImageUrls(listing)
  const numericPrice = Number(listing.price)
  const hasPrice = Number.isFinite(numericPrice) && numericPrice > 0
  const formattedPrice = hasPrice
    ? `$${numericPrice.toLocaleString(undefined, {
        minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })}`
    : 'Free'

  return (
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
        <p className="map-listing-card-location">{listing.meetup_location}</p>
        <p className="map-listing-card-price">{formattedPrice}</p>
      </div>
    </Link>
  )
}

function Home() {
  const [points, setPoints] = useState([])
  const [allListings, setAllListings] = useState([])
  const [listingsByState, setListingsByState] = useState({})
  const [selectedState, setSelectedState] = useState(null)
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false)
  const [authState, setAuthState] = useState(getAuthState)

  useEffect(() => {
    const load = async () => {
      try {
        const [statesData, citiesData, listingsData] = await Promise.all([
          readStates(),
          readCities(),
          readListings(),
        ])

        // Parse states
        let states = []
        if (Array.isArray(statesData)) {
          states = statesData
        } else if (statesData && statesData.States) {
          states = Object.values(statesData.States)
        }

        // Parse cities
        let cities = []
        if (Array.isArray(citiesData)) {
          cities = citiesData
        } else if (citiesData && citiesData.Cities) {
          cities = Object.values(citiesData.Cities)
        }

        // Parse listings
        let listings = []
        if (listingsData && listingsData.Listings) {
          listings = Object.values(listingsData.Listings)
        } else if (Array.isArray(listingsData)) {
          listings = listingsData
        }
        setAllListings(listings)

        // Build city -> state code mapping
        const cityToState = new Map()
        for (const city of cities) {
          const cityName = city.name?.toLowerCase() ?? ''
          const stateCode = city.state ?? city.state_code ?? ''
          if (cityName && stateCode) {
            cityToState.set(cityName, stateCode)
          }
        }

        console.log('City to state mapping:', Object.fromEntries(cityToState))
        console.log('Listings:', listings.map((l) => ({ title: l.title, location: l.meetup_location })))

        // Assign each listing to a state based on city
        const byState = {}
        for (const listing of listings) {
          const listingCity = listing.meetup_location?.toLowerCase() ?? ''
          const stateCode = cityToState.get(listingCity)
          
          if (stateCode) {
            if (!byState[stateCode]) byState[stateCode] = []
            byState[stateCode].push(listing)
          }
        }
        setListingsByState(byState)

        console.log('Listings by state:', byState)

        // Build map points for all states
        const pts = states
          .map((s) => {
            const backendCoords =
              s.latitude != null && s.longitude != null
                ? [s.latitude, s.longitude]
                : null
            const coords = backendCoords ?? STATE_COORDS[s.code]
            if (!coords) return null
            return {
              lat: coords[0],
              lng: coords[1],
              label: s.name,
              code: s.code,
              count: byState[s.code]?.length ?? 0,
            }
          })
          .filter(Boolean)

        setPoints(pts)
      } catch (err) {
        console.error('Failed to load map data:', err)
      }
    }

    load()
  }, [])

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
    if (!selectedState) return allListings
    return listingsByState[selectedState.code] ?? []
  }, [selectedState, allListings, listingsByState])

  const handleStateClick = (point) => {
    setSelectedState((prev) => (prev?.label === point.label ? null : point))
  }

  const handleListingCreated = async () => {
    // Reload the data after a listing is created
    try {
      const [statesData, citiesData, listingsData] = await Promise.all([
        readStates(),
        readCities(),
        readListings(),
      ])

      // Parse states
      let states = []
      if (Array.isArray(statesData)) {
        states = statesData
      } else if (statesData && statesData.States) {
        states = Object.values(statesData.States)
      }

      // Parse cities
      let cities = []
      if (Array.isArray(citiesData)) {
        cities = citiesData
      } else if (citiesData && citiesData.Cities) {
        cities = Object.values(citiesData.Cities)
      }

      // Parse listings
      let listings = []
      if (listingsData && listingsData.Listings) {
        listings = Object.values(listingsData.Listings)
      } else if (Array.isArray(listingsData)) {
        listings = listingsData
      }
      setAllListings(listings)

      // Build city -> state code mapping
      const cityToState = new Map()
      for (const city of cities) {
        const cityName = city.name?.toLowerCase() ?? ''
        const stateCode = city.state ?? city.state_code ?? ''
        if (cityName && stateCode) {
          cityToState.set(cityName, stateCode)
        }
      }

      // Assign each listing to a state based on city
      const byState = {}
      for (const listing of listings) {
        const listingCity = listing.meetup_location?.toLowerCase() ?? ''
        const stateCode = cityToState.get(listingCity)
        
        if (stateCode) {
          if (!byState[stateCode]) byState[stateCode] = []
          byState[stateCode].push(listing)
        }
      }
      setListingsByState(byState)

      // Build map points for ALL states (not just ones with listings)
      const pts = states
        .map((s) => {
          const backendCoords =
            s.latitude != null && s.longitude != null
              ? [s.latitude, s.longitude]
              : null
          const coords = backendCoords ?? STATE_COORDS[s.code]
          if (!coords) return null
          return {
            lat: coords[0],
            lng: coords[1],
            label: s.name,
            code: s.code,
            count: byState[s.code]?.length ?? 0,
          }
        })
        .filter(Boolean)

      setPoints(pts)
    } catch (err) {
      console.error('Failed to reload map data:', err)
    }
  }

  return (
    <main className="map-page">
      <Navbar />
      <div className="map-body">
        <aside className="map-sidebar">
          <div className="map-sidebar-header">
            <h3>
              {selectedState ? `${selectedState.label}` : 'All Listings'}
            </h3>
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
        className="floating-add-button"
        onClick={() => setIsCreateListingOpen(true)}
        aria-label="Create new listing"
      >
        +
      </button>

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
