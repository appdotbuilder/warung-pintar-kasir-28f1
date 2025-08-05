
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { expensesTable } from '../db/schema';
import { type CreateExpenseInput } from '../schema';
import { getExpenses } from '../handlers/get_expenses';

// Test expense data
const testExpenses: CreateExpenseInput[] = [
  {
    type: 'electricity',
    amount: 150.50,
    description: 'Monthly electricity bill',
    expense_date: new Date('2024-01-15')
  },
  {
    type: 'rent',
    amount: 2000.00,
    description: 'Store rent for January',
    expense_date: new Date('2024-01-10')
  },
  {
    type: 'salary',
    amount: 3500.75,
    description: 'Employee salary',
    expense_date: new Date('2024-01-20')
  }
];

describe('getExpenses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no expenses exist', async () => {
    const result = await getExpenses();

    expect(result).toEqual([]);
  });

  it('should return all expenses ordered by expense_date desc', async () => {
    // Insert test expenses
    await db.insert(expensesTable)
      .values(testExpenses.map(expense => ({
        ...expense,
        amount: expense.amount.toString()
      })))
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent expense_date first
    expect(result[0].expense_date).toEqual(new Date('2024-01-20'));
    expect(result[1].expense_date).toEqual(new Date('2024-01-15'));
    expect(result[2].expense_date).toEqual(new Date('2024-01-10'));
  });

  it('should return expenses with correct data types', async () => {
    // Insert single test expense
    await db.insert(expensesTable)
      .values({
        type: 'other',
        amount: '199.99',
        description: 'Test expense',
        expense_date: new Date('2024-01-01')
      })
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(1);
    const expense = result[0];

    // Verify all fields and types
    expect(expense.id).toBeDefined();
    expect(typeof expense.id).toBe('number');
    expect(expense.type).toBe('other');
    expect(expense.amount).toBe(199.99);
    expect(typeof expense.amount).toBe('number');
    expect(expense.description).toBe('Test expense');
    expect(expense.expense_date).toBeInstanceOf(Date);
    expect(expense.created_at).toBeInstanceOf(Date);
    expect(expense.updated_at).toBeInstanceOf(Date);
  });

  it('should handle expenses with null description', async () => {
    // Insert expense with null description
    await db.insert(expensesTable)
      .values({
        type: 'capital',
        amount: '500.00',
        description: null,
        expense_date: new Date('2024-01-01')
      })
      .execute();

    const result = await getExpenses();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].amount).toBe(500.00);
  });
});
