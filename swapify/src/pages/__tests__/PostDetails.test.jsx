import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import PostDetails from '../PostDetails.jsx'
import { readListingById, readUsers } from '../../api'

vi.mock('../../api', () => ({
  readListingById: vi.fn(),
  readUsers: vi.fn(),
  updateListing: vi.fn().mockResolvedValue({}),
  updateUser: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}))

describe('PostDetails', () => {
  const listing = {
    _id: 'listing-1',
    title: 'Desk Lamp',
    owner: 'alice',
    owner_email: 'alice@example.com',
    meetup_location: 'Campus Center',
    description: 'Lightly used lamp',
    transaction_type: 'sell',
    price: 25,
    status: 'active',
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    readListingById.mockResolvedValue(listing)
    readUsers.mockResolvedValue({
      User: {
        alice: {
          username: 'alice',
          email: 'alice@example.com',
          name: 'Alice',
          rating: 4.8,
        },
      },
    })
  })

  const renderPostDetails = () =>
    render(
      <MemoryRouter initialEntries={['/post/listing-1']}>
        <Routes>
          <Route path="/post/:id" element={<PostDetails />} />
        </Routes>
      </MemoryRouter>,
    )

  it('shows Mark as Sold when the listing belongs to the logged-in user', async () => {
    localStorage.setItem('swapify.authenticated', 'true')
    localStorage.setItem('swapify.username', 'alice')
    localStorage.setItem('swapify.email', 'alice@example.com')

    renderPostDetails()

    expect(
      await screen.findByRole('button', { name: /mark as sold/i }),
    ).toBeInTheDocument()
  })

  it('shows View Seller when the listing belongs to another user', async () => {
    localStorage.setItem('swapify.authenticated', 'true')
    localStorage.setItem('swapify.username', 'bob')
    localStorage.setItem('swapify.email', 'bob@example.com')

    renderPostDetails()

    expect(
      await screen.findByRole('link', { name: /view seller/i }),
    ).toBeInTheDocument()
  })
})