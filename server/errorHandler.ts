import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'

export default function createErrorHandler(production: boolean) {
  return (error: HTTPError, req: Request, res: Response, next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    const errorStatus = error.status

    if (error.status === 401 || error.status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    if (!production) {
      res.locals.message = error.message
      res.locals.status = errorStatus
      res.locals.stack = production ? null : error.stack
      res.locals.errorText = error.text
    }

    if (errorStatus === 404) {
      res.status(404)
      return res.render('pages/errors/404', { production })
    }

    res.status(error.status || 500)

    return res.render('pages/error')
  }
}
