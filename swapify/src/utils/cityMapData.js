/*
- Build map markers from city coordinates and listings grouped by city + state + country.
*/

export function geoKeyCityStateCountry(cityName, stateCode, countryCode) {
  const c = String(cityName ?? '').trim().toLowerCase()
  const s = String(stateCode ?? '').trim().toUpperCase()
  const co = String(countryCode ?? 'USA').trim().toUpperCase() || 'USA'
  if (!c || !s) return ''
  return `${c}|${s}|${co}`
}

export function resolveListingStateCode(listing, cityToState) {
  const code = String(listing.state ?? '').trim().toUpperCase()
  if (code) return code
  const listingCity = String(listing.city ?? '').trim().toLowerCase()
  const cc = String(listing.country ?? 'USA').trim().toUpperCase() || 'USA'
  return cityToState.get(`${listingCity}|${cc}`) ?? ''
}

/*
- cities from API (name, state_code, latitude, longitude, country_code)
- listings from API (city, state, country)
- returns: {{ points: object[], listingsByCityKey: Record<string, object[]>, cityToState: Map }}
 */
export function buildCityMapModel(cities, listings) {
  const cityToState = new Map()
  const geoByKey = new Map()

  for (const city of cities) {
    const name = city.name?.trim() ?? ''
    const state = String(city.state_code ?? city.state ?? '').trim().toUpperCase()
    const country =
      String(city.country_code ?? 'USA').trim().toUpperCase() || 'USA'
    if (!name || !state) continue
    const lat = parseFloat(city.latitude)
    const lng = parseFloat(city.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

    cityToState.set(`${name.toLowerCase()}|${country}`, state)
    const mapKey = geoKeyCityStateCountry(name, state, country)
    geoByKey.set(mapKey, {
      lat,
      lng,
      label: name,
      stateCode: state,
      countryCode: country,
    })
  }

  const listingsByCityKey = {}
  for (const listing of listings) {
    const stateCode = resolveListingStateCode(listing, cityToState)
    if (!stateCode) continue
    const listingCountry =
      String(listing.country ?? 'USA').trim().toUpperCase() || 'USA'
    const mapKey = geoKeyCityStateCountry(
      listing.city,
      stateCode,
      listingCountry,
    )
    if (!mapKey) continue
    if (!listingsByCityKey[mapKey]) listingsByCityKey[mapKey] = []
    listingsByCityKey[mapKey].push(listing)
  }

  const points = []
  for (const [mapKey, geo] of geoByKey) {
    points.push({
      mapKey,
      lat: geo.lat,
      lng: geo.lng,
      label: geo.label,
      subtitle: `${geo.stateCode}, ${geo.countryCode}`,
      code: geo.stateCode,
      count: listingsByCityKey[mapKey]?.length ?? 0,
    })
  }

  return { points, listingsByCityKey, cityToState }
}
