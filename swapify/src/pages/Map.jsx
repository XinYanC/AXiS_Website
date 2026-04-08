import { useState, useEffect, useMemo } from 'react'
import { readCities } from '../api/cities'
import { readListings } from '../api/listings'
import Navbar from '../components/Navbar'
import MapVisualizer from '../components/MapVisualizer'
import MapListingCard from '../components/MapListingCard'
import { buildCityMapModel } from '../utils/cityMapData'
import '../styles/map.css'

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

function Map() {
  const [points, setPoints] = useState([])
  const [allListings, setAllListings] = useState([])
  const [listingsByCityKey, setListingsByCityKey] = useState({})
  const [selectedState, setSelectedState] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [citiesData, listingsData] = await Promise.all([
          readCities(),
          readListings(),
        ])
        const cities = parseCities(citiesData)
        const listings = parseListings(listingsData)
        setAllListings(listings)
        const { points: pts, listingsByCityKey: byKey } = buildCityMapModel(cities, listings)
        setPoints(pts)
        setListingsByCityKey(byKey)
      } catch (err) {
        console.error('Failed to load map data:', err)
      }
    }

    load()
  }, [])

  const sidebarListings = useMemo(() => {
    const base = !selectedState?.mapKey
      ? allListings
      : listingsByCityKey[selectedState.mapKey] ?? []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return base
    return base.filter((l) => String(l.title ?? '').toLowerCase().includes(q))
  }, [selectedState, allListings, listingsByCityKey, searchQuery])

  const handleStateClick = (point) => {
    setSelectedState((prev) => (prev?.mapKey === point.mapKey ? null : point))
  }

  const sidebarTitle = selectedState?.mapKey
    ? `${selectedState.label}, ${selectedState.subtitle}`
    : 'All Listings'

  return (
    <main className="map-page">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
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
              <p className="no-listings">
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
