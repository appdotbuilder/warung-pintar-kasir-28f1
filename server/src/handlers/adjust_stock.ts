
import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { type StockAdjustmentInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export async function adjustStock(input: StockAdjustmentInput): Promise<Product> {
  try {
    // First, verify the product exists
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    const existingProduct = existingProducts[0];
    const oldQuantity = existingProduct.stock_quantity;
    const quantityDifference = input.new_quantity - oldQuantity;

    // Update product stock quantity
    const updatedProducts = await db.update(productsTable)
      .set({
        stock_quantity: input.new_quantity,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, input.product_id))
      .returning()
      .execute();

    // Create stock movement record
    await db.insert(stockMovementsTable)
      .values({
        product_id: input.product_id,
        movement_type: 'adjustment',
        quantity: quantityDifference,
        reference_type: 'adjustment',
        reference_id: null,
        notes: input.notes
      })
      .execute();

    // Convert numeric fields back to numbers
    const updatedProduct = updatedProducts[0];
    return {
      ...updatedProduct,
      price: parseFloat(updatedProduct.price)
    };
  } catch (error) {
    console.error('Stock adjustment failed:', error);
    throw error;
  }
}
