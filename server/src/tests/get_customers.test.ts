
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomers } from '../handlers/get_customers';

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no customers exist', async () => {
    const result = await getCustomers();
    expect(result).toEqual([]);
  });

  it('should return all customers ordered by name', async () => {
    // Create test customers
    await db.insert(customersTable)
      .values([
        {
          name: 'Charlie Brown',
          phone: '123-456-7890',
          address: '123 Main St'
        },
        {
          name: 'Alice Smith',
          phone: '098-765-4321',
          address: '456 Oak Ave'
        },
        {
          name: 'Bob Johnson',
          phone: null,
          address: null
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    
    // Verify ordered by name (alphabetical)
    expect(result[0].name).toEqual('Alice Smith');
    expect(result[1].name).toEqual('Bob Johnson');
    expect(result[2].name).toEqual('Charlie Brown');

    // Verify all fields are present
    expect(result[0].id).toBeDefined();
    expect(result[0].phone).toEqual('098-765-4321');
    expect(result[0].address).toEqual('456 Oak Ave');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify nullable fields
    expect(result[1].phone).toBeNull();
    expect(result[1].address).toBeNull();
  });

  it('should handle customers with same name', async () => {
    // Create customers with same name
    await db.insert(customersTable)
      .values([
        {
          name: 'John Doe',
          phone: '111-111-1111',
          address: 'Address 1'
        },
        {
          name: 'John Doe',
          phone: '222-222-2222',
          address: 'Address 2'
        }
      ])
      .execute();

    const result = await getCustomers();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('John Doe');
    
    // Should have different IDs
    expect(result[0].id).not.toEqual(result[1].id);
  });
});
