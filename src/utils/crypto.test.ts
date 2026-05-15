import { hashPassword, verifyPassword } from './crypto';

describe('hashPassword', () => {
  it('returns a non-empty string', async () => {
    const hash = await hashPassword('senha123', 'user@example.com');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('produces the same hash for the same inputs', async () => {
    const hash1 = await hashPassword('senha123', 'user@example.com');
    const hash2 = await hashPassword('senha123', 'user@example.com');
    expect(hash1).toBe(hash2);
  });

  it('is sensitive to password changes', async () => {
    const hash1 = await hashPassword('senha123', 'user@example.com');
    const hash2 = await hashPassword('senha456', 'user@example.com');
    expect(hash1).not.toBe(hash2);
  });

  it('is sensitive to email salt changes', async () => {
    const hash1 = await hashPassword('senha123', 'user@example.com');
    const hash2 = await hashPassword('senha123', 'other@example.com');
    expect(hash1).not.toBe(hash2);
  });

  it('normalises email case', async () => {
    const hash1 = await hashPassword('senha123', 'User@Example.COM');
    const hash2 = await hashPassword('senha123', 'user@example.com');
    expect(hash1).toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('correta', 'a@b.com');
    expect(await verifyPassword('correta', 'a@b.com', hash)).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correta', 'a@b.com');
    expect(await verifyPassword('errada', 'a@b.com', hash)).toBe(false);
  });

  it('returns false for wrong email salt', async () => {
    const hash = await hashPassword('senha', 'a@b.com');
    expect(await verifyPassword('senha', 'x@y.com', hash)).toBe(false);
  });
});
