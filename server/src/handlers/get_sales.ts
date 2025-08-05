
import { db } from '../db';
import { salesTable, customersTable, saleItemsTable, productsTable } from '../db/schema';
import { type Sale } from '../schema';
import { desc, eq } from 'drizzle-orm';

export async function getSales(): Promise<Sale[]> {
  try {
    // Fetch sales ordered by created_at descending (most recent first)
    const results = await db.select()
      .from(salesTable)
      .orderBy(desc(salesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(sale => ({
      ...sale,
      total_amount: parseFloat(sale.total_amount),
      discount_amount: parseFloat(sale.discount_amount),
      final_amount: parseFloat(sale.final_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    throw error;
  }
}
