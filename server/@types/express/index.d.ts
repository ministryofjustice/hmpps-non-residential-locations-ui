import { HmppsUser } from '../../interfaces/hmppsUser'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    systemToken: string
  }
}
interface TypedLocals {
  stack?: string
  status?: number
  message?: string
  breadcrumbs?: {
    title: string
    href: string
  }[]
  canAccess?: (permission: string) => boolean
  cspNonce?: string
  user?: HmppsUser
  paginationLocals?: PaginationLocals
}

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
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
      canAccess: (permission: string) => boolean
      featureFlags?: (typeof config)['featureFlags']
    }

    interface Locals {
      user?: HmppsUser
    }
  }
}
