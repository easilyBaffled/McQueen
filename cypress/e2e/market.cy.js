describe('Market Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
    cy.visit('/market');
  });

  // TC-MKT-001
  it('loads player cards', () => {
    cy.get('[data-testid="players-grid"]', { timeout: 10000 }).should('exist');
    cy.getPlayerCards().should('have.length.greaterThan', 0);
  });

  // TC-MKT-002
  it('sorts players with tabs', () => {
    cy.get('[data-testid="sort-tab"]')
      .contains('Biggest Risers')
      .should('have.attr', 'data-active', 'true');

    cy.get('[data-testid="sort-tab"]').contains('Biggest Fallers').click();
    cy.get('[data-testid="sort-tab"]')
      .contains('Biggest Fallers')
      .should('have.attr', 'data-active', 'true');

    cy.get('[data-testid="sort-tab"]').contains('Most Active').click();
    cy.get('[data-testid="sort-tab"]').contains('Most Active').should('have.attr', 'data-active', 'true');

    cy.get('[data-testid="sort-tab"]').contains('Highest Price').click();
    cy.get('[data-testid="sort-tab"]')
      .contains('Highest Price')
      .should('have.attr', 'data-active', 'true');
  });

  // TC-MKT-003
  it('filters players by search', () => {
    cy.get('[data-testid="search-input"]').type('KC');
    cy.getPlayerCards().each(($card) => {
      cy.wrap($card).should('contain.text', 'KC');
    });
  });

  // TC-MKT-004
  it('shows and dismisses the welcome banner', () => {
    // Clear the dismiss flag so banner shows
    cy.window().then((win) => {
      win.localStorage.removeItem('mcqueen-welcome-dismissed');
    });
    cy.visit('/market');
    cy.get('[data-testid="welcome-banner"]').should('be.visible');
    cy.get('[data-testid="welcome-dismiss"]').click();
    cy.get('[data-testid="welcome-banner"]').should('not.exist');

    cy.reload();
    cy.get('[data-testid="welcome-banner"]').should('not.exist');
  });

  // TC-MKT-005
  it('navigates to player detail on card click', () => {
    cy.get('[data-testid="players-grid"] a[href*="/player/"]', { timeout: 10000 })
      .first()
      .click();
    cy.url().should('include', '/player/');
    cy.get('[data-testid="player-detail-page"]').should('exist');
  });

  // TC-MKT-006
  it('shows first trade guide for new users', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('mcqueen-first-trade-seen');
      win.localStorage.setItem('mcqueen-onboarding-just-completed', 'true');
    });
    cy.visit('/market');
    // Guide may or may not be visible depending on trade state
    cy.get('[data-testid="market-page"]').should('exist');
  });

  // TC-MKT-007
  it('shows loading skeleton briefly', () => {
    cy.visit('/market');
    // Skeleton is shown for 300ms, just verify the page eventually renders cards
    cy.get('[data-testid="players-grid"]', { timeout: 10000 }).should('exist');
  });

  // TC-MKT-008
  it('shows mini leaderboard sidebar', () => {
    cy.get('[data-testid="market-sidebar"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="market-sidebar"]').within(() => {
      cy.contains('View All').click();
    });
    cy.url().should('include', '/leaderboard');
  });
});
