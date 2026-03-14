const getImageUrlFromValue = (value) => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (value && typeof value === 'object') {
    const candidate = value.secure_url || value.url || value.src || value.image_url || value.imageUrl
    if (typeof candidate === 'string') {
      const trimmedCandidate = candidate.trim()
      return trimmedCandidate || null
    }
  }

  return null
}

export const normalizeImageList = (input) => {
  if (Array.isArray(input)) {
    return input
      .map((item) => getImageUrlFromValue(item))
      .filter(Boolean)
  }

  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) {
      return []
    }

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        return normalizeImageList(parsed)
      } catch {
        // Fall through and treat as a plain URL string.
      }
    }

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((item) => getImageUrlFromValue(item))
        .filter(Boolean)
    }

    const single = getImageUrlFromValue(trimmed)
    return single ? [single] : []
  }

  const single = getImageUrlFromValue(input)
  return single ? [single] : []
}

export const getListingImageUrls = (listing) => {
  const candidates = [
    listing?.images,
    listing?.image,
    listing?.image_url,
    listing?.imageUrl,
  ]

  for (const candidate of candidates) {
    const normalized = normalizeImageList(candidate)
    if (normalized.length > 0) {
      return normalized
    }
  }

  return []
}