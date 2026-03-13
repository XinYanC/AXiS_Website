import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost, apiPut, apiDelete } from '../client'
import {
  getUsersCount,
  createUser,
  deleteUser,
  readUsers,
  searchUsers,
  updateUser,
} from '../users'

vi.mock('../client')

describe('users API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getUsersCount calls apiGet with /users/count', async () => {
    apiGet.mockResolvedValue({ count: 10 })
    await getUsersCount()
    expect(apiGet).toHaveBeenCalledWith('/users/count')
  })

  it('createUser calls apiPost with /users/create and payload', async () => {
    const payload = { email: 'test@test.com', username: 'tester' }
    apiPost.mockResolvedValue({ id: '1' })
    await createUser(payload)
    expect(apiPost).toHaveBeenCalledWith('/users/create', payload)
  })

  it('deleteUser calls apiDelete with /users/delete and username in body', async () => {
    apiDelete.mockResolvedValue(null)
    await deleteUser('tester')
    expect(apiDelete).toHaveBeenCalledWith('/users/delete', {
      body: JSON.stringify({ username: 'tester' }),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('readUsers calls apiGet with /users/read', async () => {
    apiGet.mockResolvedValue({ Users: {} })
    await readUsers()
    expect(apiGet).toHaveBeenCalledWith('/users/read')
  })

  it('searchUsers encodes the search term and calls apiGet', async () => {
    apiGet.mockResolvedValue({ Users: {} })
    await searchUsers('john doe')
    expect(apiGet).toHaveBeenCalledWith('/users/search?q=john%20doe')
  })

  it('updateUser calls apiPut with encoded username and payload', async () => {
    const payload = { bio: 'Hello world' }
    apiPut.mockResolvedValue({ id: '1' })
    await updateUser('john doe', payload)
    expect(apiPut).toHaveBeenCalledWith('/users/update?username=john%20doe', payload)
  })

  it('updateUser returns the API response', async () => {
    apiPut.mockResolvedValue({ username: 'alice', bio: 'updated' })
    await expect(updateUser('alice', { bio: 'updated' })).resolves.toEqual({
      username: 'alice',
      bio: 'updated',
    })
  })
})
