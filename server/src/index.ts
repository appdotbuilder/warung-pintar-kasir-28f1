
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createProductInputSchema,
  updateProductInputSchema,
  createCustomerInputSchema,
  createSaleInputSchema,
  createExpenseInputSchema,
  createDebtCreditInputSchema,
  debtCreditPaymentInputSchema,
  stockAdjustmentInputSchema,
  salesReportInputSchema,
  financialReportInputSchema,
  createUserInputSchema
} from './schema';

// Handler imports
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { updateProduct } from './handlers/update_product';
import { getProductByBarcode } from './handlers/get_product_by_barcode';
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { createSale } from './handlers/create_sale';
import { getSales } from './handlers/get_sales';
import { getSaleDetails } from './handlers/get_sale_details';
import { createExpense } from './handlers/create_expense';
import { getExpenses } from './handlers/get_expenses';
import { createDebtCredit } from './handlers/create_debt_credit';
import { getDebtCredits } from './handlers/get_debt_credits';
import { payDebtCredit } from './handlers/pay_debt_credit';
import { adjustStock } from './handlers/adjust_stock';
import { getLowStockProducts } from './handlers/get_low_stock_products';
import { getDashboardSummary } from './handlers/get_dashboard_summary';
import { getSalesReport } from './handlers/get_sales_report';
import { getFinancialReport } from './handlers/get_financial_report';
import { createUser } from './handlers/create_user';
import { getSettings } from './handlers/get_settings';
import { updateSetting } from './handlers/update_setting';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
  
  getProducts: publicProcedure
    .query(() => getProducts()),
  
  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),
  
  getProductByBarcode: publicProcedure
    .input(z.string())
    .query(({ input }) => getProductByBarcode(input)),

  // Customer management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .query(() => getCustomers()),

  // Sales management
  createSale: publicProcedure
    .input(createSaleInputSchema)
    .mutation(({ input }) => createSale(input)),
  
  getSales: publicProcedure
    .query(() => getSales()),
  
  getSaleDetails: publicProcedure
    .input(z.number())
    .query(({ input }) => getSaleDetails(input)),

  // Expense management
  createExpense: publicProcedure
    .input(createExpenseInputSchema)
    .mutation(({ input }) => createExpense(input)),
  
  getExpenses: publicProcedure
    .query(() => getExpenses()),

  // Debt/Credit management
  createDebtCredit: publicProcedure
    .input(createDebtCreditInputSchema)
    .mutation(({ input }) => createDebtCredit(input)),
  
  getDebtCredits: publicProcedure
    .query(() => getDebtCredits()),
  
  payDebtCredit: publicProcedure
    .input(debtCreditPaymentInputSchema)
    .mutation(({ input }) => payDebtCredit(input)),

  // Stock management
  adjustStock: publicProcedure
    .input(stockAdjustmentInputSchema)
    .mutation(({ input }) => adjustStock(input)),
  
  getLowStockProducts: publicProcedure
    .query(() => getLowStockProducts()),

  // Dashboard
  getDashboardSummary: publicProcedure
    .query(() => getDashboardSummary()),

  // Reports
  getSalesReport: publicProcedure
    .input(salesReportInputSchema)
    .query(({ input }) => getSalesReport(input)),
  
  getFinancialReport: publicProcedure
    .input(financialReportInputSchema)
    .query(({ input }) => getFinancialReport(input)),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Settings
  getSettings: publicProcedure
    .query(() => getSettings()),
  
  updateSetting: publicProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(({ input }) => updateSetting(input.key, input.value)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Smart Warung Cashier TRPC server listening at port: ${port}`);
}

start();
