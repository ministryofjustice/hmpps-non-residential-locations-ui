import express from 'express'
import wizard from 'hmpo-form-wizard'
import steps from './steps'
import fields from './fields'

import protectRoute from '../../middleware/protectRoute'
import populateLocation from '../../middleware/populateLocation'

const router = express.Router({ mergeParams: true })

router.use(
  protectRoute('edit_non_resi'),
  populateLocation(),
  wizard(steps, fields, {
    name: 'edit-location',
    templatePath: 'pages/editLocation',
    csrf: false,
  }),
)

export default router
