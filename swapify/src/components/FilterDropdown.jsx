import { useState } from 'react'
import './FilterDropdown.css'

const transactionTypes = [
  { value: '', label: 'Any' },
  { value: 'sell', label: 'Sell' },
  { value: 'free', label: 'Free' },
]

const FilterDropdown = ({ filters, onChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleChange = (e) => {
    const { name, value } = e.target
    setLocalFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleApply = () => {
    onChange(localFilters)
    onClose()
  }

  return (
    <div className="filter-dropdown">
      <div className="filter-dropdown-content">
        <label>
          Location:
          <input
            type="text"
            name="location"
            value={localFilters.location || ''}
            onChange={handleChange}
            placeholder="Enter city, state, or country"
          />
        </label>
        <label>
          Price (max):
          <input
            type="number"
            name="price"
            value={localFilters.price || ''}
            onChange={handleChange}
            min="0"
            placeholder="Any"
          />
        </label>
        <label>
          Transaction Type:
          <select
            name="transactionType"
            value={localFilters.transactionType || ''}
            onChange={handleChange}
          >
            {transactionTypes.map(({ value, label }) => (
              <option key={value || 'any'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="filter-dropdown-actions">
          <button type="button" onClick={handleApply} className="filter-apply-btn">Apply</button>
          <button type="button" onClick={onClose} className="filter-cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default FilterDropdown
