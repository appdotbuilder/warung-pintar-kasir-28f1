
import { db } from '../db';
import { salesTable, expensesTable } from '../db/schema';
import { type FinancialReportInput } from '../schema';
import { gte, lte, and, eq, sum, count } from 'drizzle-orm';

export async function getFinancialReport(input: FinancialReportInput) {
  try {
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Get total revenue from sales
    const revenueQuery = await db
      .select({
        total_sales: sum(salesTable.final_amount),
        sales_count: count(salesTable.id)
      })
      .from(salesTable)
      .where(
        and(
          gte(salesTable.created_at, startDate),
          lte(salesTable.created_at, endDate)
        )
      )
      .execute();

    const revenue = revenueQuery[0];
    const totalSales = revenue.total_sales ? parseFloat(revenue.total_sales) : 0;
    const salesCount = revenue.sales_count || 0;

    // Get total expenses
    const expensesQuery = await db
      .select({
        total_expenses: sum(expensesTable.amount)
      })
      .from(expensesTable)
      .where(
        and(
          gte(expensesTable.expense_date, startDate),
          lte(expensesTable.expense_date, endDate)
        )
      )
      .execute();

    const totalExpenses = expensesQuery[0].total_expenses ? parseFloat(expensesQuery[0].total_expenses) : 0;

    // Get expenses by category
    const expensesByCategoryQuery = await db
      .select({
        type: expensesTable.type,
        total_amount: sum(expensesTable.amount)
      })
      .from(expensesTable)
      .where(
        and(
          gte(expensesTable.expense_date, startDate),
          lte(expensesTable.expense_date, endDate)
        )
      )
      .groupBy(expensesTable.type)
      .execute();

    const expensesByCategory = expensesByCategoryQuery.map(expense => ({
      category: expense.type,
      amount: parseFloat(expense.total_amount || '0')
    }));

    // Calculate profit metrics
    const grossProfit = totalSales; // In a simple retail business, gross profit equals total sales
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    // Get daily breakdown
    const dailySalesQuery = await db
      .select({
        date: salesTable.created_at,
        daily_sales: sum(salesTable.final_amount)
      })
      .from(salesTable)
      .where(
        and(
          gte(salesTable.created_at, startDate),
          lte(salesTable.created_at, endDate)
        )
      )
      .groupBy(salesTable.created_at)
      .execute();

    const dailyExpensesQuery = await db
      .select({
        date: expensesTable.expense_date,
        daily_expenses: sum(expensesTable.amount)
      })
      .from(expensesTable)
      .where(
        and(
          gte(expensesTable.expense_date, startDate),
          lte(expensesTable.expense_date, endDate)
        )
      )
      .groupBy(expensesTable.expense_date)
      .execute();

    // Create a map for daily data
    const dailyData = new Map<string, { sales: number; expenses: number }>();

    // Process daily sales
    dailySalesQuery.forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { sales: 0, expenses: 0 };
      existing.sales += parseFloat(row.daily_sales || '0');
      dailyData.set(dateKey, existing);
    });

    // Process daily expenses
    dailyExpensesQuery.forEach(row => {
      const dateKey = row.date.toISOString().split('T')[0];
      const existing = dailyData.get(dateKey) || { sales: 0, expenses: 0 };
      existing.expenses += parseFloat(row.daily_expenses || '0');
      dailyData.set(dateKey, existing);
    });

    // Convert to breakdown array
    const breakdown = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      expenses: data.expenses,
      profit: data.sales - data.expenses
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        start_date: input.start_date,
        end_date: input.end_date
      },
      revenue: {
        total_sales: totalSales,
        sales_count: salesCount
      },
      expenses: {
        total_expenses: totalExpenses,
        by_category: expensesByCategory
      },
      profit: {
        gross_profit: grossProfit,
        net_profit: netProfit,
        profit_margin: Math.round(profitMargin * 100) / 100 // Round to 2 decimal places
      },
      breakdown
    };
  } catch (error) {
    console.error('Financial report generation failed:', error);
    throw error;
  }
}
