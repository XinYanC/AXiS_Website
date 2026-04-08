import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FullLogo from '../assets/FullLogo.PNG'
import ProfileAvatar from './ProfileAvatar'
import FilterDropdown from './FilterDropdown'
import { FiSliders, FiGrid, FiMap, FiHeart } from 'react-icons/fi'

const DEFAULT_NAV_FILTERS = {
  city: '',
  price: '',
  transactionType: '',
}

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
  onSearchSubmit,
  autoNavigateToGridOnEnter = true,
  showLogoutButton = false,
  onLogout,
  filters = DEFAULT_NAV_FILTERS,
  onFilterChange,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [authState, setAuthState] = useState(getAuthState)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

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

  useEffect(() => {
    setLocalSearchQuery(searchQuery || '')
  }, [searchQuery])

  const handleSearchChange = (e) => {
    const nextValue = e.target.value
    setLocalSearchQuery(nextValue)
    if (typeof onSearchChange === 'function') {
      onSearchChange(e, nextValue)
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const trimmedQuery = localSearchQuery.trim()
      if (typeof onSearchSubmit === 'function') {
        onSearchSubmit(e, localSearchQuery)
      }
      // Auto-navigate to grid with search query
      if (autoNavigateToGridOnEnter && trimmedQuery) {
        navigate(`/grid?search=${encodeURIComponent(trimmedQuery)}`)
      }
    }
  }

  const profileIdentifier = authState.username || authState.email
  const profilePath = profileIdentifier
    ? `/profile/${encodeURIComponent(profileIdentifier)}`
    : '/login'
  const savedItemsPath = authState.username
    ? `/saved-items/${encodeURIComponent(profileIdentifier)}`
    : '/login'



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
          value={localSearchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />
        <div style={{ position: 'relative' }}>
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
      </div>

      <div className="main-nav-right">
        <Link to={location.pathname === '/grid' ? '/' : '/grid'} className="nav-map-link" aria-label={location.pathname === '/grid' ? 'Map' : 'Grid'} title={location.pathname === '/grid' ? 'Map' : 'Grid'}>
          {location.pathname === '/grid' ? <FiMap size={24} /> : <FiGrid size={24} />}
        </Link>
        {authState.isLoggedIn ? (
          <>
            <Link to={savedItemsPath} className="nav-saved-items-link" aria-label="Saved Items" title="Saved Items">
              <FiHeart size={24} />
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