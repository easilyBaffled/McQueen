describe('Onboarding', () => {
  beforeEach(() => {
    cy.clearAppState();
  });

  // TC-OB-001
  it('shows onboarding modal for new users', () => {
    cy.visit('/');
    cy.get('[data-testid="onboarding-overlay"]').should('be.visible');
    cy.get('[data-testid="onboarding-modal"]').should('be.visible');
  });

  // TC-OB-002
  it('progresses through all 6 steps', () => {
    cy.visit('/');
    cy.get('[data-testid="onboarding-modal"]').should('be.visible');

    for (let step = 0; step < 5; step++) {
      cy.get('[data-testid="next-button"]').click();
    }
    // On the last step, clicking next completes onboarding
    cy.get('[data-testid="next-button"]').click();
    cy.get('[data-testid="onboarding-overlay"]').should('not.exist');
  });

  // TC-OB-003
  it('supports back button navigation', () => {
    cy.visit('/');
    cy.get('[data-testid="onboarding-modal"]').should('be.visible');

    // On step 0, back button should not be visible
    cy.get('[data-testid="back-button"]').should('not.exist');

    // Go to step 2
    cy.get('[data-testid="next-button"]').click();
    cy.get('[data-testid="next-button"]').click();

    // Back button should be visible
    cy.get('[data-testid="back-button"]').should('be.visible');
    cy.get('[data-testid="back-button"]').click();
    // Should be back on step 1
    cy.get('[data-testid="step-dot"][data-active="true"]').should('exist');
  });

  // TC-OB-004
  it('allows skipping onboarding', () => {
    cy.visit('/');
    cy.get('[data-testid="onboarding-modal"]').should('be.visible');
    cy.get('[data-testid="skip-button"]').click();
    cy.get('[data-testid="onboarding-overlay"]').should('not.exist');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('mcqueen-onboarded')).to.equal('true');
    });
  });

  // TC-OB-005
  it('does not show again after completion', () => {
    cy.visit('/');
    cy.get('[data-testid="onboarding-modal"]').should('be.visible');
    cy.get('[data-testid="skip-button"]').click();
    cy.get('[data-testid="onboarding-overlay"]').should('not.exist');

    cy.reload();
    cy.get('[data-testid="onboarding-overlay"]').should('not.exist');
  });
});
