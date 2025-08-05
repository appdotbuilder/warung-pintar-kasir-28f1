
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProductByBarcode } from '../handlers/get_product_by_barcode';

const testProduct: CreateProductInput = {
  name: 'Test Product',
  price: 25.99,
  unit: 'pcs',
  category: 'Electronics',
  barcode: '1234567890123',
  stock_quantity: 50,
  min_stock_threshold: 10
};

const testProductWithoutBarcode: CreateProductInput = {
  name: 'Product Without Barcode',
  price: 15.50,
  unit: 'kg',
  category: 'Food',
  barcode: null,
  stock_quantity: 30,
  min_stock_threshold: 5
};

describe('getProductByBarcode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product when barcode exists', async () => {
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

    const result = await getProductByBarcode('1234567890123');

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Test Product');
    expect(result!.barcode).toEqual('1234567890123');
    expect(result!.price).toEqual(25.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.unit).toEqual('pcs');
    expect(result!.category).toEqual('Electronics');
    expect(result!.stock_quantity).toEqual(50);
    expect(result!.min_stock_threshold).toEqual(10);
    expect(result!.is_active).toBe(true);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when barcode does not exist', async () => {
    // Create product without the barcode we're searching for
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: 'different-barcode',
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold
      })
      .execute();

    const result = await getProductByBarcode('nonexistent-barcode');

    expect(result).toBeNull();
  });

  it('should return null when searching for null barcode', async () => {
    // Create product with null barcode
    await db.insert(productsTable)
      .values({
        name: testProductWithoutBarcode.name,
        price: testProductWithoutBarcode.price.toString(),
        unit: testProductWithoutBarcode.unit,
        category: testProductWithoutBarcode.category,
        barcode: testProductWithoutBarcode.barcode,
        stock_quantity: testProductWithoutBarcode.stock_quantity,
        min_stock_threshold: testProductWithoutBarcode.min_stock_threshold
      })
      .execute();

    const result = await getProductByBarcode('null');

    expect(result).toBeNull();
  });

  it('should handle empty barcode string', async () => {
    const result = await getProductByBarcode('');

    expect(result).toBeNull();
  });

  it('should find product even when inactive', async () => {
    // Create inactive product
    await db.insert(productsTable)
      .values({
        name: testProduct.name,
        price: testProduct.price.toString(),
        unit: testProduct.unit,
        category: testProduct.category,
        barcode: testProduct.barcode,
        stock_quantity: testProduct.stock_quantity,
        min_stock_threshold: testProduct.min_stock_threshold,
        is_active: false
      })
      .execute();

    const result = await getProductByBarcode('1234567890123');

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Test Product');
    expect(result!.is_active).toBe(false);
  });
});
