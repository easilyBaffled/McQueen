describe('Toast Notifications', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  // TC-TOAST-001
  it('shows success toast on buy action', () => {
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');
    cy.get('.toast-success').should('exist');
  });

  // TC-TOAST-002
  it('shows error toast when buying with insufficient funds', () => {
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.form-input').clear().type('999999');
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');
  });

  // TC-TOAST-003
  it('dismisses toast on close button click', () => {
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');
    cy.get('.toast-close').click();
    cy.get('.toast').should('not.exist');
  });
});
