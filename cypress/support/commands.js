Cypress.Commands.add('clearAppState', () => {
  cy.window().then((win) => {
    const keys = Object.keys(win.localStorage).filter((k) =>
      k.startsWith('mcqueen'),
    );
    keys.forEach((k) => win.localStorage.removeItem(k));
  });
});

Cypress.Commands.add('skipOnboarding', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('mcqueen-onboarded', 'true');
    win.localStorage.setItem('mcqueen-first-trade-seen', 'true');
    win.localStorage.setItem('mcqueen-welcome-dismissed', 'true');
    win.localStorage.setItem('mcqueen-mission-help-seen', 'true');
    win.localStorage.setItem('mcqueen-league-tooltip-seen', 'true');
  });
});

Cypress.Commands.add('getPlayerCards', () => {
  return cy.get('.player-card');
});
