
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { lte, and, eq } from 'drizzle-orm';

export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    // Query products where stock_quantity <= min_stock_threshold and is_active = true
    const results = await db.select()
      .from(productsTable)
      .where(
        and(
          lte(productsTable.stock_quantity, productsTable.min_stock_threshold),
          eq(productsTable.is_active, true)
        )
      )
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));
  } catch (error) {
    console.error('Get low stock products failed:', error);
    throw error;
  }
};
