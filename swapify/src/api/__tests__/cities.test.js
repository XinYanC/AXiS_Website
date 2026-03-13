import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost, apiDelete } from '../client'
import { getCitiesCount, createCity, deleteCity, readCities, searchCities } from '../cities'

vi.mock('../client')

describe('cities API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getCitiesCount calls apiGet with /cities/count', async () => {
    apiGet.mockResolvedValue({ count: 5 })
    await getCitiesCount()
    expect(apiGet).toHaveBeenCalledWith('/cities/count')
  })

  it('createCity calls apiPost with /cities/create and payload', async () => {
    const payload = { name: 'Austin', state_id: '1' }
    apiPost.mockResolvedValue({ id: '1' })
    await createCity(payload)
    expect(apiPost).toHaveBeenCalledWith('/cities/create', payload)
  })

  it('deleteCity calls apiDelete with /cities/delete and JSON body', async () => {
    const payload = { id: '1' }
    apiDelete.mockResolvedValue(null)
    await deleteCity(payload)
    expect(apiDelete).toHaveBeenCalledWith('/cities/delete', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('readCities calls apiGet with /cities/read', async () => {
    apiGet.mockResolvedValue([])
    await readCities()
    expect(apiGet).toHaveBeenCalledWith('/cities/read')
  })

  it('searchCities encodes the query and calls apiGet', async () => {
    apiGet.mockResolvedValue([])
    await searchCities('New York')
    expect(apiGet).toHaveBeenCalledWith('/cities/search?query=New%20York')
  })
})
