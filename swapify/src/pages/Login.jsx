import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authLogin, readUsers } from '../api'
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
            const response = await authLogin({ email, password })

            const responseUser =
                response?.user ||
                response?.User ||
                response?.data?.user ||
                response?.data?.User ||
                null

            let username =
                responseUser?.username || response?.username || ''
            const resolvedEmail =
                responseUser?.email || response?.email || email

            if (!username && resolvedEmail) {
                try {
                    const usersResponse = await readUsers()
                    const usersArray = usersResponse && (usersResponse.Users || usersResponse.User)
                        ? Object.values(usersResponse.Users || usersResponse.User)
                        : Array.isArray(usersResponse)
                            ? usersResponse
                            : []

                    const targetEmail = String(resolvedEmail).trim().toLowerCase()
                    const matchedUser = usersArray.find((candidate) => {
                        const candidateEmail = String(candidate?.email || candidate?.Email || '').trim().toLowerCase()
                        return candidateEmail && candidateEmail === targetEmail
                    })

                    if (matchedUser?.username || matchedUser?.Username) {
                        username = matchedUser.username || matchedUser.Username
                    }
                } catch (lookupErr) {
                    console.warn('Could not resolve username from users list:', lookupErr)
                }
            }

            localStorage.setItem('swapify.authenticated', 'true')
            localStorage.removeItem('swapify.username')
            if (username) {
                localStorage.setItem('swapify.username', String(username))
            }
            if (resolvedEmail) {
                localStorage.setItem('swapify.email', String(resolvedEmail))
            }

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