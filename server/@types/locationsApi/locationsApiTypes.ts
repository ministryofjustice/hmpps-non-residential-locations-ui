import { components } from '.'

export type NonResidentialSummary = components['schemas']['NonResidentialSummary']
export type LocationSummary = components['schemas']['LocationSummary']
// `locationHierarchy` is declared here until the generated types are refreshed
// (`npm run generate-location-api-types`) once the API change is on dev — at which point
// `NonResidentialLocationDTO` carries it natively and this intersection becomes redundant.
export type Location = components['schemas']['NonResidentialLocationDTO'] & {
  locationHierarchy?: LocationSummary[]
}
export type Constant = components['schemas']['Constant']
export type CompoundConstant = components['schemas']['CompoundConstant']
