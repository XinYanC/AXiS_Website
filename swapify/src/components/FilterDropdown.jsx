import { useEffect, useState } from 'react'
import LocationDropdown from './LocationDropdown'
import { getSystemDropdownForm } from '../api'
import '../styles/FilterDropdown.css'

const FLD_NM = 'fld_nm'

const FilterDropdown = ({ filters, onChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [transactionTypes, setTransactionTypes] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSystemDropdownForm()
        const form = data.form || []
        const txField = form.find((f) => f[FLD_NM] === 'transaction_type')
        const choices = txField?.choices
        if (Array.isArray(choices) && choices.length > 0) {
          setTransactionTypes([
            { value: '', label: 'Any' },
            ...choices.map((c) => ({
              value: c,
              label: String(c).charAt(0).toUpperCase() + String(c).slice(1),
            })),
          ])
        }
      } catch {
        setTransactionTypes([])
      }
    }
    load()
  }, [])

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
        <div className="filter-location-field">
          <span className="filter-location-label">Location</span>
          <LocationDropdown
            legend=""
            onSelectionChange={({ cityName }) =>
              setLocalFilters((prev) => ({ ...prev, location: cityName }))
            }
          />
        </div>
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
