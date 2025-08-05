
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateProductInput = {
  name: 'Test Product',
  price: 19.99,
  unit: 'piece',
  category: 'Electronics',
  barcode: '1234567890123',
  stock_quantity: 100,
  min_stock_threshold: 10
};

const minimalInput: CreateProductInput = {
  name: 'Minimal Product',
  price: 5.00,
  unit: 'kg',
  category: null,
  barcode: null,
  stock_quantity: 50,
  min_stock_threshold: 5 // Include explicit value instead of relying on Zod default
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toBe('number');
    expect(result.unit).toEqual('piece');
    expect(result.category).toEqual('Electronics');
    expect(result.barcode).toEqual('1234567890123');
    expect(result.stock_quantity).toEqual(100);
    expect(result.min_stock_threshold).toEqual(10);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields', async () => {
    const result = await createProduct(minimalInput);

    expect(result.name).toEqual('Minimal Product');
    expect(result.price).toEqual(5.00);
    expect(result.unit).toEqual('kg');
    expect(result.category).toBeNull();
    expect(result.barcode).toBeNull();
    expect(result.stock_quantity).toEqual(50);
    expect(result.min_stock_threshold).toEqual(5);
    expect(result.is_active).toBe(true);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    
    expect(savedProduct.name).toEqual('Test Product');
    expect(parseFloat(savedProduct.price)).toEqual(19.99);
    expect(savedProduct.unit).toEqual('piece');
    expect(savedProduct.category).toEqual('Electronics');
    expect(savedProduct.barcode).toEqual('1234567890123');
    expect(savedProduct.stock_quantity).toEqual(100);
    expect(savedProduct.min_stock_threshold).toEqual(10);
    expect(savedProduct.is_active).toBe(true);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should handle numeric price conversion correctly', async () => {
    const result = await createProduct(testInput);

    // Verify returned value is a number
    expect(typeof result.price).toBe('number');
    expect(result.price).toEqual(19.99);

    // Verify database stores as string (numeric column behavior)
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(typeof products[0].price).toBe('string');
    expect(parseFloat(products[0].price)).toEqual(19.99);
  });

  it('should create multiple products with unique IDs', async () => {
    const product1 = await createProduct({
      ...testInput,
      name: 'Product 1'
    });

    const product2 = await createProduct({
      ...testInput,
      name: 'Product 2'
    });

    expect(product1.id).not.toEqual(product2.id);
    expect(product1.name).toEqual('Product 1');
    expect(product2.name).toEqual('Product 2');

    // Verify both exist in database
    const allProducts = await db.select()
      .from(productsTable)
      .execute();

    expect(allProducts).toHaveLength(2);
  });
});
