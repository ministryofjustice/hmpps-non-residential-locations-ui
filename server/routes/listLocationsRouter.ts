import { Router } from 'express'

import type { Services } from '../services'
import type { Location } from '../@types/locationsApi/locationsApiTypes'
import logger from '../../logger'
import deriveLocationHierarchy from '../utils/deriveLocationHierarchy'
import validateCaseload from '../middleware/validateCaseload'
import asyncMiddleware from '../middleware/asyncMiddleware'
import logPageView from '../middleware/logPageView'
import { Page } from '../services/auditService'
import resolveFilterState, { ALL_STATUSES, apiSortParam, buildQueryString } from '../utils/listFilterState'

export default function routes({ locationsService, auditService }: Services): Router {
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
    logPageView(auditService, Page.LIST_NON_RESIDENTIAL_LOCATIONS),
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

      const { page } = req.query

      const canEdit = req.canAccess('edit_non_resi')

      // Set breadcrumb based on permission
      res.locals.breadcrumbs = res.locals.breadcrumbs || []
      res.locals.title = canEdit ? 'Edit non-residential locations' : 'View non-residential locations'
      res.locals.breadcrumbs.push({
        title: canEdit ? 'Edit the list of non-residential locations' : 'View non-residential locations',
        href: '/',
      })

      // The filter state for this request, restoring the user's remembered filters when they
      // have come back to the list without asking for anything specific.
      const filterState = resolveFilterState(req, prisonId)
      const {
        statuses: selectedStatuses,
        serviceFamilyTypes: selectedServiceFamilyTypes,
        sort: sortParam,
        size: pageSize,
        localName: wildcardName,
      } = filterState

      const pageNo = page && !Number.isNaN(Number(page)) ? Number(page) - 1 : null
      const sortParamForApi = apiSortParam(sortParam)

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

      // Attach derived parent/hierarchy display strings so the locations table can show
      // which parent each (identically-named) child belongs to. Derived from the API's
      // structured `locationHierarchy` so the Nunjucks template stays presentation-only.
      //
      // A parent hidden from the list (MAPB-670) is shown to users as archived, even though its
      // real status stays ACTIVE for the sake of consuming services. Mapping the display status
      // here means the status tag and the "no available actions" branch in the table both fall
      // out naturally, with no special-casing in the template.
      const locationsWithHierarchy = {
        ...locations,
        content: (locations.content ?? []).map((item: Location) => ({
          ...item,
          ...deriveLocationHierarchy(item.locationHierarchy),
          status: item.hiddenFromList ? 'ARCHIVED' : item.status,
        })),
      }

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
        locations: locationsWithHierarchy,
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
