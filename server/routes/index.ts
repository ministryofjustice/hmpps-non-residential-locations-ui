import { Router } from 'express'

import type { Services } from '../services'
import addBreadcrumb from '../middleware/addBreadcrumb'
import addServicesToRequest from '../middleware/addServicesToRequest'
import populateConstants from '../middleware/populateConstants'
import config from '../config'

import listLocationsRouter from './listLocationsRouter'
import editLocationRouter from './editLocation'
import addLocationRouter from './addLocation'
import archiveLocationRouter from './archiveLocation'

export default function routes(services: Services): Router {
  const router = Router()

  router.use(addServicesToRequest(services))
  router.use(populateConstants)

  // Convert flash messages to banner for templates
  router.use((req, res, next) => {
    const successFlash = req.flash('success')
    const successMojFlash = req.flash('successMojFlash')

    if (successMojFlash?.length) {
      // eslint-disable-next-line prefer-destructuring
      res.locals.mojBanner = successMojFlash[0]
    }

    res.locals.banner = {
      success: successFlash.length > 0 ? successFlash[0] : null,
    }
    next()
  })

  router.use(
    '/',
    addBreadcrumb({ title: 'Digital Prison Services', href: config.services.dps }),
    addBreadcrumb({ title: 'Locations', href: config.services.locationsLanding }),
    listLocationsRouter(services),
  )

  router.use('/location/:locationId/edit', editLocationRouter)
  router.use('/location/:locationId/archive', archiveLocationRouter)
  router.use('/add-location', addLocationRouter)

  return router
}
