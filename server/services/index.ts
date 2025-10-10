import { dataAccess } from '../data'
import AuditService from './auditService'
import LocationsService from './locationsService'

export const services = () => {
  const { applicationInfo, hmppsAuditClient, locationsApiClient } = dataAccess()

  return {
    applicationInfo,
    auditService: new AuditService(hmppsAuditClient),
    locationsService: new LocationsService(locationsApiClient),
  }
}

export type Services = ReturnType<typeof services>
