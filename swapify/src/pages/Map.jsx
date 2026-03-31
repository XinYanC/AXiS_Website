import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { readStates } from '../api/states'
import { readListings, searchListings } from '../api/listings'
import Navbar from '../components/Navbar'
import MapVisualizer from '../components/MapVisualizer'
import STATE_COORDS from '../utils/stateCoordinates'
import { getListingImageUrls } from '../utils/images'
import '../styles/map.css'

function MapListingCard({ listing }) {
  const images = getListingImageUrls(listing)
  const price = listing.price != null ? `$${listing.price}` : 'Free'

  return (
    <Link to={`/post/${listing._id}`} className="map-listing-card">
      {images.length > 0 ? (
        <img className="map-listing-card-img" src={images[0]} alt={listing.title} />
      ) : (
        <div className="map-listing-card-img-placeholder">📦</div>
      )}
      <div className="map-listing-card-info">
        <p className="map-listing-card-title">{listing.title}</p>
        <p className="map-listing-card-location">{listing.meetup_location}</p>
        <p className="map-listing-card-price">{price}</p>
      </div>
    </Link>
  )
}

function Map() {
  const [points, setPoints] = useState([])
  const [allListings, setAllListings] = useState([])
  const [listingsByState, setListingsByState] = useState({})
  const [selectedState, setSelectedState] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [statesData, listingsData] = await Promise.all([
          readStates(),
          readListings(),
        ])

        // Parse states
        let states = []
        if (Array.isArray(statesData)) {
          states = statesData
        } else if (statesData && statesData.States) {
          states = Object.values(statesData.States)
        }

        // Parse listings
        let listings = []
        if (listingsData && listingsData.Listings) {
          listings = Object.values(listingsData.Listings)
        } else if (Array.isArray(listingsData)) {
          listings = listingsData
        }
        setAllListings(listings)

        // Build state map: code -> state name
        const stateMap = new Map(states.map((s) => [s.code, s]))

        // Assign each listing to a state
        const byState = {}
        for (const listing of listings) {
          const loc = listing.meetup_location?.toLowerCase() ?? ''
          for (const [code, state] of stateMap) {
            if (
              loc.includes(state.name.toLowerCase()) ||
              loc.includes(`, ${code.toLowerCase()}`)
            ) {
              if (!byState[code]) byState[code] = []
              byState[code].push(listing)
              break
            }
          }
        }
        setListingsByState(byState)

        // Build map points — use backend lat/lng if available, else fall back to hardcoded
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

  // Search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const statesData = await readStates()
        let searchResults = []

        if (!searchQuery) {
          searchResults = allListings
        } else {
          const data = await searchListings(searchQuery)
          if (data && data.Listings) {
            searchResults = Object.values(data.Listings)
          } else if (Array.isArray(data)) {
            searchResults = data
          }
        }

        // Rebuild listings by state with search results
        let states = []
        if (Array.isArray(statesData)) {
          states = statesData
        } else if (statesData && statesData.States) {
          states = Object.values(statesData.States)
        }

        const stateMap = new Map(states.map((s) => [s.code, s]))
        const byState = {}

        for (const listing of searchResults) {
          const loc = listing.meetup_location?.toLowerCase() ?? ''
          for (const [code, state] of stateMap) {
            if (
              loc.includes(state.name.toLowerCase()) ||
              loc.includes(`, ${code.toLowerCase()}`)
            ) {
              if (!byState[code]) byState[code] = []
              byState[code].push(listing)
              break
            }
          }
        }
        setListingsByState(byState)

        // Rebuild map points with updated counts
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
        console.error('Search failed:', err)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, allListings])

  const sidebarListings = useMemo(() => {
    if (!selectedState) return allListings
    return listingsByState[selectedState.code] ?? []
  }, [selectedState, allListings, listingsByState])

  const handleStateClick = (point) => {
    setSelectedState((prev) => (prev?.label === point.label ? null : point))
  }

  return (
    <main className="map-page">
      <Navbar searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} />
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
    </main>
  )
}

export default Map
