import { useEffect, useState, useRef } from 'react'
import LocationDropdown from './LocationDropdown'
import { getSystemDropdownForm, getSystemDropdownOptions } from '../api'
import { readUsers } from '../api/users'
import { readCountries } from '../api/countries'
import { formatGeoLocation } from '../utils/geo'
import '../styles/FilterDropdown.css'

const FLD_NM = 'fld_nm'

const FilterDropdown = ({ filters, onChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters)
  const [transactionTypes, setTransactionTypes] = useState([])
  const [isAutoLocating, setIsAutoLocating] = useState(false)
  const [autoLocateError, setAutoLocateError] = useState('')
  const [autoLocateCountryCode, setAutoLocateCountryCode] = useState('')
  const [autoLocateStateCode, setAutoLocateStateCode] = useState('')
  const [autoLocateCityValue, setAutoLocateCityValue] = useState('')
  const locationDropdownRef = useRef(null)

  const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase()

  useEffect(() => {
    const updateFilter = () => {
      setLocalFilters(filters || {})
    }

    updateFilter()
  }, [filters])

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

  const handleAutoLocate = async () => {
    setAutoLocateError('')
    setIsAutoLocating(true)

    try {
      const username = localStorage.getItem('swapify.username')
      const email = localStorage.getItem('swapify.email')

      console.log('Auto-locate: username=', username, 'email=', email)

      if (!username && !email) {
        setAutoLocateError('Please log in to use auto-locate')
        setIsAutoLocating(false)
        return
      }

      console.log('Fetching users...')
      const usersResponse = await readUsers()
      console.log('Users response:', usersResponse)
      
      const usersArray = usersResponse?.User
        ? Object.values(usersResponse.User)
        : Array.isArray(usersResponse)
          ? usersResponse
          : []

      console.log('Users array:', usersArray)

      const currentUser = usersArray.find(
        (u) =>
          normalizeIdentifier(u?.username) === normalizeIdentifier(username) ||
          normalizeIdentifier(u?.email) === normalizeIdentifier(email)
      )

      console.log('Current user found:', currentUser)

      if (!currentUser) {
        setAutoLocateError('User profile not found')
        setIsAutoLocating(false)
        return
      }

      const userLocation = formatGeoLocation(currentUser)

      console.log('User location:', userLocation)

      if (!userLocation) {
        setAutoLocateError('Your profile location is not set')
        setIsAutoLocating(false)
        return
      }

      // Extract country, state, and city from user profile
      let country = String(currentUser.country || '').trim()
      const state = String(currentUser.state || '').trim()
      const city = String(currentUser.city || '').trim()

      console.log('User geo data (before mapping):', { country, state, city })

      if (!country || !state || !city) {
        setAutoLocateError('Your profile location is incomplete')
        setIsAutoLocating(false)
        return
      }

      // Fetch countries API to map country name to country code
      console.log('Fetching countries API to resolve country mapping...')
      const countriesApiData = await readCountries()
      console.log('Countries API response:', countriesApiData)
      
      const countriesMap = countriesApiData.Countries || {}
      
      // Find the country code by matching either the code or the name
      let countryCode = null
      let resolvedCountryName = country
      
      for (const [code, countryObj] of Object.entries(countriesMap)) {
        const countryName = countryObj.name || countryObj
        
        // Try matching by code first (e.g., "USA" == "USA")
        if (normalizeIdentifier(code) === normalizeIdentifier(country)) {
          countryCode = code
          resolvedCountryName = countryName
          console.log('Found country by code match:', { code, name: countryName })
          break
        }
        
        // Then try matching by name (e.g., "USA" profile -> "United States" in API)
        if (normalizeIdentifier(countryName) === normalizeIdentifier(country)) {
          countryCode = code
          resolvedCountryName = countryName
          console.log('Found country by name match:', { code, name: countryName })
          break
        }
      }

      if (!countryCode) {
        console.error('Country not found in API:', country, 'Available codes:', Object.keys(countriesMap))
        setAutoLocateError(`Country "${country}" not found in system`)
        setIsAutoLocating(false)
        return
      }

      console.log('Resolved country code:', countryCode, 'name:', resolvedCountryName)

      // Get country code
      console.log('Fetching countries dropdown options...')
      const countriesData = await getSystemDropdownOptions()
      console.log('Countries dropdown data:', countriesData)
      
      const countryOption = countriesData.options?.find(
        (o) => normalizeIdentifier(o.value) === normalizeIdentifier(countryCode)
      )

      if (!countryOption) {
        console.error('Country code not found in dropdown:', countryCode)
        setAutoLocateError(`Country code "${countryCode}" not found in dropdown`)
        setIsAutoLocating(false)
        return
      }

      const cc = countryOption.value
      console.log('Country code found:', cc)

      // Get state code
      console.log('Fetching states for country:', cc)
      const statesData = await getSystemDropdownOptions({ country_code: cc })
      console.log('States data:', statesData)
      
      let stateOption = statesData.options?.find(
        (o) => normalizeIdentifier(o.label) === normalizeIdentifier(state)
      )

      // If not found, try matching state abbreviation in parentheses
      if (!stateOption) {
        console.log('State not found by exact match, trying abbreviation match...')
        stateOption = statesData.options?.find(
          (o) => {
            // Look for abbreviation in format "StateName (XX)"
            const match = o.label.match(/\(([^)]+)\)/)
            const abbreviation = match ? match[1] : null
            return abbreviation && normalizeIdentifier(abbreviation) === normalizeIdentifier(state)
          }
        )
      }

      if (!stateOption) {
        console.error('State not found. Looking for:', state, 'in:', statesData.options?.map(o => o.label))
        setAutoLocateError(`State "${state}" not found in system`)
        setIsAutoLocating(false)
        return
      }

      const sc = stateOption.value
      console.log('State code found:', sc)

      // Get city value
      console.log('Fetching cities for country:', cc, 'state:', sc)
      const citiesData = await getSystemDropdownOptions({ country_code: cc, state_code: sc })
      console.log('Cities data:', citiesData)
      
      let cityOption = citiesData.options?.find(
        (o) => normalizeIdentifier(o.label) === normalizeIdentifier(city)
      )

      // If not found, try matching just the city name (before comma or comma+state)
      if (!cityOption) {
        console.log('City not found by exact match, trying partial match...')
        cityOption = citiesData.options?.find(
          (o) => {
            // Extract just the city name part (before comma)
            const cityNamePart = o.label.split(',')[0].trim()
            return normalizeIdentifier(cityNamePart) === normalizeIdentifier(city)
          }
        )
      }

      if (!cityOption) {
        console.error('City not found. Looking for:', city, 'in:', citiesData.options?.map(o => o.label))
        setAutoLocateError('City not found in system')
        setIsAutoLocating(false)
        return
      }

      const cv = cityOption.value

      // Update controlled dropdown values
      console.log('Setting auto-locate values:', { cc, sc, cv })
      setAutoLocateCountryCode(cc)
      setAutoLocateStateCode(sc)
      setAutoLocateCityValue(cv)

      // Update filter with display label
      setLocalFilters((prev) => ({ ...prev, city: userLocation }))
      setAutoLocateError('')
      console.log('Auto-locate completed successfully')
    } catch (err) {
      console.error('Auto-locate error:', err)
      setAutoLocateError(err instanceof Error ? err.message : 'Failed to auto-locate')
    } finally {
      setIsAutoLocating(false)
    }
  }

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
          <div className="filter-location-header">
            <span className="filter-location-label">Location</span>
            <button
              type="button"
              onClick={handleAutoLocate}
              disabled={isAutoLocating}
              className="filter-auto-locate-btn"
              title="Use your profile location"
              aria-label="Auto-fill location from your profile"
            >
              {isAutoLocating ? 'Locating...' : 'Use My Location'}
            </button>
          </div>
          {autoLocateError && (
            <div className="filter-auto-locate-error">{autoLocateError}</div>
          )}
          <LocationDropdown
            ref={locationDropdownRef}
            legend=""
            initialCountryCode={autoLocateCountryCode}
            initialStateCode={autoLocateStateCode}
            initialCityValue={autoLocateCityValue}
            onSelectionChange={({ displayLabel }) =>
              setLocalFilters((prev) => ({ ...prev, city: displayLabel }))
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
