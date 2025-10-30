import { Router } from 'express'

import type { Services } from '../services'
import { Location } from '../@types/locationsApi'
import addBreadcrumb from '../middleware/addBreadcrumb'

export default function routes({ locationsService }: Services): Router {
  const router = Router()

  router.get('/', addBreadcrumb({ title: 'View non-residential locations', href: '/' }), async (req, res, next) => {
    const { systemToken } = req.session
    const locations: Location[] = await locationsService.getNonResidentialLocations(
      systemToken,
      res.locals.user.activeCaseload.id,
    )
    return res.render('pages/index', { ...res.locals, locations })
  })

  router.get(
    '/prison/:prisonId',
    addBreadcrumb({ title: 'View non-residential locations', href: '/' }),
    async (req, res, next) => {
      const { systemToken } = req.session
      const { prisonId } = req.params
      const locations: Location[] = await locationsService.getNonResidentialLocations(systemToken, prisonId)
      return res.render('pages/index', { ...res.locals, locations })
    },
  )

  return router
}
