import { readUsers, updateUser } from '../api/users'
import { updateListing } from '../api/listings'
import { showNotification, updateNotification, dismissNotification } from './notificationManager'

const normalizeId = (id) => String(id || '').trim()

// Cache for current user's saved listings
let cachedSavedListings = new Set() // normalized listing IDs
let cacheKey = null // Current user identifier

// Track in-flight requests to prevent race conditions
const inFlightRequests = new Map() // listingId -> Promise

// Cache change listeners
let cacheChangeListeners = new Set()

/**
 * Subscribe to cache changes
 * Returns unsubscribe function
 */
export const subscribeToCacheChanges = (callback) => {
  cacheChangeListeners.add(callback)
  return () => {
    cacheChangeListeners.delete(callback)
  }
}

/**
 * Notify all listeners of cache changes
 */
const notifyCacheChange = (listingId, isLiked) => {
  cacheChangeListeners.forEach(callback => {
    callback(listingId, isLiked)
  })
}

/**
 * Initialize the cache with the current user's saved listings
 * Call this when user logs in
 */
export const initializeLikeCache = async (username, email) => {
  const normalized = {
    username: normalizeId(username).toLowerCase(),
    email: normalizeId(email).toLowerCase()
  }
  
  cacheKey = normalized.username || normalized.email

  try {
    const response = await readUsers()
    const users = response?.User ? Object.values(response.User) : []

    const user = users.find(u => 
      normalizeId(u?.username).toLowerCase() === normalized.username ||
      normalizeId(u?.email).toLowerCase() === normalized.email
    )

    if (user && Array.isArray(user.saved_listings)) {
      cachedSavedListings = new Set(user.saved_listings.map(id => normalizeId(id)))
      console.log(`Initialized like cache with ${cachedSavedListings.size} liked items`)
    } else {
      cachedSavedListings = new Set()
    }
  } catch (err) {
    console.error('Failed to initialize like cache:', err)
    cachedSavedListings = new Set()
  }
}

/**
 * Reinitialize cache on page refresh if user is logged in
 * Call this in App.jsx on initial mount or when auth state changes
 */
export const reinitializeCacheOnPageLoad = async () => {
  if (typeof window === 'undefined') return

  try {
    const username = localStorage.getItem('swapify.username')
    const email = localStorage.getItem('swapify.email')

    // Only reinitialize if user is logged in
    if (username || email) {
      await initializeLikeCache(username || '', email || '')
      console.log('Cache reinitialized on page load')
    }
  } catch (err) {
    console.error('Failed to reinitialize cache on page load:', err)
  }
}

/**
 * Clear the cache (call on logout)
 */
export const clearLikeCache = () => {
  cachedSavedListings.clear()
  cacheKey = null
}

/**
 * Get like state from cache (synchronous, instant)
 */
export const getLikeStateFromCache = (listingId) => {
  const normalizedListingId = normalizeId(listingId)
  return cachedSavedListings.has(normalizedListingId)
}

/**
 * Update cache locally and sync to backend asynchronously
 */
export const toggleLike = async (listingId, username, email) => {
  const normalizedListingId = normalizeId(listingId)
  
  if (!normalizedListingId) {
    throw new Error('Invalid listing ID')
  }
  
  if (!username && !email) {
    throw new Error('User not authenticated')
  }

  // Update cache immediately for instant UI response
  const isCurrentlyLiked = cachedSavedListings.has(normalizedListingId)
  const shouldLike = !isCurrentlyLiked
  
  if (shouldLike) {
    cachedSavedListings.add(normalizedListingId)
  } else {
    cachedSavedListings.delete(normalizedListingId)
  }

  console.log(`Updated cache: ${normalizedListingId} is now ${shouldLike ? 'liked' : 'unliked'}`)

  // Show saving notification
  const notifId = showNotification({
    message: shouldLike ? 'Saving post...' : 'Removing post...',
    type: 'saving',
    listingId: normalizedListingId
  })

  // Sync to backend in the background with retry logic
  syncLikeToBackend(normalizedListingId, shouldLike, username, email, notifId).catch(err => {
    console.error('Failed to sync like to backend after retries:', err)
    // Only revert if all retries exhausted
    if (shouldLike) {
      cachedSavedListings.delete(normalizedListingId)
    } else {
      cachedSavedListings.add(normalizedListingId)
    }
    // Notify listeners of the actual cache state after revert
    const actualState = cachedSavedListings.has(normalizedListingId)
    notifyCacheChange(normalizedListingId, actualState)
    // Update notification to error state
    const errorMessage = shouldLike ? 'Failed to save' : 'Failed to remove'
    updateNotification(notifId, {
      message: `✗ ${errorMessage}`,
      type: 'error'
    })
    // Auto-dismiss error after 4 seconds
    setTimeout(() => {
      dismissNotification(notifId)
    }, 4000)
  })
}

/**
 * Sync a like/save to the backend (background sync with retry)
 * Optimized to only update current user's data without fetching all users
 */
const syncLikeToBackend = async (normalizedListingId, shouldLike, username, email, notifId) => {
  // If there's already a request in flight for this listing, wait for it first
  if (inFlightRequests.has(normalizedListingId)) {
    console.log(`Waiting for in-flight request for ${normalizedListingId}`)
    await inFlightRequests.get(normalizedListingId)
  }

  // Create the promise for this request with retry logic
  const syncPromise = (async () => {
    const maxRetries = 5
    let retryCount = 0
    let lastError = null
    let isComplete = false

    while (retryCount < maxRetries) {
      try {
        // Get all users from backend to find current user
        const response = await readUsers()
        const users = response?.User ? Object.values(response.User) : []

        // Find current user
        const normalized = {
          username: normalizeId(username).toLowerCase(),
          email: normalizeId(email).toLowerCase()
        }
        
        const currentUser = users.find(u => 
          normalizeId(u?.username).toLowerCase() === normalized.username ||
          normalizeId(u?.email).toLowerCase() === normalized.email
        )

        if (!currentUser) {
          throw new Error('User not found')
        }

        // Get current saved listings from backend
        const backendSaved = currentUser.saved_listings && Array.isArray(currentUser.saved_listings)
          ? currentUser.saved_listings.map(id => normalizeId(id)).sort()
          : []

        // Build new saved listings based on desired state
        let newSaved = backendSaved
        if (shouldLike) {
          newSaved = Array.from(new Set([...backendSaved, normalizedListingId])).sort()
        } else {
          newSaved = backendSaved.filter(id => id !== normalizedListingId)
        }

        // Only update if state actually changed
        const stateChanged = JSON.stringify(backendSaved) !== JSON.stringify(newSaved)
        if (!stateChanged) {
          console.log(`Backend state unchanged for ${normalizedListingId}`)
          // Success - state was already correct
          if (!isComplete) {
            isComplete = true
            const successMessage = shouldLike ? '✓ Saved' : '✓ Unsaved'
            updateNotification(notifId, {
              message: successMessage,
              type: 'success'
            })
            // Notify all listeners of the actual cache state
            const isCurrentlyLiked = cachedSavedListings.has(normalizedListingId)
            notifyCacheChange(normalizedListingId, isCurrentlyLiked)
            setTimeout(() => {
              dismissNotification(notifId)
            }, 2000)
          }
          return
        }

        // Update user's saved listings
        await updateUser(currentUser.username, {
          saved_listings: newSaved
        })

        const currentLikes = Number(currentUser.num_likes) || 0
        const likeCountDelta = shouldLike ? 1 : -1
        const newLikeCount = Math.max(0, currentLikes + likeCountDelta)
        
        // Update listing's like count
        await updateListing(normalizedListingId, {
          num_likes: newLikeCount
        })

        console.log(`Synced like for ${normalizedListingId}: count=${newLikeCount}`)

        // Update notification to success
        if (!isComplete) {
          isComplete = true
          const successMessage = shouldLike ? '✓ Saved' : '✓ Unsaved'
          updateNotification(notifId, {
            message: successMessage,
            type: 'success'
          })
          // Notify all listeners of the actual cache state
          const isCurrentlyLiked = cachedSavedListings.has(normalizedListingId)
          notifyCacheChange(normalizedListingId, isCurrentlyLiked)

          // Auto-dismiss success after 2 seconds
          setTimeout(() => {
            dismissNotification(notifId)
          }, 2000)
        }
        
        // Success - break out of retry loop
        return
      } catch (err) {
        lastError = err
        retryCount++
        
        if (retryCount < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delayMs = 1000 * Math.pow(2, retryCount - 1)
          console.log(`Retry ${retryCount}/${maxRetries} for ${normalizedListingId} in ${delayMs}ms`, err)
          
          // Keep notification showing "Saving..." during retries (only update if not complete)
          if (!isComplete) {
            updateNotification(notifId, {
              message: 'Saving...',
              type: 'saving'
            })
          }
          
          await new Promise(resolve => setTimeout(resolve, delayMs))
        } else {
          console.error(`All ${maxRetries} retries failed for ${normalizedListingId}:`, err)
        }
      }
    }

    // All retries exhausted
    if (lastError) {
      throw lastError
    }
  })()

  // Track this request
  inFlightRequests.set(normalizedListingId, syncPromise)
  
  // Clean up in-flight tracking when done
  syncPromise.finally(() => {
    inFlightRequests.delete(normalizedListingId)
  })
  
  return syncPromise
}

