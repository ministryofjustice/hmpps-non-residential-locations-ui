import { type NextFunction, type Request, type Response } from 'express'
import logger from '../../logger'

/**
 * Query parameters DPS adds to the return url after a user changes their active caseload via the
 * header switcher (CDPS-2054). DPS only adds them for services that ask for them, which we do in
 * `FeComponentsClient`. They are a hint that the url may describe the prison the user has just left,
 * nothing more. Anyone can put them in a url, so the prison we act on comes from the user's active
 * caseload, never from their values.
 */
export const CASELOAD_SWITCH_PARAMS = ['caseload-switched-from', 'caseload-switched-to'] as const

/**
 * Sends the user to the list for the caseload they have just switched to, and takes the parameters
 * back out of the address bar.
 *
 * We cannot work this out for ourselves: a request for /prison/BFI looks identical whether the user
 * has just switched to Cardiff or deliberately followed a link to Bristol, which they still have
 * access to. Without the parameters we would re-render Bristol under a header showing Cardiff.
 *
 * Mount after `prisonId` is on res.locals and before `validateCaseload()`. Redirecting someone to
 * their own active caseload is always safe, and the redirected request runs the full chain anyway.
 */
export default function handleCaseloadChange() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!CASELOAD_SWITCH_PARAMS.some(param => param in req.query)) return next()

    const activeCaseloadId = res.locals.user?.activeCaseload?.id
    const { prisonId } = res.locals

    if (activeCaseloadId && activeCaseloadId !== prisonId) {
      logger.info(`Caseload changed to ${activeCaseloadId}, redirecting from ${prisonId}`)
      // Keep the sticky prison used by the add-location journey in step with the switch
      req.session.prisonId = activeCaseloadId
      // Drop the query string entirely: it describes the prison being left, and remembered filters
      // are stored per prison, so the new prison gets its own or the defaults.
      return res.redirect(`/prison/${activeCaseloadId}`)
    }

    return res.redirect(urlWithoutSwitchParams(req))
  }
}

/** The requested url with the switch parameters removed, so the redirect cannot carry them onwards */
function urlWithoutSwitchParams(req: Request): string {
  const base = 'http://relative.invalid'
  const url = new URL(req.originalUrl, base)
  CASELOAD_SWITCH_PARAMS.forEach(param => url.searchParams.delete(param))
  return `${url.pathname}${url.search}`
}
