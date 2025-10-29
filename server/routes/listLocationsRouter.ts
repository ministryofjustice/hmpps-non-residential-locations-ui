import { Router } from 'express'

import type { Services } from '../services'
import { Location } from '../@types/locationsApi'
import addBreadcrumb from '../middleware/addBreadcrumb'
import config from '../config'

export default function routes({ locationsService }: Services): Router {
  const router = Router()

  router.get(
    '/',
    addBreadcrumb({ title: 'Digital Prison Services', href: config.services.dps }),
    addBreadcrumb({ title: 'Locations', href: config.services.locationsLanding }),
    addBreadcrumb({ title: 'View non-residential locations', href: '/' }),
    async (req, res, next) => {
      const { systemToken } = req.session
      const locations: Location[] = await locationsService.getNonResidentialLocations(
        systemToken,
        res.locals.user.activeCaseload.id,
      )
      return res.render('pages/index', { ...res.locals, locations })
    },
  )

  return router
}
