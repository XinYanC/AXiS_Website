import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>404 — Page not found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">Go back home</Link>
    </main>
  )
}

export default NotFound
