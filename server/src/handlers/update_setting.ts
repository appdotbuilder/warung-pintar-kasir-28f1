
import { db } from '../db';
import { settingsTable } from '../db/schema';
import { type Settings } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateSetting(key: string, value: string): Promise<Settings> {
  try {
    // First, try to update existing setting
    const updateResult = await db.update(settingsTable)
      .set({
        value: value,
        updated_at: new Date()
      })
      .where(eq(settingsTable.key, key))
      .returning()
      .execute();

    // If setting exists, return the updated record
    if (updateResult.length > 0) {
      return updateResult[0];
    }

    // If setting doesn't exist, create a new one
    const insertResult = await db.insert(settingsTable)
      .values({
        key: key,
        value: value
      })
      .returning()
      .execute();

    return insertResult[0];
  } catch (error) {
    console.error('Setting update failed:', error);
    throw error;
  }
}
