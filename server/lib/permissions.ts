import { uniq } from 'lodash'

const viewLocationsPermissions: string[] = ['view_non_resi']

const editLocationsPermissions: string[] = [...viewLocationsPermissions, 'edit_non_resi']

const permissionsByRole: { [key: string]: string[] } = {
  VIEW_INTERNAL_LOCATION: viewLocationsPermissions,
  NONRESI__MAINTAIN_LOCATION: editLocationsPermissions,
}

const rolesToPermissions = (roles: string[], mapping = permissionsByRole) =>
  uniq(roles.map(role => mapping[role] || []).flat())

export { permissionsByRole, rolesToPermissions }
