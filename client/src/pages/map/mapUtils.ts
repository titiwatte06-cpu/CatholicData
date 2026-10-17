import type { LatLngExpression } from 'leaflet'

export const mapCenter: LatLngExpression = [13.7563, 100.5018]
export const churchPlaceholderImage = '/church-placeholder.svg'
export const isSafeUrl = (url?: string) => !!url && /^https?:\/\//i.test(url)
