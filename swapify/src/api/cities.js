import { apiDelete, apiGet, apiPost } from './client'

export const getCitiesCount = () => apiGet('/cities/count')
export const createCity = (payload) => apiPost('/cities/create', payload)
export const deleteCity = (payload) =>
	apiDelete('/cities/delete', {
		body: JSON.stringify(payload),
		headers: { 'Content-Type': 'application/json' },
	})
export const readCities = () => apiGet('/cities/read')
export const searchCities = (query) =>
	apiGet(`/cities/search?q=${encodeURIComponent(query)}`)
