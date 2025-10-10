import { Router } from 'express'

import type { Services } from '../services'
import { Page } from '../services/auditService'

export default function routes({ auditService, locationsService }: Services): Router {
  const router = Router()

  router.get('/', async (req, res, next) => {
    await auditService.logPageView(Page.EXAMPLE_PAGE, { who: res.locals.user.username, correlationId: req.id })

    const currentTime = await locationsService.getCurrentTime()
    return res.render('pages/index', { currentTime })
  })

  return router
}
