describe('Buy Flow — end-to-end with value assertions', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  function getPlayerPrice() {
    return cy
      .get('[data-testid="player-price"]')
      .find('[class*="price-value"]')
      .invoke('text')
      .then((text) => parseFloat(text.replace(/[^0-9.]/g, '')));
  }

  function setShareInput(value) {
    cy.get('[data-testid="form-input"]').type(`{selectall}${value}`);
  }

  it('buys shares and verifies portfolio shows correct share count and computed value', () => {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');

    getPlayerPrice().then((price) => {
      expect(price).to.be.greaterThan(0);

      setShareInput('3');

      cy.get('[data-testid="order-total"]')
        .invoke('text')
        .then((totalText) => {
          const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
          expect(total).to.be.closeTo(price * 3, 0.02);
        });

      cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
      cy.get('[data-testid="toast"]').should('be.visible');

      cy.get('[data-testid="holdings-card"]').within(() => {
        cy.contains('Shares').should('exist');
      });

      cy.get('nav a[href="/portfolio"]').click();
      cy.get('[data-testid="holdings-list"]').should('exist');

      cy.get('[data-testid="holding-row"]')
        .contains('Patrick Mahomes')
        .closest('[data-testid="holding-row"]')
        .within(() => {
          cy.get('[data-testid="holding-shares"]')
            .invoke('text')
            .then((sharesText) => {
              const shares = parseInt(sharesText, 10);
              expect(shares).to.be.at.least(3);
            });

          cy.get('[data-testid="holding-value"]')
            .invoke('text')
            .then((valueText) => {
              const holdingValue = parseFloat(valueText.replace(/[^0-9.]/g, ''));
              expect(holdingValue).to.be.greaterThan(0);
            });
        });

      cy.get('[data-testid="summary-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="summary-label"]').should('contain.text', 'Total Value');
          cy.get('[data-testid="summary-value"]')
            .invoke('text')
            .then((totalText) => {
              const totalValue = parseFloat(totalText.replace(/[,$]/g, ''));
              expect(totalValue).to.be.greaterThan(5000);
            });
        });
    });
  });

  it('buys then sells shares and verifies correct portfolio update', () => {
    cy.visit('/player/mahomes');
    cy.get('[data-testid="player-detail-page"]').should('exist');

    getPlayerPrice().then((price) => {
      setShareInput('5');
      cy.get('[data-testid="trade-button"][data-variant="buy"]').click();
      cy.get('[data-testid="toast"]').should('be.visible');
      cy.get('[data-testid="toast"]').should('not.exist');

      cy.get('[data-testid="trading-tab"]').contains('Sell').click();
      cy.get('[data-testid="form-input"]').type('{selectall}2');
      cy.get('[data-testid="trade-button"][data-variant="sell"]').click();
      cy.get('[data-testid="toast"]').should('be.visible');

      cy.get('nav a[href="/portfolio"]').click();
      cy.get('[data-testid="holding-row"]')
        .contains('Patrick Mahomes')
        .closest('[data-testid="holding-row"]')
        .within(() => {
          cy.get('[data-testid="holding-shares"]')
            .invoke('text')
            .then((sharesText) => {
              const shares = parseInt(sharesText, 10);
              expect(shares).to.be.at.least(3);
            });
        });

      cy.get('[data-testid="summary-card"]')
        .contains('Cash')
        .closest('[data-testid="summary-card"]')
        .find('[data-testid="summary-value"]')
        .invoke('text')
        .then((cashText) => {
          const cashValue = parseFloat(cashText.replace(/[,$]/g, ''));
          expect(cashValue).to.be.greaterThan(0);
          expect(cashValue).to.be.lessThan(10000);
        });
    });
  });
});
