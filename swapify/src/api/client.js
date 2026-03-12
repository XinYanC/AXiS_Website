// Backend URL from env var set in local.sh or cloud.sh
const API_BASE_URL = import.meta.env.REACT_APP_API_URL ?? 'http://127.0.0.1:8000'

const defaultHeaders = {
  'Content-Type': 'application/json',
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`

  // Add debug logging in development
  if (import.meta.env.REACT_APP_ENVIRONMENT === 'local' || import.meta.env.DEV) {
    console.log(`API Request: ${options.method || 'GET'} ${url}`)
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    const message = errorText || response.statusText
    throw new Error(`API error (${response.status}): ${message}`)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export const apiGet = (path, options) => apiRequest(path, { ...options, method: 'GET' })

export const apiPost = (path, body, options = {}) =>
  apiRequest(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  })

export const apiPut = (path, body, options = {}) =>
  apiRequest(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  })

export const apiDelete = (path, options = {}) =>
  apiRequest(path, {
    ...options,
    method: 'DELETE',
  })