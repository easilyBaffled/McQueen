describe('Mission Page', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
    cy.visit('/mission');
  });

  // TC-MS-001
  it('loads the mission page with title and DailyMission', () => {
    cy.get('.mission-page').should('exist');
    cy.contains('Daily Predictions').should('be.visible');
    cy.get('.daily-mission').should('exist');
  });

  // TC-MS-002
  it('toggles the help panel', () => {
    // Help was marked as seen in skipOnboarding, so it should be hidden
    cy.get('.help-toggle').click();
    cy.get('.mission-help').should('be.visible');
    cy.contains('Pick Your Predictions').should('be.visible');

    cy.get('.help-toggle').click();
    cy.get('.mission-help').should('not.exist');
  });

  // TC-MS-003
  it('selects 3 risers', () => {
    cy.get('.selector-btn.up').then(($btns) => {
      for (let i = 0; i < Math.min(3, $btns.length); i++) {
        cy.wrap($btns[i]).click();
      }
    });
    cy.get('.picks-column.risers .pick-chip:not(.empty)').should(
      'have.length',
      3,
    );
  });

  // TC-MS-004
  it('selects 3 fallers', () => {
    cy.get('.selector-btn.down').then(($btns) => {
      for (let i = 0; i < Math.min(3, $btns.length); i++) {
        cy.wrap($btns[i]).click();
      }
    });
    cy.get('.picks-column.fallers .pick-chip:not(.empty)').should(
      'have.length',
      3,
    );
  });

  // TC-MS-005
  it('removes a pick', () => {
    cy.get('.selector-btn.up').first().click();
    cy.get('.picks-column.risers .pick-chip:not(.empty)').should(
      'have.length',
      1,
    );

    cy.get('.picks-column.risers .pick-chip:not(.empty) button')
      .first()
      .click();
    cy.get('.picks-column.risers .pick-chip:not(.empty)').should(
      'have.length',
      0,
    );
  });

  // TC-MS-006
  it('reveals results after selecting 6 picks', () => {
    // Select 3 risers (players 0, 1, 2)
    cy.get('.selector-btn.up').eq(0).click();
    cy.get('.selector-btn.up').eq(1).click();
    cy.get('.selector-btn.up').eq(2).click();
    // Select 3 fallers from different players (3, 4, 5)
    cy.get('.selector-btn.down').eq(3).click();
    cy.get('.selector-btn.down').eq(4).click();
    cy.get('.selector-btn.down').eq(5).click();
    cy.get('.reveal-button').should('not.be.disabled');
    cy.get('.reveal-button').click();
    cy.get('.mission-results').should('be.visible');
  });

  // TC-MS-007
  it('disables reveal button until 6 picks are made', () => {
    cy.get('.reveal-button').should('be.disabled');

    // Select only 2 risers
    cy.get('.selector-btn.up').then(($btns) => {
      cy.wrap($btns[0]).click();
      cy.wrap($btns[1]).click();
    });
    cy.get('.reveal-button').should('be.disabled');
  });

  // TC-MS-008
  it('resets picks with Play Again', () => {
    // Select 3 risers (players 0, 1, 2)
    cy.get('.selector-btn.up').eq(0).click();
    cy.get('.selector-btn.up').eq(1).click();
    cy.get('.selector-btn.up').eq(2).click();
    // Select 3 fallers from different players (3, 4, 5)
    cy.get('.selector-btn.down').eq(3).click();
    cy.get('.selector-btn.down').eq(4).click();
    cy.get('.selector-btn.down').eq(5).click();
    cy.get('.reveal-button').click();
    cy.get('.mission-results').should('be.visible');

    cy.get('.reset-button').click();
    cy.get('.mission-results').should('not.exist');
    cy.get('.player-selector').should('exist');
  });
});
