import './commands';

beforeEach(() => {
  cy.intercept('GET', '/espn-api/**', { body: { articles: [] } }).as('espnApi');
});
