import { apiPost } from './client'

export const authLogin = (payload) => apiPost('/auth/login', payload)