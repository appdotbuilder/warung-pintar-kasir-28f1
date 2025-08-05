
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { settingsTable } from '../db/schema';
import { updateSetting } from '../handlers/update_setting';
import { eq } from 'drizzle-orm';

describe('updateSetting', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new setting when key does not exist', async () => {
    const result = await updateSetting('store_name', 'My Store');

    expect(result.key).toEqual('store_name');
    expect(result.value).toEqual('My Store');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update existing setting when key exists', async () => {
    // Create initial setting
    await db.insert(settingsTable)
      .values({
        key: 'store_name',
        value: 'Old Store Name'
      })
      .execute();

    // Update the setting
    const result = await updateSetting('store_name', 'New Store Name');

    expect(result.key).toEqual('store_name');
    expect(result.value).toEqual('New Store Name');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save setting to database', async () => {
    const result = await updateSetting('tax_rate', '10.5');

    // Verify in database
    const settings = await db.select()
      .from(settingsTable)
      .where(eq(settingsTable.id, result.id))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].key).toEqual('tax_rate');
    expect(settings[0].value).toEqual('10.5');
    expect(settings[0].created_at).toBeInstanceOf(Date);
    expect(settings[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only have one record for each unique key', async () => {
    // Create initial setting
    await updateSetting('currency', 'USD');
    
    // Update the same key
    await updateSetting('currency', 'IDR');

    // Verify only one record exists for this key
    const settings = await db.select()
      .from(settingsTable)
      .where(eq(settingsTable.key, 'currency'))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].value).toEqual('IDR');
  });

  it('should handle multiple different settings', async () => {
    await updateSetting('store_name', 'My Store');
    await updateSetting('tax_rate', '10');
    await updateSetting('currency', 'IDR');

    const allSettings = await db.select()
      .from(settingsTable)
      .execute();

    expect(allSettings).toHaveLength(3);
    
    const settingKeys = allSettings.map(s => s.key).sort();
    expect(settingKeys).toEqual(['currency', 'store_name', 'tax_rate']);
  });

  it('should update the updated_at timestamp when updating existing setting', async () => {
    // Create initial setting
    const initial = await updateSetting('store_hours', '9-17');
    const initialUpdatedAt = initial.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the setting
    const updated = await updateSetting('store_hours', '8-18');

    expect(updated.key).toEqual('store_hours');
    expect(updated.value).toEqual('8-18');
    expect(updated.id).toEqual(initial.id); // Same record
    expect(updated.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
  });
});
