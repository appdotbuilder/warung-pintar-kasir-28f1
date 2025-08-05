
import { z } from 'zod';

// Enums
export const paymentMethodEnum = z.enum(['cash', 'qris', 'transfer']);
export const expenseTypeEnum = z.enum(['capital', 'electricity', 'rent', 'salary', 'other']);
export const userRoleEnum = z.enum(['cashier', 'owner']);
export const debtCreditTypeEnum = z.enum(['debt', 'credit']);

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  unit: z.string(),
  category: z.string().nullable(),
  barcode: z.string().nullable(),
  stock_quantity: z.number().int(),
  min_stock_threshold: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  category: z.string().nullable(),
  barcode: z.string().nullable(),
  stock_quantity: z.number().int().nonnegative(),
  min_stock_threshold: z.number().int().nonnegative().default(5)
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  min_stock_threshold: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Sale schema
export const saleSchema = z.object({
  id: z.number(),
  customer_id: z.number().nullable(),
  total_amount: z.number(),
  discount_amount: z.number(),
  final_amount: z.number(),
  payment_method: paymentMethodEnum,
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Sale = z.infer<typeof saleSchema>;

export const saleItemSchema = z.object({
  id: z.number(),
  sale_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  unit_price: z.number(),
  total_price: z.number(),
  created_at: z.coerce.date()
});

export type SaleItem = z.infer<typeof saleItemSchema>;

export const createSaleInputSchema = z.object({
  customer_id: z.number().nullable(),
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().int().positive(),
    unit_price: z.number().positive()
  })).min(1, 'At least one item is required'),
  discount_amount: z.number().nonnegative().default(0),
  payment_method: paymentMethodEnum,
  notes: z.string().nullable()
});

export type CreateSaleInput = z.infer<typeof createSaleInputSchema>;

// Expense schema
export const expenseSchema = z.object({
  id: z.number(),
  type: expenseTypeEnum,
  amount: z.number(),
  description: z.string().nullable(),
  expense_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Expense = z.infer<typeof expenseSchema>;

export const createExpenseInputSchema = z.object({
  type: expenseTypeEnum,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().nullable(),
  expense_date: z.coerce.date().default(() => new Date())
});

export type CreateExpenseInput = z.infer<typeof createExpenseInputSchema>;

// Debt/Credit schema
export const debtCreditSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  type: debtCreditTypeEnum,
  amount: z.number(),
  remaining_amount: z.number(),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  is_paid: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DebtCredit = z.infer<typeof debtCreditSchema>;

export const createDebtCreditInputSchema = z.object({
  customer_id: z.number(),
  type: debtCreditTypeEnum,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable()
});

export type CreateDebtCreditInput = z.infer<typeof createDebtCreditInputSchema>;

export const debtCreditPaymentInputSchema = z.object({
  debt_credit_id: z.number(),
  payment_amount: z.number().positive('Payment amount must be positive'),
  notes: z.string().nullable()
});

export type DebtCreditPaymentInput = z.infer<typeof debtCreditPaymentInputSchema>;

// Stock Movement schema
export const stockMovementSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  movement_type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().int(),
  reference_type: z.enum(['sale', 'purchase', 'adjustment']).nullable(),
  reference_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StockMovement = z.infer<typeof stockMovementSchema>;

export const stockAdjustmentInputSchema = z.object({
  product_id: z.number(),
  new_quantity: z.number().int().nonnegative(),
  notes: z.string().nullable()
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentInputSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Settings schema
export const settingsSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Settings = z.infer<typeof settingsSchema>;

// Dashboard summary schema
export const dashboardSummarySchema = z.object({
  today_sales: z.number(),
  today_transactions: z.number().int(),
  low_stock_products: z.number().int(),
  overdue_debts: z.number().int(),
  top_selling_products: z.array(z.object({
    product_name: z.string(),
    total_sold: z.number().int()
  }))
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// Report schemas
export const salesReportInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  payment_method: paymentMethodEnum.optional()
});

export type SalesReportInput = z.infer<typeof salesReportInputSchema>;

export const financialReportInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type FinancialReportInput = z.infer<typeof financialReportInputSchema>;
