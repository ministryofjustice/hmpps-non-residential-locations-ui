import { Location } from '../@types/locationsApi'
import LocationStatusMap from '../@types/locationsApi/locationStatusMap'

export default function locationStatusTagClass(location: Location): string {
  const { status } = location
  const mapping = LocationStatusMap[status]
  return mapping?.tagColour ? `govuk-tag--${mapping.tagColour}` : ''
}
