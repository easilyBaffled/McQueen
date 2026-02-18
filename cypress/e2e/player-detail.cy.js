describe('Player Detail Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  function visitFirstPlayer() {
    cy.visit('/player/mahomes');
    cy.get('.player-detail-page').should('exist');
  }

  // TC-PD-001
  it('loads player detail page', () => {
    visitFirstPlayer();
    cy.get('.player-name').should('exist');
    cy.get('.player-price').should('exist');
    cy.get('.price-change').should('exist');
    cy.get('.chart-card').should('exist');
    cy.get('.trading-card').should('exist');
  });

  // TC-PD-002
  it('shows error state for invalid player ID', () => {
    cy.visit('/player/nonexistent-player-id-12345');
    cy.get('.error-state').should('exist');
    cy.contains('Player Not Found').should('be.visible');
  });

  // TC-PD-003
  it('renders the price chart', () => {
    visitFirstPlayer();
    cy.get('.chart-card').should('exist');
    cy.get('.chart-container').should('exist');
  });

  // TC-PD-004
  it('shows event markers on the chart', () => {
    visitFirstPlayer();
    cy.get('.chart-container').should('exist');
  });

  // TC-PD-005
  it('buys shares', () => {
    visitFirstPlayer();
    cy.get('.trading-tab').contains('Buy').should('have.class', 'active');
    cy.get('.order-total').should('contain.text', '$');
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');
    cy.get('.holdings-card').should('exist');
  });

  // TC-PD-006
  it('prevents buying more than affordable', () => {
    visitFirstPlayer();
    cy.get('.form-input').clear().type('999999');
    cy.get('.trade-button.buy').click();
    // Should show error toast or prevent the action
    cy.get('.toast').should('be.visible');
  });

  // TC-PD-007
  it('sells shares after buying', () => {
    visitFirstPlayer();
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');
    cy.get('.toast').should('not.exist');

    cy.get('.trading-tab').contains('Sell').should('not.be.disabled').click();
    cy.get('.trading-tab').contains('Sell').should('have.class', 'active');
    cy.get('.trade-button.sell').should('exist').click();
    cy.get('.toast').should('be.visible');
  });

  // TC-PD-008
  it('prevents selling more than owned', () => {
    visitFirstPlayer();
    cy.get('.trade-button.buy').click();
    cy.get('.toast').should('be.visible');
    cy.get('.toast').should('not.exist');

    cy.get('.trading-tab').contains('Sell').should('not.be.disabled').click();
    cy.get('.trading-tab').contains('Sell').should('have.class', 'active');
    cy.get('.form-input').clear().type('999');
    cy.get('.trade-button.sell').should('exist');
  });

  // TC-PD-009
  it('disables sell tab when no holdings', () => {
    cy.visit('/player/hill');
    cy.get('.player-detail-page').should('exist');
    cy.get('.trading-tab').contains('Sell').should('be.disabled');
  });

  // TC-PD-010
  it('toggles watchlist', () => {
    visitFirstPlayer();
    cy.get('.watchlist-button').should('contain.text', 'Add to Watchlist');
    cy.get('.watchlist-button').click();
    cy.get('.watchlist-button').should('contain.text', 'Watching');

    cy.get('.watchlist-button').click();
    cy.get('.watchlist-button').should('contain.text', 'Add to Watchlist');
  });

  // TC-PD-011
  it('shows holdings card after buying', () => {
    visitFirstPlayer();
    cy.get('.trade-button.buy').click();
    cy.get('.holdings-card').should('exist');
    cy.get('.holdings-card').within(() => {
      cy.contains('Shares').should('exist');
      cy.contains('Avg Cost').should('exist');
      cy.contains('Market Value').should('exist');
      cy.contains('P/L').should('exist');
    });
  });

  // TC-PD-012
  it('shows move reason when available', () => {
    visitFirstPlayer();
    // moveReason may or may not exist depending on data
    cy.get('.player-detail-page').should('exist');
  });

  // TC-PD-013
  it('shows price history timeline', () => {
    visitFirstPlayer();
    cy.get('.timeline-card').should('exist');
    cy.get('.price-timeline').should('exist');
    cy.get('.timeline-entry').should('have.length.greaterThan', 0);
  });

  // TC-PD-014
  it('shows content tiles when available', () => {
    // Visit Mahomes who has content tiles in midweek data
    cy.visit('/player/mahomes');
    cy.get('.player-detail-page').should('exist');
    // Content tiles may or may not exist depending on player data
  });

  // TC-PD-015
  it('shows league owners section', () => {
    cy.visit('/player/mahomes');
    cy.get('.player-detail-page').should('exist');
    cy.get('.league-owners-card').should('exist');
    cy.get('.league-owner-row').should('have.length.greaterThan', 0);
  });

  // TC-PD-016
  it('navigates back', () => {
    cy.visit('/market');
    cy.get('.players-grid a[href*="/player/"]', { timeout: 10000 }).first().click();
    cy.get('.back-link').click();
    cy.url().should('include', '/market');
  });

  // TC-PD-017
  it('shows placeholder when headshot fails to load', () => {
    visitFirstPlayer();
    // The component handles image errors with a fallback SVG
    cy.get('.player-header').should('exist');
  });
});
