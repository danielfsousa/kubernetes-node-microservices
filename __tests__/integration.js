const request = require('supertest')
const app = require('../src/app')

test('GET /status/ready', () =>
  request(app)
    .get('/status/ready')
    .expect(200))
