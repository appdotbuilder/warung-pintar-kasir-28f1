
import { db } from '../db';
import { debtCreditsTable, customersTable } from '../db/schema';
import { type DebtCredit } from '../schema';
import { eq, asc, desc } from 'drizzle-orm';

export async function getDebtCredits(): Promise<DebtCredit[]> {
  try {
    const results = await db.select()
      .from(debtCreditsTable)
      .innerJoin(customersTable, eq(debtCreditsTable.customer_id, customersTable.id))
      .orderBy(
        asc(debtCreditsTable.is_paid), // Unpaid records first
        asc(debtCreditsTable.due_date), // Then by due date (earliest first)
        desc(debtCreditsTable.created_at) // Finally by creation date (newest first)
      )
      .execute();

    return results.map(result => ({
      ...result.debt_credits,
      amount: parseFloat(result.debt_credits.amount),
      remaining_amount: parseFloat(result.debt_credits.remaining_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch debt/credit records:', error);
    throw error;
  }
}
