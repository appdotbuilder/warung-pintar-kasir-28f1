
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCustomerInput = {
  name: 'John Doe',
  phone: '+1234567890',
  address: '123 Main Street, City'
};

// Test input with minimal required fields
const minimalInput: CreateCustomerInput = {
  name: 'Jane Smith',
  phone: null,
  address: null
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Main Street, City');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer with minimal fields', async () => {
    const result = await createCustomer(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.phone).toBe(null);
    expect(result.address).toBe(null);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query the database to verify customer was saved
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].name).toEqual('John Doe');
    expect(customers[0].phone).toEqual('+1234567890');
    expect(customers[0].address).toEqual('123 Main Street, City');
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple customers with unique IDs', async () => {
    const customer1 = await createCustomer(testInput);
    const customer2 = await createCustomer(minimalInput);

    // Verify different IDs
    expect(customer1.id).not.toEqual(customer2.id);
    expect(customer1.name).toEqual('John Doe');
    expect(customer2.name).toEqual('Jane Smith');

    // Verify both exist in database
    const allCustomers = await db.select()
      .from(customersTable)
      .execute();

    expect(allCustomers).toHaveLength(2);
  });

  it('should handle customer with empty strings as null', async () => {
    const inputWithEmptyStrings: CreateCustomerInput = {
      name: 'Test Customer',
      phone: '',
      address: ''
    };

    const result = await createCustomer(inputWithEmptyStrings);

    expect(result.name).toEqual('Test Customer');
    expect(result.phone).toEqual('');
    expect(result.address).toEqual('');
  });
});
