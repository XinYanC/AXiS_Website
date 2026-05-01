import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/register.css'
import FullLogo from '../assets/FullLogo.PNG'
import LocationDropdown from '../components/LocationDropdown'
import { createUser, getSystemDropdownOptions } from '../api'
import { readCountries } from '../api/countries'

const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [regCity, setRegCity] = useState('')
  const [regState, setRegState] = useState('')
  const [regCountry, setRegCountry] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isGeoLocating, setIsGeoLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [geoCountryCode, setGeoCountryCode] = useState('')
  const [geoStateCode, setGeoStateCode] = useState('')
  const [geoCityValue, setGeoCityValue] = useState('')

  const normalizeIdentifier = (value) => String(value || '').trim().toLowerCase()

  const handleLocationSelection = ({ cityName, countryCode: cc, stateCode: sc }) => {
    setRegCity(cityName ? String(cityName).trim() : '')
    setRegState(sc ? String(sc).trim() : '')
    setRegCountry(cc ? String(cc).trim() : '')
  }

  const handleUseCurrentLocation = async () => {
    setGeoError('')
    setIsGeoLocating(true)

    try {
      if (!navigator.geolocation) {
        setGeoError('Geolocation is not supported by your browser')
        setIsGeoLocating(false)
        return
      }

      // Get user's current coordinates
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords

            console.log('Got geolocation coordinates:', { latitude, longitude })

            // Use OpenStreetMap Nominatim API to reverse-geocode coordinates to address
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`

            console.log('Fetching reverse geocode data from Nominatim...')
            const geoResponse = await fetch(nominatimUrl)

            if (!geoResponse.ok) {
              throw new Error('Failed to get location from coordinates')
            }

            const geoData = await geoResponse.json()

            console.log('Nominatim reverse geocode response:', geoData)

            // Extract country, state, city from the address
            const address = geoData.address || {}
            let countryName = address.country || ''
            let stateName = address.state || ''
            let cityName = address.city || address.town || address.village || ''

            console.log('Extracted from geocode:', { countryName, stateName, cityName })

            if (!countryName || !stateName || !cityName) {
              setGeoError('Could not determine your city/state/country from coordinates')
              setIsGeoLocating(false)
              return
            }

            // Get countries dropdown to find country code
            console.log('Fetching countries dropdown...')
            const countriesData = await getSystemDropdownOptions()

            console.log('Countries dropdown:', countriesData)

            // Try matching by label (full name) first
            let countryOption = countriesData.options?.find((o) =>
              normalizeIdentifier(o.label) === normalizeIdentifier(countryName)
            )

            // If not found, try matching by value (country code)
            if (!countryOption) {
              countryOption = countriesData.options?.find((o) =>
                normalizeIdentifier(o.value) === normalizeIdentifier(countryName)
              )
            }

            // If still not found, fetch from readCountries API to match country name to code
            if (!countryOption) {
              console.log('Country not found by dropdown match. Fetching from countries API...')
              const countriesApiData = await readCountries()
              const countriesMap = countriesApiData.Countries || {}
              
              let countryCode = null
              for (const [code, countryObj] of Object.entries(countriesMap)) {
                const countryFullName = countryObj.name || countryObj
                
                // Try matching by code first
                if (normalizeIdentifier(code) === normalizeIdentifier(countryName)) {
                  countryCode = code
                  break
                }
                
                // Then try matching by name
                if (normalizeIdentifier(countryFullName) === normalizeIdentifier(countryName)) {
                  countryCode = code
                  break
                }
              }
              
              if (countryCode) {
                countryOption = countriesData.options?.find((o) =>
                  normalizeIdentifier(o.value) === normalizeIdentifier(countryCode)
                )
              }
            }

            if (!countryOption) {
              setGeoError(`Country "${countryName}" not found in system`)
              setIsGeoLocating(false)
              return
            }

            const cc = countryOption.value

            console.log('Country code found:', cc)

            // Get states dropdown for this country
            console.log('Fetching states for country:', cc)
            const statesData = await getSystemDropdownOptions({ country_code: cc })

            console.log('States data:', statesData)

            // Try exact match first, then partial match (e.g., "California" vs "California (CA)")
            let stateOption = statesData.options?.find((o) =>
              normalizeIdentifier(o.label) === normalizeIdentifier(stateName)
            )

            if (!stateOption) {
              // Try matching just the state name part (before parentheses)
              stateOption = statesData.options?.find((o) => {
                const stateNamePart = o.label.split('(')[0].trim()
                return normalizeIdentifier(stateNamePart) === normalizeIdentifier(stateName)
              })
            }

            if (!stateOption) {
              setGeoError(`State "${stateName}" not found in system`)
              setIsGeoLocating(false)
              return
            }

            const sc = stateOption.value

            console.log('State code found:', sc)

            // Get cities dropdown for this country and state
            console.log('Fetching cities for country:', cc, 'state:', sc)
            const citiesData = await getSystemDropdownOptions({ country_code: cc, state_code: sc })

            console.log('Cities data:', citiesData)

            // Try exact match first, then partial match
            let cityOption = citiesData.options?.find((o) =>
              normalizeIdentifier(o.label) === normalizeIdentifier(cityName)
            )

            if (!cityOption) {
              // Try matching just the city name part (before comma)
              cityOption = citiesData.options?.find((o) => {
                const cityNamePart = o.label.split(',')[0].trim()
                return normalizeIdentifier(cityNamePart) === normalizeIdentifier(cityName)
              })
            }

            if (!cityOption) {
              setGeoError(`City "${cityName}" not found in system`)
              setIsGeoLocating(false)
              return
            }

            const cv = cityOption.value

            console.log('Setting geolocation values:', { cc, sc, cv })
            setGeoCountryCode(cc)
            setGeoStateCode(sc)
            setGeoCityValue(cv)
            setGeoError('')
            console.log('Geolocation completed successfully')
          } catch (err) {
            console.error('Geolocation error:', err)
            setGeoError(err instanceof Error ? err.message : 'Geolocation failed')
          } finally {
            setIsGeoLocating(false)
          }
        },
        (positionError) => {
          console.error('Position error:', positionError)
          let errorMsg = 'Could not get your location'
          if (positionError.code === 1) {
            errorMsg = 'Location permission denied. Please enable location access.'
          } else if (positionError.code === 2) {
            errorMsg = 'Location unavailable. Please try again.'
          } else if (positionError.code === 3) {
            errorMsg = 'Location request timed out. Please try again.'
          }
          setGeoError(errorMsg)
          setIsGeoLocating(false)
        }
      )
    } catch (err) {
      console.error('Geolocation setup error:', err)
      setGeoError(err instanceof Error ? err.message : 'Geolocation failed')
      setIsGeoLocating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const payload = {
        username,
        password,
        name,
        email,
        age: parseInt(age, 10) || 0,
        bio,
        is_verified: false,
        city: regCity,
        state: regState,
        country: regCountry,
      }

      await createUser(payload)

      // Keep auth state consistent with Login flow so navbar updates immediately.
      localStorage.removeItem('swapify.username')
      localStorage.removeItem('swapify.email')
      localStorage.removeItem('swapify.authenticated')

      localStorage.setItem('swapify.username', String(username).trim())
      localStorage.setItem('swapify.email', String(email).trim())
      localStorage.setItem('swapify.authenticated', 'true')

      navigate('/', { replace: true })
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.'

      if (err instanceof Error) {
        // Extract error message from API error format
        // e.g., "API error (400): {"Error": "Email must end in .edu"}"
        const match = err.message.match(/\{"Error":\s*"([^"]+)"\}/)
        if (match && match[1]) {
          errorMessage = match[1]
        } else {
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-logo">
        <Link to="/">
          <img src={FullLogo} alt="Swapify" />
        </Link>
      </div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit} className="register-form">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required />
        <input type="text" placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} required />

        <LocationDropdown
          legend="Location"
          required
          disabled={isLoading}
          onSelectionChange={handleLocationSelection}
          initialCountryCode={geoCountryCode}
          initialStateCode={geoStateCode}
          initialCityValue={geoCityValue}
        />

        {geoError && (
          <div style={{
            padding: '8px 12px',
            marginBottom: '12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {geoError}
          </div>
        )}

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLoading || isGeoLocating}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '12px',
            backgroundColor: isGeoLocating ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading || isGeoLocating ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {isGeoLocating ? 'Getting your location...' : 'Use My Current Location'}
        </button>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      {error && (
        <div className="error-container">
          <p className="error-header">Registration Failed</p>
          <p className="error-message">{error}</p>
        </div>
      )}
      <p>
        Already have an account?{' '}
        <Link to="/login" className="login-link">
          Login
        </Link>
      </p>
    </div>
  )
}

export default Register
