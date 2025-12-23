import Page, { PageElement } from '../page'

export default class IndexPage extends Page {
  constructor() {
    super('Check your answers')
  }

  static goTo = () => cy.visit('/check-your-answers')

  continueButton = (): PageElement => cy.get('button[type="submit"]')
}
