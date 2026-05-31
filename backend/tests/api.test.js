const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod, app, server;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.NODE_ENV = 'test';
  const mod = require('../server');
  app = mod.app;
  server = mod.server;
});

afterAll(async () => {
  if (server) server.close();
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

// ─── Auth ────────────────────────────────────────────────────────────────────
describe('Auth Endpoints', () => {
  const user = { name: 'Alice', email: 'alice@test.com', password: 'pass123' };
  let token;

  test('POST /register – success', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  test('POST /register – duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(400);
  });

  test('POST /login – success', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    token = res.body.token;
  });

  test('POST /login – wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('GET /me – authenticated', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  test('GET /me – unauthenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ─── Tasks ───────────────────────────────────────────────────────────────────
describe('Task Endpoints', () => {
  let token, taskId;
  const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
  const taskData = { title: 'Test Task', description: 'Desc', status: 'Pending', dueDate: futureDate, priority: 'High' };

  beforeAll(async () => {
    const email = `task_${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({ name: 'Bob', email, password: 'pass123' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'pass123' });
    token = res.body.token;
  });

  test('POST /tasks – create', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send(taskData);
    expect(res.status).toBe(201);
    taskId = res.body.task._id;
  });

  test('GET /tasks – list with progress', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.progress).toBeDefined();
  });

  test('GET /tasks/:id – single task', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.task._id).toBe(taskId);
  });

  test('PUT /tasks/:id – update', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`).send({ ...taskData, status: 'Completed' });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('Completed');
  });

  test('GET /tasks?status=Completed – filter', async () => {
    const res = await request(app).get('/api/tasks?status=Completed').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    res.body.tasks.forEach((t) => expect(t.status).toBe('Completed'));
  });

  test('GET /tasks?search=Test – search', async () => {
    const res = await request(app).get('/api/tasks?search=Test').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  test('GET /tasks/shared – shared tasks', async () => {
    const res = await request(app).get('/api/tasks/shared').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  test('DELETE /tasks/:id – delete', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ─── Notifications ───────────────────────────────────────────────────────────
describe('Notification Endpoints', () => {
  let token;

  beforeAll(async () => {
    const email = `notif_${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({ name: 'Carol', email, password: 'pass123' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'pass123' });
    token = res.body.token;
  });

  test('GET /notifications – returns list', async () => {
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(typeof res.body.unreadCount).toBe('number');
  });

  test('PUT /notifications/read-all – marks all read', async () => {
    const res = await request(app).put('/api/notifications/read-all').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ─── Analytics ───────────────────────────────────────────────────────────────
describe('Analytics Endpoints', () => {
  let token;
  const futureDate = new Date(Date.now() + 86400000 * 3).toISOString();

  beforeAll(async () => {
    const email = `analytics_${Date.now()}@test.com`;
    await request(app).post('/api/auth/register').send({ name: 'Dave', email, password: 'pass123' });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'pass123' });
    token = res.body.token;
    // Seed some tasks
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'A', dueDate: futureDate, status: 'Completed', priority: 'High' });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'B', dueDate: futureDate, status: 'Pending', priority: 'Low' });
  });

  test('GET /analytics/overview – returns stats', async () => {
    const res = await request(app).get('/api/analytics/overview').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.statusBreakdown).toBeDefined();
  });

  test('GET /analytics/trends?period=weekly', async () => {
    const res = await request(app).get('/api/analytics/trends?period=weekly').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.labels).toBeDefined();
    expect(res.body.data.created).toBeDefined();
  });

  test('GET /analytics/trends?period=monthly', async () => {
    const res = await request(app).get('/api/analytics/trends?period=monthly').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('monthly');
  });
});
