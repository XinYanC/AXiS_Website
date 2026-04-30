import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { cleanup, render, screen } from '@testing-library/react'
import PostDetails from '../PostDetails.jsx'
import { readListingById } from '../../api'
import * as usersApi from '../../api/users'

vi.mock('../../api', () => ({
  readListingById: vi.fn(),
  updateListing: vi.fn().mockResolvedValue({}),
}))

vi.mock('../../api/users', () => ({
  readUsersWithRetry: vi.fn(),
  readUsers: vi.fn(),
}))

vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar" />,
}))

describe('PostDetails', () => {
  afterEach(() => {
    cleanup()
  })

  const listing = {
    _id: 'listing-1',
    title: 'Desk Lamp',
    owner: 'alice',
    owner_email: 'alice@example.com',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    description: 'Lightly used lamp',
    transaction_type: 'sell',
    price: 25,
    status: 'active',
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    readListingById.mockResolvedValue(listing)
    const usersPayload = {
      User: {
        alice: {
          username: 'alice',
          email: 'alice@example.com',
          name: 'Alice',
          rating: 4.8,
          saved_listings: [],
        },
        bob: {
          username: 'bob',
          email: 'bob@example.com',
          name: 'Bob',
          rating: 4.5,
          saved_listings: [],
        },
      },
    }
    vi.mocked(usersApi.readUsersWithRetry).mockResolvedValue(usersPayload)
    vi.mocked(usersApi.readUsers).mockResolvedValue(usersPayload)
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

  it('shows seller profile and message actions when the listing belongs to another user', async () => {
    localStorage.setItem('swapify.authenticated', 'true')
    localStorage.setItem('swapify.username', 'bob')
    localStorage.setItem('swapify.email', 'bob@example.com')

    renderPostDetails()

    const profileLink = await screen.findByRole('link', { name: /alice/i })
    expect(profileLink).toHaveAttribute('href', '/profile/alice')
    const messageSellerLinks = screen.getAllByRole('link', { name: /message seller/i })
    expect(
      messageSellerLinks.some((el) => el.getAttribute('href')?.startsWith('mailto:')),
    ).toBe(true)
  })
})