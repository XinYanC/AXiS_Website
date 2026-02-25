import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/register.css'
import FullLogo from '../assets/FullLogo.PNG'
import { createUser } from '../api'

const Register = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [age, setAge] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLocation] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

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
                age: parseInt(age) || 0,
                bio,
                is_verified: false,
                location
            }

            await createUser(payload)
            // Redirect to home page on success
            navigate('/')
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
                <input type="text" placeholder="Location (e.g., NY,USA)" value={location} onChange={(e) => setLocation(e.target.value)} required />
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
            <p>Already have an account? <Link to="/login" className="login-link">Login</Link></p>
        </div>
    )
}

export default Register