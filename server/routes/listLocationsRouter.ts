import { Router } from 'express'

import type { Services } from '../services'
import logger from '../../logger'

export default function routes({ locationsService }: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    return res.redirect(`prison/${res.locals.user.activeCaseload.id}`)
  })

  router.get('/prison/:prisonId', async (req, res, next) => {
    const { systemToken } = req.session
    const { prisonId } = req.params

    try {
      logger.info(`Getting prison configuration for ${prisonId}`)
      await locationsService.getPrisonConfiguration(systemToken, prisonId)
    } catch (error) {
      logger.error(`Error getting prison configuration for ${prisonId}. Prison may not exist.  ${error}`)
      return next(error)
    }

    req.session.prisonId = prisonId

    const { page, status, sort, localName, serviceFamilyType } = req.query

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

    let selectedServiceFamilyType: string = null
    if (serviceFamilyType !== undefined) {
      selectedServiceFamilyType = serviceFamilyType as string
    }

    let wildcardName: string = null
    if (localName !== undefined) {
      wildcardName = localName as string
    }
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

    // Fetch counts for each status
    const [activeCount, inactiveCount, archivedCount] = await Promise.all([
      locationsService.getNonResidentialLocationCount(systemToken, prisonId, ['ACTIVE']),
      locationsService.getNonResidentialLocationCount(systemToken, prisonId, ['INACTIVE']),
      locationsService.getNonResidentialLocationCount(systemToken, prisonId, ['ARCHIVED']),
    ])

    const statusCounts = {
      ACTIVE: activeCount,
      INACTIVE: inactiveCount,
      ARCHIVED: archivedCount,
    }

    // If no statuses selected, show an empty result
    if (selectedStatuses.length === 0) {
      const emptyLocations = {
        content: [] as never[],
        numberOfElements: 0,
        pageable: { pageSize: 35, pageNumber: 0 },
        totalElements: 0,
        totalPages: 0,
      }

      res.locals.paginationLocals = {
        totalPages: 0,
        pageSize: 35,
        currentPage: 0,
        totalRows: 0,
        rowCount: 0,
        rowFrom: 0,
        rowTo: 0,
        hrefTemplate: `?status=NONE&sort=${sortParam}&page={page}`,
      }

      return res.render('pages/index', {
        ...res.locals,
        locations: emptyLocations,
        canEdit,
        selectedStatuses,
        statusCounts,
        sort: sortParam,
        sortHrefTemplate: `?status=NONE&sort={sortKey},{sortDirection}`,
      })
    }

    // Fetch locations for selected statuses
    const locationsResult = await locationsService.getNonResidentialLocations(
      systemToken,
      prisonId,
      pageNo ? `${pageNo}` : undefined,
      selectedStatuses,
      sortParamForApi,
      selectedServiceFamilyType,
      wildcardName,
    )

    const { locations } = locationsResult
    const { pageable } = locations

    const rowFrom = pageable.pageSize * pageable.pageNumber + 1
    const rowTo = rowFrom + locations.numberOfElements - 1

    // Build href template preserving status filter and sort
    const statusParams = selectedStatuses.map(s => `status=${s}`)
    const hrefTemplate = `?${[...statusParams, `sort=${sortParam}`, 'page={page}'].join('&')}`
    const sortHrefTemplate = `?${[...statusParams, 'sort={sortKey},{sortDirection}'].join('&')}`

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
      statusCounts,
      sort: sortParam,
      sortHrefTemplate,
    })
  })

  return router
}
