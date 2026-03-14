import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FullLogo from '../assets/FullLogo.PNG'
import ProfileAvatar from './ProfileAvatar'

const getAuthState = () => {
  if (typeof window === 'undefined') {
    return {
      isLoggedIn: false,
      username: '',
      email: '',
    }
  }

  const isLoggedIn = localStorage.getItem('swapify.authenticated') === 'true'
  const username = localStorage.getItem('swapify.username') || ''
  const email = localStorage.getItem('swapify.email') || ''

  return {
    isLoggedIn,
    username,
    email,
  }
}

function Navbar({ searchQuery = '', onSearchChange, showLogoutButton = false, onLogout }) {
  const [authState, setAuthState] = useState(getAuthState)

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(getAuthState())
    }

    window.addEventListener('storage', syncAuthState)
    window.addEventListener('focus', syncAuthState)

    return () => {
      window.removeEventListener('storage', syncAuthState)
      window.removeEventListener('focus', syncAuthState)
    }
  }, [])

  const handleSearchChange = (e) => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(e)
    }
  }

  const profileIdentifier = authState.username || authState.email
  const profilePath = profileIdentifier
    ? `/profile/${encodeURIComponent(profileIdentifier)}`
    : '/login'

  return (
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
          onChange={handleSearchChange}
        />
      </div>

      <div className="main-nav-right">
        {authState.isLoggedIn ? (
          <>
            <h2>Saved Items</h2>
            <h2>Messages</h2>
            <Link to={profilePath} className="nav-profile-link" aria-label="Profile">
              <ProfileAvatar value={profileIdentifier} className="nav-profile-avatar" />
            </Link>
            {showLogoutButton && typeof onLogout === 'function' ? (
              <button type="button" className="nav-logout-button" onClick={onLogout}>
                Logout
              </button>
            ) : null}
          </>
        ) : (
          <Link to="/login" className="nav-login-button">
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar