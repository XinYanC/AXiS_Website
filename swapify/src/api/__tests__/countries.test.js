import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost, apiDelete } from '../client'
import {
  getCountriesCount,
  createCountry,
  deleteCountry,
  readCountries,
  searchCountries,
} from '../countries'

vi.mock('../client')

describe('countries API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCountriesCount calls apiGet with /countries/count', async () => {
    apiGet.mockResolvedValue({ count: 3 })
    await getCountriesCount()
    expect(apiGet).toHaveBeenCalledWith('/countries/count')
  })

  it('createCountry calls apiPost with /countries/create and payload', async () => {
    const payload = { name: 'Canada' }
    apiPost.mockResolvedValue({ id: '1' })
    await createCountry(payload)
    expect(apiPost).toHaveBeenCalledWith('/countries/create', payload)
  })

  it('deleteCountry calls apiDelete with /countries/delete and JSON body', async () => {
    const payload = { id: '1' }
    apiDelete.mockResolvedValue(null)
    await deleteCountry(payload)
    expect(apiDelete).toHaveBeenCalledWith('/countries/delete', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('readCountries calls apiGet with /countries/read', async () => {
    apiGet.mockResolvedValue([])
    await readCountries()
    expect(apiGet).toHaveBeenCalledWith('/countries/read')
  })

  it('searchCountries encodes the query and calls apiGet', async () => {
    apiGet.mockResolvedValue([])
    await searchCountries('United States')
    expect(apiGet).toHaveBeenCalledWith('/countries/search?q=United%20States')
  })
})
