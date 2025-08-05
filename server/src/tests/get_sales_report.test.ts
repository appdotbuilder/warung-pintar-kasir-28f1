
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, customersTable, salesTable, saleItemsTable } from '../db/schema';
import { type SalesReportInput } from '../schema';
import { getSalesReport } from '../handlers/get_sales_report';

describe('getSalesReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  const createTestData = async () => {
    // Create products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Product A',
          price: '10.00',
          unit: 'pcs',
          stock_quantity: 100,
          min_stock_threshold: 5
        },
        {
          name: 'Product B',
          price: '25.50',
          unit: 'pcs',
          stock_quantity: 50,
          min_stock_threshold: 5
        }
      ])
      .returning()
      .execute();

    // Create customer
    const customers = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '123456789'
      })
      .returning()
      .execute();

    // Use specific dates for consistent testing
    const date1 = new Date('2024-06-01T10:00:00Z');
    const date2 = new Date('2024-06-02T14:30:00Z');

    // Create sales with different dates and payment methods
    const sales = await db.insert(salesTable)
      .values([
        {
          customer_id: customers[0].id,
          total_amount: '100.00',
          discount_amount: '10.00',
          final_amount: '90.00',
          payment_method: 'cash',
          created_at: date1
        },
        {
          customer_id: customers[0].id,
          total_amount: '200.00',
          discount_amount: '0.00',
          final_amount: '200.00',
          payment_method: 'qris',
          created_at: date2
        },
        {
          customer_id: null,
          total_amount: '50.00',
          discount_amount: '5.00',
          final_amount: '45.00',
          payment_method: 'cash',
          created_at: date2
        }
      ])
      .returning()
      .execute();

    // Create sale items
    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: sales[0].id,
          product_id: products[0].id,
          quantity: 10,
          unit_price: '10.00',
          total_price: '100.00'
        },
        {
          sale_id: sales[1].id,
          product_id: products[1].id,
          quantity: 8,
          unit_price: '25.00',
          total_price: '200.00'
        },
        {
          sale_id: sales[2].id,
          product_id: products[0].id,
          quantity: 5,
          unit_price: '10.00',
          total_price: '50.00'
        }
      ])
      .execute();

    return { products, customers, sales };
  };

  it('should generate complete sales report', async () => {
    await createTestData();

    const input: SalesReportInput = {
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-06-02')
    };

    const result = await getSalesReport(input);

    // Check period
    expect(result.period.start_date).toEqual(input.start_date);
    expect(result.period.end_date).toEqual(input.end_date);
    expect(result.period.payment_method).toBeNull();

    // Check summary
    expect(result.summary.total_sales).toEqual(335); // 90 + 200 + 45
    expect(result.summary.total_transactions).toEqual(3);
    expect(result.summary.total_discount).toEqual(15); // 10 + 0 + 5
    expect(result.summary.average_transaction).toEqual(111.67); // 335/3 rounded to 2 decimals

    // Check payment methods
    expect(result.by_payment_method).toHaveLength(2);
    const cashMethod = result.by_payment_method.find(p => p.payment_method === 'cash');
    const qrisMethod = result.by_payment_method.find(p => p.payment_method === 'qris');
    
    expect(cashMethod).toBeDefined();
    expect(cashMethod!.total_amount).toEqual(135); // 90 + 45
    expect(cashMethod!.transaction_count).toEqual(2);
    
    expect(qrisMethod).toBeDefined();
    expect(qrisMethod!.total_amount).toEqual(200);
    expect(qrisMethod!.transaction_count).toEqual(1);

    // Check daily breakdown
    expect(result.daily_breakdown.length).toBeGreaterThan(0);

    // Check top products
    expect(result.top_products).toHaveLength(2);
    const topProduct = result.top_products[0];
    expect(topProduct.product_name).toEqual('Product A');
    expect(topProduct.total_quantity).toEqual(15); // 10 + 5
    expect(typeof topProduct.total_quantity).toBe('number');
    expect(topProduct.total_revenue).toEqual(150); // 100 + 50
  });

  it('should filter by payment method', async () => {
    await createTestData();

    const input: SalesReportInput = {
      start_date: new Date('2024-06-01'),
      end_date: new Date('2024-06-02'),
      payment_method: 'cash'
    };

    const result = await getSalesReport(input);

    expect(result.period.payment_method).toEqual('cash');
    expect(result.summary.total_sales).toEqual(135); // Only cash transactions
    expect(result.summary.total_transactions).toEqual(2);
    expect(result.by_payment_method).toHaveLength(1);
    expect(result.by_payment_method[0].payment_method).toEqual('cash');
  });

  it('should handle date range filtering', async () => {
    await createTestData();

    // Only include June 2nd data
    const input: SalesReportInput = {
      start_date: new Date('2024-06-02'),
      end_date: new Date('2024-06-02')
    };

    const result = await getSalesReport(input);

    // Should only include June 2nd transactions
    expect(result.summary.total_sales).toEqual(245); // 200 + 45 (June 2nd sales)
    expect(result.summary.total_transactions).toEqual(2);
  });

  it('should return empty report for no data', async () => {
    const input: SalesReportInput = {
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-01-31')
    };

    const result = await getSalesReport(input);

    expect(result.summary.total_sales).toEqual(0);
    expect(result.summary.total_transactions).toEqual(0);
    expect(result.summary.total_discount).toEqual(0);
    expect(result.summary.average_transaction).toEqual(0);
    expect(result.by_payment_method).toHaveLength(0);
    expect(result.daily_breakdown).toHaveLength(0);
    expect(result.top_products).toHaveLength(0);
  });

  it('should handle single transaction correctly', async () => {
    const products = await db.insert(productsTable)
      .values({
        name: 'Single Product',
        price: '15.00',
        unit: 'pcs',
        stock_quantity: 10,
        min_stock_threshold: 5
      })
      .returning()
      .execute();

    const sales = await db.insert(salesTable)
      .values({
        customer_id: null,
        total_amount: '30.00',
        discount_amount: '2.50',
        final_amount: '27.50',
        payment_method: 'transfer',
        created_at: new Date('2024-06-15T12:00:00Z')
      })
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values({
        sale_id: sales[0].id,
        product_id: products[0].id,
        quantity: 2,
        unit_price: '15.00',
        total_price: '30.00'
      })
      .execute();

    const input: SalesReportInput = {
      start_date: new Date('2024-06-15'),
      end_date: new Date('2024-06-15')
    };

    const result = await getSalesReport(input);

    expect(result.summary.total_sales).toEqual(27.5);
    expect(result.summary.total_transactions).toEqual(1);
    expect(result.summary.average_transaction).toEqual(27.5);
    expect(result.by_payment_method).toHaveLength(1);
    expect(result.by_payment_method[0].payment_method).toEqual('transfer');
    expect(result.top_products).toHaveLength(1);
    expect(result.top_products[0].product_name).toEqual('Single Product');
  });

  it('should order top products by quantity sold', async () => {
    const products = await db.insert(productsTable)
      .values([
        { name: 'Low Volume', price: '100.00', unit: 'pcs', stock_quantity: 100, min_stock_threshold: 5 },
        { name: 'High Volume', price: '5.00', unit: 'pcs', stock_quantity: 100, min_stock_threshold: 5 }
      ])
      .returning()
      .execute();

    const sales = await db.insert(salesTable)
      .values([
        {
          customer_id: null,
          total_amount: '100.00',
          discount_amount: '0.00',
          final_amount: '100.00',
          payment_method: 'cash',
          created_at: new Date('2024-06-20T10:00:00Z')
        },
        {
          customer_id: null,
          total_amount: '50.00',
          discount_amount: '0.00',
          final_amount: '50.00',
          payment_method: 'cash',
          created_at: new Date('2024-06-20T11:00:00Z')
        }
      ])
      .returning()
      .execute();

    await db.insert(saleItemsTable)
      .values([
        {
          sale_id: sales[0].id,
          product_id: products[0].id, // Low Volume: 1 unit, high price
          quantity: 1,
          unit_price: '100.00',
          total_price: '100.00'
        },
        {
          sale_id: sales[1].id,
          product_id: products[1].id, // High Volume: 10 units, low price
          quantity: 10,
          unit_price: '5.00',
          total_price: '50.00'
        }
      ])
      .execute();

    const input: SalesReportInput = {
      start_date: new Date('2024-06-20'),
      end_date: new Date('2024-06-20')
    };

    const result = await getSalesReport(input);

    expect(result.top_products).toHaveLength(2);
    expect(result.top_products[0].product_name).toEqual('High Volume'); // Higher quantity sold
    expect(result.top_products[0].total_quantity).toEqual(10);
    expect(typeof result.top_products[0].total_quantity).toBe('number');
    expect(result.top_products[1].product_name).toEqual('Low Volume');
    expect(result.top_products[1].total_quantity).toEqual(1);
  });
});
