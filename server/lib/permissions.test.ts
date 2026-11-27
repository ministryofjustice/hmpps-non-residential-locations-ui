import { rolesToPermissions } from './permissions'

describe('rolesToPermissions', () => {
  it('grants no permissions to a user with no locations roles', () => {
    expect(rolesToPermissions([])).toEqual([])
  })

  it('grants edit_non_resi to NONRESI__MAINTAIN_LOCATION', () => {
    expect(rolesToPermissions(['NONRESI__MAINTAIN_LOCATION']).sort()).toEqual(['edit_non_resi'])
  })

  it('grants edit_non_resi and edit_bvl to NONRESI__MAINTAIN_BVL_LOCS', () => {
    expect(rolesToPermissions(['NONRESI__MAINTAIN_BVL_LOCS']).sort()).toEqual(['edit_bvl', 'edit_non_resi'])
  })
})
