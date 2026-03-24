import { apiDelete, apiGet, apiPost, apiPut } from './client'

export const getUsersCount = () => apiGet('/users/count')

export const createUser = (payload) => apiPost('/users/create', payload)

export const deleteUser = (username) =>
	apiDelete(`/users/delete?username=${encodeURIComponent(username)}`)

export const readUsers = () => apiGet('/users/read')

export const searchUsers = (searchTerm) =>
	apiGet(`/users/search?q=${encodeURIComponent(searchTerm)}`)

export const updateUser = (usernameOrId, payload) =>
	apiPut(`/users/update?username=${encodeURIComponent(usernameOrId)}`, payload)
