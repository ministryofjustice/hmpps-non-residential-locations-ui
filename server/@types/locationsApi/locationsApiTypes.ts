import { components } from '.'

export type NonResidentialSummary = components['schemas']['NonResidentialSummary']
export type LocationSummary = components['schemas']['LocationSummary']
// These fields are declared here until the generated types are refreshed
// (`npm run generate-location-api-types`) once the API change is on dev — at which point
// `NonResidentialLocationDTO` carries them natively and this intersection becomes redundant.
//   - locationHierarchy: ancestors and self, top to bottom
//   - hiddenFromList / canBeHiddenFromList: whether a parent location has been, or can be,
//     removed from the non-residential locations list (see MAPB-670)
export type Location = components['schemas']['NonResidentialLocationDTO'] & {
  locationHierarchy?: LocationSummary[]
  hiddenFromList?: boolean
  canBeHiddenFromList?: boolean
}
export type Constant = components['schemas']['Constant']
export type CompoundConstant = components['schemas']['CompoundConstant']
