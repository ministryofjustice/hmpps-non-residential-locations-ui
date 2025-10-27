import { LocationStatus } from './locationStatus'

export declare interface Location {
  id: string
  prisonId: string
  locationType: string
  code: string
  usage: {
    usageType: string
    capacity: number
    sequence: number
  }[]
  status: LocationStatus
}
