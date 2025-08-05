
import { db } from '../db';
import { salesTable, saleItemsTable } from '../db/schema';
import { type Sale, type SaleItem } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSaleDetails(saleId: number): Promise<{ sale: Sale; items: SaleItem[] } | null> {
  try {
    // First, get the sale record
    const saleResults = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, saleId))
      .execute();

    if (saleResults.length === 0) {
      return null;
    }

    const saleRecord = saleResults[0];

    // Convert numeric fields to numbers for the sale
    const sale: Sale = {
      ...saleRecord,
      total_amount: parseFloat(saleRecord.total_amount),
      discount_amount: parseFloat(saleRecord.discount_amount),
      final_amount: parseFloat(saleRecord.final_amount)
    };

    // Get the sale items
    const itemResults = await db.select()
      .from(saleItemsTable)
      .where(eq(saleItemsTable.sale_id, saleId))
      .execute();

    // Convert numeric fields to numbers for the items
    const items: SaleItem[] = itemResults.map(item => ({
      ...item,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price)
    }));

    return { sale, items };
  } catch (error) {
    console.error('Get sale details failed:', error);
    throw error;
  }
}
