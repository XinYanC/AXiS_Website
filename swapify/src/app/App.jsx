import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import PostDetails from '../pages/PostDetails.jsx'
import Messages from '../pages/Messages.jsx'
import './App.css'
import Profile from "../pages/Profile.jsx";
import NotFound from '../pages/NotFound.jsx'
import SavedItems from '../pages/SavedItems.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  useEffect(() => {
    const cleanupMarkerKey = 'swapify.storage-cleanup.saved-likes.v1'
    const alreadyCleaned = localStorage.getItem(cleanupMarkerKey) === 'true'

    if (alreadyCleaned) {
      return
    }

    const keysToRemove = []

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key) {
        continue
      }

      if (
        key.startsWith('swapify.saved-listings.') ||
        key === 'swapify.saved-posts' ||
        key === 'swapify.savedPosts' ||
        key === 'swapify.likes' ||
        key === 'swapify.liked-posts'
      ) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })

    localStorage.setItem(cleanupMarkerKey, 'true')

    if (keysToRemove.length > 0) {
      window.dispatchEvent(new CustomEvent('swapify:saved-items-updated'))
    }
  }, [])

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post/:id" element={<PostDetails />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/saved-items/:username" element={<SavedItems />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
