import { apiDelete, apiGet, apiPost } from './client'

export const getListingsCount = () => apiGet('/listings/count')

export const createListing = (payload) => apiPost('/listings/create', payload)

export const deleteListing = (id) =>
	apiDelete('/listings/delete', {
		body: JSON.stringify({ id }),
		headers: { 'Content-Type': 'application/json' },
	})

export const readListings = () => apiGet('/listings/read')

export const searchListings = (searchTerm) =>
	apiGet(`/listings/search?q=${encodeURIComponent(searchTerm)}`)
