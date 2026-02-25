import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { readListings } from '../api/listings'
import Post from '../components/Post'
import CreateListing from '../components/CreateListing'
import FullLogo from '../assets/FullLogo.PNG'
import '../styles/createListing.css'

function Home() {
  const [isCreateListingOpen, setIsCreateListingOpen] = useState(false)
  const [listings, setListings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

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
    fetchListings()
  }, [])

  return (
    <main>
      <nav className="main-nav">
        <div className="main-nav-left">
          <Link to="/">
            <img src={FullLogo} alt="Swapify" />
          </Link>
        </div>
        <div className="search-container">
        <input
          type="text"
          className="search-bar"
          placeholder="Search listings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
        <div className="main-nav-right">
          <h2>Saved Items</h2>
          <h2>Messages</h2>
          <h2>
            <Link to="/login">Profile</Link>
          </h2>
        </div>
      </nav>

      <div className="posts-grid">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <Post
              key={listing._id}
              id={listing._id}
              title={listing.title}
              description={listing.description}
              imageUrl={listing.images && listing.images.length > 0 ? listing.images[0] : null}
              location={listing.meetup_location}
              transactionType={listing.transaction_type}
              price={listing.price}
            />
          ))
        ) : (
          <p>No listings available yet. Create one to get started!</p>
        )}
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
        onSuccess={fetchListings}
      />
    </main>
  )
}

export default Home
