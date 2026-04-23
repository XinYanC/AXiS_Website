import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HeartIcon } from './post'
import { getListingImageUrls } from '../utils/images'
import { formatGeoLocation } from '../utils/geo'
import { isListingSaved, toggleLike } from '../utils/likeItems'

function MapListingCard({ listing }) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const images = getListingImageUrls(listing)
  const numericPrice = Number(listing.price)
  const hasPrice = Number.isFinite(numericPrice) && numericPrice > 0
  const formattedPrice = hasPrice
    ? `$${numericPrice.toLocaleString(undefined, {
      minimumFractionDigits: numericPrice % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`
    : 'Free'

  useEffect(() => {
    const username = localStorage.getItem('swapify.username')
    const email = localStorage.getItem('swapify.email')
    if (!username && !email) {
      setLiked(false)
      return undefined
    }

    let isMounted = true
    const loadLikedState = async () => {
      try {
        const nextLiked = await isListingSaved(listing._id, username || '', email || '')
        if (isMounted) {
          setLiked(nextLiked)
        }
      } catch {
        if (isMounted) {
          setLiked(false)
        }
      }
    }

    loadLikedState()

    return () => {
      isMounted = false
    }
  }, [listing._id])

  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const username = localStorage.getItem('swapify.username')
    const email = localStorage.getItem('swapify.email')

    if (!username && !email) {
      navigate('/login', { state: { fromLike: true } })
      return
    }

    setIsUpdating(true)

    try {
      const result = await toggleLike(listing._id, username, email)
      setLiked(result.liked)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="map-listing-card-wrapper">
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
          <p className="map-listing-card-location">{formatGeoLocation(listing)}</p>
          <p className="map-listing-card-price">{formattedPrice}</p>
        </div>
      </Link>
      <button
        className={`map-listing-like-button ${liked ? 'liked' : ''} ${isUpdating ? 'syncing' : ''}`}
        onClick={handleLike}
        title={liked ? 'Unlike' : 'Like'}
        disabled={isUpdating}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <HeartIcon />
      </button>
    </div>
  )
}

export default MapListingCard
