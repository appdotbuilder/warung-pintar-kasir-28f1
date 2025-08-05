
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.barcode, barcode))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert numeric field to number
    };
  } catch (error) {
    console.error('Product lookup by barcode failed:', error);
    throw error;
  }
};
