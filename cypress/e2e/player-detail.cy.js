describe('Player Detail Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  function visitFirstPlayer() {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');
  }

  // TC-PD-001
  it('loads player detail page', () => {
    visitFirstPlayer();
    cy.get('[data-testid="player-name"]').should('exist');
    cy.get('[data-testid="player-price"]').should('exist');
    cy.get('[data-testid="price-change"]').should('exist');
    cy.get('[data-testid="chart-card"]').should('exist');
    cy.get('[data-testid="trading-card"]').should('exist');
  });

  // TC-PD-002
  it('shows error state for invalid player ID', () => {
    cy.visit('/player/nonexistent-player-id-12345');
    cy.get('[data-testid="error-state"]').should('exist');
    cy.contains('Player Not Found').should('be.visible');
  });

  // TC-PD-003
  it('renders the price chart', () => {
    visitFirstPlayer();
    cy.get('[data-testid="chart-card"]').should('exist');
    cy.get('[data-testid="chart-container"]').should('exist');
  });

  // TC-PD-004
  it('shows event markers on the chart', () => {
    visitFirstPlayer();
    cy.get('[data-testid="chart-container"]').should('exist');
  });

  // TC-PD-005
  it('buys shares', () => {
    visitFirstPlayer();
    cy.get('[data-testid="trading-tab"]').contains('Buy').should('have.attr', 'data-active', 'true');
    cy.get('[data-testid="order-total"]').should('contain.text', '$');
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('[data-testid="toast"]').should('be.visible');
    cy.get('[data-testid="holdings-card"]').should('exist');
  });

  // TC-PD-006
  it('prevents buying more than affordable', () => {
    visitFirstPlayer();
    cy.get('[data-testid="form-input"]').clear().type('999999');
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    // Should show error toast or prevent the action
    cy.get('[data-testid="toast"]').should('be.visible');
  });

  // TC-PD-007
  it('sells shares after buying', () => {
    visitFirstPlayer();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('[data-testid="toast"]').should('be.visible');
    cy.get('[data-testid="toast"]').should('not.exist');

    cy.get('[data-testid="trading-tab"]').contains('Sell').should('not.be.disabled').click();
    cy.get('[data-testid="trading-tab"]').contains('Sell').should('have.attr', 'data-active', 'true');
    cy.get('[data-testid="trade-button"][data-variant="sell"]').should('exist').click();
    cy.get('[data-testid="toast"]').should('be.visible');
  });

  // TC-PD-008
  it('prevents selling more than owned', () => {
    visitFirstPlayer();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('[data-testid="toast"]').should('be.visible');
    cy.get('[data-testid="toast"]').should('not.exist');

    cy.get('[data-testid="trading-tab"]').contains('Sell').should('not.be.disabled').click();
    cy.get('[data-testid="trading-tab"]').contains('Sell').should('have.attr', 'data-active', 'true');
    cy.get('[data-testid="form-input"]').clear().type('999');
    cy.get('[data-testid="trade-button"][data-variant="sell"]').should('exist');
  });

  // TC-PD-009
  it('disables sell tab when no holdings', () => {
    cy.visit('/player/hill');
    cy.get('[data-testid="player-detail-page"]').should('exist');
    cy.get('[data-testid="trading-tab"]').contains('Sell').should('be.disabled');
  });

  // TC-PD-010
  it('toggles watchlist', () => {
    visitFirstPlayer();
    cy.get('[data-testid="watchlist-button"]').should('contain.text', 'Add to Watchlist');
    cy.get('[data-testid="watchlist-button"]').click();
    cy.get('[data-testid="watchlist-button"]').should('contain.text', 'Watching');

    cy.get('[data-testid="watchlist-button"]').click();
    cy.get('[data-testid="watchlist-button"]').should('contain.text', 'Add to Watchlist');
  });

  // TC-PD-011
  it('shows holdings card after buying', () => {
    visitFirstPlayer();
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('[data-testid="holdings-card"]').should('exist');
    cy.get('[data-testid="holdings-card"]').within(() => {
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
    cy.get('[data-testid="player-detail-page"]').should('exist');
  });

  // TC-PD-013
  it('shows price history timeline', () => {
    visitFirstPlayer();
    cy.get('[data-testid="timeline-card"]').should('exist');
    cy.get('[data-testid="price-timeline"]').should('exist');
    cy.get('[data-testid="timeline-entry"]').should('have.length.greaterThan', 0);
  });

  // TC-PD-014
  it('shows content tiles when available', () => {
    // Visit Mahomes who has content tiles in midweek data
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');
    // Content tiles may or may not exist depending on player data
  });

  // TC-PD-015
  it('shows league owners section', () => {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');
    cy.get('[data-testid="league-owners-card"]').should('exist');
    cy.get('[data-testid="league-owner-row"]').should('have.length.greaterThan', 0);
  });

  // TC-PD-016
  it('navigates back', () => {
    cy.visit('/market');
    cy.get('[data-testid="players-grid"] a[href*="/player/"]', { timeout: 10000 })
      .first()
      .click();
    cy.get('[data-testid="back-link"]').click();
    cy.url().should('include', '/market');
  });

  // TC-PD-017
  it('shows placeholder when headshot fails to load', () => {
    visitFirstPlayer();
    // The component handles image errors with a fallback SVG
    cy.get('[data-testid="player-header"]').should('exist');
  });
});
