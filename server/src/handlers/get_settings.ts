
import { db } from '../db';
import { settingsTable } from '../db/schema';
import { type Settings } from '../schema';

export const getSettings = async (): Promise<Settings[]> => {
  try {
    const results = await db.select()
      .from(settingsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    throw error;
  }
};
