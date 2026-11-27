import express from 'express'
import request from 'supertest'
import config from '../config'
import setUpWebSession from '../middleware/setUpWebSession'
import type { Services } from '../services'
import LocationsService from '../services/locationsService'
import routes from './index'

jest.mock('../services/locationsService')

describe('GET /accessibility-statement', () => {
  it('redirects to the residential locations accessibility statement', async () => {
    jest.replaceProperty(config.services, 'residentialLocations', 'https://residential.example.com')
    try {
      const app = express()
      const locationsService = new LocationsService(null)
      app.use(setUpWebSession())
      app.use((req, res, next) => {
        req.flash = jest.fn()
        next()
      })
      app.use(routes({ locationsService } as Services))

      await request(app)
        .get('/accessibility-statement')
        .expect(302)
        .expect('Location', 'https://residential.example.com/accessibility-statement')
    } finally {
      jest.restoreAllMocks()
    }
  })
})
