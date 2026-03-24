// Backend URL from env var set in local.sh or cloud.sh
const API_BASE_URL = import.meta.env.REACT_APP_API_URL ?? 'http://127.0.0.1:8000'

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`
  const method = String(options.method || 'GET').toUpperCase()

  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers = {
    ...(options.body != null && !isFormDataBody ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ?? {}),
  }

  // Add debug logging in development
  if (import.meta.env.REACT_APP_ENVIRONMENT === 'local' || import.meta.env.DEV) {
    console.log(`API Request: ${options.method || 'GET'} ${url}`)
  }

  let response

  try {
    response = await fetch(url, {
      ...options,
      headers,
      keepalive: options.keepalive ?? method !== 'GET',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error'
    throw new Error(
      `Network error while requesting ${url}: ${message}. ` +
      'Check REACT_APP_API_URL and confirm the backend is reachable.'
    )
  }

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