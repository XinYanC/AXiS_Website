import { readUsers, updateUser } from '../api/users'
import { readListingById, updateListing } from '../api/listings'
import { showNotification, updateNotification, dismissNotification } from './notificationManager'

const normalizeId = (id) => String(id || '').trim()

const findCurrentUser = async (username, email) => {
  const normalized = {
    username: normalizeId(username).toLowerCase(),
    email: normalizeId(email).toLowerCase()
  }

  const response = await readUsers()
  const users = response?.User ? Object.values(response.User) : []

  return users.find(u =>
    normalizeId(u?.username).toLowerCase() === normalized.username ||
    normalizeId(u?.email).toLowerCase() === normalized.email
  )
}

const getNormalizedSavedListings = (savedListings) => {
  return savedListings.map(id => normalizeId(id)).filter(Boolean)
}

// checks if listingId passed in is in current user's saved listings
export const isListingSaved = async (listingId, username, email) => {
  const normalizedListingId = normalizeId(listingId)

  if (!username && !email) {
    throw new Error('User not authenticated')
  }

  const currentUser = await findCurrentUser(username, email)
  if (!currentUser) {
    throw new Error('User not found')
  }

  const savedListings = getNormalizedSavedListings(currentUser.saved_listings)
  return savedListings.includes(normalizedListingId)
}

export const toggleLike = async (listingId, username, email) => {
  const normalizedListingId = normalizeId(listingId)

  if (!username && !email) {
    throw new Error('User not authenticated')
  }

  const notifId = showNotification({
    message: 'Loading...',
    type: 'saving',
    listingId: normalizedListingId
  })

  try {
    const currentUser = await findCurrentUser(username, email)
    if (!currentUser) {
      throw new Error('User not found')
    }

    const savedListings = getNormalizedSavedListings(currentUser.saved_listings)
    const shouldLike = !savedListings.includes(normalizedListingId) // not already liked by user, so can like
    // add listing to savedlisting
    const nextSavedListings = shouldLike
      ? [...savedListings, normalizedListingId]
      : savedListings.filter(id => id !== normalizedListingId)

    const listing = await readListingById(normalizedListingId)
    if (!listing) {
      throw new Error('Listing not found')
    }

    const currentLikes = Number(listing.num_likes) || 0
    const nextLikes = shouldLike
      ? currentLikes + 1
      : Math.max(0, currentLikes - 1)

    await updateUser(currentUser.username, {
      saved_listings: nextSavedListings
    })
    await updateListing(normalizedListingId, {
      num_likes: nextLikes
    })

    updateNotification(notifId, {
      message: shouldLike ? '✓ Saved' : '✓ Unsaved',
      type: 'success'
    })
    setTimeout(() => {
      dismissNotification(notifId)
    }, 2000)

    return {
      liked: shouldLike,
      savedListings: nextSavedListings,
      numLikes: nextLikes
    }
  } catch (err) {
    updateNotification(notifId, {
      message: '✗ Failed to save',
      type: 'error'
    })
    setTimeout(() => {
      dismissNotification(notifId)
    }, 4000)
    throw err
  }
}

