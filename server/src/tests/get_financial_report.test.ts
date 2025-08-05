
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salesTable, expensesTable, customersTable, productsTable, saleItemsTable } from '../db/schema';
import { type FinancialReportInput } from '../schema';
import { getFinancialReport } from '../handlers/get_financial_report';

describe('getFinancialReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate financial report with no data', async () => {
    const input: FinancialReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    expect(result.period.start_date).toEqual(input.start_date);
    expect(result.period.end_date).toEqual(input.end_date);
    expect(result.revenue.total_sales).toBe(0);
    expect(result.revenue.sales_count).toBe(0);
    expect(result.expenses.total_expenses).toBe(0);
    expect(result.expenses.by_category).toHaveLength(0);
    expect(result.profit.gross_profit).toBe(0);
    expect(result.profit.net_profit).toBe(0);
    expect(result.profit.profit_margin).toBe(0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('should generate financial report with sales and expenses', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable).values({
      name: 'Test Customer',
      phone: null,
      address: null
    }).returning().execute();
    const customerId = customerResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable).values({
      name: 'Test Product',
      price: '100.00',
      unit: 'pcs',
      category: null,
      barcode: null,
      stock_quantity: 50,
      min_stock_threshold: 5
    }).returning().execute();
    const productId = productResult[0].id;

    // Create test sales
    const saleDate = new Date('2024-01-15T10:00:00Z');
    const saleResult = await db.insert(salesTable).values([
      {
        customer_id: customerId,
        total_amount: '200.00',
        discount_amount: '10.00',
        final_amount: '190.00',
        payment_method: 'cash',
        notes: null,
        created_at: saleDate,
        updated_at: saleDate
      },
      {
        customer_id: null,
        total_amount: '300.00',
        discount_amount: '0.00',
        final_amount: '300.00',
        payment_method: 'qris',
        notes: null,
        created_at: saleDate,
        updated_at: saleDate
      }
    ]).returning().execute();

    // Create sale items
    await db.insert(saleItemsTable).values([
      {
        sale_id: saleResult[0].id,
        product_id: productId,
        quantity: 2,
        unit_price: '100.00',
        total_price: '200.00'
      },
      {
        sale_id: saleResult[1].id,
        product_id: productId,
        quantity: 3,
        unit_price: '100.00',
        total_price: '300.00'
      }
    ]).execute();

    // Create test expenses
    const expenseDate = new Date('2024-01-15T12:00:00Z');
    await db.insert(expensesTable).values([
      {
        type: 'electricity',
        amount: '50.00',
        description: 'Monthly electricity bill',
        expense_date: expenseDate
      },
      {
        type: 'rent',
        amount: '100.00',
        description: 'Monthly rent',
        expense_date: expenseDate
      }
    ]).execute();

    const input: FinancialReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    // Verify period
    expect(result.period.start_date).toEqual(input.start_date);
    expect(result.period.end_date).toEqual(input.end_date);

    // Verify revenue
    expect(result.revenue.total_sales).toBe(490); // 190 + 300
    expect(result.revenue.sales_count).toBe(2);

    // Verify expenses
    expect(result.expenses.total_expenses).toBe(150); // 50 + 100
    expect(result.expenses.by_category).toHaveLength(2);
    
    const electricityExpense = result.expenses.by_category.find((e: any) => e.category === 'electricity');
    const rentExpense = result.expenses.by_category.find((e: any) => e.category === 'rent');
    expect(electricityExpense?.amount).toBe(50);
    expect(rentExpense?.amount).toBe(100);

    // Verify profit
    expect(result.profit.gross_profit).toBe(490);
    expect(result.profit.net_profit).toBe(340); // 490 - 150
    expect(result.profit.profit_margin).toBe(69.39); // (340/490) * 100 rounded

    // Verify breakdown
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].date).toBe('2024-01-15');
    expect(result.breakdown[0].sales).toBe(490);
    expect(result.breakdown[0].expenses).toBe(150);
    expect(result.breakdown[0].profit).toBe(340);
  });

  it('should filter data by date range', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable).values({
      name: 'Test Customer',
      phone: null,
      address: null
    }).returning().execute();
    const customerId = customerResult[0].id;

    // Create sales outside and inside date range
    const insideDate = new Date('2024-01-15T10:00:00Z');
    const outsideDate = new Date('2024-02-15T10:00:00Z');

    await db.insert(salesTable).values([
      {
        customer_id: customerId,
        total_amount: '100.00',
        discount_amount: '0.00',
        final_amount: '100.00',
        payment_method: 'cash',
        notes: null,
        created_at: insideDate,
        updated_at: insideDate
      },
      {
        customer_id: customerId,
        total_amount: '200.00',
        discount_amount: '0.00',
        final_amount: '200.00',
        payment_method: 'cash',
        notes: null,
        created_at: outsideDate,
        updated_at: outsideDate
      }
    ]).execute();

    // Create expenses inside and outside date range
    await db.insert(expensesTable).values([
      {
        type: 'electricity',
        amount: '30.00',
        description: 'Inside range',
        expense_date: insideDate
      },
      {
        type: 'rent',
        amount: '50.00',
        description: 'Outside range',
        expense_date: outsideDate
      }
    ]).execute();

    const input: FinancialReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    // Should only include data from January
    expect(result.revenue.total_sales).toBe(100);
    expect(result.revenue.sales_count).toBe(1);
    expect(result.expenses.total_expenses).toBe(30);
    expect(result.profit.net_profit).toBe(70); // 100 - 30
  });

  it('should handle zero profit margin correctly', async () => {
    // Create expenses without sales
    await db.insert(expensesTable).values({
      type: 'electricity',
      amount: '100.00',
      description: 'Only expense',
      expense_date: new Date('2024-01-15T12:00:00Z')
    }).execute();

    const input: FinancialReportInput = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };

    const result = await getFinancialReport(input);

    expect(result.revenue.total_sales).toBe(0);
    expect(result.expenses.total_expenses).toBe(100);
    expect(result.profit.gross_profit).toBe(0);
    expect(result.profit.net_profit).toBe(-100);
    expect(result.profit.profit_margin).toBe(0); // Should be 0 when no sales
  });
});
