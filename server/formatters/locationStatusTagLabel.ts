import { Location } from '../@types/locationsApi'
import LocationStatusMap from '../@types/locationsApi/locationStatusMap'

export default function locationStatusTagLabel(location: Location): string {
  return LocationStatusMap[location.status]?.label || location.status
}
