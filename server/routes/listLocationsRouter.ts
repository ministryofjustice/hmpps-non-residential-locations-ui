import { Router } from 'express'

import type { Services } from '../services'
import addBreadcrumb from '../middleware/addBreadcrumb'

export default function routes({ locationsService }: Services): Router {
  const router = Router()

  router.get('/', (req, res, next) => {
    return res.redirect(`prison/${res.locals.user.activeCaseload.id}`)
  })

  router.get(
    '/prison/:prisonId',
    addBreadcrumb({ title: 'View non-residential locations', href: '/' }),
    async (req, res, next) => {
      const { systemToken } = req.session
      const { prisonId } = req.params
      const { page } = req.query

      const pageNo = page && !Number.isNaN(Number(page)) ? Number(page) - 1 : null
      const { locations } = await locationsService.getNonResidentialLocations(
        systemToken,
        prisonId,
        pageNo ? `${pageNo}` : undefined,
      )
      const { pageable } = locations

      const rowFrom = pageable.pageSize * pageable.pageNumber + 1
      const rowTo = rowFrom + locations.numberOfElements - 1

      res.locals.paginationLocals = {
        totalPages: locations.totalPages,
        pageSize: pageable.pageSize,
        currentPage: pageable.pageNumber,
        totalRows: locations.totalElements,
        rowCount: locations.numberOfElements,
        rowFrom,
        rowTo,
        hrefTemplate: '?page={page}',
      }

      return res.render('pages/index', { ...res.locals, locations })
    },
  )

  return router
}
