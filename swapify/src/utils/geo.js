// Format city / state / country for display (matches API field names).
export function formatGeoLocation(source) {
  if (!source || typeof source !== 'object') return ''
  const city = String(source.city ?? '').trim()
  const state = String(source.state ?? '').trim()
  const country = String(source.country ?? '').trim()
  const parts = [city, state, country].filter(Boolean)
  return parts.length ? parts.join(', ') : ''
}
