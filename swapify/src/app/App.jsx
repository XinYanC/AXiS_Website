import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import PostDetails from '../pages/PostDetails.jsx'
import './App.css'
import Profile from "../pages/Profile.jsx";
import NotFound from '../pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post/:id" element={<PostDetails />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
