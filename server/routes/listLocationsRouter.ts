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
      const { locations } = await locationsService.getNonResidentialLocations(systemToken, prisonId)

      return res.render('pages/index', { ...res.locals, locations })
    },
  )

  return router
}
