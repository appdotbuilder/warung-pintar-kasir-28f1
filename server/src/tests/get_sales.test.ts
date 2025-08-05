
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTable, customersTable } from '../db/schema';
import { type CreateSaleInput, type CreateCustomerInput } from '../schema';
import { getSales } from '../handlers/get_sales';

// Test data
const testCustomer: CreateCustomerInput = {
  name: 'Test Customer',
  phone: '1234567890',
  address: '123 Test St'
};

const testSale1: CreateSaleInput = {
  customer_id: null,
  items: [
    {
      product_id: 1,
      quantity: 2,
      unit_price: 10.50
    }
  ],
  discount_amount: 1.00,
  payment_method: 'cash',
  notes: 'Test sale 1'
};

const testSale2: CreateSaleInput = {
  customer_id: null,
  items: [
    {
      product_id: 1,
      quantity: 1,
      unit_price: 25.75
    }
  ],
  discount_amount: 0,
  payment_method: 'qris',
  notes: 'Test sale 2'
};

describe('getSales', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sales exist', async () => {
    const result = await getSales();
    expect(result).toEqual([]);
  });

  it('should return sales ordered by created_at descending', async () => {
    // Create test customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: testCustomer.name,
        phone: testCustomer.phone,
        address: testCustomer.address
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create first sale
    const sale1Total = testSale1.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const sale1Final = sale1Total - testSale1.discount_amount;

    await db.insert(salesTable)
      .values({
        customer_id: customerId,
        total_amount: sale1Total.toString(),
        discount_amount: testSale1.discount_amount.toString(),
        final_amount: sale1Final.toString(),
        payment_method: testSale1.payment_method,
        notes: testSale1.notes
      })
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second sale
    const sale2Total = testSale2.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const sale2Final = sale2Total - testSale2.discount_amount;

    await db.insert(salesTable)
      .values({
        customer_id: customerId,
        total_amount: sale2Total.toString(),
        discount_amount: testSale2.discount_amount.toString(),
        final_amount: sale2Final.toString(),
        payment_method: testSale2.payment_method,
        notes: testSale2.notes
      })
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(2);
    
    // Verify ordering - most recent first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    
    // Verify numeric conversions
    expect(typeof result[0].total_amount).toBe('number');
    expect(typeof result[0].discount_amount).toBe('number');
    expect(typeof result[0].final_amount).toBe('number');
    
    // Verify calculations
    expect(result[1].total_amount).toBe(21.00); // First sale: 2 * 10.50
    expect(result[1].discount_amount).toBe(1.00);
    expect(result[1].final_amount).toBe(20.00);
    
    expect(result[0].total_amount).toBe(25.75); // Second sale: 1 * 25.75
    expect(result[0].discount_amount).toBe(0);
    expect(result[0].final_amount).toBe(25.75);
  });

  it('should handle sales with null customer_id', async () => {
    // Create sale without customer
    const saleTotal = 15.50;
    const discountAmount = 0.50;
    const finalAmount = saleTotal - discountAmount;

    await db.insert(salesTable)
      .values({
        customer_id: null,
        total_amount: saleTotal.toString(),
        discount_amount: discountAmount.toString(),
        final_amount: finalAmount.toString(),
        payment_method: 'transfer',
        notes: 'Cash sale'
      })
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toBeNull();
    expect(result[0].total_amount).toBe(15.50);
    expect(result[0].discount_amount).toBe(0.50);
    expect(result[0].final_amount).toBe(15.00);
    expect(result[0].payment_method).toBe('transfer');
    expect(result[0].notes).toBe('Cash sale');
  });

  it('should return all required sale fields', async () => {
    // Create minimal sale
    await db.insert(salesTable)
      .values({
        customer_id: null,
        total_amount: '10.00',
        discount_amount: '0.00',
        final_amount: '10.00',
        payment_method: 'cash',
        notes: null
      })
      .execute();

    const result = await getSales();

    expect(result).toHaveLength(1);
    const sale = result[0];
    
    // Verify all required fields are present
    expect(sale.id).toBeDefined();
    expect(sale.customer_id).toBeNull();
    expect(sale.total_amount).toBe(10.00);
    expect(sale.discount_amount).toBe(0.00);
    expect(sale.final_amount).toBe(10.00);
    expect(sale.payment_method).toBe('cash');
    expect(sale.notes).toBeNull();
    expect(sale.created_at).toBeInstanceOf(Date);
    expect(sale.updated_at).toBeInstanceOf(Date);
  });
});
