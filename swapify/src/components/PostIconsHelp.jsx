import React from 'react'
import { SellIcon, DonationIcon } from './post'
import '../styles/postIconsHelp.css'

const LEGEND_ITEMS = [
  { Icon: DonationIcon, label: 'Free' },
  { Icon: SellIcon, label: 'Sell' },
]

function PostIconsHelp({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div
      className="post-icons-help-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-icons-help-title"
    >
      <div
        className="post-icons-help-card"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="post-icons-help-header">
          <h2 id="post-icons-help-title">Transaction types</h2>
          <button
            type="button"
            className="post-icons-help-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <ul className="post-icons-help-list">
          {LEGEND_ITEMS.map((item) => (
            <li key={item.label} className="post-icons-help-item">
              <span className="post-icons-help-icon">
                {React.createElement(item.Icon)}
              </span>
              <span className="post-icons-help-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PostIconsHelp
