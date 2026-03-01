describe('Smoke Test', () => {
  it('loads the homepage', () => {
    cy.visit('/');
    cy.contains('McQUEEN').should('be.visible');
    cy.get('[data-testid="balance-value"]').should('contain.text', '$');
    cy.get('nav [data-testid="nav-link"]').should('have.length', 6);
  });

  it('displays the bottom navigation', () => {
    cy.visit('/');
    cy.get('nav').should('exist');
    cy.get('nav a[href="/"]').should('contain.text', 'Timeline');
    cy.get('nav a[href="/market"]').should('contain.text', 'Market');
    cy.get('nav a[href="/portfolio"]').should('contain.text', 'Portfolio');
    cy.get('nav a[href="/watchlist"]').should('contain.text', 'Watchlist');
    cy.get('nav a[href="/leaderboard"]').should('contain.text', 'Leaderboard');
  });

  it('navigates to the Market page', () => {
    cy.visit('/');
    cy.get('a[href="/market"]').first().click();
    cy.url().should('include', '/market');
  });

  it('navigates to the Portfolio page', () => {
    cy.visit('/');
    cy.get('a[href="/portfolio"]').first().click();
    cy.url().should('include', '/portfolio');
  });

  it('navigates to the Leaderboard page', () => {
    cy.visit('/');
    cy.get('a[href="/leaderboard"]').first().click();
    cy.url().should('include', '/leaderboard');
  });
});
