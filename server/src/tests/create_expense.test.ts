
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { createExpense } from '../handlers/create_expense';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateExpenseInput = {
  type: 'rent',
  amount: 500000,
  description: 'Monthly rent payment',
  expense_date: new Date('2024-01-15')
};

describe('createExpense', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an expense', async () => {
    const result = await createExpense(testInput);

    // Basic field validation
    expect(result.type).toEqual('rent');
    expect(result.amount).toEqual(500000);
    expect(typeof result.amount).toBe('number');
    expect(result.description).toEqual('Monthly rent payment');
    expect(result.expense_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save expense to database', async () => {
    const result = await createExpense(testInput);

    // Query using proper drizzle syntax
    const expenses = await db.select()
      .from(expensesTable)
      .where(eq(expensesTable.id, result.id))
      .execute();

    expect(expenses).toHaveLength(1);
    expect(expenses[0].type).toEqual('rent');
    expect(parseFloat(expenses[0].amount)).toEqual(500000);
    expect(expenses[0].description).toEqual('Monthly rent payment');
    expect(expenses[0].expense_date).toEqual(new Date('2024-01-15'));
    expect(expenses[0].created_at).toBeInstanceOf(Date);
    expect(expenses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle expense with null description', async () => {
    const inputWithNullDescription: CreateExpenseInput = {
      type: 'electricity',
      amount: 150000,
      description: null,
      expense_date: new Date('2024-01-20')
    };

    const result = await createExpense(inputWithNullDescription);

    expect(result.type).toEqual('electricity');
    expect(result.amount).toEqual(150000);
    expect(result.description).toBeNull();
    expect(result.expense_date).toEqual(new Date('2024-01-20'));
    expect(result.id).toBeDefined();
  });

  it('should handle different expense types', async () => {
    const salaryExpense: CreateExpenseInput = {
      type: 'salary',
      amount: 3000000,
      description: 'Employee monthly salary',
      expense_date: new Date('2024-01-31')
    };

    const result = await createExpense(salaryExpense);

    expect(result.type).toEqual('salary');
    expect(result.amount).toEqual(3000000);
    expect(result.description).toEqual('Employee monthly salary');
  });

  it('should use default expense_date when provided', async () => {
    const today = new Date();
    const expenseWithToday: CreateExpenseInput = {
      type: 'other',
      amount: 75000,
      description: 'Miscellaneous expense',
      expense_date: today
    };

    const result = await createExpense(expenseWithToday);

    expect(result.expense_date.getTime()).toEqual(today.getTime());
  });
});
