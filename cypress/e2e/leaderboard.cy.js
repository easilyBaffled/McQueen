describe('Leaderboard Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
    cy.visit('/leaderboard');
  });

  // TC-LB-001
  it('renders the leaderboard table', () => {
    cy.get('[data-testid="leaderboard-table"]').should('exist');
    cy.get('[data-testid="table-row"]').should('have.length.gte', 10);
    cy.get('[data-testid="table-row"]')
      .first()
      .within(() => {
        cy.get('[data-testid="col-trader"]').should('exist');
        cy.get('[data-testid="col-value"]').should('contain.text', '$');
        cy.get('[data-testid="col-gain"]').should('contain.text', '%');
      });
  });

  // TC-LB-002
  it('shows medal icons for top 3', () => {
    cy.get('[data-testid="table-row"]').eq(0).should('contain.text', '🥇');
    cy.get('[data-testid="table-row"]').eq(1).should('contain.text', '🥈');
    cy.get('[data-testid="table-row"]').eq(2).should('contain.text', '🥉');
  });

  // TC-LB-003
  it('shows user rank card', () => {
    cy.get('[data-testid="user-rank-card"]').should('exist');
    cy.get('[data-testid="rank-badge"]').should('contain.text', '#');
    cy.get('[data-testid="rank-value"]').should('contain.text', '$');
  });

  // TC-LB-004
  it('shows user row in the rankings', () => {
    cy.get('[data-testid="table-row"][data-user]').should('exist');
    cy.get('[data-testid="table-row"][data-user]').should('contain.text', 'You');
  });

  // TC-LB-006
  it('color-codes gain percentages', () => {
    cy.get('[data-testid="col-gain"][aria-label*="Up"]').should('have.length.greaterThan', 0);
  });
});
