
import { db } from '../db';
import { salesTable, saleItemsTable, productsTable } from '../db/schema';
import { type SalesReportInput } from '../schema';
import { eq, and, gte, lte, desc, sum, count, sql } from 'drizzle-orm';

export async function getSalesReport(input: SalesReportInput) {
  try {
    // Build base conditions for date range
    // Ensure end_date includes the entire day by setting time to end of day
    const startDate = new Date(input.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(input.end_date);
    endDate.setHours(23, 59, 59, 999);

    const conditions = [
      gte(salesTable.created_at, startDate),
      lte(salesTable.created_at, endDate)
    ];

    // Add payment method filter if specified
    if (input.payment_method) {
      conditions.push(eq(salesTable.payment_method, input.payment_method));
    }

    // 1. Get summary statistics
    const summaryResult = await db.select({
      total_sales: sum(salesTable.final_amount),
      total_transactions: count(salesTable.id),
      total_discount: sum(salesTable.discount_amount)
    })
    .from(salesTable)
    .where(and(...conditions))
    .execute();

    const summary = summaryResult[0];
    const totalSales = summary.total_sales ? parseFloat(summary.total_sales) : 0;
    const totalTransactions = summary.total_transactions || 0;
    const totalDiscount = summary.total_discount ? parseFloat(summary.total_discount) : 0;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // 2. Get sales by payment method
    const paymentMethodResult = await db.select({
      payment_method: salesTable.payment_method,
      total_amount: sum(salesTable.final_amount),
      transaction_count: count(salesTable.id)
    })
    .from(salesTable)
    .where(and(...conditions))
    .groupBy(salesTable.payment_method)
    .orderBy(desc(sum(salesTable.final_amount)))
    .execute();

    const byPaymentMethod = paymentMethodResult.map(row => ({
      payment_method: row.payment_method,
      total_amount: row.total_amount ? parseFloat(row.total_amount) : 0,
      transaction_count: row.transaction_count || 0
    }));

    // 3. Get daily breakdown
    const dailyResult = await db.select({
      date: sql<string>`DATE(${salesTable.created_at})`,
      total_amount: sum(salesTable.final_amount),
      transaction_count: count(salesTable.id)
    })
    .from(salesTable)
    .where(and(...conditions))
    .groupBy(sql`DATE(${salesTable.created_at})`)
    .orderBy(sql`DATE(${salesTable.created_at})`)
    .execute();

    const dailyBreakdown = dailyResult.map(row => ({
      date: row.date,
      total_amount: row.total_amount ? parseFloat(row.total_amount) : 0,
      transaction_count: row.transaction_count || 0
    }));

    // 4. Get top selling products
    const topProductsResult = await db.select({
      product_name: productsTable.name,
      total_quantity: sum(saleItemsTable.quantity),
      total_revenue: sum(saleItemsTable.total_price)
    })
    .from(saleItemsTable)
    .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
    .innerJoin(productsTable, eq(saleItemsTable.product_id, productsTable.id))
    .where(and(...conditions))
    .groupBy(productsTable.id, productsTable.name)
    .orderBy(desc(sum(saleItemsTable.quantity)))
    .limit(10)
    .execute();

    const topProducts = topProductsResult.map(row => ({
      product_name: row.product_name,
      total_quantity: row.total_quantity ? parseInt(row.total_quantity) : 0, // Convert to number
      total_revenue: row.total_revenue ? parseFloat(row.total_revenue) : 0
    }));

    return {
      period: {
        start_date: input.start_date,
        end_date: input.end_date,
        payment_method: input.payment_method || null
      },
      summary: {
        total_sales: totalSales,
        total_transactions: totalTransactions,
        total_discount: totalDiscount,
        average_transaction: Math.round(averageTransaction * 100) / 100 // Round to 2 decimal places
      },
      by_payment_method: byPaymentMethod,
      daily_breakdown: dailyBreakdown,
      top_products: topProducts
    };
  } catch (error) {
    console.error('Sales report generation failed:', error);
    throw error;
  }
}
