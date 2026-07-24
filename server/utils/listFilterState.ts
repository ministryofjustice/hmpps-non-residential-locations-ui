import { Request } from 'express'

export const ALL_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED']

// Only active locations are shown until the user asks for more. Inactive and archived
// locations are still one click away via the status filter.
export const DEFAULT_STATUSES = ['ACTIVE']

export const DEFAULT_PAGE_SIZE = 35

const DEFAULT_SORT_KEY = 'localName'
const ALLOWED_SORT_KEYS = new Set([DEFAULT_SORT_KEY, 'status'])

export type FilterState = {
  statuses: string[]
  serviceTypes: string[]
  sort: string
  size: number
  localName: string | null
}

// The part of the filter state remembered for the duration of the user's session. The page
// number and page size are deliberately left out: the list may well have changed while the
// user was editing a location, so they go back to the first page at the default size.
export type RememberedFilterState = Pick<FilterState, 'statuses' | 'serviceTypes' | 'sort' | 'localName'>

export function buildQueryString(state: FilterState, overrides: Partial<{ page: number | null }> = {}): string {
  const parts: string[] = []

  if (state.statuses.length === 0) {
    parts.push('status=NONE')
  } else {
    state.statuses.forEach(s => parts.push(`status=${encodeURIComponent(s)}`))
  }

  state.serviceTypes.forEach(s => parts.push(`serviceType=${encodeURIComponent(s)}`))

  if (state.sort) parts.push(`sort=${state.sort}`)
  if (state.size) parts.push(`size=${state.size}`)
  if (state.localName) parts.push(`localName=${encodeURIComponent(state.localName)}`)

  if (overrides.page !== null && overrides.page !== undefined) {
    parts.push(`page=${overrides.page}`)
  }

  return `?${parts.join('&')}`
}

/**
 * When sorting by status, add a secondary sort by local name so locations stay in
 * alphabetical order within each status.
 */
export function apiSortParam(sort: string): string | string[] {
  const [sortKey] = sort.split(',')
  return sortKey === 'status' ? [sort, `${DEFAULT_SORT_KEY},asc`] : sort
}

function parseStatuses(status: unknown): string[] {
  // status=NONE means the user explicitly cleared every status filter
  if (status === undefined) return DEFAULT_STATUSES
  if (status === 'NONE') return []
  if (Array.isArray(status)) return (status as string[]).filter(s => s !== 'NONE')
  return [status as string]
}

function parseServiceTypes(serviceType: unknown): string[] {
  if (serviceType === undefined) return []
  if (Array.isArray(serviceType)) return (serviceType as string[]).filter(s => s && s !== 'ALL')
  if (serviceType === '' || serviceType === 'ALL') return []
  return [serviceType as string]
}

function parseSort(sort: unknown): string {
  const rawSort = Array.isArray(sort) ? sort[0] : sort
  const [requestedKey, requestedDirection] = typeof rawSort === 'string' ? rawSort.split(',') : []
  const sortKey = ALLOWED_SORT_KEYS.has(requestedKey) ? requestedKey : DEFAULT_SORT_KEY
  const sortDirection = requestedDirection === 'desc' ? 'desc' : 'asc'
  return `${sortKey},${sortDirection}`
}

function parseQuery(query: Request['query']): FilterState {
  const { status, sort, localName, serviceType, size } = query

  return {
    statuses: parseStatuses(status),
    serviceTypes: parseServiceTypes(serviceType),
    sort: parseSort(sort),
    size: size ? Number(size) : DEFAULT_PAGE_SIZE,
    localName: localName === undefined ? null : (localName as string),
  }
}

/**
 * The filter state for this request, remembering the user's last choices for the duration of
 * their session. A request carrying no query parameters at all is a return to the list -
 * whether by Cancel, Back, the breadcrumb or a fresh navigation - so the remembered filters
 * are re-applied. Any request that does carry query parameters is the user expressing a new
 * choice, so it is parsed as-is and becomes the new memory.
 */
export default function resolveFilterState(req: Request, prisonId: string): FilterState {
  const remembered = req.session.nonResidentialListFilters?.[prisonId]

  if (remembered && Object.keys(req.query).length === 0) {
    return { ...remembered, size: DEFAULT_PAGE_SIZE }
  }

  const filterState = parseQuery(req.query)
  const { statuses, serviceTypes, sort, localName } = filterState

  req.session.nonResidentialListFilters = {
    ...req.session.nonResidentialListFilters,
    [prisonId]: { statuses, serviceTypes, sort, localName },
  }

  return filterState
}
