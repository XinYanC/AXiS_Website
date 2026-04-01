import { apiGet } from './client'

export const getEndpoints = () => apiGet('/endpoints')

// HATEOAS: form metadata for dropdown fields
export const getSystemDropdownForm = () => apiGet('/system/dropdown-form')

/*
HATEOAS: option lists for cascading dropdowns.
- No params: countries
- country_code: states in that country
- state_code: cities in that state
*/
export const getSystemDropdownOptions = (params = {}) => {
  const search = new URLSearchParams()
  if (params.country_code) search.set('country_code', params.country_code)
  if (params.state_code) search.set('state_code', params.state_code)
  const q = search.toString()
  return apiGet(`/system/dropdown-options${q ? `?${q}` : ''}`)
}
