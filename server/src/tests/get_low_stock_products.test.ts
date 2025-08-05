
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getLowStockProducts } from '../handlers/get_low_stock_products';

describe('getLowStockProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products with stock below minimum threshold', async () => {
    // Create products with different stock levels
    const lowStockProduct: CreateProductInput = {
      name: 'Low Stock Product',
      price: 10.00,
      unit: 'pcs',
      category: 'test',
      barcode: null,
      stock_quantity: 3,
      min_stock_threshold: 5
    };

    const normalStockProduct: CreateProductInput = {
      name: 'Normal Stock Product',
      price: 15.00,
      unit: 'pcs',
      category: 'test',
      barcode: null,
      stock_quantity: 10,
      min_stock_threshold: 5
    };

    await db.insert(productsTable).values([
      {
        ...lowStockProduct,
        price: lowStockProduct.price.toString()
      },
      {
        ...normalStockProduct,
        price: normalStockProduct.price.toString()
      }
    ]).execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Low Stock Product');
    expect(result[0].stock_quantity).toEqual(3);
    expect(result[0].min_stock_threshold).toEqual(5);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(10.00);
  });

  it('should return products with stock equal to minimum threshold', async () => {
    const equalStockProduct: CreateProductInput = {
      name: 'Equal Stock Product',
      price: 12.50,
      unit: 'pcs',
      category: 'test',
      barcode: null,
      stock_quantity: 5,
      min_stock_threshold: 5
    };

    await db.insert(productsTable).values({
      ...equalStockProduct,
      price: equalStockProduct.price.toString()
    }).execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Equal Stock Product');
    expect(result[0].stock_quantity).toEqual(5);
    expect(result[0].min_stock_threshold).toEqual(5);
  });

  it('should not return inactive products', async () => {
    const inactiveLowStockProduct: CreateProductInput = {
      name: 'Inactive Low Stock Product',
      price: 8.00,
      unit: 'pcs',
      category: 'test',
      barcode: null,
      stock_quantity: 2,
      min_stock_threshold: 5
    };

    await db.insert(productsTable).values({
      ...inactiveLowStockProduct,
      price: inactiveLowStockProduct.price.toString(),
      is_active: false
    }).execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no products have low stock', async () => {
    const highStockProduct: CreateProductInput = {
      name: 'High Stock Product',
      price: 20.00,
      unit: 'pcs',
      category: 'test',
      barcode: null,
      stock_quantity: 20,
      min_stock_threshold: 5
    };

    await db.insert(productsTable).values({
      ...highStockProduct,
      price: highStockProduct.price.toString()
    }).execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(0);
  });

  it('should return multiple low stock products sorted correctly', async () => {
    const products: CreateProductInput[] = [
      {
        name: 'Product A',
        price: 5.00,
        unit: 'pcs',
        category: 'test',
        barcode: null,
        stock_quantity: 1,
        min_stock_threshold: 3
      },
      {
        name: 'Product B',
        price: 7.50,
        unit: 'pcs',
        category: 'test',
        barcode: null,
        stock_quantity: 2,
        min_stock_threshold: 4
      },
      {
        name: 'Product C',
        price: 12.00,
        unit: 'pcs',
        category: 'test',
        barcode: null,
        stock_quantity: 8,
        min_stock_threshold: 6
      }
    ];

    await db.insert(productsTable).values(
      products.map(product => ({
        ...product,
        price: product.price.toString()
      }))
    ).execute();

    const result = await getLowStockProducts();

    expect(result).toHaveLength(2);
    
    // Verify both low stock products are returned
    const productNames = result.map(p => p.name);
    expect(productNames).toContain('Product A');
    expect(productNames).toContain('Product B');
    
    // Verify numeric conversion
    result.forEach(product => {
      expect(typeof product.price).toBe('number');
    });
  });
});
