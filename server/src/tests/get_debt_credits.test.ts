
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, debtCreditsTable } from '../db/schema';
import { type CreateCustomerInput, type CreateDebtCreditInput } from '../schema';
import { getDebtCredits } from '../handlers/get_debt_credits';

describe('getDebtCredits', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no debt/credit records exist', async () => {
    const result = await getDebtCredits();
    expect(result).toEqual([]);
  });

  it('should fetch debt/credit records with proper numeric conversion', async () => {
    // Create customer first
    const customerData: CreateCustomerInput = {
      name: 'Test Customer',
      phone: '123456789',
      address: 'Test Address'
    };

    const customerResult = await db.insert(customersTable)
      .values(customerData)
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create debt record
    const debtData: CreateDebtCreditInput = {
      customer_id: customerId,
      type: 'debt',
      amount: 100.50,
      description: 'Test debt',
      due_date: new Date('2024-12-31')
    };

    await db.insert(debtCreditsTable)
      .values({
        ...debtData,
        amount: debtData.amount.toString(),
        remaining_amount: debtData.amount.toString()
      })
      .execute();

    const results = await getDebtCredits();

    expect(results).toHaveLength(1);
    expect(results[0].customer_id).toEqual(customerId);
    expect(results[0].type).toEqual('debt');
    expect(results[0].amount).toEqual(100.50);
    expect(typeof results[0].amount).toEqual('number');
    expect(results[0].remaining_amount).toEqual(100.50);
    expect(typeof results[0].remaining_amount).toEqual('number');
    expect(results[0].description).toEqual('Test debt');
    expect(results[0].is_paid).toEqual(false);
  });

  it('should order records by is_paid, due_date, and created_at', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create multiple debt/credit records with different dates and payment status
    const records = [
      {
        customer_id: customerId,
        type: 'debt' as const,
        amount: '100.00',
        remaining_amount: '100.00',
        description: 'Paid debt',
        due_date: new Date('2024-01-15'),
        is_paid: true
      },
      {
        customer_id: customerId,
        type: 'debt' as const,
        amount: '200.00',
        remaining_amount: '200.00',
        description: 'Unpaid debt - later due',
        due_date: new Date('2024-02-15'),
        is_paid: false
      },
      {
        customer_id: customerId,
        type: 'debt' as const,
        amount: '150.00',
        remaining_amount: '150.00',
        description: 'Unpaid debt - earlier due',
        due_date: new Date('2024-01-10'),
        is_paid: false
      }
    ];

    // Insert records in random order
    for (const record of records) {
      await db.insert(debtCreditsTable).values(record).execute();
    }

    const results = await getDebtCredits();

    expect(results).toHaveLength(3);

    // First two should be unpaid (is_paid = false), ordered by due_date
    expect(results[0].is_paid).toEqual(false);
    expect(results[0].description).toEqual('Unpaid debt - earlier due');
    expect(results[0].due_date).toEqual(new Date('2024-01-10'));

    expect(results[1].is_paid).toEqual(false);
    expect(results[1].description).toEqual('Unpaid debt - later due');
    expect(results[1].due_date).toEqual(new Date('2024-02-15'));

    // Last should be paid (is_paid = true)
    expect(results[2].is_paid).toEqual(true);
    expect(results[2].description).toEqual('Paid debt');
  });

  it('should handle both debt and credit types', async () => {
    // Create customer
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: null,
        address: null
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create both debt and credit records
    await db.insert(debtCreditsTable)
      .values([
        {
          customer_id: customerId,
          type: 'debt',
          amount: '100.00',
          remaining_amount: '100.00',
          description: 'Customer owes money',
          due_date: new Date('2024-01-15'),
          is_paid: false
        },
        {
          customer_id: customerId,
          type: 'credit',
          amount: '50.00',
          remaining_amount: '50.00',
          description: 'Store owes customer',
          due_date: new Date('2024-01-10'),
          is_paid: false
        }
      ])
      .execute();

    const results = await getDebtCredits();

    expect(results).toHaveLength(2);
    
    const debtRecord = results.find(r => r.type === 'debt');
    const creditRecord = results.find(r => r.type === 'credit');

    expect(debtRecord).toBeDefined();
    expect(debtRecord!.amount).toEqual(100);
    expect(debtRecord!.description).toEqual('Customer owes money');

    expect(creditRecord).toBeDefined();
    expect(creditRecord!.amount).toEqual(50);
    expect(creditRecord!.description).toEqual('Store owes customer');
  });
});
