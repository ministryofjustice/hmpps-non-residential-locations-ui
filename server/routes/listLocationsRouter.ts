import { Router } from 'express'

import type { Services } from '../services'
import { Location } from '../@types/locationsApi'

export default function routes({ locationsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    const { systemToken } = req.session
    const locations: Location[] = await locationsService.getNonResidentialLocations(
      systemToken,
      res.locals.user.activeCaseload.id,
    )
    return res.render('pages/index', { locations })
  })

  return router
}
