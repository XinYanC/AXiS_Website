import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '../Home.jsx'
import * as citiesApi from '../../api/cities'
import * as listingsApi from '../../api/listings'

vi.mock('../../api/cities')
vi.mock('../../api/listings')

vi.mock('../../components/MapVisualizer', () => ({
  default: () => <div data-testid="map-visualizer">Map Visualizer</div>,
}))

vi.mock('../../components/CreateListing', () => ({
  default: ({ isOpen }) =>
    isOpen ? <div data-testid="create-listing">Create Listing Modal</div> : null,
}))

vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

describe('Home page (Map view)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('swapify.authenticated', 'true')
      window.localStorage.setItem('swapify.username', 'testuser')
      window.localStorage.setItem('swapify.email', 'testuser@example.com')
    }

    vi.mocked(citiesApi.readCities).mockResolvedValue({
      Cities: {
        '1': {
          name: 'Seattle',
          state_code: 'WA',
          country_code: 'USA',
          latitude: 47.6062,
          longitude: -122.3321,
        },
        '2': {
          name: 'Los Angeles',
          state_code: 'CA',
          country_code: 'USA',
          latitude: 34.0522,
          longitude: -118.2437,
        },
      },
    })

    vi.mocked(listingsApi.readListings).mockResolvedValue({
      Listings: {
        '1': {
          _id: '1',
          title: 'Test Listing 1',
          city: 'Seattle',
          state: 'WA',
          country: 'USA',
          price: 50,
          owner: 'testuser',
        },
        '2': {
          _id: '2',
          title: 'Test Listing 2',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          price: 0,
          owner: 'another_user',
        },
      },
    })
  })

  it('renders map view with navbar', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(screen.getByTestId('map-visualizer')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Create new listing')).toBeInTheDocument()
  })

  it('displays sidebar header with all listings', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3, name: /all listings/i })
      expect(headings.length).toBeGreaterThan(0)
      expect(headings[0]).toBeInTheDocument()
    })
  })

  it('calls API endpoints on mount', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(citiesApi.readCities).toHaveBeenCalled()
      expect(listingsApi.readListings).toHaveBeenCalled()
    })
  })
})
