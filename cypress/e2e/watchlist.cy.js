describe('Watchlist Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  // TC-WL-001
  it('shows empty state when watchlist is empty', () => {
    cy.visit('/watchlist');
    cy.get('[data-testid="empty-state"]').should('be.visible');
    cy.contains('Track Your Favorites').should('be.visible');
  });

  // TC-WL-002
  it('adds a player via quick add button', () => {
    cy.visit('/watchlist');
    cy.get('[data-testid="quick-add-player"]').first().click();
    cy.get('[data-testid="toast"]').should('be.visible');
    cy.get('[data-testid="watchlist-grid"]').should('exist');
    cy.getPlayerCards().should('have.length', 1);
  });

  // TC-WL-003
  it('removes a player from the watchlist', () => {
    cy.visit('/watchlist');
    cy.get('[data-testid="quick-add-player"]').first().click();
    cy.get('[data-testid="watchlist-grid"]').should('exist');
    cy.get('[data-testid="remove-button"]').first().click();
    cy.get('[data-testid="toast"]').should('be.visible');
    cy.get('[data-testid="empty-state"]').should('be.visible');
  });

  // TC-WL-004
  it('navigates to player detail from watchlist card', () => {
    cy.visit('/watchlist');
    cy.get('[data-testid="quick-add-player"]').first().click();
    cy.get('[data-testid="watchlist-card-wrapper"] a[href*="/player/"]').first().click();
    cy.url().should('include', '/player/');
  });

  // TC-WL-005
  it('navigates to market from Browse All Players CTA', () => {
    cy.visit('/watchlist');
    cy.contains('Browse All Players').click();
    cy.url().should('include', '/market');
  });

  // TC-WL-006
  it('persists watchlist across reload', () => {
    // Add first player via quick-add
    cy.visit('/watchlist');
    cy.get('[data-testid="quick-add-player"]').first().click();
    cy.get('[data-testid="watchlist-grid"]').should('exist');
    cy.getPlayerCards().should('have.length', 1);

    // Add second player from the player detail page
    cy.visit('/player/mahomes');
    cy.get('[data-testid="watchlist-button"]').click();
    cy.get('[data-testid="watchlist-button"]').should('contain.text', 'Watching');

    // Verify both persist after reload
    cy.visit('/watchlist');
    cy.getPlayerCards().should('have.length', 2);

    cy.reload();
    cy.getPlayerCards().should('have.length', 2);
  });
});
