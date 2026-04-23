import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import Grid from '../pages/Grid.jsx'
import Login from '../pages/Login.jsx'
import Register from '../pages/Register.jsx'
import PostDetails from '../pages/PostDetails.jsx'
import Messages from '../pages/Messages.jsx'
import NotificationBar from '../components/NotificationBar.jsx'
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
  return (
    <>
      <NotificationBar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grid" element={<Grid />} />
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
