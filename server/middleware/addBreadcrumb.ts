import asyncMiddleware from './asyncMiddleware'
import backUrl from '../utils/backUrl'

export default function addBreadcrumb(breadcrumb: { title: string; href: string; useBackUrl?: boolean }) {
  return asyncMiddleware((req, res, next) => {
    res.locals.breadcrumbs = res.locals.breadcrumbs || []
    const { title, href, useBackUrl } = breadcrumb

    if (useBackUrl) {
      const backHref = backUrl(req, { fallbackUrl: href })
      res.locals.breadcrumbs.push({ title, href: backHref })
    } else {
      res.locals.breadcrumbs.push(breadcrumb)
    }

    next()
  })
}
