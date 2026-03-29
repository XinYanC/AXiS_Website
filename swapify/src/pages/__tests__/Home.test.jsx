import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import Home from '../Home.jsx'
import * as statesApi from '../../api/states'
import * as citiesApi from '../../api/cities'
import * as listingsApi from '../../api/listings'

// Mock the API modules
vi.mock('../../api/states')
vi.mock('../../api/cities')
vi.mock('../../api/listings')

// Mock the MapVisualizer component to avoid leaflet issues in tests
vi.mock('../../components/MapVisualizer', () => ({
  default: () => <div data-testid="map-visualizer">Map Visualizer</div>,
}))

// Mock the CreateListing component
vi.mock('../../components/CreateListing', () => ({
  default: ({ isOpen, onClose }) => (
    isOpen ? <div data-testid="create-listing">Create Listing Modal</div> : null
  ),
}))

// Mock the Navbar component
vi.mock('../../components/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

describe('Home page (Map view)', () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => null)
    
    // Setup API mocks with default responses
    vi.mocked(statesApi.readStates).mockResolvedValue({
      States: {
        'WA': { code: 'WA', name: 'Washington', latitude: 47.5, longitude: -120.5 },
        'CA': { code: 'CA', name: 'California', latitude: 36.5, longitude: -119.5 },
      },
    })

    vi.mocked(citiesApi.readCities).mockResolvedValue({
      Cities: {
        '1': { name: 'seattle', state: 'WA' },
        '2': { name: 'los angeles', state: 'CA' },
      },
    })

    vi.mocked(listingsApi.readListings).mockResolvedValue({
      Listings: {
        '1': {
          _id: '1',
          title: 'Test Listing 1',
          meetup_location: 'seattle',
          price: 50,
          owner: 'testuser',
        },
        '2': {
          _id: '2',
          title: 'Test Listing 2',
          meetup_location: 'los angeles',
          price: 0,
          owner: 'another_user',
        },
      },
    })
  })

  it('renders map view with navbar', async () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    // Wait for API calls to complete
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(screen.getByTestId('map-visualizer')).toBeInTheDocument()
    })

    // Check that main elements are rendered
    expect(screen.getByLabelText('Create new listing')).toBeInTheDocument()
  })

  it('displays sidebar header with all listings', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      // Look for the h3 element in the sidebar header (get first match if multiple)
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
      expect(statesApi.readStates).toHaveBeenCalled()
      expect(citiesApi.readCities).toHaveBeenCalled()
      expect(listingsApi.readListings).toHaveBeenCalled()
    })
  })
})

