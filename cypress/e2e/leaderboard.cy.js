describe('Leaderboard Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
    cy.visit('/leaderboard');
  });

  // TC-LB-001
  it('renders the leaderboard table', () => {
    cy.get('[class*="leaderboard-table"]').should('exist');
    cy.get('[class*="table-row"]').should('have.length.gte', 10);
    cy.get('[class*="table-row"]')
      .first()
      .within(() => {
        cy.get('[class*="col-trader"]').should('exist');
        cy.get('[class*="col-value"]').should('contain.text', '$');
        cy.get('[class*="col-gain"]').should('contain.text', '%');
      });
  });

  // TC-LB-002
  it('shows medal icons for top 3', () => {
    cy.get('[class*="table-row"]').eq(0).should('contain.text', '🥇');
    cy.get('[class*="table-row"]').eq(1).should('contain.text', '🥈');
    cy.get('[class*="table-row"]').eq(2).should('contain.text', '🥉');
  });

  // TC-LB-003
  it('shows user rank card', () => {
    cy.get('[class*="user-rank-card"]').should('exist');
    cy.get('[class*="rank-badge"]').should('contain.text', '#');
    cy.get('[class*="rank-value"]').should('contain.text', '$');
  });

  // TC-LB-004
  it('shows user row in the rankings', () => {
    cy.get('[class*="user-row"]').should('exist');
    cy.get('[class*="user-row"]').should('contain.text', 'You');
  });

  // TC-LB-006
  it('color-codes gain percentages', () => {
    cy.get('.text-up').should('have.length.greaterThan', 0);
  });
});
