import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiRequest, apiGet, apiPost, apiPut, apiDelete } from '../client'

let mockFetch

function makeResponse({ status = 200, body = {}, contentType = 'application/json' } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    headers: { get: (key) => (key === 'content-type' ? contentType : null) },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  }
}

describe('apiRequest', () => {
  beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON for a successful JSON response', async () => {
    const data = { id: 1 }
    mockFetch.mockResolvedValue(makeResponse({ body: data }))
    await expect(apiRequest('/test')).resolves.toEqual(data)
  })

  it('returns text when content-type is not JSON', async () => {
    mockFetch.mockResolvedValue(makeResponse({ body: 'plain text', contentType: 'text/plain' }))
    await expect(apiRequest('/test')).resolves.toBe('plain text')
  })

  it('returns null for a 204 No Content response', async () => {
    mockFetch.mockResolvedValue(makeResponse({ status: 204, contentType: null }))
    await expect(apiRequest('/test')).resolves.toBeNull()
  })

  it('throws for a non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Not found'),
    })
    await expect(apiRequest('/test')).rejects.toThrow('API error (404)')
  })

  it('throws a network error when fetch rejects', async () => {
    mockFetch.mockRejectedValue(new Error('Failed to fetch'))
    await expect(apiRequest('/test')).rejects.toThrow('Network error')
  })
})

describe('apiGet', () => {
  beforeEach(() => { mockFetch = vi.fn(); vi.stubGlobal('fetch', mockFetch) })
  afterEach(() => vi.unstubAllGlobals())

  it('uses GET method', async () => {
    mockFetch.mockResolvedValue(makeResponse())
    await apiGet('/items')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items'),
      expect.objectContaining({ method: 'GET' })
    )
  })
})

describe('apiPost', () => {
  beforeEach(() => { mockFetch = vi.fn(); vi.stubGlobal('fetch', mockFetch) })
  afterEach(() => vi.unstubAllGlobals())

  it('uses POST method with a serialized body', async () => {
    mockFetch.mockResolvedValue(makeResponse())
    await apiPost('/items', { name: 'thing' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'thing' }) })
    )
  })
})

describe('apiPut', () => {
  beforeEach(() => { mockFetch = vi.fn(); vi.stubGlobal('fetch', mockFetch) })
  afterEach(() => vi.unstubAllGlobals())

  it('uses PUT method with a serialized body', async () => {
    mockFetch.mockResolvedValue(makeResponse())
    await apiPut('/items/1', { name: 'updated' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/1'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'updated' }) })
    )
  })
})

describe('apiDelete', () => {
  beforeEach(() => { mockFetch = vi.fn(); vi.stubGlobal('fetch', mockFetch) })
  afterEach(() => vi.unstubAllGlobals())

  it('uses DELETE method', async () => {
    mockFetch.mockResolvedValue(makeResponse())
    await apiDelete('/items/1')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
