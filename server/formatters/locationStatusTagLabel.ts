import LocationStatusMap from '../@types/locationsApi/locationStatusMap'
import { Location } from '../@types/locationsApi/locationsApiTypes'

export default function locationStatusTagLabel(location: Location): string {
  return LocationStatusMap[location.status]?.label || location.status
}
