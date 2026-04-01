import { apiDelete, apiGet, apiPost } from './client'

export const getStatesCount = () => apiGet('/states/count')
export const createState = (payload) => apiPost('/states/create', payload)
export const deleteState = (payload) =>
  apiDelete('/states/delete', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
export const readStates = () => apiGet('/states/read')
export const searchStates = (query) =>
  apiGet(`/states/search?q=${encodeURIComponent(query)}`)
