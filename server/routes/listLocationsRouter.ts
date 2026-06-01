import { Router } from 'express'

import type { Services } from '../services'
import logger from '../../logger'
import validateCaseload from '../middleware/validateCaseload'
import asyncMiddleware from '../middleware/asyncMiddleware'

const ALL_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED']

type FilterState = {
  statuses: string[]
  serviceFamilyTypes: string[]
  sort: string
  size: number
  localName: string | null
}

function buildQueryString(state: FilterState, overrides: Partial<{ page: number | null }> = {}): string {
  const parts: string[] = []

  if (state.statuses.length === 0) {
    parts.push('status=NONE')
  } else {
    state.statuses.forEach(s => parts.push(`status=${encodeURIComponent(s)}`))
  }

  state.serviceFamilyTypes.forEach(s => parts.push(`serviceFamilyType=${encodeURIComponent(s)}`))

  if (state.sort) parts.push(`sort=${state.sort}`)
  if (state.size) parts.push(`size=${state.size}`)
  if (state.localName) parts.push(`localName=${encodeURIComponent(state.localName)}`)

  if (overrides.page !== null && overrides.page !== undefined) {
    parts.push(`page=${overrides.page}`)
  }

  return `?${parts.join('&')}`
}

export default function routes({ locationsService }: Services): Router {
  const router = Router()

  router.get('/', (req, res) => {
    return res.redirect(`prison/${res.locals.user.activeCaseload.id}`)
  })

  router.get(
    '/prison/:prisonId',
    (req, res, next) => {
      res.locals.prisonId = req.params.prisonId
      next()
    },
    validateCaseload(),
    asyncMiddleware(async (req, res, next) => {
      const { systemToken } = req.session
      const { prisonId } = res.locals

      try {
        logger.info(`Getting prison configuration for ${prisonId}`)
        await locationsService.getPrisonConfiguration(systemToken, prisonId)
      } catch (error) {
        logger.error(`Error getting prison configuration for ${prisonId}. Prison may not exist.  ${error}`)
        return next(error)
      }

      req.session.prisonId = prisonId

      const { page, status, sort, localName, serviceFamilyType, size } = req.query

      const canEdit = req.canAccess('edit_non_resi')

      // Set breadcrumb based on permission
      res.locals.breadcrumbs = res.locals.breadcrumbs || []
      res.locals.title = canEdit ? 'Edit non-residential locations' : 'View non-residential locations'
      res.locals.breadcrumbs.push({
        title: canEdit ? 'Edit the list of non-residential locations' : 'View non-residential locations',
        href: '/',
      })

      // Parse status filter - default to ACTIVE and INACTIVE on first load
      // status=NONE means user explicitly cleared all filters
      const defaultStatuses = ['ACTIVE', 'INACTIVE']
      let selectedStatuses: string[]
      if (status === undefined) {
        selectedStatuses = defaultStatuses
      } else if (status === 'NONE') {
        selectedStatuses = []
      } else if (Array.isArray(status)) {
        selectedStatuses = (status as string[]).filter(s => s !== 'NONE')
      } else {
        selectedStatuses = [status as string]
      }

      // Parse service family type filter - empty means no filter (show all services)
      let selectedServiceFamilyTypes: string[]
      if (serviceFamilyType === undefined) {
        selectedServiceFamilyTypes = []
      } else if (Array.isArray(serviceFamilyType)) {
        selectedServiceFamilyTypes = (serviceFamilyType as string[]).filter(s => s && s !== 'ALL')
      } else if (serviceFamilyType === '' || serviceFamilyType === 'ALL') {
        selectedServiceFamilyTypes = []
      } else {
        selectedServiceFamilyTypes = [serviceFamilyType as string]
      }

      let wildcardName: string = null
      if (localName !== undefined) {
        wildcardName = localName as string
      }
      const pageSize = size ? Number(size) : 35

      const pageNo = page && !Number.isNaN(Number(page)) ? Number(page) - 1 : null

      const defaultSortKey = 'localName'
      const allowedSortKeys = new Set(['localName', 'status'])
      const rawSort = Array.isArray(sort) ? sort[0] : sort
      const [requestedKey, requestedDirection] = typeof rawSort === 'string' ? rawSort.split(',') : []
      const sortKey = allowedSortKeys.has(requestedKey) ? requestedKey : defaultSortKey
      const sortDirection = requestedDirection === 'desc' ? 'desc' : 'asc'
      const sortParam = `${sortKey},${sortDirection}`
      // When sorting by status, add a secondary sort by localName to maintain alphabetical order within each status
      const sortParamForApi: string | string[] =
        sortKey === 'status' ? [`${sortKey},${sortDirection}`, 'localName,asc'] : sortParam

      // Fetch service family types for the service filter
      const serviceFamilyTypes = await locationsService.getServiceFamilyTypes(systemToken)

      // Fetch counts for each status and each service family type in parallel
      const statusCountPromises = ALL_STATUSES.map(s =>
        locationsService.getNonResidentialLocationCount(systemToken, prisonId, [s]),
      )
      const serviceCountPromises = serviceFamilyTypes.map(family =>
        locationsService.getNonResidentialLocationCount(systemToken, prisonId, ALL_STATUSES, [family.key]),
      )

      const [statusCountValues, serviceCountValues] = await Promise.all([
        Promise.all(statusCountPromises),
        Promise.all(serviceCountPromises),
      ])

      const statusCounts = {
        ACTIVE: statusCountValues[0],
        INACTIVE: statusCountValues[1],
        ARCHIVED: statusCountValues[2],
      }

      const serviceFamilyOptions = serviceFamilyTypes.map((family, index) => ({
        key: family.key,
        description: family.description,
        count: serviceCountValues[index],
        checked: selectedServiceFamilyTypes.includes(family.key),
      }))

      const filterState: FilterState = {
        statuses: selectedStatuses,
        serviceFamilyTypes: selectedServiceFamilyTypes,
        sort: sortParam,
        size: pageSize,
        localName: wildcardName,
      }

      const statusLabels: Record<string, string> = {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        ARCHIVED: 'Archived',
      }

      const statusChips = selectedStatuses.map(s => ({
        label: statusLabels[s] || s,
        removeHref: buildQueryString({ ...filterState, statuses: selectedStatuses.filter(x => x !== s) }),
      }))

      const serviceChips = selectedServiceFamilyTypes.map(key => {
        const family = serviceFamilyTypes.find(f => f.key === key)
        return {
          label: family ? family.description : key,
          removeHref: buildQueryString({
            ...filterState,
            serviceFamilyTypes: selectedServiceFamilyTypes.filter(x => x !== key),
          }),
        }
      })

      const hasSelectedFilters = statusChips.length > 0 || serviceChips.length > 0
      const clearAllHref = buildQueryString({ ...filterState, statuses: [], serviceFamilyTypes: [] })

      // If no statuses selected, show an empty result
      if (selectedStatuses.length === 0) {
        const emptyLocations = {
          content: [] as never[],
          numberOfElements: 0,
          pageable: { pageSize, pageNumber: 0 },
          totalElements: 0,
          totalPages: 0,
        }

        res.locals.paginationLocals = {
          totalPages: 0,
          pageSize,
          currentPage: 0,
          totalRows: 0,
          rowCount: 0,
          rowFrom: 0,
          rowTo: 0,
          hrefTemplate: `${buildQueryString(filterState)}&page={page}`,
        }

        return res.render('pages/index', {
          ...res.locals,
          locations: emptyLocations,
          canEdit,
          selectedStatuses,
          selectedServiceFamilyTypes,
          statusCounts,
          serviceFamilyOptions,
          statusChips,
          serviceChips,
          hasSelectedFilters,
          clearAllHref,
          sort: sortParam,
          sortHrefTemplate: `${buildQueryString({ ...filterState, sort: '{sortKey},{sortDirection}' })}`,
          viewAllHref: null as string | null,
        })
      }

      // Fetch locations for selected statuses
      const locationsResult = await locationsService.getNonResidentialLocations(
        systemToken,
        prisonId,
        pageNo ? `${pageNo}` : undefined,
        selectedStatuses,
        sortParamForApi,
        selectedServiceFamilyTypes,
        wildcardName,
        pageSize,
      )

      const { locations } = locationsResult
      const { pageable } = locations

      const rowFrom = pageable.pageSize * pageable.pageNumber + 1
      const rowTo = rowFrom + locations.numberOfElements - 1

      // Build href template preserving status filter, service filter, and sort
      const hrefTemplate = `${buildQueryString(filterState)}&page={page}`
      const sortHrefTemplate = `${buildQueryString({ ...filterState, sort: '{sortKey},{sortDirection}' })}`
      const viewAllHref = buildQueryString({ ...filterState, size: locations.totalElements })

      res.locals.paginationLocals = {
        totalPages: locations.totalPages,
        pageSize: pageable.pageSize,
        currentPage: pageable.pageNumber,
        totalRows: locations.totalElements,
        rowCount: locations.numberOfElements,
        rowFrom,
        rowTo,
        hrefTemplate,
      }

      return res.render('pages/index', {
        ...res.locals,
        locations,
        canEdit,
        selectedStatuses,
        selectedServiceFamilyTypes,
        statusCounts,
        serviceFamilyOptions,
        statusChips,
        serviceChips,
        hasSelectedFilters,
        clearAllHref,
        sort: sortParam,
        sortHrefTemplate,
        viewAllHref,
      })
    }),
  )

  return router
}
