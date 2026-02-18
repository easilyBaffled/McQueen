describe('Watchlist Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  // TC-WL-001
  it('shows empty state when watchlist is empty', () => {
    cy.visit('/watchlist');
    cy.get('.empty-state').should('be.visible');
    cy.contains('Track Your Favorites').should('be.visible');
  });

  // TC-WL-002
  it('adds a player via quick add button', () => {
    cy.visit('/watchlist');
    cy.get('.quick-add-player').first().click();
    cy.get('.toast').should('be.visible');
    cy.get('.watchlist-grid').should('exist');
    cy.getPlayerCards().should('have.length', 1);
  });

  // TC-WL-003
  it('removes a player from the watchlist', () => {
    cy.visit('/watchlist');
    cy.get('.quick-add-player').first().click();
    cy.get('.watchlist-grid').should('exist');
    cy.get('.remove-button').first().click();
    cy.get('.toast').should('be.visible');
    cy.get('.empty-state').should('be.visible');
  });

  // TC-WL-004
  it('navigates to player detail from watchlist card', () => {
    cy.visit('/watchlist');
    cy.get('.quick-add-player').first().click();
    cy.get('.watchlist-card-wrapper a[href*="/player/"]').first().click();
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
    cy.get('.quick-add-player').first().click();
    cy.get('.watchlist-grid').should('exist');
    cy.getPlayerCards().should('have.length', 1);

    // Add second player from the player detail page
    cy.visit('/player/mahomes');
    cy.get('.watchlist-button').click();
    cy.get('.watchlist-button').should('contain.text', 'Watching');

    // Verify both persist after reload
    cy.visit('/watchlist');
    cy.getPlayerCards().should('have.length', 2);

    cy.reload();
    cy.getPlayerCards().should('have.length', 2);
  });
});
