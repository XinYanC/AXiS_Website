import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { readListingById, updateListing } from '../api'
import { readUsersWithRetry } from '../api/users'
import { toggleLike, getLikeStateFromCache, subscribeToCacheChanges } from '../utils/likeSync'
import Navbar from '../components/Navbar'
import ProfileAvatar from '../components/ProfileAvatar'
import { getListingImageUrls } from '../utils/images'
import { formatGeoLocation } from '../utils/geo'
import { FiHeart, FiMapPin } from 'react-icons/fi'
import '../styles/postDetails.css'

const normalizeUsername = (value) => String(value || '').trim().replace(/^@+/, '').toLowerCase()
const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase()

const toUsersArray = (usersResponse) => {
  const bucket = usersResponse?.User
  if (bucket) {
    return Object.values(bucket)
  }
  return []
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

function PostDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageErrors, setImageErrors] = useState({})
  const [liked, setLiked] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const pendingLikedRef = useRef(null)
  const isSyncingRef = useRef(false)

  const listingImageUrls = useMemo(() => getListingImageUrls(listing), [listing])

  useEffect(() => {
    setCurrentImageIndex(0)
    setImageErrors({})
  }, [listingImageUrls])

  const loadData = useCallback(async (showLoading = true) => {
    if (!id) {
      setError('Post id is missing.')
      setLoading(false)
      return
    }

    if (showLoading) {
      setLoading(true)
    }
    setError('')

    let listingData = null
    try {
      listingData = await readListingById(id)
    } catch (err) {
      console.error('Error fetching listing:', err)
      setError(err instanceof Error ? err.message : 'Failed to load post.')
      setLoading(false)
      return
    }

    if (!listingData) {
      setListing(null)
      setSeller(null)
      setError('Post not found.')
      setLoading(false)
      return
    }

    setListing(listingData)

    try {
      const usersResponse = await readUsersWithRetry()
      const usersArray = toUsersArray(usersResponse)

      const ownerRaw = String(listingData.owner || '').trim()

      const matchedSeller = usersArray.find((candidate) => {
        const u = normalizeIdentifier(candidate?.username)
        const o = normalizeIdentifier(ownerRaw)
        return u && o && u === o
      })

      setSeller(matchedSeller || null)

      // Fetch liked state
      const viewer = getViewerIdentity()
      const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail
      if (viewerKey) {
        const normalizedId = String(id).trim()
        const isLiked = getLikeStateFromCache(normalizedId)
        console.debug(`PostDetails - Post ${id}, isLiked: ${isLiked}`)
        setLiked(isLiked)
      } else {
        setLiked(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post details.')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  useEffect(() => {
    const refreshDetails = () => {
      loadData(false)
    }

    // Refresh when user returns from another page
    window.addEventListener('focus', refreshDetails)

    return () => {
      window.removeEventListener('focus', refreshDetails)
    }
  }, [loadData])

  useEffect(() => {
    // Subscribe to cache changes to revert UI if sync fails
    const unsubscribe = subscribeToCacheChanges((listingId, isLiked) => {
      if (listingId === String(id).trim()) {
        setLiked(isLiked)
      }
    })

    return unsubscribe
  }, [id])

  const processPendingLikeSync = useCallback(async () => {
    if (isSyncingRef.current || !id) {
      return
    }

    isSyncingRef.current = true
    setIsUpdating(true)

    try {
      while (pendingLikedRef.current !== null) {
        const targetLiked = pendingLikedRef.current
        pendingLikedRef.current = null
        const listingId = String(id)
        const viewer = getViewerIdentity()

        try {
          await toggleLike(listingId, viewer.username, viewer.email)
        } catch (backendErr) {
          console.error('Failed to sync save/like with backend:', backendErr)
          if (pendingLikedRef.current === null) {
            setLiked(!targetLiked)
          }
        }
      }
    } finally {
      isSyncingRef.current = false
      setIsUpdating(false)
    }
  }, [id])

  useEffect(() => {
    const flushPendingLikeSync = () => {
      if (pendingLikedRef.current !== null) {
        void processPendingLikeSync()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingLikeSync()
      }
    }

    window.addEventListener('pagehide', flushPendingLikeSync)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushPendingLikeSync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [processPendingLikeSync])

  const handleLike = useCallback((e) => {
    if (e) {
      e.stopPropagation()
    }

    const viewer = getViewerIdentity()
    const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail
    if (!viewerKey) {
      // Redirect to login if not logged in
      navigate('/login', { state: { fromLike: true } })
      return
    }

    const nextLiked = !liked

    setLiked(nextLiked)
    
    // Update the like count immediately
    const currentLikes = Number(listing?.num_likes) || 0
    const newLikeCount = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
    setListing((prev) => (prev ? { ...prev, num_likes: newLikeCount } : null))
    
    pendingLikedRef.current = nextLiked
    void processPendingLikeSync()
  }, [liked, listing?.num_likes, processPendingLikeSync, navigate])

  // Button text based on transaction type
  const getBuyButtonText = () => {
    if (isOwnedByCurrentUser) return isSold ? 'Sold' : 'Mark as Sold'
    if (isSold) return 'Sold'
    return 'View Seller'
  }

  const handleMarkAsSold = async () => {
    if (!isOwnedByCurrentUser || !listing?._id) return

    try {
      await updateListing(String(listing._id).trim(), { status: 'sold' })
      setListing((prev) => (prev ? { ...prev, status: 'sold' } : null))
    } catch (err) {
      console.error('Error marking post as sold:', err)
      setError('Failed to mark post as sold')
    }
  }

  const handleMessageSeller = (e) => {
    const viewer = getViewerIdentity()
    const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail
    if (!viewerKey) {
      // Redirect to login if not logged in
      e.preventDefault()
      navigate('/login', { state: { fromMessage: true } })
      return
    }
  }

  const [shareFeedback, setShareFeedback] = useState('')

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const shareData = {
      title: listing?.title || 'Swapify listing',
      text: `Check out "${listing?.title || 'this listing'}" on Swapify`,
      url,
    }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData)
        return
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareFeedback('Link copied!')
        setTimeout(() => setShareFeedback(''), 2000)
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

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

  const likesCount = useMemo(() => {
    const numericLikes = Number(listing?.num_likes)
    if (Number.isFinite(numericLikes) && numericLikes >= 0) {
      return numericLikes
    }
    return 0
  }, [listing])

  const locationLabel = formatGeoLocation(listing) || 'Unknown location'
  const hasLocation = Boolean(String(locationLabel || '').trim() && locationLabel !== 'Location not specified')
  const mapEmbedUrl = hasLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(String(locationLabel))}&output=embed`
    : ''
  const mapsExternalUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(locationLabel))}`
    : ''

  const sellerUsername =
    normalizeUsername(seller?.username) || normalizeUsername(listing?.owner)

  const sellerDisplayName =
    seller?.name || seller?.username || listing?.owner || 'Unknown seller'

  const sellerProfilePath = sellerUsername ? `/profile/${encodeURIComponent(sellerUsername)}` : '/login'

  const viewerIdentity = getViewerIdentity()
  const listingOwnerRaw = String(listing?.owner || '').trim()
  const isOwnedByCurrentUser = Boolean(
    (viewerIdentity.username &&
      normalizeIdentifier(viewerIdentity.username) === normalizeIdentifier(listingOwnerRaw)) ||
    (viewerIdentity.email &&
      normalizeIdentifier(viewerIdentity.email) === normalizeIdentifier(listingOwnerRaw)) ||
    (viewerIdentity.username &&
      seller?.username &&
      normalizeIdentifier(viewerIdentity.username) === normalizeIdentifier(seller.username)) ||
    (viewerIdentity.email &&
      seller?.email &&
      normalizeIdentifier(viewerIdentity.email) === normalizeIdentifier(seller.email))
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/grid?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <main className="post-details-page">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
      />

      <div className="post-details-container">
        {loading ? (
          <div className="post-details-state">Loading post details…</div>
        ) : error ? (
          <div className="post-details-state error">{error}</div>
        ) : (
          <>

            <section className="post-details-main-card">
              <div className="post-details-image-wrap">
                {isSold && (
                  <div className="post-details-sold-overlay">SOLD</div>
                )}
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
              </div>
            </section>


            <div className="post-details-side-stack">
              <Link to={sellerProfilePath} className="post-seller-card post-seller-card-link">
                <div className="post-details-seller-header">
                  <ProfileAvatar value={sellerDisplayName} className="post-details-seller-avatar post-details-seller-avatar-large" />
                  <div className="post-details-seller-text">
                    <span className="post-details-seller-label">Seller</span>
                    <span className="post-details-seller-name">{sellerDisplayName}</span>
                  </div>
                </div>
              </Link>

              <section className="post-details-content-card">
                <div className="post-details-content">
                  <h1 className="post-details-title">{listing?.title || 'Untitled listing'}</h1>
                  <p className="post-details-description">
                    {listing?.description || 'No description provided for this post.'}
                  </p>
                  <p className="post-details-location">
                    <FiMapPin style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    {locationLabel}
                  </p>

                  <div className="post-details-meta-grid">
                    <div>
                      <span className="label">Price</span>
                      <span>{priceLabel}</span>
                    </div>
                    <div>
                      <span className="label">Likes</span>
                      <button
                        type="button"
                        onClick={handleLike}
                        className={`post-details-like-button ${liked ? 'liked' : ''} ${isUpdating ? 'syncing' : ''}`}
                        aria-label={liked ? 'Unlike post' : 'Like post'}
                        aria-busy={isUpdating}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: 'inherit',
                          color: 'inherit',
                        }}
                      >
                        <FiHeart style={{ fill: liked ? 'currentColor' : 'none' }} />
                        {likesCount}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="post-details-action-buttons">
                {isOwnedByCurrentUser ? (
                  <button
                    type="button"
                    onClick={handleMarkAsSold}
                    className="post-buy-button"
                    disabled={isSold}
                    style={isSold ? { opacity: 0.7, cursor: 'default' } : {}}
                  >
                    {getBuyButtonText()}
                  </button>
                ) : null}
                {!isOwnedByCurrentUser && seller?.email ? (
                  <a
                    href={`mailto:${encodeURIComponent(seller.email)}?subject=${encodeURIComponent(`Interested in your Swapify listing: ${listing?.title || 'your item'}`)}&body=${encodeURIComponent(`Hi ${seller?.username || 'there'},\n\nI saw your listing "${listing?.title || ''}" on Swapify and I'm interested in buying it. Is it still available?\n\nThanks!`)}`}
                    onClick={handleMessageSeller}
                    className="post-message-button post-buy-button"
                  >
                    Message Seller
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={handleShare}
                  className="post-share-button"
                >
                  {shareFeedback || 'Share'}
                </button>
              </div>
            </div>

            <section className="post-details-map-card">
              <div className="post-details-map-header">
                <h2>Approximate Location</h2>
                {hasLocation ? (
                  <a
                    href={mapsExternalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="post-details-map-link"
                  >
                    Open in Maps
                  </a>
                ) : null}
              </div>

              {hasLocation ? (
                <div className="post-details-map-frame-wrap">
                  <iframe
                    title={`Map for ${locationLabel}`}
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="post-details-map-frame"
                  />
                </div>
              ) : (
                <p className="post-details-map-empty">Location not specified for this item.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default PostDetails
