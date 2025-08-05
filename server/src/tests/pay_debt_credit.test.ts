
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, debtCreditsTable } from '../db/schema';
import { type DebtCreditPaymentInput } from '../schema';
import { payDebtCredit } from '../handlers/pay_debt_credit';
import { eq } from 'drizzle-orm';

describe('payDebtCredit', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;

  beforeEach(async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        name: 'Test Customer',
        phone: '081234567890',
        address: 'Test Address'
      })
      .returning()
      .execute();
    
    customerId = customerResult[0].id;
  });

  it('should process partial payment for debt', async () => {
    // Create a debt record
    const debtResult = await db.insert(debtCreditsTable)
      .values({
        customer_id: customerId,
        type: 'debt',
        amount: '1000.00',
        remaining_amount: '1000.00',
        description: 'Test debt',
        due_date: new Date('2024-12-31'),
        is_paid: false
      })
      .returning()
      .execute();

    const debtId = debtResult[0].id;

    const input: DebtCreditPaymentInput = {
      debt_credit_id: debtId,
      payment_amount: 300,
      notes: 'Partial payment'
    };

    const result = await payDebtCredit(input);

    expect(result.id).toEqual(debtId);
    expect(result.amount).toEqual(1000);
    expect(result.remaining_amount).toEqual(700);
    expect(result.is_paid).toBe(false);
    expect(typeof result.remaining_amount).toBe('number');
  });

  it('should mark debt as paid when fully paid', async () => {
    // Create a debt record with small remaining amount
    const debtResult = await db.insert(debtCreditsTable)
      .values({
        customer_id: customerId,
        type: 'debt',
        amount: '500.00',
        remaining_amount: '200.00',
        description: 'Test debt',
        due_date: new Date('2024-12-31'),
        is_paid: false
      })
      .returning()
      .execute();

    const debtId = debtResult[0].id;

    const input: DebtCreditPaymentInput = {
      debt_credit_id: debtId,
      payment_amount: 200,
      notes: 'Final payment'
    };

    const result = await payDebtCredit(input);

    expect(result.remaining_amount).toEqual(0);
    expect(result.is_paid).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update database record correctly', async () => {
    // Create a credit record
    const creditResult = await db.insert(debtCreditsTable)
      .values({
        customer_id: customerId,
        type: 'credit',
        amount: '800.00',
        remaining_amount: '800.00',
        description: 'Test credit',
        due_date: null,
        is_paid: false
      })
      .returning()
      .execute();

    const creditId = creditResult[0].id;

    const input: DebtCreditPaymentInput = {
      debt_credit_id: creditId,
      payment_amount: 300,
      notes: null
    };

    await payDebtCredit(input);

    // Verify database was updated
    const updatedRecords = await db.select()
      .from(debtCreditsTable)
      .where(eq(debtCreditsTable.id, creditId))
      .execute();

    const updatedRecord = updatedRecords[0];
    expect(parseFloat(updatedRecord.remaining_amount)).toEqual(500);
    expect(updatedRecord.is_paid).toBe(false);
    expect(updatedRecord.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when debt/credit not found', async () => {
    const input: DebtCreditPaymentInput = {
      debt_credit_id: 99999,
      payment_amount: 100,
      notes: null
    };

    await expect(payDebtCredit(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when already fully paid', async () => {
    // Create a fully paid debt
    const debtResult = await db.insert(debtCreditsTable)
      .values({
        customer_id: customerId,
        type: 'debt',
        amount: '500.00',
        remaining_amount: '0.00',
        description: 'Paid debt',
        due_date: new Date('2024-12-31'),
        is_paid: true
      })
      .returning()
      .execute();

    const debtId = debtResult[0].id;

    const input: DebtCreditPaymentInput = {
      debt_credit_id: debtId,
      payment_amount: 100,
      notes: null
    };

    await expect(payDebtCredit(input)).rejects.toThrow(/already fully paid/i);
  });

  it('should throw error when payment exceeds remaining amount', async () => {
    // Create a debt with small remaining amount
    const debtResult = await db.insert(debtCreditsTable)
      .values({
        customer_id: customerId,
        type: 'debt',
        amount: '1000.00',
        remaining_amount: '150.00',
        description: 'Nearly paid debt',
        due_date: new Date('2024-12-31'),
        is_paid: false
      })
      .returning()
      .execute();

    const debtId = debtResult[0].id;

    const input: DebtCreditPaymentInput = {
      debt_credit_id: debtId,
      payment_amount: 200, // More than remaining 150
      notes: null
    };

    await expect(payDebtCredit(input)).rejects.toThrow(/cannot exceed remaining/i);
  });
});
