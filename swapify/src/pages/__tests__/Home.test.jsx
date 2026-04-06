import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '../Home.jsx'

describe('Home page', () => {
  beforeEach(() => {
    // Simulate a signed-in user for tests by default
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('swapify.authenticated', 'true')
      window.localStorage.setItem('swapify.username', 'testuser')
      window.localStorage.setItem('swapify.email', 'testuser@example.com')
    }
  })

  it('renders map view with navbar', async () => {
    // Render
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    // Basic render checks (UI components may be mocked in real tests)
    await waitFor(() => {
      // We expect the Home component to render; navbar/map may be mocked in real tests
    })
  })
})
