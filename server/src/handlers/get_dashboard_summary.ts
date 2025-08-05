
import { db } from '../db';
import { 
  salesTable, 
  productsTable, 
  debtCreditsTable, 
  saleItemsTable 
} from '../db/schema';
import { type DashboardSummary } from '../schema';
import { sql, eq, lt, and, gte } from 'drizzle-orm';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's sales data
    const todaySalesResult = await db
      .select({
        total_sales: sql<string>`COALESCE(SUM(${salesTable.final_amount}), 0)`,
        transaction_count: sql<string>`COUNT(*)`
      })
      .from(salesTable)
      .where(
        and(
          gte(salesTable.created_at, today),
          lt(salesTable.created_at, tomorrow)
        )
      )
      .execute();

    const todaySales = todaySalesResult[0];
    const today_sales = parseFloat(todaySales.total_sales);
    const today_transactions = parseInt(todaySales.transaction_count);

    // 2. Low stock products count
    const lowStockResult = await db
      .select({
        count: sql<string>`COUNT(*)`
      })
      .from(productsTable)
      .where(
        and(
          sql`${productsTable.stock_quantity} <= ${productsTable.min_stock_threshold}`,
          eq(productsTable.is_active, true)
        )
      )
      .execute();

    const low_stock_products = parseInt(lowStockResult[0].count);

    // 3. Overdue debts count
    const overdueDebtsResult = await db
      .select({
        count: sql<string>`COUNT(*)`
      })
      .from(debtCreditsTable)
      .where(
        and(
          eq(debtCreditsTable.is_paid, false),
          lt(debtCreditsTable.due_date, today),
          sql`${debtCreditsTable.due_date} IS NOT NULL`
        )
      )
      .execute();

    const overdue_debts = parseInt(overdueDebtsResult[0].count);

    // 4. Top selling products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProductsResult = await db
      .select({
        product_name: productsTable.name,
        total_sold: sql<string>`SUM(${saleItemsTable.quantity})`
      })
      .from(saleItemsTable)
      .innerJoin(salesTable, eq(saleItemsTable.sale_id, salesTable.id))
      .innerJoin(productsTable, eq(saleItemsTable.product_id, productsTable.id))
      .where(gte(salesTable.created_at, thirtyDaysAgo))
      .groupBy(productsTable.id, productsTable.name)
      .orderBy(sql`SUM(${saleItemsTable.quantity}) DESC`)
      .limit(5)
      .execute();

    const top_selling_products = topProductsResult.map(product => ({
      product_name: product.product_name,
      total_sold: parseInt(product.total_sold)
    }));

    return {
      today_sales,
      today_transactions,
      low_stock_products,
      overdue_debts,
      top_selling_products
    };
  } catch (error) {
    console.error('Dashboard summary generation failed:', error);
    throw error;
  }
}
