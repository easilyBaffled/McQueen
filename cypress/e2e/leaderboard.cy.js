describe('Leaderboard Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
    cy.visit('/leaderboard');
  });

  // TC-LB-001
  it('renders the leaderboard table', () => {
    cy.get('.leaderboard-table').should('exist');
    cy.get('.table-row').should('have.length.gte', 10);
    cy.get('.table-row')
      .first()
      .within(() => {
        cy.get('.col-trader').should('exist');
        cy.get('.col-value').should('contain.text', '$');
        cy.get('.col-gain').should('contain.text', '%');
      });
  });

  // TC-LB-002
  it('shows medal icons for top 3', () => {
    cy.get('.table-row').eq(0).should('contain.text', '🥇');
    cy.get('.table-row').eq(1).should('contain.text', '🥈');
    cy.get('.table-row').eq(2).should('contain.text', '🥉');
  });

  // TC-LB-003
  it('shows user rank card', () => {
    cy.get('.user-rank-card').should('exist');
    cy.get('.rank-badge').should('contain.text', '#');
    cy.get('.rank-value').should('contain.text', '$');
  });

  // TC-LB-004
  it('shows user row below table when not in top 10', () => {
    // Default starting balance of $10,000 puts user outside top 10
    cy.get('.user-row').should('exist');
    cy.get('.table-divider').should('exist');
    cy.get('.user-row').should('contain.text', 'You');
  });

  // TC-LB-006
  it('color-codes gain percentages', () => {
    cy.get('.col-gain.text-up').should('have.length.greaterThan', 0);
  });
});
