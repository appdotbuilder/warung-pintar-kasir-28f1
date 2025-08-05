
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProducts } from '../handlers/get_products';

const testProduct1: CreateProductInput = {
  name: 'Test Product 1',
  price: 19.99,
  unit: 'pcs',
  category: 'Electronics',
  barcode: '1234567890',
  stock_quantity: 100,
  min_stock_threshold: 10
};

const testProduct2: CreateProductInput = {
  name: 'Test Product 2',
  price: 5.50,
  unit: 'kg',
  category: null,
  barcode: null,
  stock_quantity: 0,
  min_stock_threshold: 5
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('should return all products with correct data types', async () => {
    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: testProduct1.name,
          price: testProduct1.price.toString(),
          unit: testProduct1.unit,
          category: testProduct1.category,
          barcode: testProduct1.barcode,
          stock_quantity: testProduct1.stock_quantity,
          min_stock_threshold: testProduct1.min_stock_threshold
        },
        {
          name: testProduct2.name,
          price: testProduct2.price.toString(),
          unit: testProduct2.unit,
          category: testProduct2.category,
          barcode: testProduct2.barcode,
          stock_quantity: testProduct2.stock_quantity,
          min_stock_threshold: testProduct2.min_stock_threshold
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);

    // Test first product
    const product1 = result.find(p => p.name === 'Test Product 1');
    expect(product1).toBeDefined();
    expect(product1!.name).toEqual('Test Product 1');
    expect(product1!.price).toEqual(19.99);
    expect(typeof product1!.price).toBe('number');
    expect(product1!.unit).toEqual('pcs');
    expect(product1!.category).toEqual('Electronics');
    expect(product1!.barcode).toEqual('1234567890');
    expect(product1!.stock_quantity).toEqual(100);
    expect(product1!.min_stock_threshold).toEqual(10);
    expect(product1!.is_active).toBe(true);
    expect(product1!.id).toBeDefined();
    expect(product1!.created_at).toBeInstanceOf(Date);
    expect(product1!.updated_at).toBeInstanceOf(Date);

    // Test second product
    const product2 = result.find(p => p.name === 'Test Product 2');
    expect(product2).toBeDefined();
    expect(product2!.name).toEqual('Test Product 2');
    expect(product2!.price).toEqual(5.50);
    expect(typeof product2!.price).toBe('number');
    expect(product2!.unit).toEqual('kg');
    expect(product2!.category).toBeNull();
    expect(product2!.barcode).toBeNull();
    expect(product2!.stock_quantity).toEqual(0);
    expect(product2!.min_stock_threshold).toEqual(5);
  });

  it('should return inactive products as well', async () => {
    // Create inactive product
    await db.insert(productsTable)
      .values({
        name: 'Inactive Product',
        price: '10.00',
        unit: 'pcs',
        category: null,
        barcode: null,
        stock_quantity: 0,
        min_stock_threshold: 5,
        is_active: false
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Inactive Product');
    expect(result[0].is_active).toBe(false);
  });

  it('should handle products with zero stock correctly', async () => {
    await db.insert(productsTable)
      .values({
        name: 'Zero Stock Product',
        price: '15.75',
        unit: 'pcs',
        category: 'Test',
        barcode: null,
        stock_quantity: 0,
        min_stock_threshold: 5
      })
      .execute();

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].stock_quantity).toEqual(0);
    expect(result[0].price).toEqual(15.75);
    expect(typeof result[0].price).toBe('number');
  });
});
