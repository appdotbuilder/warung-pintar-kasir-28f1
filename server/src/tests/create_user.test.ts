
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

const testInput: CreateUserInput = {
  username: 'testuser',
  password: 'password123',
  role: 'cashier'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.username).toEqual('testuser');
    expect(result.role).toEqual('cashier');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toEqual('testuser');
    expect(users[0].role).toEqual('cashier');
    expect(users[0].is_active).toEqual(true);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    // Password should be hashed, not stored in plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash.length).toBeGreaterThan(10);

    // Verify password can be verified with Bun's password verification
    const isValid = await Bun.password.verify('password123', result.password_hash);
    expect(isValid).toBe(true);

    const isInvalid = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should reject duplicate usernames', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      username: 'testuser',
      password: 'differentpassword',
      role: 'owner'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/username already exists/i);
  });

  it('should create owner role user', async () => {
    const ownerInput: CreateUserInput = {
      username: 'owner123',
      password: 'ownerpass',
      role: 'owner'
    };

    const result = await createUser(ownerInput);

    expect(result.username).toEqual('owner123');
    expect(result.role).toEqual('owner');
    expect(result.is_active).toEqual(true);
  });
});
