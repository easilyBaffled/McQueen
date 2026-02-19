describe('Timeline Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
    cy.visit('/');
  });

  // TC-TL-001
  it('loads with timeline events', () => {
    cy.get('[data-testid="timeline-event"]').should('have.length.greaterThan', 0);
    cy.get('[data-testid="timeline-event"]')
      .first()
      .within(() => {
        cy.get('[data-testid="timeline-event-content"]').should('exist');
      });
  });

  // TC-TL-002
  it('filters events by type', () => {
    cy.get('[data-testid="filter-select"]').first().select('news');
    cy.get('[data-testid="timeline-event"]').should('have.length.greaterThan', 0);

    cy.get('[data-testid="filter-select"]').first().select('all');
    cy.get('[data-testid="timeline-event"]').should('have.length.greaterThan', 0);
  });

  // TC-TL-003
  it('filters events by magnitude', () => {
    cy.get('[data-testid="timeline-event"]').then(($allEvents) => {
      const allCount = $allEvents.length;
      cy.get('[data-testid="filter-select"]').eq(1).select('major');
      cy.get('[data-testid="timeline-event"]').should('have.length.lte', allCount);
    });
  });

  // TC-TL-004
  it('searches for players by name', () => {
    cy.get('[data-testid="search-input"]').type('Mahomes');
    cy.get('[data-testid="timeline-track"]').should('contain.text', 'Mahomes');
    cy.get('[data-testid="timeline-event"]').should('have.length.greaterThan', 0);

    cy.get('[data-testid="search-input"]').clear();
    cy.get('[data-testid="timeline-event"]').should('have.length.greaterThan', 0);
  });

  // TC-TL-005
  it('expands and collapses an event', () => {
    cy.get('[data-testid="timeline-event"]').first().click();
    cy.get('[data-testid="inline-trade-widget"]').should('be.visible');

    cy.get('[data-testid="timeline-event"]').first().click();
    cy.get('[data-testid="inline-trade-widget"]').should('not.exist');
  });

  // TC-TL-006
  it('buys shares from the timeline', () => {
    cy.get('[data-testid="timeline-event"]').first().click();
    cy.get('[data-testid="inline-trade-widget"]').should('be.visible');
    cy.get('[data-testid="inline-trade-widget"] [data-testid="trade-btn"]').contains('Buy').click();
    cy.get('[data-testid="toast"]').should('be.visible');
  });

  // TC-TL-007
  it('sells shares from the timeline', () => {
    // The midweek scenario starts with holdings - buy first to ensure
    cy.get('[data-testid="timeline-event"]').first().click();
    cy.get('[data-testid="inline-trade-widget"] [data-testid="trade-btn"]').contains('Buy').click();
    cy.get('[data-testid="toast"]').should('be.visible');

    // Now try to sell
    cy.get('[data-testid="timeline-event"]').first().click();
    cy.get('[data-testid="inline-trade-widget"] [data-testid="trade-btn"]').contains('Sell').click();
  });

  // TC-TL-008
  it('shows empty state for no-match search', () => {
    cy.get('[data-testid="search-input"]').type('ZZZZZ_NO_MATCH');
    cy.get('[data-testid="timeline-event"]').should('not.exist');
  });

  // TC-TL-009
  it('navigates to player detail from event badge', () => {
    cy.get('[data-testid="timeline-event"]')
      .first()
      .within(() => {
        cy.get('a[href*="/player/"]').first().click();
      });
    cy.url().should('include', '/player/');
  });
});
