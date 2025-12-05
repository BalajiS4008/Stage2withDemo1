import { describe, it, expect, beforeEach } from 'vitest';
import { formatCurrency, formatDate, generateId } from './dataManager';

describe('formatCurrency', () => {
  // Positive test cases
  it('should format positive numbers correctly', () => {
    expect(formatCurrency(1000)).toBe('₹1,000.00');
    expect(formatCurrency(1234.56)).toBe('₹1,234.56');
  });

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('₹0.00');
  });

  // Edge cases
  it('should handle negative numbers', () => {
    expect(formatCurrency(-500)).toBe('₹-500.00');
  });

  it('should handle very large numbers', () => {
    expect(formatCurrency(1000000000)).toBe('₹1,000,000,000.00');
  });

  it('should handle very small decimal numbers', () => {
    expect(formatCurrency(0.01)).toBe('₹0.01');
    expect(formatCurrency(0.001)).toBe('₹0.00');
  });

  it('should handle null and undefined', () => {
    expect(formatCurrency(null)).toBe('₹0.00');
    expect(formatCurrency(undefined)).toBe('₹0.00');
  });

  it('should handle string numbers', () => {
    expect(formatCurrency('1000')).toBe('₹1,000.00');
    expect(formatCurrency('1234.56')).toBe('₹1,234.56');
  });

  it('should handle invalid inputs', () => {
    expect(formatCurrency('invalid')).toBe('₹0.00');
    expect(formatCurrency(NaN)).toBe('₹0.00');
    expect(formatCurrency({})).toBe('₹0.00');
    expect(formatCurrency([])).toBe('₹0.00');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(10.123)).toBe('₹10.12');
    expect(formatCurrency(10.126)).toBe('₹10.13');
  });

  it('should handle Infinity', () => {
    expect(formatCurrency(Infinity)).toBe('₹0.00');
    expect(formatCurrency(-Infinity)).toBe('₹0.00');
  });
});

describe('formatDate', () => {
  // Positive test cases
  it('should format valid date string correctly', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('should format Date object correctly', () => {
    const date = new Date('2024-01-15');
    const result = formatDate(date);
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });

  // Edge cases
  it('should handle null and undefined', () => {
    expect(formatDate(null)).toBe('-');
    expect(formatDate(undefined)).toBe('-');
  });

  it('should handle invalid date strings', () => {
    expect(formatDate('invalid-date')).toBe('Invalid Date');
  });

  it('should handle empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('should handle leap year dates', () => {
    const result = formatDate('2024-02-29');
    expect(result).toMatch(/29/);
  });

  it('should handle year 2000 dates', () => {
    const result = formatDate('2000-01-01');
    expect(result).toMatch(/2000/);
  });

  it('should handle very old dates', () => {
    const result = formatDate('1900-01-01');
    expect(result).toMatch(/1900/);
  });

  it('should handle future dates', () => {
    const result = formatDate('2099-12-31');
    expect(result).toMatch(/2099/);
  });

  it('should handle timestamp numbers', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const result = formatDate(timestamp);
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});

describe('generateId', () => {
  // Positive test cases
  it('should generate a string ID', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).not.toBe(id3);
  });

  it('should generate IDs with length > 0', () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  // Edge cases
  it('should generate 1000 unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(1000);
  });

  it('should not contain spaces or special characters that break URLs', () => {
    const id = generateId();
    expect(id).not.toMatch(/\s/);
    expect(id).not.toMatch(/[<>]/);
  });
});
