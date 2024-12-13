Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
  });
});

Cypress.Commands.add('createDeclaration', (declarationData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/declarations`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    body: declarationData
  });
}); 