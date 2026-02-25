import { apiDelete, apiGet, apiPost } from './client'

export const getUsersCount = () => apiGet('/users/count')

export const createUser = (payload) => apiPost('/users/create', payload)

export const deleteUser = (username) =>
	apiDelete('/users/delete', {
		body: JSON.stringify({ username }),
		headers: { 'Content-Type': 'application/json' },
	})

export const readUsers = () => apiGet('/users/read')

export const searchUsers = (searchTerm) =>
	apiGet(`/users/search?q=${encodeURIComponent(searchTerm)}`)
