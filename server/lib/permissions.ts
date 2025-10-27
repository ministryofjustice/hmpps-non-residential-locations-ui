import { uniq } from 'lodash'

const viewLocationsPermissions: string[] = ['view_non_resi']

const maintainLocationsPermissions: string[] = [...viewLocationsPermissions, 'some_other_permission'] // FIXME update when permissions are added

const permissionsByRole: { [key: string]: string[] } = {
  VIEW_INTERNAL_LOCATION: viewLocationsPermissions,
  MANAGE_RESIDENTIAL_LOCATIONS: maintainLocationsPermissions,
}

const rolesToPermissions = (roles: string[], mapping = permissionsByRole) =>
  uniq(roles.map(role => mapping[role] || []).flat())

export { permissionsByRole, rolesToPermissions }
