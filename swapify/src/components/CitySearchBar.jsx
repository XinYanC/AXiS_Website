import { useEffect, useRef, useState } from 'react'
import { readStates, searchCities } from '../api'
import '../styles/citySearchBar.css'

const CitySearchBar = ({ value, onChange, onCitySelect }) => {
    const [suggestions, setSuggestions] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [stateMap, setStateMap] = useState({})
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef(null)
    const suggestionsRef = useRef(null)
    const skipNextSearchRef = useRef(false)

    const getCityQuery = (rawValue) => String(rawValue || '').split(',')[0].trim()

    // Load all cities and states on mount
    useEffect(() => {
        const loadCitiesAndStates = async () => {
            try {
                const statesData = await readStates()
                // Create a map of state code to state name
                let stateMapData = {}
                
                // States are nested under the 'States' key
                if (statesData && statesData.States) {
                    Object.values(statesData.States).forEach((state) => {
                        if (state.code && state.name) {
                            stateMapData[state.code] = state.name
                        }
                    })
                }

                setStateMap(stateMapData)
            } catch (err) {
                // Silently fail to load states
            }
        }

        loadCitiesAndStates()
    }, [])

    // Handle input changes and search
    useEffect(() => {
        const handleSearch = async () => {
            if (skipNextSearchRef.current) {
                skipNextSearchRef.current = false
                setIsOpen(false)
                setError('')
                return
            }

            const cityQuery = getCityQuery(value)

            if (cityQuery.length === 0) {
                setSuggestions([])
                setError('')
                setIsOpen(false)
                return
            }

            setIsLoading(true)
            setError('')

            try {
                // Search for matching cities
                let searchResults = await searchCities(cityQuery)
                
                // Handle different response formats
                let results = []
                if (Array.isArray(searchResults)) {
                    results = searchResults
                } else if (searchResults && typeof searchResults === 'object') {
                    // Check if results are nested under 'Cities' key (object format)
                    if (searchResults.Cities && typeof searchResults.Cities === 'object') {
                        results = Object.values(searchResults.Cities)
                    } else {
                        results = searchResults.data || searchResults.cities || searchResults.results || []
                    }
                }

                // Ensure we have an array
                if (!Array.isArray(results)) {
                    results = []
                }

                // Map results to include state names
                const suggestionsWithStates = results.map((city) => ({
                    ...city,
                    stateName: stateMap[city.state_code] || 'Unknown State',
                }))

                setSuggestions(suggestionsWithStates)
                
                if (suggestionsWithStates.length > 0) {
                    setIsOpen(true)
                    setError('')
                } else {
                    // No results found
                    setIsOpen(false)
                    setError('Usage in that city is not available yet.')
                }
            } catch (err) {
                setSuggestions([])
                setIsOpen(false)
                setError('Usage in that city is not available yet.')
            } finally {
                setIsLoading(false)
            }
        }

        const debounceTimer = setTimeout(() => {
            handleSearch()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [value, stateMap])

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSuggestionClick = (city) => {
        skipNextSearchRef.current = true
        const cityDisplay = `${city.name}, ${city.stateName}`
        onChange(cityDisplay)
        onCitySelect(city.name) // Only send city name to parent
        setIsOpen(false)
        setSuggestions([])
        setError('')
    }

    const handleInputChange = (e) => {
        onChange(e.target.value)
    }

    const handleInputFocus = () => {
        if (suggestions.length > 0) {
            setIsOpen(true)
        }
    }

    return (
        <div className="city-search-bar-container">
            <div className="city-search-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Meetup City *"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    className={`city-search-input ${error ? 'error' : ''}`}
                    autoComplete="off"
                />
                {isLoading && <div className="city-search-loader" />}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div ref={suggestionsRef} className="city-suggestions-list">
                    {suggestions.map((city, index) => (
                        <button
                            key={`${city.city_id}-${index}`}
                            type="button"
                            className="city-suggestion-item"
                            onClick={() => handleSuggestionClick(city)}
                        >
                            <span className="city-name">{city.name}</span>
                            <span className="city-state">{city.stateName}</span>
                        </button>
                    ))}
                </div>
            )}

            {error && <p className="city-search-error">{error}</p>}
        </div>
    )
}

export default CitySearchBar
