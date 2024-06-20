import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { execSync } from 'child_process';
import request from 'supertest';
import { app } from '../src/app';

describe('Users routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all');
    execSync('npm run knex migrate:latest');
  });

  it('should be able to create a new user', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@email.com',
      })
      .expect(201);
  });
});
