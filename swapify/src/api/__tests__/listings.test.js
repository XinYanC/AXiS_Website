import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiGet, apiPost, apiPut, apiDelete, apiRequest } from '../client'
import {
  getListingsCount,
  createListing,
  uploadListingImage,
  deleteListing,
  readListings,
  readListingsByUser,
  readListingById,
  searchListings,
  updateListing,
} from '../listings'

vi.mock('../client')

describe('listings API', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getListingsCount calls apiGet with /listings/count', async () => {
    apiGet.mockResolvedValue({ count: 3 })
    await getListingsCount()
    expect(apiGet).toHaveBeenCalledWith('/listings/count')
  })

  it('createListing calls apiPost with /listings/create and payload', async () => {
    const payload = { title: 'Bike', price: 50 }
    apiPost.mockResolvedValue({ id: '1' })
    await createListing(payload)
    expect(apiPost).toHaveBeenCalledWith('/listings/create', payload)
  })

  it('uploadListingImage calls /listings/upload-image with FormData and returns URL', async () => {
    const file = new File(['file-content'], 'square.png', { type: 'image/png' })
    apiRequest.mockResolvedValue({ url: 'https://res.cloudinary.com/demo/image/upload/v1/square.png' })

    const uploadedUrl = await uploadListingImage(file)

    expect(apiRequest).toHaveBeenCalledTimes(1)
    const [path, requestOptions] = apiRequest.mock.calls[0]
    expect(path).toBe('/listings/upload-image')
    expect(requestOptions.method).toBe('POST')
    expect(requestOptions.body).toBeInstanceOf(FormData)
    expect(requestOptions.body.get('image')).toBe(file)
    expect(uploadedUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/square.png')
  })

  it('uploadListingImage falls back to file field when image field is rejected', async () => {
    const file = new File(['file-content'], 'square.png', { type: 'image/png' })
    apiRequest
      .mockRejectedValueOnce(new Error('API error (422): image field required'))
      .mockResolvedValueOnce({ secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/fallback.png' })

    const uploadedUrl = await uploadListingImage(file)

    expect(apiRequest).toHaveBeenCalledTimes(2)
    expect(apiRequest.mock.calls[0][1].body.get('image')).toBe(file)
    expect(apiRequest.mock.calls[1][1].body.get('file')).toBe(file)
    expect(uploadedUrl).toBe('https://res.cloudinary.com/demo/image/upload/v1/fallback.png')
  })

  it('deleteListing calls apiDelete with /listings/delete and id in body', async () => {
    apiDelete.mockResolvedValue(null)
    await deleteListing('abc123')
    expect(apiDelete).toHaveBeenCalledWith('/listings/delete', {
      body: JSON.stringify({ id: 'abc123' }),
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('readListings calls apiGet with /listings/read', async () => {
    apiGet.mockResolvedValue({ Listings: {}, 'Number of Records': 0 })
    await readListings()
    expect(apiGet).toHaveBeenCalledWith('/listings/read')
  })

  describe('readListingsByUser', () => {
    it('calls apiGet with /listings/by-user and encoded username', async () => {
      apiGet.mockResolvedValue({ Listings: {} })
      await readListingsByUser('john doe')
      expect(apiGet).toHaveBeenCalledWith('/listings/by-user?username=john%20doe')
    })

    it('throws when username is empty', async () => {
      await expect(readListingsByUser('')).rejects.toThrow('Username is required')
    })

    it('falls back to /listings/by_user on a 404 error', async () => {
      apiGet
        .mockRejectedValueOnce(new Error('API error (404): not found'))
        .mockResolvedValueOnce({ Listings: {} })
      await readListingsByUser('alice')
      expect(apiGet).toHaveBeenNthCalledWith(1, '/listings/by-user?username=alice')
      expect(apiGet).toHaveBeenNthCalledWith(2, '/listings/by_user?username=alice')
    })

    it('rethrows non-404 errors without fallback', async () => {
      apiGet.mockRejectedValue(new Error('API error (500): Server Error'))
      await expect(readListingsByUser('alice')).rejects.toThrow('500')
      expect(apiGet).toHaveBeenCalledTimes(1)
    })
  })

  describe('readListingById', () => {
    it('returns the listing matching the given id', async () => {
      apiGet.mockResolvedValue({
        Listings: {
          '1': { _id: '1', title: 'Bike' },
          '2': { _id: '2', title: 'Scooter' },
        },
      })
      const result = await readListingById('1')
      expect(result).toEqual({ _id: '1', title: 'Bike' })
    })

    it('returns null when the id is not found', async () => {
      apiGet.mockResolvedValue({ Listings: { '1': { _id: '1', title: 'Bike' } } })
      const result = await readListingById('999')
      expect(result).toBeNull()
    })

    it('handles array response format', async () => {
      apiGet.mockResolvedValue([{ _id: '42', title: 'Skateboard' }])
      const result = await readListingById('42')
      expect(result).toEqual({ _id: '42', title: 'Skateboard' })
    })
  })

  it('searchListings encodes the search term and calls apiGet', async () => {
    apiGet.mockResolvedValue({ Listings: {} })
    await searchListings('road bike')
    expect(apiGet).toHaveBeenCalledWith('/listings/search?q=road%20bike')
  })

  it('updateListing calls apiPut with encoded id and payload', async () => {
    const payload = { title: 'Updated Bike' }
    apiPut.mockResolvedValue({ id: '1' })
    await updateListing('abc 123', payload)
    expect(apiPut).toHaveBeenCalledWith('/listings/update?id=abc%20123', payload)
  })
})
