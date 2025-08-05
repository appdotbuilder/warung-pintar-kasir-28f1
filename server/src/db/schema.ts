
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  pgEnum,
  foreignKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'qris', 'transfer']);
export const expenseTypeEnum = pgEnum('expense_type', ['capital', 'electricity', 'rent', 'salary', 'other']);
export const userRoleEnum = pgEnum('user_role', ['cashier', 'owner']);
export const debtCreditTypeEnum = pgEnum('debt_credit_type', ['debt', 'credit']);
export const movementTypeEnum = pgEnum('movement_type', ['in', 'out', 'adjustment']);
export const referenceTypeEnum = pgEnum('reference_type', ['sale', 'purchase', 'adjustment']);

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull(),
  category: text('category'),
  barcode: text('barcode'),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  min_stock_threshold: integer('min_stock_threshold').notNull().default(5),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Sales table
export const salesTable = pgTable('sales', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  final_amount: numeric('final_amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerReference: foreignKey({
    columns: [table.customer_id],
    foreignColumns: [customersTable.id],
    name: "sales_customer_id_fkey"
  })
}));

// Sale items table
export const saleItemsTable = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  sale_id: integer('sale_id').notNull(),
  product_id: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  saleReference: foreignKey({
    columns: [table.sale_id],
    foreignColumns: [salesTable.id],
    name: "sale_items_sale_id_fkey"
  }),
  productReference: foreignKey({
    columns: [table.product_id],
    foreignColumns: [productsTable.id],
    name: "sale_items_product_id_fkey"
  })
}));

// Expenses table
export const expensesTable = pgTable('expenses', {
  id: serial('id').primaryKey(),
  type: expenseTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  expense_date: timestamp('expense_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Debt/Credit table
export const debtCreditsTable = pgTable('debt_credits', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull(),
  type: debtCreditTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  remaining_amount: numeric('remaining_amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  due_date: timestamp('due_date'),
  is_paid: boolean('is_paid').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  customerReference: foreignKey({
    columns: [table.customer_id],
    foreignColumns: [customersTable.id],
    name: "debt_credits_customer_id_fkey"
  })
}));

// Stock movements table
export const stockMovementsTable = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull(),
  movement_type: movementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  reference_type: referenceTypeEnum('reference_type'),
  reference_id: integer('reference_id'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  productReference: foreignKey({
    columns: [table.product_id],
    foreignColumns: [productsTable.id],
    name: "stock_movements_product_id_fkey"
  })
}));

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Settings table
export const settingsTable = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  saleItems: many(saleItemsTable),
  stockMovements: many(stockMovementsTable),
}));

export const customersRelations = relations(customersTable, ({ many }) => ({
  sales: many(salesTable),
  debtCredits: many(debtCreditsTable),
}));

export const salesRelations = relations(salesTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [salesTable.customer_id],
    references: [customersTable.id],
  }),
  items: many(saleItemsTable),
}));

export const saleItemsRelations = relations(saleItemsTable, ({ one }) => ({
  sale: one(salesTable, {
    fields: [saleItemsTable.sale_id],
    references: [salesTable.id],
  }),
  product: one(productsTable, {
    fields: [saleItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const debtCreditsRelations = relations(debtCreditsTable, ({ one }) => ({
  customer: one(customersTable, {
    fields: [debtCreditsTable.customer_id],
    references: [customersTable.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovementsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [stockMovementsTable.product_id],
    references: [productsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  products: productsTable,
  customers: customersTable,
  sales: salesTable,
  saleItems: saleItemsTable,
  expenses: expensesTable,
  debtCredits: debtCreditsTable,
  stockMovements: stockMovementsTable,
  users: usersTable,
  settings: settingsTable,
};
