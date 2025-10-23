import { SuperAgentRequest } from 'superagent'
import { stubFor } from './wiremock'

export default {
  stubManageUsers: (name: string = 'john smith'): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-users-api/users/\\w+',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          username: 'USER1',
          active: true,
          name,
        },
      },
    }),

  stubManageUsersMe: (name: string = 'john smith'): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-users-api/users/me',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          username: 'USER1',
          active: true,
          name,
        },
      },
    }),

  stubManageUsersMeRoles: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-users-api/users/me/roles',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [{ roleCode: 'SOME_USER_ROLE' }],
      },
    }),

  stubManageUsersMeCaseloads: (): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-users-api/users/me/caseloads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          username: 'USER1',
          active: true,
          accountType: 'GENERAL',
          activeCaseload: {
            id: 'TST',
            name: 'TEST (HMP)',
          },
          caseloads: [
            {
              id: 'TST',
              name: 'TEST (HMP)',
            },
          ],
        },
      },
    }),

  stubManageUsersByCaseload: (page: string = '0'): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        url: `/manage-users-api/prisonusers/search?inclusiveRoles=true&status=ACTIVE&caseload=TST&accessRoles=MANAGE_RES_LOCATIONS_OP_CAP&page=${page}&size=50`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          content: [{ username: 'joe1', email: 'joe1@test.com' }],
          totalPages: 1,
        },
      },
    }),

  stubManageUsersHealthPing: (httpStatus = 200): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/manage-users-api/health/ping',
      },
      response: {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { status: httpStatus === 200 ? 'UP' : 'DOWN' },
      },
    }),
}
