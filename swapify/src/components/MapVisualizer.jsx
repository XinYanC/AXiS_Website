import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/map.css'

// Recenter helper — flies to new center when selectedState changes
function FlyTo({ center }) {
  const map = useMap()
  if (center) map.flyTo(center, 7, { duration: 0.8 })
  return null
}

function makeIcon(label, active) {
  return L.divIcon({
    className: '',
    html: `<div class="map-marker-bubble${active ? ' active' : ''}">${label}</div>`,
    iconAnchor: [0, 0],
  })
}

function MapVisualizer({ points, selectedState, onStateClick }) {
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
      {selectedState && <FlyTo center={[selectedState.lat, selectedState.lng]} />}
      {points.map((point) => (
        <Marker
          key={point.label}
          position={[point.lat, point.lng]}
          icon={makeIcon(
            point.count > 0 ? `${point.count}` : point.code,
            selectedState?.label === point.label
          )}
          eventHandlers={{ click: () => onStateClick(point) }}
        />
      ))}
    </MapContainer>
  )
}

export default MapVisualizer
