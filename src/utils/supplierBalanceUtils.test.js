import { describe, it, expect } from 'vitest';
import { calculateSupplierBalance } from './supplierBalanceUtils';

describe('calculateSupplierBalance', () => {
  // Positive test cases
  it('should calculate balance correctly with purchases and payments', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
    expect(result.outstandingBalance).toBe(400);
    expect(result.balanceType).toBe('payable');
  });

  it('should handle overpayment correctly', () => {
    const transactions = [
      { type: 'purchase', amount: 500, supplierId: '1' },
      { type: 'payment', amount: 800, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(500);
    expect(result.totalPayments).toBe(800);
    expect(result.outstandingBalance).toBe(300);
    expect(result.balanceType).toBe('overpaid');
  });

  it('should handle settled balance', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 1000, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(1000);
    expect(result.outstandingBalance).toBe(0);
    expect(result.balanceType).toBe('settled');
  });

  // Edge cases - Empty/null data
  it('should handle empty transactions array', () => {
    const result = calculateSupplierBalance([], '1');

    expect(result.totalPurchases).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.outstandingBalance).toBe(0);
    expect(result.balanceType).toBe('settled');
  });

  it('should handle null transactions', () => {
    const result = calculateSupplierBalance(null, '1');

    expect(result.totalPurchases).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.outstandingBalance).toBe(0);
  });

  it('should handle undefined transactions', () => {
    const result = calculateSupplierBalance(undefined, '1');

    expect(result.totalPurchases).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.outstandingBalance).toBe(0);
  });

  // Edge cases - Filtering by supplier ID
  it('should filter transactions by supplier ID', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'purchase', amount: 500, supplierId: '2' },
      { type: 'payment', amount: 600, supplierId: '1' },
      { type: 'payment', amount: 300, supplierId: '2' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
    expect(result.outstandingBalance).toBe(400);
  });

  it('should return zero balances for non-existent supplier', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '999');

    expect(result.totalPurchases).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.outstandingBalance).toBe(0);
  });

  // Edge cases - Number handling
  it('should handle zero amounts', () => {
    const transactions = [
      { type: 'purchase', amount: 0, supplierId: '1' },
      { type: 'payment', amount: 0, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(0);
    expect(result.totalPayments).toBe(0);
    expect(result.outstandingBalance).toBe(0);
  });

  it('should handle very large amounts', () => {
    const transactions = [
      { type: 'purchase', amount: 999999999.99, supplierId: '1' },
      { type: 'payment', amount: 888888888.88, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(999999999.99);
    expect(result.totalPayments).toBe(888888888.88);
    expect(result.outstandingBalance).toBeCloseTo(111111111.11, 2);
  });

  it('should handle decimal precision correctly', () => {
    const transactions = [
      { type: 'purchase', amount: 100.33, supplierId: '1' },
      { type: 'purchase', amount: 200.44, supplierId: '1' },
      { type: 'payment', amount: 150.55, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBeCloseTo(300.77, 2);
    expect(result.totalPayments).toBe(150.55);
    expect(result.outstandingBalance).toBeCloseTo(150.22, 2);
  });

  it('should handle negative amounts gracefully', () => {
    const transactions = [
      { type: 'purchase', amount: -100, supplierId: '1' },
      { type: 'payment', amount: -50, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    // Negative amounts should still be calculated
    expect(result.totalPurchases).toBe(-100);
    expect(result.totalPayments).toBe(-50);
  });

  it('should handle string amounts', () => {
    const transactions = [
      { type: 'purchase', amount: '1000', supplierId: '1' },
      { type: 'payment', amount: '600', supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    // Should convert string to number
    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
  });

  it('should handle NaN amounts', () => {
    const transactions = [
      { type: 'purchase', amount: NaN, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPayments).toBe(600);
  });

  it('should handle null amounts', () => {
    const transactions = [
      { type: 'purchase', amount: null, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPayments).toBe(600);
  });

  it('should handle undefined amounts', () => {
    const transactions = [
      { type: 'purchase', amount: undefined, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPayments).toBe(600);
  });

  // Edge cases - Transaction types
  it('should handle credit type as purchase', () => {
    const transactions = [
      { type: 'credit', amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
  });

  it('should handle debit type as payment', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'debit', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
  });

  it('should ignore unknown transaction types', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'unknown', amount: 500, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
  });

  it('should handle missing transaction type', () => {
    const transactions = [
      { amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPayments).toBe(600);
  });

  // Edge cases - Multiple transactions
  it('should handle many transactions', () => {
    const transactions = [];
    for (let i = 0; i < 1000; i++) {
      transactions.push({ type: 'purchase', amount: 10, supplierId: '1' });
      transactions.push({ type: 'payment', amount: 5, supplierId: '1' });
    }

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(10000);
    expect(result.totalPayments).toBe(5000);
    expect(result.outstandingBalance).toBe(5000);
  });

  it('should handle duplicate transactions', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(2000);
    expect(result.totalPayments).toBe(1200);
    expect(result.outstandingBalance).toBe(800);
  });

  // Edge cases - Balance type threshold
  it('should handle balance very close to zero (should be settled)', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1' },
      { type: 'payment', amount: 999.999, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.outstandingBalance).toBeCloseTo(0.001, 3);
  });

  // Edge cases - Project filtering (if applicable)
  it('should filter by project ID if provided', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1', projectId: 'P1' },
      { type: 'purchase', amount: 500, supplierId: '1', projectId: 'P2' },
      { type: 'payment', amount: 600, supplierId: '1', projectId: 'P1' }
    ];

    const result = calculateSupplierBalance(transactions, '1', 'P1');

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
    expect(result.outstandingBalance).toBe(400);
  });

  it('should handle null project ID', () => {
    const transactions = [
      { type: 'purchase', amount: 1000, supplierId: '1', projectId: null },
      { type: 'payment', amount: 600, supplierId: '1', projectId: null }
    ];

    const result = calculateSupplierBalance(transactions, '1', null);

    expect(result.totalPurchases).toBe(1000);
    expect(result.totalPayments).toBe(600);
  });

  // Edge cases - Malformed data
  it('should handle transactions with missing supplier ID', () => {
    const transactions = [
      { type: 'purchase', amount: 1000 },
      { type: 'payment', amount: 600, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPayments).toBe(600);
  });

  it('should handle completely malformed transaction', () => {
    const transactions = [
      null,
      undefined,
      {},
      { type: 'purchase', amount: 1000, supplierId: '1' }
    ];

    const result = calculateSupplierBalance(transactions, '1');

    expect(result.totalPurchases).toBe(1000);
  });
});
