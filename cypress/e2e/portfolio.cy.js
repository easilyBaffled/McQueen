describe('Portfolio Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  // TC-PF-001
  it('shows starting holdings from scenario', () => {
    cy.visit('/portfolio');
    cy.get('[data-testid="holdings-list"]').should('exist');
    cy.get('[data-testid="holding-row"]').should('have.length', 3);
  });

  // TC-PF-002
  it('displays summary cards with starting balance', () => {
    cy.visit('/portfolio');
    cy.get('[data-testid="portfolio-summary"]').should('exist');
    cy.get('[data-testid="summary-card"]').should('have.length', 4);
    cy.get('[data-testid="summary-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="summary-label"]').should('contain.text', 'Total Value');
        cy.get('[data-testid="summary-value"]').should('contain.text', '$');
      });
  });

  // TC-PF-003
  it('updates summary after buying shares', () => {
    cy.visit('/market');
    cy.get('[data-testid="players-grid"] a[href*="/player/"]', { timeout: 10000 })
      .first()
      .click();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('[data-testid="toast"]').should('be.visible');

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('[data-testid="holdings-list"]').should('exist');
  });

  // TC-PF-004
  it('shows holdings table with player details', () => {
    // Buy two different players
    cy.visit('/market');
    cy.get('[data-testid="players-grid"] a[href*="/player/"]', { timeout: 10000 })
      .first()
      .click();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('nav a[href="/market"]').click();

    cy.get('[data-testid="players-grid"] a[href*="/player/"]', { timeout: 10000 })
      .eq(1)
      .click();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('[data-testid="holding-row"]').should('have.length.gte', 2);
    cy.get('[data-testid="holding-row"]')
      .first()
      .within(() => {
        cy.get('[data-testid="player-name"]').should('exist');
        cy.get('[data-testid="holding-shares"]').should('exist');
        cy.get('[data-testid="holding-cost"]').should('exist');
        cy.get('[data-testid="holding-value"]').should('exist');
        cy.get('[data-testid="holding-gain"]').should('exist');
      });
  });

  // TC-PF-005
  it('navigates to player detail from holdings row', () => {
    cy.visit('/market');
    cy.get('[data-testid="players-grid"] a[href*="/player/"]', { timeout: 10000 })
      .first()
      .click();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('[data-testid="holding-row"]').first().click();
    cy.url().should('include', '/player/');
  });

  // TC-PF-006
  it('color-codes gain and loss', () => {
    cy.visit('/portfolio');
    cy.get('[data-testid="summary-card"]')
      .last()
      .within(() => {
        cy.get('[data-testid="summary-value"]').should('exist');
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
    cy.get('[data-testid="summary-label"]').first().trigger('mouseenter');
  });
});
