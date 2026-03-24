import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { readListingById, readUsers, updateListing, updateUser } from '../api'
import Navbar from '../components/Navbar'
import ProfileAvatar from '../components/ProfileAvatar'
import { getListingImageUrls } from '../utils/images'
import { FiHeart, FiMapPin } from 'react-icons/fi'
import '../styles/postDetails.css'

// Global queue to serialize like/unlike operations and prevent race conditions
let likeQueue = Promise.resolve();

const queueLikeOperation = async (operation) => {
  likeQueue = likeQueue.then(() => operation());
  return likeQueue;
};

const normalizeUsername = (value) => String(value || '').trim().replace(/^@+/, '').toLowerCase()
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()
const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase()

const toUsersArray = (usersResponse) => {
  if (usersResponse && (usersResponse.Users || usersResponse.User)) {
    return Object.values(usersResponse.Users || usersResponse.User)
  }
  return Array.isArray(usersResponse) ? usersResponse : []
}

const resolveSavedPostIds = (user) => {
  const savedField =
    user?.saved_listings ||
    user?.savedListings ||
    user?.saved_posts ||
    user?.savedPosts ||
    user?.favorites ||
    []

  if (Array.isArray(savedField)) {
    return savedField.map((item) => String(item || '').trim()).filter(Boolean)
  }

  if (savedField && typeof savedField === 'object') {
    return Object.values(savedField)
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }

  return []
}

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

const syncLikeAndSaveToBackend = async ({ listingId, nextLiked }) => {
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
      const candidateUsername = normalizeIdentifier(candidate?.username || candidate?.Username || candidate?.user_name)
      const candidateEmail = normalizeIdentifier(candidate?.email || candidate?.Email || candidate?.user_email)

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

    const userIdentifierForUpdate =
      matchedUser?.username ||
      matchedUser?.Username ||
      matchedUser?.user_name ||
      viewer.username ||
      viewer.email

    if (userIdentifierForUpdate) {
      await updateUser(userIdentifierForUpdate, {
        saved_listings: nextSaved,
      })
    }

    // Calculate new like count from current users data
    const numLikes = users.reduce((count, candidate) => {
      const candidateSaved = resolveSavedPostIds(candidate)
      const candidateKey =
        normalizeIdentifier(candidate?.username || candidate?.Username || candidate?.user_name) ||
        normalizeIdentifier(candidate?.email || candidate?.Email || candidate?.user_email) ||
        normalizeIdentifier(candidate?._id || candidate?.id)

      const matchedKey =
        normalizeIdentifier(matchedUser?.username || matchedUser?.Username || matchedUser?.user_name) ||
        normalizeIdentifier(matchedUser?.email || matchedUser?.Email || matchedUser?.user_email) ||
        normalizeIdentifier(matchedUser?._id || matchedUser?.id)

      const effectiveSaved = candidateKey && matchedKey && candidateKey === matchedKey
        ? nextSaved
        : candidateSaved

      return effectiveSaved.includes(normalizedListingId) ? count + 1 : count
    }, 0)

    await updateListing(normalizedListingId, {
      num_likes: numLikes,
    })
  } catch (err) {
    console.error('Error syncing like to backend:', err)
    throw err
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

      // Fetch liked state
      const viewer = getViewerIdentity()
      const viewerKey = viewer.normalizedUsername || viewer.normalizedEmail
      if (viewerKey) {
        const matchedUser = usersArray.find((candidate) => {
          const candidateUsername = normalizeUsername(candidate?.username || candidate?.Username || candidate?.user_name)
          const candidateEmail = normalizeEmail(candidate?.email || candidate?.Email || candidate?.user_email)

          return (
            (viewer.normalizedUsername && candidateUsername === viewer.normalizedUsername) ||
            (viewer.normalizedEmail && candidateEmail === viewer.normalizedEmail)
          );
        })

        const savedIds = matchedUser ? resolveSavedPostIds(matchedUser) : []
        const normalizedId = String(id).trim()
        const isLiked = savedIds.includes(normalizedId)
        console.debug(`PostDetails - Post ${id}, isLiked: ${isLiked}, savedIds:`, savedIds)
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

        try {
          await queueLikeOperation(async () => {
            await syncLikeAndSaveToBackend({ listingId, nextLiked: targetLiked })
          })
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
      return
    }

    const nextLiked = !liked

    setLiked(nextLiked)
    pendingLikedRef.current = nextLiked
    void processPendingLikeSync()
  }, [liked, processPendingLikeSync])

  const transactionLabel = useMemo(() => {
    if (!listing?.transaction_type) return 'Not specified'
    return String(listing.transaction_type)
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [listing?.transaction_type])

  // Button text based on transaction type
  const getBuyButtonText = () => {
    if (isOwnedByCurrentUser) return 'Edit post'
    if (isSold) return 'Sold'
    if (transactionLabel.toLowerCase().includes('sell')) return 'Buy'
    if (transactionLabel.toLowerCase().includes('trade')) return 'Trade'
    if (transactionLabel.toLowerCase().includes('free')) return 'Claim'
    if (transactionLabel.toLowerCase().includes('rent')) return 'Rent'
    return 'Continue'
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
    const numericLikes = Number(
      listing?.num_likes ??
      listing?.numLikes ??
      listing?.likes_count ??
      listing?.likesCount ??
      listing?.likes
    )

    if (Number.isFinite(numericLikes) && numericLikes >= 0) {
      return numericLikes
    }

    const likesCollection =
      listing?.likes ??
      listing?.liked_by ??
      listing?.likedBy ??
      listing?.favorites ??
      listing?.saved_by

    if (Array.isArray(likesCollection)) {
      return likesCollection.length
    }

    if (likesCollection && typeof likesCollection === 'object') {
      return Object.keys(likesCollection).length
    }

    return 0
  }, [listing])

  const locationLabel = listing?.meetup_location || listing?.location || 'Location not specified'
  const hasLocation = Boolean(String(locationLabel || '').trim() && locationLabel !== 'Location not specified')
  const mapEmbedUrl = hasLocation
    ? `https://www.google.com/maps?q=${encodeURIComponent(String(locationLabel))}&output=embed`
    : ''
  const mapsExternalUrl = hasLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(locationLabel))}`
    : ''

  const sellerUsername =
    normalizeUsername(seller?.username || seller?.Username || seller?.user_name) ||
    normalizeUsername(listing?.owner)

  const sellerDisplayName =
    seller?.name ||
    seller?.username ||
    seller?.Username ||
    listing?.owner ||
    'Unknown seller'

  const sellerProfilePath = sellerUsername ? `/profile/${encodeURIComponent(sellerUsername)}` : '/login'
  const messageSellerPath = sellerUsername
    ? `/messages?seller=${encodeURIComponent(sellerDisplayName)}&listingId=${encodeURIComponent(id || '')}&listingTitle=${encodeURIComponent(listing?.title || '')}`
    : '/login'

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
                    <span className="post-details-seller-rating">
                      <span className="star-icon">★</span>
                      {sellerRating}
                    </span>
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
                <Link
                  to={isOwnedByCurrentUser || isSold ? '#' : sellerProfilePath}
                  className="post-buy-button"
                  disabled={isSold}
                  style={isSold ? { pointerEvents: 'none', opacity: 0.7 } : {}}
                >
                  {getBuyButtonText()}
                </Link>
                {!isOwnedByCurrentUser ? (
                  <Link to={messageSellerPath} className="post-message-button">
                    Message Seller
                  </Link>
                ) : null}
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
