import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { readListingById, readUsers } from '../api'
import FullLogo from '../assets/FullLogo.PNG'
import '../styles/postDetails.css'

const normalizeUsername = (value) => String(value || '').trim().replace(/^@+/, '').toLowerCase()
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

function PostDetails() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Post id is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const listingData = await readListingById(id)
        if (!listingData) {
          setListing(null)
          setSeller(null)
          setError('Post not found.')
          return
        }

        setListing(listingData)

        const usersResponse = await readUsers()
        const usersArray = usersResponse && (usersResponse.Users || usersResponse.User)
          ? Object.values(usersResponse.Users || usersResponse.User)
          : Array.isArray(usersResponse)
            ? usersResponse
            : []

        const listingOwnerUsername = normalizeUsername(listingData.owner)
        const listingOwnerEmail = normalizeEmail(listingData.owner_email || listingData.ownerEmail)

        const matchedSeller = usersArray.find((candidate) => {
          const candidateUsername = normalizeUsername(candidate?.username || candidate?.Username || candidate?.user_name)
          const candidateEmail = normalizeEmail(candidate?.email || candidate?.Email || candidate?.user_email)

          return (
            (listingOwnerUsername && candidateUsername === listingOwnerUsername) ||
            (listingOwnerEmail && candidateEmail === listingOwnerEmail)
          )
        })

        setSeller(matchedSeller || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post details.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const transactionLabel = useMemo(() => {
    if (!listing?.transaction_type) return 'Not specified'
    return String(listing.transaction_type)
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [listing?.transaction_type])

  const priceLabel = useMemo(() => {
    const numericPrice = Number(listing?.price)
    if (Number.isFinite(numericPrice) && numericPrice > 0) {
      return `$${numericPrice.toLocaleString(undefined, {
        minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })}`
    }
    return 'N/A'
  }, [listing?.price])

  const sellerUsername =
    normalizeUsername(seller?.username || seller?.Username || seller?.user_name) ||
    normalizeUsername(listing?.owner)

  const sellerProfilePath = sellerUsername ? `/profile/${encodeURIComponent(sellerUsername)}` : '/login'

  const sellerDisplayName =
    seller?.name ||
    seller?.username ||
    seller?.Username ||
    listing?.owner ||
    'Unknown seller'

  const sellerRatingValue = Number(seller?.rating ?? seller?.sellerRating)
  const sellerRating = Number.isFinite(sellerRatingValue) && sellerRatingValue > 0
    ? sellerRatingValue.toFixed(1)
    : 'N/A'
  const isSold = String(listing?.status || '').toLowerCase() === 'sold'

  const sellerInitials = sellerDisplayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <main className="post-details-page">
      <nav className="main-nav">
        <div className="main-nav-left">
          <Link to="/">
            <img src={FullLogo} alt="Swapify" />
          </Link>
        </div>
      </nav>

      <div className="post-details-container">
        {loading ? (
          <div className="post-details-state">Loading post details…</div>
        ) : error ? (
          <div className="post-details-state error">{error}</div>
        ) : (
          <>
            <section className="post-details-main-card">
              <div className="post-details-image-wrap">
                {listing?.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing?.title || 'Listing image'} className="post-details-image" />
                ) : (
                  <div className="post-details-image-fallback">No image</div>
                )}
                <div className="post-details-price-overlay">{priceLabel !== 'N/A' ? priceLabel : transactionLabel}</div>
              </div>
            </section>

            <div className="post-details-side-stack">
              <aside className="post-seller-card">
                <h2>Seller</h2>
                <div className="post-details-seller-header">
                  <div className="post-details-seller-avatar">{sellerInitials || '?'}</div>
                  <div className="post-details-seller-text">
                    <p className="post-details-seller-name">{sellerDisplayName}</p>
                    <p className="post-details-seller-rating">
                      <span className="star-icon">★</span>
                      {sellerRating}
                    </p>
                  </div>
                </div>
                {seller?.bio && <p className="seller-bio">{seller.bio}</p>}

                <div className="seller-links">
                  <Link to={sellerProfilePath} className="seller-link primary">
                    View Profile
                  </Link>
                </div>
              </aside>

              <section className="post-details-content-card">
                <div className="post-details-content">
                  <h1>{listing?.title || 'Untitled listing'}</h1>
                  <p className="post-details-location">{listing?.meetup_location || listing?.location || 'Location not specified'}</p>
                  <p className="post-details-description">
                    {listing?.description || 'No description provided for this post.'}
                  </p>

                  <div className="post-details-meta-grid">
                    <div>
                      <span className="label">Price</span>
                      <span>{priceLabel}</span>
                    </div>
                    <div>
                      <span className="label">Type</span>
                      <span>{transactionLabel}</span>
                    </div>
                    <div>
                      <span className="label">Location</span>
                      <span>{listing?.meetup_location || listing?.location || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="label">Status</span>
                      <span>{listing?.status || 'active'}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="post-buy-card">
                {isSold ? (
                  <button type="button" className="post-buy-button" disabled>
                    Sold
                  </button>
                ) : (
                  <Link to={sellerProfilePath} className="post-buy-button">
                    Click to Buy
                  </Link>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default PostDetails
