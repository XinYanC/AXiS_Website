import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FullLogo from '../assets/FullLogo.PNG'
import ProfileAvatar from './ProfileAvatar'
import FilterDropdown from './FilterDropdown'
import './FilterDropdown.css'
import { FiSliders } from 'react-icons/fi'

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

function Navbar({
  searchQuery = '',
  onSearchChange,
  showLogoutButton = false,
  onLogout,
  filters = {},
  onFilterChange,
}) {
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
  const savedItemsPath = authState.username
    ? `/saved-items/${encodeURIComponent(profileIdentifier)}`
    : '/login'
  const messagesPath = authState.isLoggedIn ? '/messages' : '/login'



  const [showFilter, setShowFilter] = useState(false)

  return (
    <nav className="main-nav">
      <div className="main-nav-left">
        <Link to="/">
          <img src={FullLogo} alt="Swapify" />
        </Link>
      </div>

      <div className="search-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          className="search-bar"
          placeholder="Search listings..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button
          type="button"
          className="filter-btn"
          aria-label="Filter listings"
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '50%',
            cursor: 'pointer',
            padding: 8,
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 0
          }}
          onClick={() => setShowFilter((v) => !v)}
        >
          <FiSliders />
        </button>
        {showFilter && (
          <FilterDropdown
            filters={filters}
            onChange={onFilterChange}
            onClose={() => setShowFilter(false)}
          />
        )}
      </div>

      <div className="main-nav-right">
        {authState.isLoggedIn ? (
          <>
            <Link to={savedItemsPath} className="nav-saved-items-link">
              <h2>Saved Items</h2>
            </Link>
            <Link to={messagesPath} className="nav-messages-link">
              <h2>Messages</h2>
            </Link>
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