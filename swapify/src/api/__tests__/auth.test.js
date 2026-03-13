import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiPost } from '../client'
import { authLogin } from '../auth'

vi.mock('../client')

describe('auth API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('authLogin calls apiPost with /auth/login and payload', async () => {
    const payload = { email: 'user@example.com', password: 'secret' }
    apiPost.mockResolvedValue({ token: 'abc123' })
    await authLogin(payload)
    expect(apiPost).toHaveBeenCalledWith('/auth/login', payload)
  })

  it('authLogin returns the API response', async () => {
    const payload = { email: 'user@example.com', password: 'secret' }
    apiPost.mockResolvedValue({ token: 'abc123' })
    await expect(authLogin(payload)).resolves.toEqual({ token: 'abc123' })
  })

  it('authLogin propagates errors from the API', async () => {
    apiPost.mockRejectedValue(new Error('API error (401): Unauthorized'))
    await expect(authLogin({ email: 'x', password: 'wrong' })).rejects.toThrow('401')
  })
})
