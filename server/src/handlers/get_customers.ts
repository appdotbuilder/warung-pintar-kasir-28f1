
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer } from '../schema';
import { asc } from 'drizzle-orm';

export async function getCustomers(): Promise<Customer[]> {
  try {
    const result = await db.select()
      .from(customersTable)
      .orderBy(asc(customersTable.name))
      .execute();

    return result;
  } catch (error) {
    console.error('Get customers failed:', error);
    throw error;
  }
}
