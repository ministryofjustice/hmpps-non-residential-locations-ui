import { LocationSummary } from '../@types/locationsApi/locationsApiTypes'

export type LocationHierarchyView = {
  // Readable "›"-joined path of ancestor local names including the location itself,
  // e.g. "Houseblock 1 › Gym". Undefined when the location has no hierarchy.
  localNamePath?: string
  // The immediate parent's local name, e.g. "Houseblock 1". Undefined for top-level locations.
  parentLocalName?: string
}

const label = (summary: LocationSummary): string => summary.localName || summary.code

/**
 * Derives the display strings the locations table needs from the API's structured
 * `locationHierarchy` (ancestors and self, ordered top → bottom).
 */
export default function deriveLocationHierarchy(hierarchy?: LocationSummary[]): LocationHierarchyView {
  if (!hierarchy || hierarchy.length === 0) {
    return {}
  }

  return {
    localNamePath: hierarchy.map(label).join(' › '),
    parentLocalName: hierarchy.length > 1 ? label(hierarchy[hierarchy.length - 2]) : undefined,
  }
}
