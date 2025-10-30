import { Router } from 'express'

import type { Services } from '../services'
import addBreadcrumb from '../middleware/addBreadcrumb'
import config from '../config'

import listLocationsRouter from './listLocationsRouter'

export default function routes(services: Services): Router {
  const router = Router()

  router.use(
    '/',
    addBreadcrumb({ title: 'Digital Prison Services', href: config.services.dps }),
    addBreadcrumb({ title: 'Locations', href: config.services.locationsLanding }),
    listLocationsRouter(services),
  )

  return router
}
