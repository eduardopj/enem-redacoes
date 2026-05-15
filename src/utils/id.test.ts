import { generateId } from './id';

describe('generateId', () => {
  it('returns a string of 36 characters', () => {
    expect(generateId()).toHaveLength(36);
  });

  it('matches UUID v4 format', () => {
    const uuid = generateId();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('generates unique values', () => {
    const ids = Array.from({ length: 1000 }, () => generateId());
    const unique = new Set(ids);
    expect(unique.size).toBe(1000);
  });

  it('version nibble is always 4', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateId();
      expect(id[14]).toBe('4');
    }
  });

  it('variant nibble is always 8, 9, a or b', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateId();
      expect(['8', '9', 'a', 'b']).toContain(id[19]);
    }
  });
});
