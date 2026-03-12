import { apiGet } from './client'

export const getEndpoints = () => apiGet('/endpoints')
