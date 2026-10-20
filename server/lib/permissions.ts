import { uniq } from 'lodash'

const editLocationsPermissions: string[] = ['edit_non_resi']

const editBvlLocationsPermissions: string[] = [...editLocationsPermissions, 'edit_bvl']

const permissionsByRole: { [key: string]: string[] } = {
  NONRESI__MAINTAIN_LOCATION: editLocationsPermissions,
  NONRESI__MAINTAIN_BVL_LOCS: editBvlLocationsPermissions,
}

const rolesToPermissions = (roles: string[], mapping = permissionsByRole) =>
  uniq(roles.map(role => mapping[role] || []).flat())

export { permissionsByRole, rolesToPermissions }
