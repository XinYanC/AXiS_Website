import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../Navbar'

describe('Navbar', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    localStorage.clear()
  })

  it('shows login button when user is logged out', () => {
    render(
      <MemoryRouter>
        <Navbar searchQuery="" onSearchChange={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument()
  })

  it('shows circular profile avatar instead of profile text when user is logged in', () => {
    localStorage.setItem('swapify.authenticated', 'true')
    localStorage.setItem('swapify.username', 'alice')

    render(
      <MemoryRouter>
        <Navbar searchQuery="" onSearchChange={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Profile menu')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.queryByText('Profile')).not.toBeInTheDocument()
  })

  it('opens profile dropdown with Go to Profile and Logout', () => {
    localStorage.setItem('swapify.authenticated', 'true')
    localStorage.setItem('swapify.username', 'alice')

    render(
      <MemoryRouter>
        <Navbar searchQuery="" onSearchChange={() => {}} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }))

    expect(screen.getByRole('menuitem', { name: /go to profile/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
  })

  it('calls logout handler from profile dropdown', () => {
    const onLogout = vi.fn()
    localStorage.setItem('swapify.authenticated', 'true')
    localStorage.setItem('swapify.username', 'alice')

    render(
      <MemoryRouter>
        <Navbar searchQuery="" onSearchChange={() => {}} onLogout={onLogout} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /profile menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /logout/i }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('calls search handler when input changes', () => {
    const handleSearchChange = (e) => {
      events.push(e.target.value)
    }
    const events = []

    render(
      <MemoryRouter>
        <Navbar searchQuery="" onSearchChange={handleSearchChange} />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Search listings...'), {
      target: { value: 'lamp' },
    })

    expect(events).toEqual(['lamp'])
  })
})
