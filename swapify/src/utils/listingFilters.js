import { formatGeoLocation } from './geo'

const normalize = (value) => String(value || '').trim().toLowerCase()

export const isListingSold = (listing) => normalize(listing?.status) === 'sold'

export const excludeSoldListings = (listings) => {
  const source = Array.isArray(listings) ? listings : []
  return source.filter((listing) => !isListingSold(listing))
}

export function filterListings(listings, { searchQuery = '', filters = {} } = {}) {
  const source = excludeSoldListings(listings)
  const q = normalize(searchQuery)
  const cityFilter = normalize(filters.city)
  const transactionTypeFilter = normalize(filters.transactionType)
  const maxPrice = Number(filters.price)

  return source.filter((listing) => {
    const title = normalize(listing?.title)
    const location = normalize(formatGeoLocation(listing))
    const transactionType = normalize(listing?.transaction_type)
    const numericPrice = Number(listing?.price)

    const matchesSearch = !q || title.includes(q)
    const matchesCity = !cityFilter || location.includes(cityFilter)
    const matchesType = !transactionTypeFilter || transactionType === transactionTypeFilter
    const matchesPrice =
      !maxPrice || (Number.isFinite(numericPrice) && numericPrice <= maxPrice)

    return matchesSearch && matchesCity && matchesType && matchesPrice
  })
}
