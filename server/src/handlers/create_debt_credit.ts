
import { db } from '../db';
import { debtCreditsTable, customersTable } from '../db/schema';
import { type CreateDebtCreditInput, type DebtCredit } from '../schema';
import { eq } from 'drizzle-orm';

export const createDebtCredit = async (input: CreateDebtCreditInput): Promise<DebtCredit> => {
  try {
    // Validate that customer exists
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} not found`);
    }

    // Insert debt/credit record
    const result = await db.insert(debtCreditsTable)
      .values({
        customer_id: input.customer_id,
        type: input.type,
        amount: input.amount.toString(),
        remaining_amount: input.amount.toString(), // Initially full amount remains
        description: input.description,
        due_date: input.due_date,
        is_paid: false // Default to unpaid
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const debtCredit = result[0];
    return {
      ...debtCredit,
      amount: parseFloat(debtCredit.amount),
      remaining_amount: parseFloat(debtCredit.remaining_amount)
    };
  } catch (error) {
    console.error('Debt/Credit creation failed:', error);
    throw error;
  }
};
