
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { settingsTable } from '../db/schema';
import { getSettings } from '../handlers/get_settings';

describe('getSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no settings exist', async () => {
    const result = await getSettings();

    expect(result).toEqual([]);
  });

  it('should return all settings', async () => {
    // Create test settings
    await db.insert(settingsTable)
      .values([
        { key: 'qris_merchant_id', value: '123456789' },
        { key: 'store_name', value: 'My Store' },
        { key: 'tax_rate', value: '0.10' }
      ])
      .execute();

    const result = await getSettings();

    expect(result).toHaveLength(3);
    
    // Verify all settings are returned
    const keys = result.map(setting => setting.key);
    expect(keys).toContain('qris_merchant_id');
    expect(keys).toContain('store_name');
    expect(keys).toContain('tax_rate');

    // Verify specific setting values
    const qrisSetting = result.find(s => s.key === 'qris_merchant_id');
    expect(qrisSetting?.value).toEqual('123456789');

    const storeSetting = result.find(s => s.key === 'store_name');
    expect(storeSetting?.value).toEqual('My Store');

    // Verify settings have proper structure
    result.forEach(setting => {
      expect(setting.id).toBeDefined();
      expect(typeof setting.key).toBe('string');
      expect(typeof setting.value).toBe('string');
      expect(setting.created_at).toBeInstanceOf(Date);
      expect(setting.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return settings ordered by creation', async () => {
    // Create settings with slight delay to ensure different timestamps
    await db.insert(settingsTable)
      .values({ key: 'first_setting', value: 'first' })
      .execute();

    await db.insert(settingsTable)
      .values({ key: 'second_setting', value: 'second' })
      .execute();

    const result = await getSettings();

    expect(result).toHaveLength(2);
    expect(result[0].key).toEqual('first_setting');
    expect(result[1].key).toEqual('second_setting');
    
    // Verify timestamps are in order
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
