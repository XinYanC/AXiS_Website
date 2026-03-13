import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet } from '../client'
import { getEndpoints } from '../system'

vi.mock('../client')

describe('system API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getEndpoints calls apiGet with /endpoints', async () => {
    apiGet.mockResolvedValue([])
    await getEndpoints()
    expect(apiGet).toHaveBeenCalledWith('/endpoints')
  })

  it('getEndpoints returns the API response', async () => {
    const endpoints = ['/users/read', '/listings/read']
    apiGet.mockResolvedValue(endpoints)
    await expect(getEndpoints()).resolves.toEqual(endpoints)
  })
})
