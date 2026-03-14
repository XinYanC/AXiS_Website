import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { readListingById, readUsers } from '../api'
import Navbar from '../components/Navbar'
import ProfileAvatar from '../components/ProfileAvatar'
import { getListingImageUrls } from '../utils/images'
import '../styles/postDetails.css'

const normalizeUsername = (value) => String(value || '').trim().replace(/^@+/, '').toLowerCase()
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const getStoredViewerIdentity = () => {
  if (typeof window === 'undefined') {
    return {
      username: '',
      email: '',
    }
  }

  return {
    username: normalizeUsername(localStorage.getItem('swapify.username')),
    email: normalizeEmail(localStorage.getItem('swapify.email')),
  }
}

function PostDetails() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState({})

  const listingImageUrls = useMemo(() => getListingImageUrls(listing), [listing])

  useEffect(() => {
    setCurrentImageIndex(0)
    setImageErrors({})
  }, [listingImageUrls])

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
  const viewerIdentity = getStoredViewerIdentity()
  const sellerEmail = normalizeEmail(seller?.email || seller?.Email || seller?.user_email)
  const listingOwnerUsername = normalizeUsername(listing?.owner)
  const listingOwnerEmail = normalizeEmail(listing?.owner_email || listing?.ownerEmail)
  const isOwnedByCurrentUser = Boolean(
    (viewerIdentity.username && (
      viewerIdentity.username === sellerUsername ||
      viewerIdentity.username === listingOwnerUsername
    )) ||
    (viewerIdentity.email && (
      viewerIdentity.email === sellerEmail ||
      viewerIdentity.email === listingOwnerEmail
    ))
  )
  const isSold = String(listing?.status || '').toLowerCase() === 'sold'

  const currentImageUrl = listingImageUrls[currentImageIndex] || null
  const isCurrentImageErrored = Boolean(imageErrors[currentImageIndex])
  const hasMultipleImages = listingImageUrls.length > 1

  const showPreviousImage = () => {
    if (listingImageUrls.length < 2) {
      return
    }

    setCurrentImageIndex((prev) => {
      if (prev === 0) {
        return listingImageUrls.length - 1
      }
      return prev - 1
    })
  }

  const showNextImage = () => {
    if (listingImageUrls.length < 2) {
      return
    }

    setCurrentImageIndex((prev) => (prev + 1) % listingImageUrls.length)
  }

  const handleImageError = () => {
    setImageErrors((prev) => ({ ...prev, [currentImageIndex]: true }))
  }

  return (
    <main className="post-details-page">
      <Navbar searchQuery={searchQuery} onSearchChange={(e) => setSearchQuery(e.target.value)} />

      <div className="post-details-container">
        {loading ? (
          <div className="post-details-state">Loading post details…</div>
        ) : error ? (
          <div className="post-details-state error">{error}</div>
        ) : (
          <>
            <section className="post-details-main-card">
              <div className="post-details-image-wrap">
                {currentImageUrl && !isCurrentImageErrored ? (
                  <img
                    src={currentImageUrl}
                    alt={`${listing?.title || 'Listing'} - image ${currentImageIndex + 1}`}
                    className="post-details-image"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="post-details-image-fallback">No image</div>
                )}

                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      className="post-details-image-nav post-details-image-nav-left"
                      onClick={showPreviousImage}
                      aria-label="Previous image"
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      className="post-details-image-nav post-details-image-nav-right"
                      onClick={showNextImage}
                      aria-label="Next image"
                    >
                      &gt;
                    </button>
                    <div className="post-details-image-count">
                      {currentImageIndex + 1} / {listingImageUrls.length}
                    </div>
                  </>
                )}

                <div className="post-details-price-overlay">{priceLabel !== 'N/A' ? priceLabel : transactionLabel}</div>
              </div>
            </section>

            <div className="post-details-side-stack">
              <Link to={sellerProfilePath} className="post-seller-card post-seller-card-link">
                <h2>Seller</h2>
                <div className="post-details-seller-header">
                  <ProfileAvatar value={sellerDisplayName} className="post-details-seller-avatar" />
                  <div className="post-details-seller-text">
                    <p className="post-details-seller-name">{sellerDisplayName}</p>
                    <p className="post-details-seller-rating">
                      <span className="star-icon">★</span>
                      {sellerRating}
                    </p>
                  </div>
                </div>
                {seller?.bio && <p className="seller-bio">{seller.bio}</p>}
              </Link>

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

              {isSold ? (
                <button type="button" className="post-buy-button" disabled>
                  Sold
                </button>
              ) : (
                <Link to={sellerProfilePath} className="post-buy-button">
                  {isOwnedByCurrentUser ? 'Edit post' : 'Click to Buy'}
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default PostDetails
