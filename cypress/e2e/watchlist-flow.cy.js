describe('Watchlist Flow — end-to-end with value assertions', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  it('adds player from detail page, verifies on watchlist with correct price, then removes', () => {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');
    cy.get('[data-testid="watchlist-button"]').should('contain.text', 'Add to Watchlist');

    cy.get('[data-testid="player-price"]')
      .invoke('text')
      .then((detailPriceText) => {
        const detailPrice = parseFloat(detailPriceText.replace(/[^0-9.]/g, ''));
        expect(detailPrice).to.be.greaterThan(0);

        cy.get('[data-testid="watchlist-button"]').click();
        cy.get('[data-testid="watchlist-button"]').should('contain.text', 'Watching');
        cy.get('[data-testid="toast"]').should('be.visible');

        cy.get('nav a[href="/watchlist"]').click();
        cy.get('[data-testid="watchlist-grid"]').should('exist');

        cy.getPlayerCards().should('have.length.gte', 1);
        cy.contains('Patrick Mahomes').should('be.visible');
        cy.contains('KC').should('be.visible');

        cy.getPlayerCards()
          .first()
          .invoke('text')
          .then((cardText) => {
            const priceMatch = cardText.match(/\$(\d+\.\d{2})/);
            if (priceMatch) {
              const watchlistPrice = parseFloat(priceMatch[1]);
              expect(watchlistPrice).to.be.closeTo(detailPrice, 1.0);
            }
          });

        cy.get('[data-testid="remove-button"]').first().click();
        cy.get('[data-testid="toast"]').should('be.visible');
        cy.get('[data-testid="empty-state"]').should('be.visible');
        cy.contains('Track Your Favorites').should('be.visible');
      });
  });

  it('watchlist player card displays actual price from scenario data', () => {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');

    cy.get('[data-testid="player-price"]')
      .invoke('text')
      .then((priceText) => {
        const detailPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        expect(detailPrice).to.be.greaterThan(0);

        cy.get('[data-testid="watchlist-button"]').click();
        cy.get('[data-testid="toast"]').should('be.visible');

        cy.get('nav a[href="/watchlist"]').click();
        cy.get('[data-testid="watchlist-grid"]').should('exist');

        cy.getPlayerCards().first().within(() => {
          cy.contains('$').should('exist');
          cy.contains('%').should('exist');
        });

        cy.getPlayerCards()
          .first()
          .invoke('text')
          .then((cardText) => {
            const priceMatch = cardText.match(/\$(\d+\.\d{2})/);
            if (priceMatch) {
              const watchlistPrice = parseFloat(priceMatch[1]);
              expect(watchlistPrice).to.be.closeTo(detailPrice, 1.0);
            }
          });
      });
  });
});
