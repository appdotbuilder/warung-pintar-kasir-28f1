
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // First check if product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.price !== undefined) {
      updateData.price = input.price.toString(); // Convert number to string for numeric column
    }
    if (input.unit !== undefined) {
      updateData.unit = input.unit;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.barcode !== undefined) {
      updateData.barcode = input.barcode;
    }
    if (input.stock_quantity !== undefined) {
      updateData.stock_quantity = input.stock_quantity;
    }
    if (input.min_stock_threshold !== undefined) {
      updateData.min_stock_threshold = input.min_stock_threshold;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update product record
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
