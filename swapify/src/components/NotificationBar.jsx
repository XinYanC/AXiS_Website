import { useEffect, useState } from 'react'
import { subscribeToNotifications } from '../utils/notificationManager'
import '../styles/notificationBar.css'

export default function NotificationBar() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notifs) => {
      setNotifications(notifs)
    })

    return unsubscribe
  }, [])

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="notification-bar">
      {notifications.map((notif) => (
        <div key={notif.id} className={`notification notification-${notif.type}`}>
          <span className="notification-message">{notif.message}</span>
        </div>
      ))}
    </div>
  )
}
