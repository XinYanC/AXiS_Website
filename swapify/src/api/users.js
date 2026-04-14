import { apiDelete, apiGet, apiPost, apiPut } from './client'

export const getUsersCount = () => apiGet('/users/count')

export const createUser = (payload) => apiPost('/users/create', payload)

export const deleteUser = (username) =>
	apiDelete(`/users/delete?username=${encodeURIComponent(username)}`)

export const readUsers = () => apiGet('/users/read')

/**
 * Read users with retry logic to handle race conditions
 */
export const readUsersWithRetry = async (maxRetries = 3) => {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await readUsers()
			if (response && response.User) {
				return response
			}
			// If response doesn't have User field and we have retries left, retry
			if (attempt < maxRetries - 1) {
				await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)))
			}
		} catch (err) {
			if (attempt === maxRetries - 1) throw err
			await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)))
		}
	}
	throw new Error('Failed to load users after retries')
}

export const searchUsers = (searchTerm) =>
	apiGet(`/users/search?q=${encodeURIComponent(searchTerm)}`)

export const updateUser = (usernameOrId, payload) =>
	apiPut(`/users/update?username=${encodeURIComponent(usernameOrId)}`, payload)
