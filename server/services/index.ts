import { dataAccess } from '../data'
import AuditService from './auditService'
import LocationsService from './locationsService'
import AuthService from './authService'
import ManageUsersService from './manageUsersService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, hmppsAuthClient, locationsApiClient, manageUsersApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    locationsService: new LocationsService(locationsApiClient),
    manageUsersService: new ManageUsersService(manageUsersApiClient),
    authService: new AuthService(hmppsAuthClient),
  }
}

export type Services = ReturnType<typeof services>
