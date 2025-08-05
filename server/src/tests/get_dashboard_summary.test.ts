
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  productsTable, 
  customersTable, 
  salesTable, 
  saleItemsTable, 
  debtCreditsTable 
} from '../db/schema';
import { getDashboardSummary } from '../handlers/get_dashboard_summary';

describe('getDashboardSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty dashboard summary when no data exists', async () => {
    const result = await getDashboardSummary();

    expect(result.today_sales).toEqual(0);
    expect(result.today_transactions).toEqual(0);
    expect(result.low_stock_products).toEqual(0);
    expect(result.overdue_debts).toEqual(0);
    expect(result.top_selling_products).toEqual([]);
  });

  it('should calculate today sales correctly', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        price: '10.50',
        unit: 'pcs',
        stock_quantity: 100,
        min_stock_threshold: 5,
        is_active: true
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Create today's sales
    const saleResult = await db.insert(salesTable)
      .values({
        total_amount: '100.00',
        discount_amount: '10.00',
        final_amount: '90.00',
        payment_method: 'cash'
      })
      .returning()
      .execute();

    const sale = saleResult[0];

    // Create sale item
    await db.insert(saleItemsTable)
      .values({
        sale_id: sale.id,
        product_id: product.id,
        quantity: 2,
        unit_price: '10.50',
        total_price: '21.00'
      })
      .execute();

    // Create another sale
    await db.insert(salesTable)
      .values({
        total_amount: '50.00',
        discount_amount: '0.00',
        final_amount: '50.00',
        payment_method: 'qris'
      })
      .execute();

    const result = await getDashboardSummary();

    expect(result.today_sales).toEqual(140); // 90 + 50
    expect(result.today_transactions).toEqual(2);
  });

  it('should count low stock products correctly', async () => {
    // Create products with different stock levels
    await db.insert(productsTable)
      .values([
        {
          name: 'Low Stock Product 1',
          price: '10.00',
          unit: 'pcs',
          stock_quantity: 3, // Below threshold (5)
          min_stock_threshold: 5,
          is_active: true
        },
        {
          name: 'Low Stock Product 2',
          price: '15.00',
          unit: 'pcs',
          stock_quantity: 5, // Equal to threshold
          min_stock_threshold: 5,
          is_active: true
        },
        {
          name: 'Good Stock Product',
          price: '20.00',
          unit: 'pcs',
          stock_quantity: 50, // Above threshold
          min_stock_threshold: 5,
          is_active: true
        },
        {
          name: 'Inactive Low Stock',
          price: '25.00',
          unit: 'pcs',
          stock_quantity: 2, // Below threshold but inactive
          min_stock_threshold: 5,
          is_active: false
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.low_stock_products).toEqual(2); // Only active products below/equal threshold
  });

  it('should count overdue debts correctly', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '123456789'
      })
      .returning()
      .execute();

    const customer = customerResult[0];

    // Create overdue and current debts
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await db.insert(debtCreditsTable)
      .values([
        {
          customer_id: customer.id,
          type: 'debt',
          amount: '100.00',
          remaining_amount: '100.00',
          due_date: yesterday, // Overdue
          is_paid: false
        },
        {
          customer_id: customer.id,
          type: 'debt',
          amount: '200.00',
          remaining_amount: '200.00',
          due_date: tomorrow, // Not overdue
          is_paid: false
        },
        {
          customer_id: customer.id,
          type: 'debt',
          amount: '150.00',
          remaining_amount: '0.00',
          due_date: yesterday, // Overdue but paid
          is_paid: true
        },
        {
          customer_id: customer.id,
          type: 'debt',
          amount: '300.00',
          remaining_amount: '300.00',
          due_date: null, // No due date
          is_paid: false
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.overdue_debts).toEqual(1); // Only unpaid overdue debts with due_date
  });

  it('should calculate top selling products correctly', async () => {
    // Create test products
    const productsResult = await db.insert(productsTable)
      .values([
        {
          name: 'Product A',
          price: '10.00',
          unit: 'pcs',
          stock_quantity: 100,
          min_stock_threshold: 5,
          is_active: true
        },
        {
          name: 'Product B',
          price: '15.00',
          unit: 'pcs',
          stock_quantity: 100,
          min_stock_threshold: 5,
          is_active: true
        },
        {
          name: 'Product C',
          price: '20.00',
          unit: 'pcs',
          stock_quantity: 100,
          min_stock_threshold: 5,
          is_active: true
        }
      ])
      .returning()
      .execute();

    // Create sales within last 30 days
    const salesResult = await db.insert(salesTable)
      .values([
        {
          total_amount: '100.00',
          discount_amount: '0.00',
          final_amount: '100.00',
          payment_method: 'cash'
        },
        {
          total_amount: '150.00',
          discount_amount: '0.00',
          final_amount: '150.00',
          payment_method: 'qris'
        }
      ])
      .returning()
      .execute();

    // Create sale items with different quantities
    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: salesResult[0].id,
          product_id: productsResult[0].id, // Product A
          quantity: 10,
          unit_price: '10.00',
          total_price: '100.00'
        },
        {
          sale_id: salesResult[1].id,
          product_id: productsResult[1].id, // Product B
          quantity: 5,
          unit_price: '15.00',
          total_price: '75.00'
        },
        {
          sale_id: salesResult[1].id,
          product_id: productsResult[0].id, // Product A again
          quantity: 3,
          unit_price: '10.00',
          total_price: '30.00'
        }
      ])
      .execute();

    const result = await getDashboardSummary();

    expect(result.top_selling_products).toHaveLength(2);
    expect(result.top_selling_products[0].product_name).toEqual('Product A');
    expect(result.top_selling_products[0].total_sold).toEqual(13); // 10 + 3
    expect(result.top_selling_products[1].product_name).toEqual('Product B');
    expect(result.top_selling_products[1].total_sold).toEqual(5);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create test data for numeric validation
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Numeric Test Product',
        price: '25.75',
        unit: 'kg',
        stock_quantity: 2,
        min_stock_threshold: 5,
        is_active: true
      })
      .returning()
      .execute();

    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Numeric Test Customer'
      })
      .returning()
      .execute();

    const saleResult = await db.insert(salesTable)
      .values({
        total_amount: '123.45',
        discount_amount: '23.45',
        final_amount: '100.00',
        payment_method: 'transfer'
      })
      .returning()
      .execute();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(debtCreditsTable)
      .values({
        customer_id: customerResult[0].id,
        type: 'debt',
        amount: '250.50',
        remaining_amount: '250.50',
        due_date: yesterday,
        is_paid: false
      })
      .execute();

    const result = await getDashboardSummary();

    // Verify all numeric fields are proper numbers
    expect(typeof result.today_sales).toBe('number');
    expect(typeof result.today_transactions).toBe('number');
    expect(typeof result.low_stock_products).toBe('number');
    expect(typeof result.overdue_debts).toBe('number');

    expect(result.today_sales).toEqual(100);
    expect(result.today_transactions).toEqual(1);
    expect(result.low_stock_products).toEqual(1);
    expect(result.overdue_debts).toEqual(1);
  });
});
