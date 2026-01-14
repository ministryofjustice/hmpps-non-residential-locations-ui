import express from 'express'
import wizard from 'hmpo-form-wizard'
import steps from './steps'
import fields from './fields'

import protectRoute from '../../middleware/protectRoute'

const router = express.Router({ mergeParams: true })

router.use(
  protectRoute('edit_non_resi'),
  wizard(steps, fields, {
    name: 'add-location',
    templatePath: 'pages/addLocation',
    csrf: false,
  }),
)

export default router
