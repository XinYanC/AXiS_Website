import { Link } from 'react-router-dom'

function ProfileMenuDropdown({ profilePath, onClose, onLogout, showLogout = true }) {
  return (
    <div className="profile-menu-dropdown" role="menu" aria-label="Profile options">
      <Link
        to={profilePath}
        role="menuitem"
        className="profile-menu-item"
        onClick={onClose}
      >
        Go to Profile
      </Link>
      {showLogout ? (
        <button
          type="button"
          role="menuitem"
          className="profile-menu-item profile-menu-item-button"
          onClick={onLogout}
        >
          Logout
        </button>
      ) : null}
    </div>
  )
}

export default ProfileMenuDropdown
