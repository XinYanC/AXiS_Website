import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/map.css'

// Recenter helper — flies to new center when selection changes
function FlyTo({ center, zoom }) {
  const map = useMap()
  if (center) map.flyTo(center, zoom ?? 7, { duration: 0.8 })
  return null
}

// Create a custom dropper icon with listing count
function makeDropperIcon(count, active) {
  const hasListings = count > 0
  const fillColor = hasListings ? (active ? '#3b82f6' : '#ef4444') : '#cbd5e1'

  return L.divIcon({
    className: 'location-dropper-marker',
    html: `
      <div class="dropper-icon${active ? ' active' : ''}${!hasListings ? ' disabled' : ''}">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2C14.48 2 10 6.48 10 12C10 19.59 20 35 20 35S30 19.59 30 12C30 6.48 25.52 2 20 2Z" fill="${fillColor}" stroke="white" stroke-width="1.5"/>
          <circle cx="20" cy="12" r="3.5" fill="white"/>
        </svg>
        ${hasListings ? `<span class="dropper-label">${count}</span>` : '<span class="dropper-label">0</span>'}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

function MapVisualizer({ points, selectedState, onStateClick }) {
  const flyZoom = selectedState?.mapKey ? 10 : 7

  return (
    <MapContainer
      center={[38, -96]}
      zoom={4}
      className="map-container"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {selectedState && (
        <FlyTo center={[selectedState.lat, selectedState.lng]} zoom={flyZoom} />
      )}
      {points.map((point) => (
        <Marker
          key={point.mapKey ?? point.label}
          position={[point.lat, point.lng]}
          icon={makeDropperIcon(
            point.count,
            selectedState?.mapKey != null &&
            selectedState.mapKey === point.mapKey,
          )}
          eventHandlers={{ click: () => onStateClick(point) }}
        >
          <Popup>
            <div className="map-popup">
              <p className="popup-state-name">
                {point.subtitle ? `${point.label}, ${point.subtitle}` : point.label}
              </p>
              <p className="popup-count">
                {point.count} listing{point.count !== 1 ? 's' : ''}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default MapVisualizer
