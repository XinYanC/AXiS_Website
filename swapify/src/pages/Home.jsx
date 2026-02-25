import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getCitiesCount } from '../api/cities'
import { getCountriesCount } from '../api/countries'
import { getStatesCount } from '../api/states'
import { getEndpoints, getHello } from '../api/system'
import Post from '../components/Post'
import FullLogo from '../assets/FullLogo.PNG'

function Home() {
  const [citiesCount, setCitiesCount] = useState(null)
  const [countriesCount, setCountriesCount] = useState(null)
  const [statesCount, setStatesCount] = useState(null)
  const [helloStatus, setHelloStatus] = useState(null)
  const [endpointsList, setEndpointsList] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLoadCount = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getCitiesCount()
      const count =
        typeof data === 'number'
          ? data
          : data?.count ?? data?.total ?? JSON.stringify(data)
      setCitiesCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load count')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadCountriesCount = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getCountriesCount()
      const count =
        typeof data === 'number'
          ? data
          : data?.count ?? data?.total ?? JSON.stringify(data)
      setCountriesCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load count')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadStatesCount = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getStatesCount()
      const count =
        typeof data === 'number'
          ? data
          : data?.count ?? data?.total ?? JSON.stringify(data)
      setStatesCount(count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load count')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadHello = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getHello()
      setHelloStatus(
        typeof data === 'string' ? data : data?.message ?? JSON.stringify(data)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoadEndpoints = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getEndpoints()
      setEndpointsList(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load endpoints')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main>
      <nav className="main-nav">
        <div className="main-nav-left">
          <Link to="/">
            <img src={FullLogo} alt="Swapify" />
          </Link>
        </div>
        <div className="main-nav-right">
          <h2>Sell Items</h2>
          <h2>Saved</h2>
          <h2>Messages</h2>
          <h2>
            <Link to="/login">Profile</Link>
          </h2>
        </div>
      </nav>

      <p style={{ marginTop: '100px' }}>Find items students are selling or donating.</p>

      <button type="button" onClick={handleLoadCount} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Load city count'}
      </button>

      <button type="button" onClick={handleLoadCountriesCount} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Load country count'}
      </button>

      <button type="button" onClick={handleLoadStatesCount} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Load state count'}
      </button>

      <button type="button" onClick={handleLoadHello} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Check server status'}
      </button>

      <button type="button" onClick={handleLoadEndpoints} disabled={isLoading}>
        {isLoading ? 'Loading…' : 'Load endpoints'}
      </button>

      <div className="posts-grid">
        <Post></Post>
        <Post></Post>
        <Post></Post>
        <Post></Post>
        <Post></Post>
        <Post></Post>
        <Post></Post>
        <Post></Post>
      </div>

      {error && <p>{error}</p>}
      {citiesCount !== null && !error && <p>Total cities: {citiesCount}</p>}
      {countriesCount !== null && !error && (
        <p>Total countries: {countriesCount}</p>
      )}
      {statesCount !== null && !error && <p>Total states: {statesCount}</p>}
      {helloStatus && !error && <p>Server status: {helloStatus}</p>}
      {endpointsList && !error && (
        <pre>{JSON.stringify(endpointsList, null, 2)}</pre>
      )}
    </main>
  )
}

export default Home
