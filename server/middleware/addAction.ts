import asyncMiddleware from './asyncMiddleware'

export default function addAction(action: {
  text: string
  href: string
  classes?: string
  preventDoubleClick?: boolean
}) {
  return asyncMiddleware((req, res, next) => {
    const newAction = { classes: 'govuk-button--secondary', ...action }

    res.locals.actions = res.locals.actions || []
    res.locals.actions.push(newAction)

    if (next) {
      next()
    }
  })
}
