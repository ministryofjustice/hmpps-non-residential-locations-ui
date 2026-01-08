import { stubFor } from './wiremock'

const stubComponentsHealthPing = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components-api/health',
    },
    response: {
      status: 200,
    },
  })

const stubComponents = ({ userName = 'J. Smith' }: { userName?: string } = {}) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/components-api/components.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        header: {
          html: `<header class="govuk-header" data-module="govuk-header">
            <div class="govuk-header__container govuk-width-container">
              <div class="govuk-header__logo"><span class="govuk-header__logotype-text">GOV.UK</span></div>
              <div class="govuk-header__content">
                <a href="/" class="govuk-header__link govuk-header__service-name">HMPPS</a>
                <span data-qa="header-phase-banner" class="govuk-tag">TEST</span>
              </div>
              <div class="govuk-header__navigation">
                <a data-qa="header-user-name" href="/account-details">${userName}</a>
                <a data-qa="manageDetails" href="/account-details">Manage details</a>
                <a data-qa="signOut" href="/sign-out">Sign out</a>
              </div>
            </div>
          </header>`,
          javascript: [],
          css: [],
        },
        footer: {
          html: '<footer class="govuk-footer"></footer>',
          javascript: [],
          css: [],
        },
        meta: {
          activeCaseLoad: { caseLoadId: 'TST', description: 'Test' },
          caseLoads: [{ caseLoadId: 'TST', description: 'Test' }],
          services: [],
        },
      },
    },
  })

export default {
  stubComponentsHealthPing,
  stubComponents,
}
