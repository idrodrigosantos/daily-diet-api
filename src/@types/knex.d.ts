// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex';

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string;
      name: string;
      email: string;
      created_at: string;
      session_id?: string;
    };
    meals: {
      id: string;
      name: string;
      description?: string;
      created_at: string;
      is_diet: boolean;
      session_id?: string;
    };
  }
}
