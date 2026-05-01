import { useEffect, useState } from 'react'
import { getSystemDropdownOptions } from '../api'
import '../styles/LocationDropdown.css'

// Cascading country → state → city from GET /system/dropdown-options.
function LocationDropdown({
  disabled = false,
  legend = 'Location',
  required = false,
  onSelectionChange,
  initialCountryCode = '',
  initialStateCode = '',
  initialCityValue = '',
}) {
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [countryCode, setCountryCode] = useState(initialCountryCode)
  const [stateCode, setStateCode] = useState(initialStateCode)
  const [cityValue, setCityValue] = useState(initialCityValue)
  const [geoLoading, setGeoLoading] = useState(false)

  // Update controlled values when props change
  useEffect(() => {
    setCountryCode(initialCountryCode)
  }, [initialCountryCode])

  useEffect(() => {
    setStateCode(initialStateCode)
  }, [initialStateCode])

  useEffect(() => {
    setCityValue(initialCityValue)
  }, [initialCityValue])

  const notify = ({ cityName = '', displayLabel = '', countryCode: cc, stateCode: sc }) => {
    if (typeof onSelectionChange !== 'function') return
    onSelectionChange({
      cityName: cityName ? String(cityName).trim() : '',
      displayLabel: displayLabel || '',
      countryCode: cc !== undefined ? cc : countryCode,
      stateCode: sc !== undefined ? sc : stateCode,
    })
  }

  useEffect(() => {
    const load = async () => {
      setGeoLoading(true)
      try {
        const data = await getSystemDropdownOptions()
        setCountries(data.options || [])
      } catch {
        setCountries([])
      } finally {
        setGeoLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!countryCode) {
      setStates([])
      return
    }
    let cancelled = false
    const load = async () => {
      setGeoLoading(true)
      try {
        const data = await getSystemDropdownOptions({ country_code: countryCode })
        if (!cancelled) {
          setStates(data.options || [])
        }
      } catch {
        if (!cancelled) setStates([])
      } finally {
        if (!cancelled) setGeoLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [countryCode])

  useEffect(() => {
    if (!stateCode) {
      setCities([])
      return
    }
    let cancelled = false
    const load = async () => {
      setGeoLoading(true)
      try {
        const data = await getSystemDropdownOptions({
          state_code: stateCode,
          country_code: countryCode,
        })
        if (!cancelled) {
          setCities(data.options || [])
        }
      } catch {
        if (!cancelled) setCities([])
      } finally {
        if (!cancelled) setGeoLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [stateCode, countryCode])

  const handleCountryChange = (e) => {
    const v = e.target.value
    setCountryCode(v)
    setStateCode('')
    setCityValue('')
    setCities([])
    if (!v) {
      setStates([])
      notify({ cityName: '', displayLabel: '', countryCode: '', stateCode: '' })
      return
    }
    notify({ cityName: '', displayLabel: '', countryCode: v, stateCode: '' })
  }

  const handleStateChange = (e) => {
    const v = e.target.value
    setStateCode(v)
    setCityValue('')
    setCities([])
    notify({ cityName: '', displayLabel: '', countryCode, stateCode: v })
  }

  const handleCityChange = (e) => {
    const value = e.target.value
    setCityValue(value)
    const opt = cities.find((o) => o.value === value)
    const displayLabel = opt ? opt.label : value
    notify({ cityName: value, displayLabel, countryCode, stateCode })
  }

  const busy = disabled || geoLoading

  return (
    <fieldset
      className="location-dropdowns"
      disabled={busy}
      aria-label={legend && String(legend).replace(/\s*\*?\s*$/, '').trim() || 'Location'}
    >
      {legend ? (
        <legend className="location-dropdowns-legend">
          {legend}
          {geoLoading ? <span className="location-dropdowns-loading"> Loading…</span> : null}
        </legend>
      ) : (
        geoLoading ? (
          <span className="location-dropdowns-loading location-dropdowns-loading-standalone">Loading…</span>
        ) : null
      )}
      <select
        className="location-dropdowns-select"
        value={countryCode}
        onChange={handleCountryChange}
        aria-label="Country"
        required={required}
      >
        <option value="">Country</option>
        {countries.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="location-dropdowns-select"
        value={stateCode}
        onChange={handleStateChange}
        disabled={!countryCode || busy}
        aria-label="State"
        required={required}
      >
        <option value="">State</option>
        {states.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className="location-dropdowns-select"
        value={cityValue}
        onChange={handleCityChange}
        disabled={!stateCode || busy}
        aria-label="City"
        required={required}
      >
        <option value="">City</option>
        {cities.map((o) => (
          <option key={`${o.value}-${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </fieldset>
  )
}

export default LocationDropdown
