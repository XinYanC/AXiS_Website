import React from 'react'
import {
  PickupIcon,
  BuyIcon,
  SellIcon,
  DonationIcon,
  DropOffIcon,
  TradeIcon,
} from './post'
import '../styles/postIconsHelp.css'

const LEGEND_ITEMS = [
  { Icon: PickupIcon, label: 'Pickup' },
  { Icon: BuyIcon, label: 'Buy' },
  { Icon: SellIcon, label: 'Sell' },
  { Icon: DonationIcon, label: 'Donation' },
  { Icon: DropOffIcon, label: 'Drop-off' },
  { Icon: TradeIcon, label: 'Trade/Swap' },
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
          {LEGEND_ITEMS.map(({ Icon, label }) => (
            <li key={label} className="post-icons-help-item">
              <span className="post-icons-help-icon">
                <Icon />
              </span>
              <span className="post-icons-help-label">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PostIconsHelp
