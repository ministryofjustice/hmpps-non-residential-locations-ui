import { ApplicationInsights } from '@microsoft/applicationinsights-web'

if (window.applicationInsightsConnectionString) {
  const appInsights = new ApplicationInsights({
    config: {
      connectionString: window.applicationInsightsConnectionString,
    },
  })

  appInsights.addTelemetryInitializer(envelope => {
    // eslint-disable-next-line no-param-reassign
    envelope.tags['ai.cloud.role'] = window.applicationInsightsRoleName
  })

  appInsights.setAuthenticatedUserContext(window.authenticatedUser)
  appInsights.loadAppInsights()
  appInsights.trackPageView()
}
