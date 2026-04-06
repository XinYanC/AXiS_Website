import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { readListings, searchListings } from '../api/listings'
import Navbar from '../components/Navbar'
import Post from '../components/post'
import CreateListing from '../components/CreateListing'
import PostIconsHelp from '../components/PostIconsHelp'
import { getListingImageUrls } from '../utils/images'
import { formatGeoLocation } from '../utils/geo'
import '../styles/createListing.css'
import '../styles/postIconsHelp.css'

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

function Grid() {
  const [searchParams] = useSearchParams()
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [listings, setListings] = useState([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [authState, setAuthState] = useState(getAuthState)
  const [filters, setFilters] = useState({ city: '', price: '', transactionType: '' })

  const fetchListings = async () => {
    try {
      const data = await readListings()
      console.log('Listings data received:', data)

      // Handle the response structure: { "Listings": { id: {...}, ... }, "Number of Records": X }
      let listingsArray = []
      if (data && data.Listings) {
        // Convert the Listings object to an array
        listingsArray = Object.values(data.Listings)
      } else if (Array.isArray(data)) {
        listingsArray = data
      }

      console.log('Listings array:', listingsArray)
      setListings(listingsArray)
    } catch (err) {
      console.error('Failed to load listings:', err)
    }
  }

  useEffect(() => {
    const loadListings = async () => {
      await fetchListings()
    }

    loadListings()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery) {
        fetchListings()
        return
      }
      try {
        const data = await searchListings(searchQuery)
        let listingsArray = []
        if (data && data.Listings) {
          listingsArray = Object.values(data.Listings)
        } else if (Array.isArray(data)) {
          listingsArray = data
        }
        setListings(listingsArray)
      } catch (err) {
        console.error('Search failed:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter listings client-side
  const filteredListings = listings.filter((listing) => {
    // Location filter (city, state, or country)
    const city = String(listing.city || '').toLowerCase()
    const filterCity = String(filters.city || '').toLowerCase()
    const matchesCity = !filterCity || city.includes(filterCity)

    // Price filter (max price)
    const price = Number(listing.price)
    const filterPrice = Number(filters.price)
    const matchesPrice = !filterPrice || price <= filterPrice

    // Transaction type filter
    const transactionType = String(listing.transaction_type || '').toLowerCase()
    const filterType = String(filters.transactionType || '').toLowerCase()
    const matchesType = !filterType || transactionType === filterType

    return matchesCity && matchesPrice && matchesType
  })

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

  return (
    <main>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        filters={filters}
        onFilterChange={setFilters}
      />

      <div className="posts-grid">
        {filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <Post
              key={listing._id}
              id={listing._id}
              title={listing.title}
              description={listing.description}
              imageUrls={getListingImageUrls(listing)}
              location={formatGeoLocation(listing)}
              transactionType={listing.transaction_type}
              price={listing.price}
              owner={listing.owner}
            />
          ))
        ) : (
          <p>No listings available yet. Create one to get started!</p>
        )}
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
        onSuccess={fetchListings}
        isLoggedIn={authState.isLoggedIn}
        currentUserIdentifier={authState.username || authState.email}
      />

      <PostIconsHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </main>
  )
}

export default Grid
