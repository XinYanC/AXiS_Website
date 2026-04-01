import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost, apiDelete } from '../client'
import { getStatesCount, createState, deleteState, readStates, searchStates } from '../states'

vi.mock('../client')

describe('states API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getStatesCount calls apiGet with /states/count', async () => {
    apiGet.mockResolvedValue({ count: 50 })
    await getStatesCount()
    expect(apiGet).toHaveBeenCalledWith('/states/count')
  })

  it('createState calls apiPost with /states/create and payload', async () => {
    const payload = { name: 'Texas', country_id: '1' }
    apiPost.mockResolvedValue({ id: '1' })
    await createState(payload)
    expect(apiPost).toHaveBeenCalledWith('/states/create', payload)
  })

  it('deleteState calls apiDelete with /states/delete and JSON body', async () => {
    const payload = { id: '1' }
    apiDelete.mockResolvedValue(null)
    await deleteState(payload)
    expect(apiDelete).toHaveBeenCalledWith('/states/delete', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('readStates calls apiGet with /states/read', async () => {
    apiGet.mockResolvedValue([])
    await readStates()
    expect(apiGet).toHaveBeenCalledWith('/states/read')
  })

  it('searchStates encodes the query and calls apiGet', async () => {
    apiGet.mockResolvedValue([])
    await searchStates('New Mexico')
    expect(apiGet).toHaveBeenCalledWith('/states/search?q=New%20Mexico')
  })
})
