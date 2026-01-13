import { HmppsUser } from '../../interfaces/hmppsUser'
import { FeComponentsMeta } from '../../data/feComponentsClient'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    nowInMinutes: number
    referrerUrl: string
    returnTo: string
    systemToken: string
  }
}

interface AllLocals {
  stack?: string
  status?: number
  message?: string
  errorlist: FormWizard.Controller.Error[]
  backLink: string
  cancelLink: string
  buttonText: string
  breadcrumbs?: {
    title: string
    href: string
  }[]
  title: string
  locationDetails: Location
  locationId: string
  options: FormWizard.Request['form']['options']
  prisonId: string
  canAccess?: (permission: string) => boolean
  cspNonce?: string
  user?: HmppsUser
  pageTitle?: string
  paginationLocals?: PaginationLocals
  titleCaption?: string
  validationErrors: { text: string; href: string }[]
  values: FormWizard.Values
  fields: FormWizard.Fields
  nonResiUsageTypes?: ReferenceData[]
  serviceTypes?: ReferenceData[]
  serviceFamilyTypes?: ReferenceData[]
  feComponents?: {
    header?: string
    footer?: string
    cssIncludes?: string[]
    jsIncludes?: string[]
    meta?: FeComponentsMeta
  }
}

type TypedLocals = Partial<AllLocals>

interface PaginationLocals {
  totalPages: number
  pageSize: number
  currentPage: number
  totalRows: number
  rowCount: number
  hrefTemplate: string
}

export declare module 'express' {
  interface Response {
    locals: TypedLocals
  }
}
export declare global {
  namespace Express {
    interface User {
      activeCaseload?: {
        id: string
        name: string
      }
      authSource: string
      caseloads?: {
        id: string
        name: string
      }[]
      displayName?: string
      name?: string
      staffId?: number
      token: string
      userId?: string
      username: string
      userRoles?: string[]
    }

    interface Flash {
      title: string
      content: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
      services?: Services
      flash(message: string): Flash[]
      flash(type: string, message: Flash): Flash[]
      canAccess: (permission: string) => boolean
      featureFlags?: (typeof config)['featureFlags']
    }

    interface Locals {
      user?: HmppsUser
    }
  }
}
