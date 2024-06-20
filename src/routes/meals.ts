import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { knex } from '../database';
import { randomUUID } from 'node:crypto';
import { checkSessionIdExists } from '../middlewares/check-session-id-exists';

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string().optional(),
      isDiet: z.boolean(),
    });

    const { name, description, isDiet } = createMealBodySchema.parse(
      request.body,
    );

    let sessionId = request.cookies.sessionId;
    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_diet: isDiet,
      session_id: sessionId,
    });

    return reply.status(201).send();
  });

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        isDiet: z.boolean(),
      });

      const { name, description, isDiet } = updateMealBodySchema.parse(
        request.body,
      );

      await knex('meals').where({ id }).update({
        name,
        description,
        is_diet: isDiet,
      });

      return reply.status(204).send();
    },
  );

  app.delete('/:id', async (request, reply) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getMealParamsSchema.parse(request.params);

    await knex('meals').where({ id }).delete();

    return reply.status(204).send();
  });

  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;

    const meals = await knex('meals').where('session_id', sessionId).select();

    return { meals };
  });

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getMealParamsSchema.parse(request.params);

    const { sessionId } = request.cookies;

    const meal = await knex('meals')
      .where({ session_id: sessionId, id })
      .first();

    return { meal };
  });

  app.get(
    '/metrics',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies;

      const totalNumberMeals = await knex('meals')
        .where({
          session_id: sessionId,
        })
        .count('id', { as: 'total' })
        .first();

      const totalNumberMealsWithDiet = await knex('meals')
        .where({
          session_id: sessionId,
          is_diet: true,
        })
        .count('id', { as: 'total' })
        .first();

      const totalNumberMealsWithoutDiet = await knex('meals')
        .where({
          session_id: sessionId,
          is_diet: false,
        })
        .count('id', { as: 'total' })
        .first();

      return {
        totalNumberMeals: totalNumberMeals?.total,
        totalNumberMealsWithDiet: totalNumberMealsWithDiet?.total,
        totalNumberMealsWithoutDiet: totalNumberMealsWithoutDiet?.total,
      };
    },
  );
}
