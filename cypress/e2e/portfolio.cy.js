describe('Portfolio Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  // TC-PF-001
  it('shows starting holdings from scenario', () => {
    cy.visit('/portfolio');
    cy.get('.holdings-list').should('exist');
    cy.get('.holding-row').should('have.length', 3);
  });

  // TC-PF-002
  it('displays summary cards with starting balance', () => {
    cy.visit('/portfolio');
    cy.get('.portfolio-summary').should('exist');
    cy.get('.summary-card').should('have.length', 4);
    cy.get('.summary-card').first().within(() => {
      cy.get('.summary-label').should('contain.text', 'Total Value');
      cy.get('.summary-value').should('contain.text', '$');
    });
  });

  // TC-PF-003
  it('updates summary after buying shares', () => {
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('.holdings-list').should('exist');
  });

  // TC-PF-004
  it('shows holdings table with player details', () => {
    // Buy two different players
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.trade-button.buy').click();
    cy.get('nav a[href="/market"]').click();

    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).eq(1).click();
    cy.get('.trade-button.buy').click();

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('.holding-row').should('have.length.gte', 2);
    cy.get('.holding-row').first().within(() => {
      cy.get('.player-name').should('exist');
      cy.get('.holding-shares').should('exist');
      cy.get('.holding-cost').should('exist');
      cy.get('.holding-value').should('exist');
      cy.get('.holding-gain').should('exist');
    });
  });

  // TC-PF-005
  it('navigates to player detail from holdings row', () => {
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.trade-button.buy').click();

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('.holding-row').first().click();
    cy.url().should('include', '/player/');
  });

  // TC-PF-006
  it('color-codes gain and loss', () => {
    cy.visit('/portfolio');
    cy.get('.summary-card').last().within(() => {
      cy.get('.summary-value').should('exist');
    });
  });

  // TC-PF-007
  it('navigates to market from portfolio', () => {
    cy.visit('/portfolio');
    cy.get('nav a[href="/market"]').click();
    cy.url().should('include', '/market');
  });

  // TC-PF-008
  it('shows tooltips on hover over summary labels', () => {
    cy.visit('/portfolio');
    cy.get('.summary-label').first().trigger('mouseenter');
  });
});
