const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../db/client');
const app = require('../server');

describe('Webhook endpoint', () => {
  test('almacena evento POST y responde 200', async () => {
    const payload = { entry: [{ id: '123', changes: [] }] };
    const response = await request(app).post('/webhook').send(payload);
    expect(response.status).toBe(200);
    const db = openDatabase();
    const row = await db.get('SELECT * FROM webhook_events ORDER BY id DESC LIMIT 1');
    await db.close();
    expect(row).toBeDefined();
    expect(row.type).toBe('meta_webhook');
  });
});
