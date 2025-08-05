
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable, stockMovementsTable } from '../db/schema';
import { type CreateSaleInput, type Sale } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  try {
    // Calculate totals
    const totalAmount = input.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0);
    const finalAmount = totalAmount - input.discount_amount;

    // Start transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Validate all products exist before proceeding
      const productIds = input.items.map(item => item.product_id);
      const existingProducts = await tx.select()
        .from(productsTable)
        .where(inArray(productsTable.id, productIds))
        .execute();

      const existingProductIds = existingProducts.map(p => p.id);
      const missingProductIds = productIds.filter(id => !existingProductIds.includes(id));
      
      if (missingProductIds.length > 0) {
        throw new Error(`Product with id ${missingProductIds[0]} not found`);
      }

      // 2. Create sale record
      const saleResult = await tx.insert(salesTable)
        .values({
          customer_id: input.customer_id,
          total_amount: totalAmount.toString(),
          discount_amount: input.discount_amount.toString(),
          final_amount: finalAmount.toString(),
          payment_method: input.payment_method,
          notes: input.notes
        })
        .returning()
        .execute();

      const sale = saleResult[0];

      // 3. Create sale items and update stock
      for (const item of input.items) {
        // Create sale item record
        await tx.insert(saleItemsTable)
          .values({
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price.toString(),
            total_price: (item.quantity * item.unit_price).toString()
          })
          .execute();

        // Find the product from our validated list
        const product = existingProducts.find(p => p.id === item.product_id)!;

        // Update product stock quantity
        const newStockQuantity = product.stock_quantity - item.quantity;
        await tx.update(productsTable)
          .set({ stock_quantity: newStockQuantity })
          .where(eq(productsTable.id, item.product_id))
          .execute();

        // Create stock movement record
        await tx.insert(stockMovementsTable)
          .values({
            product_id: item.product_id,
            movement_type: 'out',
            quantity: -item.quantity, // Negative for outgoing stock
            reference_type: 'sale',
            reference_id: sale.id,
            notes: `Sale #${sale.id}`
          })
          .execute();
      }

      return sale;
    });

    // Convert numeric fields back to numbers
    return {
      ...result,
      total_amount: parseFloat(result.total_amount),
      discount_amount: parseFloat(result.discount_amount),
      final_amount: parseFloat(result.final_amount)
    };
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
}
