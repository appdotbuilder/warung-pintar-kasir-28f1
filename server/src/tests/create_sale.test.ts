
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, customersTable, salesTable, saleItemsTable, stockMovementsTable } from '../db/schema';
import { type CreateSaleInput } from '../schema';
import { createSale } from '../handlers/create_sale';
import { eq } from 'drizzle-orm';

describe('createSale', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testProduct1: any;
  let testProduct2: any;
  let testCustomer: any;

  beforeEach(async () => {
    // Create test products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Test Product 1',
          price: '10.50',
          unit: 'pcs',
          stock_quantity: 100,
          min_stock_threshold: 5
        },
        {
          name: 'Test Product 2',
          price: '25.00',
          unit: 'kg',
          stock_quantity: 50,
          min_stock_threshold: 10
        }
      ])
      .returning()
      .execute();

    testProduct1 = products[0];
    testProduct2 = products[1];

    // Create test customer
    const customers = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '123456789'
      })
      .returning()
      .execute();

    testCustomer = customers[0];
  });

  const createTestSaleInput = (): CreateSaleInput => ({
    customer_id: testCustomer.id,
    items: [
      {
        product_id: testProduct1.id,
        quantity: 2,
        unit_price: 10.50
      },
      {
        product_id: testProduct2.id,
        quantity: 1,
        unit_price: 25.00
      }
    ],
    discount_amount: 5.00,
    payment_method: 'cash' as const,
    notes: 'Test sale'
  });

  it('should create a sale with correct totals', async () => {
    const input = createTestSaleInput();
    const result = await createSale(input);

    expect(result.customer_id).toEqual(testCustomer.id);
    expect(result.total_amount).toEqual(46.00); // (2 * 10.50) + (1 * 25.00)
    expect(result.discount_amount).toEqual(5.00);
    expect(result.final_amount).toEqual(41.00); // 46.00 - 5.00
    expect(result.payment_method).toEqual('cash');
    expect(result.notes).toEqual('Test sale');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save sale to database', async () => {
    const input = createTestSaleInput();
    const result = await createSale(input);

    const sales = await db.select()
      .from(salesTable)
      .where(eq(salesTable.id, result.id))
      .execute();

    expect(sales).toHaveLength(1);
    expect(sales[0].customer_id).toEqual(testCustomer.id);
    expect(parseFloat(sales[0].total_amount)).toEqual(46.00);
    expect(parseFloat(sales[0].discount_amount)).toEqual(5.00);
    expect(parseFloat(sales[0].final_amount)).toEqual(41.00);
  });

  it('should create sale items records', async () => {
    const input = createTestSaleInput();
    const result = await createSale(input);

    const saleItems = await db.select()
      .from(saleItemsTable)
      .where(eq(saleItemsTable.sale_id, result.id))
      .execute();

    expect(saleItems).toHaveLength(2);

    const item1 = saleItems.find(item => item.product_id === testProduct1.id);
    const item2 = saleItems.find(item => item.product_id === testProduct2.id);

    expect(item1).toBeDefined();
    expect(item1!.quantity).toEqual(2);
    expect(parseFloat(item1!.unit_price)).toEqual(10.50);
    expect(parseFloat(item1!.total_price)).toEqual(21.00);

    expect(item2).toBeDefined();
    expect(item2!.quantity).toEqual(1);
    expect(parseFloat(item2!.unit_price)).toEqual(25.00);
    expect(parseFloat(item2!.total_price)).toEqual(25.00);
  });

  it('should update product stock quantities', async () => {
    const input = createTestSaleInput();
    await createSale(input);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct1.id))
      .execute();

    expect(products[0].stock_quantity).toEqual(98); // 100 - 2

    const products2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct2.id))
      .execute();

    expect(products2[0].stock_quantity).toEqual(49); // 50 - 1
  });

  it('should create stock movement records', async () => {
    const input = createTestSaleInput();
    const result = await createSale(input);

    const stockMovements = await db.select()
      .from(stockMovementsTable)
      .where(eq(stockMovementsTable.reference_id, result.id))
      .execute();

    expect(stockMovements).toHaveLength(2);

    const movement1 = stockMovements.find(m => m.product_id === testProduct1.id);
    const movement2 = stockMovements.find(m => m.product_id === testProduct2.id);

    expect(movement1).toBeDefined();
    expect(movement1!.movement_type).toEqual('out');
    expect(movement1!.quantity).toEqual(-2);
    expect(movement1!.reference_type).toEqual('sale');
    expect(movement1!.reference_id).toEqual(result.id);

    expect(movement2).toBeDefined();
    expect(movement2!.movement_type).toEqual('out');
    expect(movement2!.quantity).toEqual(-1);
    expect(movement2!.reference_type).toEqual('sale');
    expect(movement2!.reference_id).toEqual(result.id);
  });

  it('should handle sale without customer', async () => {
    const input: CreateSaleInput = {
      customer_id: null,
      items: [
        {
          product_id: testProduct1.id,
          quantity: 1,
          unit_price: 10.50
        }
      ],
      discount_amount: 0,
      payment_method: 'qris',
      notes: null
    };

    const result = await createSale(input);

    expect(result.customer_id).toBeNull();
    expect(result.total_amount).toEqual(10.50);
    expect(result.final_amount).toEqual(10.50);
    expect(result.payment_method).toEqual('qris');
  });

  it('should handle sale without discount', async () => {
    const input: CreateSaleInput = {
      customer_id: testCustomer.id,
      items: [
        {
          product_id: testProduct1.id,
          quantity: 1,
          unit_price: 10.50
        }
      ],
      discount_amount: 0,
      payment_method: 'transfer',
      notes: null
    };

    const result = await createSale(input);

    expect(result.total_amount).toEqual(10.50);
    expect(result.discount_amount).toEqual(0);
    expect(result.final_amount).toEqual(10.50);
  });

  it('should throw error for non-existent product', async () => {
    const input: CreateSaleInput = {
      customer_id: testCustomer.id,
      items: [
        {
          product_id: 99999, // Non-existent product
          quantity: 1,
          unit_price: 10.50
        }
      ],
      discount_amount: 0,
      payment_method: 'cash',
      notes: null
    };

    await expect(createSale(input)).rejects.toThrow(/Product with id 99999 not found/i);
  });
});
