
import { db } from '../db';
import { debtCreditsTable } from '../db/schema';
import { type DebtCreditPaymentInput, type DebtCredit } from '../schema';
import { eq } from 'drizzle-orm';

export const payDebtCredit = async (input: DebtCreditPaymentInput): Promise<DebtCredit> => {
  try {
    // First, get the current debt/credit record
    const existingRecords = await db.select()
      .from(debtCreditsTable)
      .where(eq(debtCreditsTable.id, input.debt_credit_id))
      .execute();

    if (existingRecords.length === 0) {
      throw new Error('Debt/credit record not found');
    }

    const existingRecord = existingRecords[0];
    
    // Check if already fully paid
    if (existingRecord.is_paid) {
      throw new Error('Debt/credit is already fully paid');
    }

    const currentRemaining = parseFloat(existingRecord.remaining_amount);
    
    // Validate payment amount doesn't exceed remaining amount
    if (input.payment_amount > currentRemaining) {
      throw new Error('Payment amount cannot exceed remaining amount');
    }

    // Calculate new remaining amount
    const newRemainingAmount = currentRemaining - input.payment_amount;
    const isPaid = newRemainingAmount === 0;

    // Update the debt/credit record
    const result = await db.update(debtCreditsTable)
      .set({
        remaining_amount: newRemainingAmount.toString(),
        is_paid: isPaid,
        updated_at: new Date()
      })
      .where(eq(debtCreditsTable.id, input.debt_credit_id))
      .returning()
      .execute();

    const updatedRecord = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...updatedRecord,
      amount: parseFloat(updatedRecord.amount),
      remaining_amount: parseFloat(updatedRecord.remaining_amount)
    };
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
};
