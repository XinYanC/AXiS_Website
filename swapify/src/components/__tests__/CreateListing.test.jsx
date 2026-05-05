import { useLayoutEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CreateListing from '../CreateListing'
import { createListing, uploadListingImage } from '../../api'

vi.mock('../LocationDropdown', () => ({
  default: function MockLocationDropdown({ onSelectionChange }) {
    useLayoutEffect(() => {
      onSelectionChange?.({
        cityName: 'new-york',
        stateCode: 'NY',
        countryCode: 'USA',
      })
    }, [onSelectionChange])
    return <div data-testid="mock-location-dropdown" />
  },
}))

vi.mock('../../api', () => ({
  createListing: vi.fn(),
  uploadListingImage: vi.fn(),
}))

describe('CreateListing', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    createListing.mockResolvedValue({ id: 'listing-1' })
    uploadListingImage.mockResolvedValue('https://res.cloudinary.com/demo/upload/v1/square.png')
  })

  it('shows sign-up message and registration button when user is not logged in', () => {
    render(
      <MemoryRouter>
        <CreateListing isOpen isLoggedIn={false} onClose={vi.fn()} onSuccess={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Sign Up Required')).toBeInTheDocument()
    expect(screen.getByText('You need to sign up before posting a listing.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to registration/i })).toHaveAttribute('href', '/register')
    expect(screen.queryByRole('button', { name: /create listing/i })).not.toBeInTheDocument()
  })

  it('shows the listing form when user is logged in', () => {
    render(
      <MemoryRouter>
        <CreateListing isOpen isLoggedIn currentUserIdentifier="alice" onClose={vi.fn()} onSuccess={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Create New Listing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create listing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^free$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^sell$/i })).toBeInTheDocument()
    expect(screen.getByText('Upload image')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Price *')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/owner/i)).not.toBeInTheDocument()
  })

  it('shows price input only when sell is selected', () => {
    render(
      <MemoryRouter>
        <CreateListing isOpen isLoggedIn currentUserIdentifier="alice" onClose={vi.fn()} onSuccess={vi.fn()} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /^free$/i }))
    expect(screen.queryByPlaceholderText('Price *')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^sell$/i }))
    expect(screen.getByPlaceholderText('Price *')).toBeInTheDocument()
  })

  it('submits listing with owner from logged-in user', async () => {
    render(
      <MemoryRouter>
        <CreateListing isOpen isLoggedIn currentUserIdentifier="alice" onClose={vi.fn()} onSuccess={vi.fn()} />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Title *'), { target: { value: 'Desk Lamp' } })
    fireEvent.change(screen.getByPlaceholderText('Description *'), { target: { value: 'Like new.' } })
    fireEvent.change(screen.getByPlaceholderText('Price *'), { target: { value: '12.99' } })

    fireEvent.submit(
      screen.getByRole('button', { name: /create listing/i }).closest('form'),
    )

    await waitFor(() => {
      expect(createListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Desk Lamp',
          description: 'Like new.',
          city: 'new-york',
          state: 'NY',
          country: 'USA',
          owner: 'alice',
          transaction_type: 'sell',
          price: 12.99,
        }),
      )
    })
  })
})
