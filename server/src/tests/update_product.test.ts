
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test product directly in database
  const createTestProduct = async () => {
    const result = await db.insert(productsTable)
      .values({
        name: 'Original Product',
        price: '15.99',
        unit: 'pcs',
        category: 'original-category',
        barcode: 'ORIG123',
        stock_quantity: 50,
        min_stock_threshold: 10
      })
      .returning()
      .execute();

    return {
      ...result[0],
      price: parseFloat(result[0].price)
    };
  };

  it('should update product with all fields', async () => {
    // Create initial product
    const createdProduct = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Updated Product',
      price: 29.99,
      unit: 'box',
      category: 'updated-category',
      barcode: 'UPD456',
      stock_quantity: 75,
      min_stock_threshold: 15,
      is_active: false
    };

    const result = await updateProduct(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(createdProduct.id);
    expect(result.name).toEqual('Updated Product');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number');
    expect(result.unit).toEqual('box');
    expect(result.category).toEqual('updated-category');
    expect(result.barcode).toEqual('UPD456');
    expect(result.stock_quantity).toEqual(75);
    expect(result.min_stock_threshold).toEqual(15);
    expect(result.is_active).toEqual(false);
    expect(result.created_at).toEqual(createdProduct.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdProduct.updated_at).toBe(true);
  });

  it('should update product with partial fields', async () => {
    // Create initial product
    const createdProduct = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Partially Updated Product',
      price: 22.50
    };

    const result = await updateProduct(updateInput);

    // Verify only specified fields are updated
    expect(result.name).toEqual('Partially Updated Product');
    expect(result.price).toEqual(22.50);
    expect(typeof result.price).toEqual('number');
    
    // Verify other fields remain unchanged
    expect(result.unit).toEqual('pcs');
    expect(result.category).toEqual('original-category');
    expect(result.barcode).toEqual('ORIG123');
    expect(result.stock_quantity).toEqual(50);
    expect(result.min_stock_threshold).toEqual(10);
    expect(result.is_active).toEqual(true); // Default value
  });

  it('should update product with nullable fields', async () => {
    // Create initial product
    const createdProduct = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      category: null,
      barcode: null
    };

    const result = await updateProduct(updateInput);

    // Verify nullable fields are updated to null
    expect(result.category).toBeNull();
    expect(result.barcode).toBeNull();
    
    // Verify other fields remain unchanged
    expect(result.name).toEqual('Original Product');
    expect(result.price).toEqual(15.99);
  });

  it('should save updated product to database', async () => {
    // Create initial product
    const createdProduct = await createTestProduct();

    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      name: 'Database Updated Product',
      price: 33.33
    };

    await updateProduct(updateInput);

    // Query database directly to verify update
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, createdProduct.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Product');
    expect(parseFloat(products[0].price)).toEqual(33.33);
    expect(products[0].updated_at).toBeInstanceOf(Date);
    expect(products[0].updated_at > createdProduct.updated_at).toBe(true);
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update is_active flag correctly', async () => {
    // Create initial product (is_active defaults to true)
    const createdProduct = await createTestProduct();
    expect(createdProduct.is_active).toBe(true);

    // Update to inactive
    const updateInput: UpdateProductInput = {
      id: createdProduct.id,
      is_active: false
    };

    const result = await updateProduct(updateInput);
    expect(result.is_active).toBe(false);

    // Update back to active
    const reactivateInput: UpdateProductInput = {
      id: createdProduct.id,
      is_active: true
    };

    const reactivatedResult = await updateProduct(reactivateInput);
    expect(reactivatedResult.is_active).toBe(true);
  });
});
