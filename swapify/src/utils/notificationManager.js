// Global notification state
let notificationListeners = new Set()
let activeNotifications = new Map() // id -> notification object

let notificationId = 0

/**
 * Subscribe to notification updates
 * Returns unsubscribe function
 */
export const subscribeToNotifications = (callback) => {
  notificationListeners.add(callback)
  return () => {
    notificationListeners.delete(callback)
  }
}

/**
 * Emit notification to all listeners
 */
const notifyListeners = () => {
  const notifications = Array.from(activeNotifications.values())
  notificationListeners.forEach(callback => {
    callback(notifications)
  })
}

/**
 * Show a notification
 * @param {Object} options
 * @param {string} options.message - Notification message
 * @param {string} options.type - 'saving' | 'success' | 'error' (default: 'info')
 * @param {number} options.duration - Auto-dismiss after ms (0 = no auto-dismiss)
 * @param {string} options.listingId - Optional listing ID for context
 */
export const showNotification = (options) => {
  const {
    message,
    type = 'info',
    duration = 0,
    listingId = null
  } = options

  const id = `notif-${++notificationId}`
  const notification = {
    id,
    message,
    type,
    listingId,
    createdAt: Date.now()
  }

  activeNotifications.set(id, notification)
  notifyListeners()

  // Auto-dismiss if duration specified
  if (duration > 0) {
    setTimeout(() => {
      dismissNotification(id)
    }, duration)
  }

  return id
}

/**
 * Update a notification
 */
export const updateNotification = (id, updates) => {
  if (activeNotifications.has(id)) {
    const notification = activeNotifications.get(id)
    activeNotifications.set(id, { ...notification, ...updates })
    notifyListeners()
  }
}

/**
 * Dismiss a notification
 */
export const dismissNotification = (id) => {
  if (activeNotifications.delete(id)) {
    notifyListeners()
  }
}

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  activeNotifications.clear()
  notifyListeners()
}

/**
 * Get current notifications
 */
export const getNotifications = () => {
  return Array.from(activeNotifications.values())
}

/**
 * Dismiss all notifications of a specific type
 */
export const dismissNotificationsByType = (type) => {
  let dismissed = false
  activeNotifications.forEach((notif, id) => {
    if (notif.type === type) {
      activeNotifications.delete(id)
      dismissed = true
    }
  })
  if (dismissed) {
    notifyListeners()
  }
}

/**
 * Helper to show a saving notification and auto-update to success/error
 * Returns a promise that resolves when complete
 */
export const showSaveNotification = async (promise, listingId) => {
  const notifId = showNotification({
    message: `Saving...`,
    type: 'saving',
    listingId
  })

  try {
    await promise
    updateNotification(notifId, {
      message: '✓ Saved',
      type: 'success'
    })
    // Auto-dismiss success after 2 seconds
    setTimeout(() => {
      dismissNotification(notifId)
    }, 2000)
  } catch (err) {
    updateNotification(notifId, {
      message: '✗ Failed to save',
      type: 'error'
    })
    // Auto-dismiss error after 4 seconds
    setTimeout(() => {
      dismissNotification(notifId)
    }, 4000)
  }
}
