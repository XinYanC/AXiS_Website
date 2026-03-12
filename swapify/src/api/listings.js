import { apiDelete, apiGet, apiPost, apiPut } from './client'

export const getListingsCount = () => apiGet('/listings/count')

export const createListing = (payload) => apiPost('/listings/create', payload)

export const deleteListing = (id) =>
	apiDelete('/listings/delete', {
		body: JSON.stringify({ id }),
		headers: { 'Content-Type': 'application/json' },
	})

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
		listingsArray.find((listing) => String(listing?._id || listing?.id || '') === normalizedId) ||
		null
	)
}

export const searchListings = (searchTerm) =>
	apiGet(`/listings/search?q=${encodeURIComponent(searchTerm)}`)

export const updateListing = (id, payload) =>
	apiPut(`/listings/update?id=${encodeURIComponent(id)}`, payload)
