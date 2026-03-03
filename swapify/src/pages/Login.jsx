import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authLogin } from '../api'
import '../styles/login.css'
import FullLogo from '../assets/FullLogo.PNG'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await authLogin({ email, password })
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-logo">
                <Link to="/">
                    <img src={FullLogo} alt="Swapify" />
                </Link>
            </div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit} className="login-form">
                {error && <p className="login-error" role="alert">{error}</p>}
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
            </form>
            <p>Don't have an account? <Link to="/register" className="register-link">Register</Link></p>
        </div>
    )
}

export default Login