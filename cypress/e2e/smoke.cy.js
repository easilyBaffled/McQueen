describe('Smoke Test', () => {
  it('loads the homepage', () => {
    cy.visit('/');
    cy.get('body').should('be.visible');
  });

  it('displays the bottom navigation', () => {
    cy.visit('/');
    cy.get('nav').should('exist');
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
