const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      apiUrl: 'http://localhost:4000/api'
    }
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false
}); 