import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/login.css'
import FullLogo from '../assets/FullLogo.PNG'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
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
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <Link to="/register" className="register-link">Register</Link></p>
        </div>
    )
}

export default Login