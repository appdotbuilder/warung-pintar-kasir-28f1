
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, productsTable, salesTable, saleItemsTable } from '../db/schema';
import { getSaleDetails } from '../handlers/get_sale_details';

describe('getSaleDetails', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return sale details with items', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '123456789',
        address: 'Test Address'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        price: '19.99',
        unit: 'pcs',
        category: 'test',
        barcode: '123456',
        stock_quantity: 100,
        min_stock_threshold: 5
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    // Create sale
    const saleResult = await db.insert(salesTable)  
      .values({
        customer_id: customerId,
        total_amount: '59.97',
        discount_amount: '5.00',
        final_amount: '54.97',
        payment_method: 'cash',
        notes: 'Test sale'
      })
      .returning()
      .execute();
    const saleId = saleResult[0].id;

    // Create sale items
    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: saleId,
          product_id: productId,
          quantity: 2,
          unit_price: '19.99',
          total_price: '39.98'
        },
        {
          sale_id: saleId,
          product_id: productId,
          quantity: 1,
          unit_price: '19.99',
          total_price: '19.99'
        }
      ])
      .execute();

    const result = await getSaleDetails(saleId);

    expect(result).not.toBeNull();
    expect(result!.sale.id).toEqual(saleId);
    expect(result!.sale.customer_id).toEqual(customerId);
    expect(result!.sale.total_amount).toEqual(59.97);
    expect(result!.sale.discount_amount).toEqual(5.00);
    expect(result!.sale.final_amount).toEqual(54.97);
    expect(result!.sale.payment_method).toEqual('cash');
    expect(result!.sale.notes).toEqual('Test sale');
    expect(result!.sale.created_at).toBeInstanceOf(Date);
    expect(result!.sale.updated_at).toBeInstanceOf(Date);

    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].sale_id).toEqual(saleId);
    expect(result!.items[0].product_id).toEqual(productId);
    expect(result!.items[0].quantity).toEqual(2);
    expect(result!.items[0].unit_price).toEqual(19.99);
    expect(result!.items[0].total_price).toEqual(39.98);
    expect(result!.items[0].created_at).toBeInstanceOf(Date);

    expect(result!.items[1].quantity).toEqual(1);
    expect(result!.items[1].unit_price).toEqual(19.99);
    expect(result!.items[1].total_price).toEqual(19.99);
  });

  it('should return null for non-existent sale', async () => {
    const result = await getSaleDetails(999);
    expect(result).toBeNull();
  });

  it('should return sale with empty items array if no items exist', async () => {
    // Create prerequisite data
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '123456789',
        address: 'Test Address'
      })
      .returning()
      .execute();
    const customerId = customerResult[0].id;

    // Create sale without items
    const saleResult = await db.insert(salesTable)
      .values({
        customer_id: customerId,
        total_amount: '0.00',
        discount_amount: '0.00',
        final_amount: '0.00',
        payment_method: 'cash',
        notes: 'Empty sale'
      })
      .returning()
      .execute();
    const saleId = saleResult[0].id;

    const result = await getSaleDetails(saleId);

    expect(result).not.toBeNull();
    expect(result!.sale.id).toEqual(saleId);
    expect(result!.sale.total_amount).toEqual(0.00);
    expect(result!.sale.final_amount).toEqual(0.00);
    expect(result!.items).toHaveLength(0);
  });

  it('should handle sale without customer', async () => {
    // Create sale without customer
    const saleResult = await db.insert(salesTable)
      .values({
        customer_id: null,
        total_amount: '25.50',
        discount_amount: '0.00',
        final_amount: '25.50',
        payment_method: 'qris',
        notes: null
      })
      .returning()
      .execute();
    const saleId = saleResult[0].id;

    const result = await getSaleDetails(saleId);

    expect(result).not.toBeNull();
    expect(result!.sale.id).toEqual(saleId);
    expect(result!.sale.customer_id).toBeNull();
    expect(result!.sale.total_amount).toEqual(25.50);
    expect(result!.sale.payment_method).toEqual('qris');
    expect(result!.sale.notes).toBeNull();
    expect(result!.items).toHaveLength(0);
  });
});
