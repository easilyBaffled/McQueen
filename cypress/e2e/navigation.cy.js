describe('Layout and Navigation', () => {
  beforeEach(() => {
    cy.clearAppState();
    cy.skipOnboarding();
  });

  // TC-NAV-001
  it('renders all 6 navigation links', () => {
    cy.visit('/');
    cy.get('nav .nav-link').should('have.length', 6);
    cy.get('nav a[href="/"]').should('contain.text', 'Timeline');
    cy.get('nav a[href="/market"]').should('contain.text', 'Market');
    cy.get('nav a[href="/portfolio"]').should('contain.text', 'Portfolio');
    cy.get('nav a[href="/watchlist"]').should('contain.text', 'Watchlist');
    cy.get('nav a[href="/mission"]').should('contain.text', 'Mission');
    cy.get('nav a[href="/leaderboard"]').should('contain.text', 'Leaderboard');
  });

  // TC-NAV-002
  it('highlights the active route', () => {
    cy.visit('/market');
    cy.get('nav a[href="/market"]').should('have.class', 'active');
    cy.get('nav a[href="/portfolio"]').should('not.have.class', 'active');

    cy.get('nav a[href="/portfolio"]').click();
    cy.get('nav a[href="/portfolio"]').should('have.class', 'active');
    cy.get('nav a[href="/market"]').should('not.have.class', 'active');
  });

  // TC-NAV-003
  it('displays portfolio value in header', () => {
    cy.visit('/');
    cy.get('.balance-value').should('contain.text', '$');
    cy.get('.balance-label').should('contain.text', 'Total Value');
  });

  // TC-NAV-004
  it('shows scenario toggle in header', () => {
    cy.visit('/');
    cy.get('.header-center').should('exist');
  });

  // TC-NAV-005
  it('opens and closes the glossary modal', () => {
    cy.visit('/');
    cy.get('.help-button').click();
    cy.contains('Trading Terms').should('be.visible');
    cy.get('body').type('{esc}');
  });

  // TC-NAV-006
  it('scrolls to top on route change', () => {
    cy.visit('/');
    cy.scrollTo('bottom');
    cy.get('nav a[href="/market"]').click();
    cy.window().its('scrollY').should('equal', 0);
  });
});
