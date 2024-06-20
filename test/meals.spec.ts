import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { execSync } from 'child_process';
import request from 'supertest';
import { app } from '../src/app';

describe('Meals routes', () => {
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

  it('should be able to create a new meal', async () => {
    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: true,
      })
      .expect(201);
  });

  it('should be able to update a meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: true,
      })
      .expect(201);

    const cookies = createMealResponse.get('Set-Cookie') || [];

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200);

    const mealId = listMealsResponse.body.meals[0].id;

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .send({
        name: 'Update Meal',
        description: 'Update meal description',
        isDiet: false,
      })
      .expect(204);
  });

  it('should be able to delete a meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: true,
      })
      .expect(201);

    const cookies = createMealResponse.get('Set-Cookie') || [];

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200);

    const mealId = listMealsResponse.body.meals[0].id;

    await request(app.server).delete(`/meals/${mealId}`).expect(204);
  });

  it('should be able to list all meals', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: true,
      })
      .expect(201);

    const cookies = createMealResponse.get('Set-Cookie') || [];

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200);

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name: 'New Meal',
        description: 'Meal description',
      }),
    ]);
  });

  it('should be able to a specific meal', async () => {
    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: true,
      })
      .expect(201);

    const cookies = createMealResponse.get('Set-Cookie') || [];

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200);

    const mealId = listMealsResponse.body.meals[0].id;

    const getMealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(getMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'New Meal',
        description: 'Meal description',
      }),
    );
  });

  it('should be able to a metrics', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@email.com',
      })
      .expect(201);

    const cookies = userResponse.get('Set-Cookie') || [];

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: true,
      })
      .set('Cookie', cookies)
      .expect(201);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: false,
      })
      .set('Cookie', cookies)
      .expect(201);

    await request(app.server)
      .post('/meals')
      .send({
        name: 'New Meal',
        description: 'Meal description',
        isDiet: false,
      })
      .set('Cookie', cookies)
      .expect(201);

    const metricsResponse = await request(app.server)
      .get('/meals/metrics')
      .set('Cookie', cookies)
      .expect(200);

    expect(metricsResponse.body).toEqual({
      totalNumberMeals: 3,
      totalNumberMealsWithDiet: 1,
      totalNumberMealsWithoutDiet: 2,
    });
  });
});
