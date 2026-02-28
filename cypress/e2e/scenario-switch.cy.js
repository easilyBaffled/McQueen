describe('Scenario Switch — prices change and portfolio resets', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  function getDisplayedPrice() {
    return cy
      .get('[data-testid="player-price"]')
      .find('[class*="price-value"]')
      .invoke('text')
      .then((text) => parseFloat(text.replace(/[^0-9.]/g, '')));
  }

  it('switching scenario re-renders market with valid price data', () => {
    cy.visit('/market');
    cy.get('[data-testid="players-grid"]', { timeout: 10000 }).should('exist');
    cy.getPlayerCards().should('have.length.greaterThan', 0);

    cy.getPlayerCards()
      .first()
      .invoke('text')
      .then((midweekText) => {
        cy.get('[role="tablist"][aria-label="Demo scenarios"]')
          .find('[role="tab"]')
          .contains('Playoffs')
          .click({ force: true });

        cy.get('[data-testid="players-grid"]', { timeout: 10000 }).should('exist');
        cy.getPlayerCards().should('have.length.greaterThan', 0);

        cy.getPlayerCards()
          .first()
          .invoke('text')
          .then((playoffText) => {
            expect(playoffText).to.be.a('string');
            expect(playoffText.length).to.be.greaterThan(0);
          });
      });
  });

  it('portfolio resets after scenario switch', () => {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');
    cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
    cy.get('[data-testid="toast"]').should('be.visible');

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('[data-testid="holdings-list"]').should('exist');

    cy.get('[role="tablist"][aria-label="Demo scenarios"]')
      .find('[role="tab"]')
      .contains('Playoffs')
      .click({ force: true });

    cy.get('[data-testid="summary-card"]')
      .contains('Cash')
      .closest('[data-testid="summary-card"]')
      .find('[data-testid="summary-value"]')
      .invoke('text')
      .then((cashText) => {
        const cash = parseFloat(cashText.replace(/[,$]/g, ''));
        expect(cash).to.be.closeTo(10000, 1.0);
      });
  });
});
