
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type Expense } from '../schema';
import { desc } from 'drizzle-orm';

export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const results = await db.select()
      .from(expensesTable)
      .orderBy(desc(expensesTable.expense_date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    throw error;
  }
};
