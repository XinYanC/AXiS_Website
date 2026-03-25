import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from './client'

export const getListingsCount = () => apiGet('/listings/count')

export const createListing = (payload) => apiPost('/listings/create', payload)

const getUploadedImageUrl = (response) => {
	if (typeof response === 'string') {
		const trimmed = response.trim()
		if (trimmed) {
			return trimmed
		}
	}

	const url = response && typeof response === 'object' ? response.url : undefined
	if (typeof url === 'string' && url.trim()) {
		return url.trim()
	}

	throw new Error('Upload succeeded but no image URL was returned by the server.')
}

export const uploadListingImage = async (file) => {
	const isFileLike =
		(typeof File !== 'undefined' && file instanceof File) ||
		(file && typeof file === 'object' && typeof file.name === 'string')

	if (!isFileLike) {
		throw new Error('A valid image file is required for upload.')
	}

	const uploadWithFieldName = async (fieldName) => {
		const formData = new FormData()
		formData.append(fieldName, file)

		return apiRequest('/listings/upload-image', {
			method: 'POST',
			body: formData,
		})
	}

	try {
		const primaryResponse = await uploadWithFieldName('image')
		return getUploadedImageUrl(primaryResponse)
	} catch (err) {
		const message = err instanceof Error ? err.message : ''
		const shouldTryFallback =
			message.includes('API error (400)') ||
			message.includes('API error (415)') ||
			message.includes('API error (422)')

		if (!shouldTryFallback) {
			throw err
		}

		const fallbackResponse = await uploadWithFieldName('file')
		return getUploadedImageUrl(fallbackResponse)
	}
}

export const deleteListing = (id) =>
	apiDelete(`/listings/delete?id=${encodeURIComponent(id)}`)

export const readListings = () => apiGet('/listings/read')

export const readListingsByUser = async (username) => {
	const normalizedUsername = String(username || '').trim()
	if (!normalizedUsername) {
		throw new Error('Username is required to fetch user listings')
	}

	const encodedUsername = encodeURIComponent(normalizedUsername)

	try {
		// Current deployed backend uses kebab-case.
		return await apiGet(`/listings/by-user?username=${encodedUsername}`)
	} catch (err) {
		// Compatibility fallback for deployments using underscore naming.
		if (err instanceof Error && err.message.includes('API error (404)')) {
			return apiGet(`/listings/by_user?username=${encodedUsername}`)
		}

		throw err
	}
}

export const readListingById = async (id) => {
	const response = await readListings()
	const listingsArray = response && response.Listings
		? Object.values(response.Listings)
		: Array.isArray(response)
			? response
			: []

	const normalizedId = String(id || '')

	return (
		listingsArray.find((listing) => String(listing?._id ?? '') === normalizedId) ||
		null
	)
}

export const searchListings = (searchTerm) =>
	apiGet(`/listings/search?q=${encodeURIComponent(searchTerm)}`)

export const updateListing = (id, payload) =>
	apiPut(`/listings/update?id=${encodeURIComponent(id)}`, payload)
