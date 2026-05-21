const serverless = require('serverless-http');
const app = require('../src-backend/server');

module.exports = serverless(app);
