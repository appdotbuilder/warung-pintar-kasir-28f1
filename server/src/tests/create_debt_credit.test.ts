
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { debtCreditsTable, customersTable } from '../db/schema';
import { type CreateDebtCreditInput, type CreateCustomerInput } from '../schema';
import { createDebtCredit } from '../handlers/create_debt_credit';
import { eq } from 'drizzle-orm';

describe('createDebtCredit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create a test customer
  const createTestCustomer = async (): Promise<number> => {
    const customerInput: CreateCustomerInput = {
      name: 'Test Customer',
      phone: '123456789',
      address: 'Test Address'
    };

    const result = await db.insert(customersTable)
      .values(customerInput)
      .returning()
      .execute();

    return result[0].id;
  };

  it('should create a debt record', async () => {
    const customerId = await createTestCustomer();
    
    const testInput: CreateDebtCreditInput = {
      customer_id: customerId,
      type: 'debt',
      amount: 150000,
      description: 'Product purchase on credit',
      due_date: new Date('2024-12-31')
    };

    const result = await createDebtCredit(testInput);

    // Basic field validation
    expect(result.customer_id).toEqual(customerId);
    expect(result.type).toEqual('debt');
    expect(result.amount).toEqual(150000);
    expect(result.remaining_amount).toEqual(150000); // Initially full amount remains
    expect(result.description).toEqual('Product purchase on credit');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.is_paid).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.amount).toBe('number');
    expect(typeof result.remaining_amount).toBe('number');
  });

  it('should create a credit record', async () => {
    const customerId = await createTestCustomer();
    
    const testInput: CreateDebtCreditInput = {
      customer_id: customerId,
      type: 'credit',
      amount: 75000,
      description: 'Return overpayment',
      due_date: null
    };

    const result = await createDebtCredit(testInput);

    expect(result.customer_id).toEqual(customerId);
    expect(result.type).toEqual('credit');
    expect(result.amount).toEqual(75000);
    expect(result.remaining_amount).toEqual(75000);
    expect(result.description).toEqual('Return overpayment');
    expect(result.due_date).toBeNull();
    expect(result.is_paid).toEqual(false);
  });

  it('should save debt/credit to database', async () => {
    const customerId = await createTestCustomer();
    
    const testInput: CreateDebtCreditInput = {
      customer_id: customerId,
      type: 'debt',
      amount: 200000,
      description: 'Monthly supplies',
      due_date: new Date('2024-11-30')
    };

    const result = await createDebtCredit(testInput);

    // Query using proper drizzle syntax
    const debtCredits = await db.select()
      .from(debtCreditsTable)
      .where(eq(debtCreditsTable.id, result.id))
      .execute();

    expect(debtCredits).toHaveLength(1);
    expect(debtCredits[0].customer_id).toEqual(customerId);
    expect(debtCredits[0].type).toEqual('debt');
    expect(parseFloat(debtCredits[0].amount)).toEqual(200000);
    expect(parseFloat(debtCredits[0].remaining_amount)).toEqual(200000);
    expect(debtCredits[0].description).toEqual('Monthly supplies');
    expect(debtCredits[0].due_date).toEqual(new Date('2024-11-30'));
    expect(debtCredits[0].is_paid).toEqual(false);
    expect(debtCredits[0].created_at).toBeInstanceOf(Date);
    expect(debtCredits[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description and due_date', async () => {
    const customerId = await createTestCustomer();
    
    const testInput: CreateDebtCreditInput = {
      customer_id: customerId,
      type: 'credit',
      amount: 50000,
      description: null,
      due_date: null
    };

    const result = await createDebtCredit(testInput);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.amount).toEqual(50000);
    expect(result.remaining_amount).toEqual(50000);
  });

  it('should throw error when customer does not exist', async () => {
    const testInput: CreateDebtCreditInput = {
      customer_id: 99999, // Non-existent customer ID
      type: 'debt',
      amount: 100000,
      description: 'Test debt',
      due_date: new Date('2024-12-31')
    };

    await expect(createDebtCredit(testInput)).rejects.toThrow(/customer.*not found/i);
  });
});
