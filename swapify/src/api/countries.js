import { apiDelete, apiGet, apiPost } from './client'

export const getCountriesCount = () => apiGet('/countries/count')
export const createCountry = (payload) => apiPost('/countries/create', payload)
export const deleteCountry = (payload) =>
  apiDelete('/countries/delete', {
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
export const readCountries = () => apiGet('/countries/read')
export const searchCountries = (query) =>
  apiGet(`/countries/search?q=${encodeURIComponent(query)}`)
