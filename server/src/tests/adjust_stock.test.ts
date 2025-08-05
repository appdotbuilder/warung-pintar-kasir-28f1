
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, stockMovementsTable } from '../db/schema';
import { type StockAdjustmentInput, type CreateProductInput } from '../schema';
import { adjustStock } from '../handlers/adjust_stock';
import { eq } from 'drizzle-orm';

// Test product data
const testProduct: CreateProductInput = {
  name: 'Test Product',
  price: 15.99,
  unit: 'pcs',
  category: 'Test Category',
  barcode: '1234567890',
  stock_quantity: 50,
  min_stock_threshold: 10
};

const testAdjustment: StockAdjustmentInput = {
  product_id: 1,
  new_quantity: 75,
  notes: 'Stock adjustment test'
};

describe('adjustStock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should adjust product stock quantity', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: testProduct.barcode,
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold
      })
      .execute();

    const result = await adjustStock(testAdjustment);

    // Verify the returned product
    expect(result.id).toBe(1);
    expect(result.stock_quantity).toBe(75);
    expect(result.name).toBe('Test Product');
    expect(result.price).toBe(15.99);
    expect(typeof result.price).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update product in database', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: testProduct.barcode,
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold
      })
      .execute();

    await adjustStock(testAdjustment);

    // Verify product was updated in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, 1))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].stock_quantity).toBe(75);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create stock movement record', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: testProduct.barcode,
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold
      })
      .execute();

    await adjustStock(testAdjustment);

    // Verify stock movement was created
    const movements = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, 1))
      .execute();

    expect(movements).toHaveLength(1);
    expect(movements[0].product_id).toBe(1);
    expect(movements[0].movement_type).toBe('adjustment');
    expect(movements[0].quantity).toBe(25); // 75 - 50 = 25
    expect(movements[0].reference_type).toBe('adjustment');
    expect(movements[0].reference_id).toBeNull();
    expect(movements[0].notes).toBe('Stock adjustment test');
    expect(movements[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle negative stock adjustment', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: testProduct.barcode,
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold
      })
      .execute();

    const negativeAdjustment: StockAdjustmentInput = {
      product_id: 1,
      new_quantity: 20,
      notes: 'Reducing stock'
    };

    await adjustStock(negativeAdjustment);

    // Verify stock movement shows negative quantity
    const movements = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, 1))
      .execute();

    expect(movements).toHaveLength(1);
    expect(movements[0].quantity).toBe(-30); // 20 - 50 = -30
    expect(movements[0].notes).toBe('Reducing stock');
  });

  it('should handle adjustment to zero stock', async () => {
    // Create test product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: testProduct.barcode,
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold
      })
      .execute();

    const zeroAdjustment: StockAdjustmentInput = {
      product_id: 1,
      new_quantity: 0,
      notes: null
    };

    const result = await adjustStock(zeroAdjustment);

    expect(result.stock_quantity).toBe(0);

    // Verify stock movement
    const movements = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.product_id, 1))
      .execute();

    expect(movements[0].quantity).toBe(-50); // 0 - 50 = -50
    expect(movements[0].notes).toBeNull();
  });

  it('should throw error for non-existent product', async () => {
    const invalidAdjustment: StockAdjustmentInput = {
      product_id: 999,
      new_quantity: 100,
      notes: 'This should fail'
    };

    await expect(adjustStock(invalidAdjustment)).rejects.toThrow(/Product with id 999 not found/i);
  });
});
