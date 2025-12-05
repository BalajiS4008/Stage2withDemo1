import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as XLSX from 'xlsx';
import {
  exportSuppliersToExcel,
  formatInvoicesForExport,
  showExportSuccess,
  showExportError
} from './exportUtils';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    book_new: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    encode_cell: vi.fn((cell) => `${String.fromCharCode(65 + cell.c)}${cell.r + 1}`)
  },
  writeFile: vi.fn()
}));

describe('exportSuppliersToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  // Positive test cases
  it('should export suppliers successfully with valid data', () => {
    const suppliers = [
      {
        id: '1',
        name: 'Supplier 1',
        phone: '1234567890',
        email: 'supplier1@test.com',
        totalPurchases: 1000,
        totalPayments: 500,
        outstandingBalance: 500,
        balanceType: 'payable',
        transactionCount: 5
      }
    ];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('should handle multiple suppliers', () => {
    const suppliers = Array(100).fill(null).map((_, i) => ({
      id: `${i}`,
      name: `Supplier ${i}`,
      phone: `123456789${i}`,
      email: `supplier${i}@test.com`,
      totalPurchases: Math.random() * 10000,
      totalPayments: Math.random() * 5000,
      outstandingBalance: Math.random() * 5000,
      balanceType: i % 2 === 0 ? 'payable' : 'overpaid',
      transactionCount: Math.floor(Math.random() * 20)
    }));

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  // Edge cases - Empty/Null data
  it('should handle empty suppliers array', () => {
    const result = exportSuppliersToExcel([]);
    expect(result).toBe(true);
  });

  it('should handle null supplier data', () => {
    expect(() => exportSuppliersToExcel(null)).not.toThrow();
  });

  it('should handle undefined supplier data', () => {
    expect(() => exportSuppliersToExcel(undefined)).not.toThrow();
  });

  // Edge cases - Missing fields
  it('should handle supplier with missing phone', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: null,
      email: 'test@test.com',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle supplier with missing email', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: '1234567890',
      email: '',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle supplier with all fields missing', () => {
    const suppliers = [{}];
    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  // Edge cases - Number handling
  it('should handle zero values', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 0,
      totalPayments: 0,
      outstandingBalance: 0,
      balanceType: 'settled',
      transactionCount: 0
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle negative balances', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 500,
      totalPayments: 1000,
      outstandingBalance: -500,
      balanceType: 'overpaid',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle very large numbers', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 999999999.99,
      totalPayments: 888888888.88,
      outstandingBalance: 111111111.11,
      balanceType: 'payable',
      transactionCount: 99999
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle decimal precision', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 1234.567,
      totalPayments: 567.123,
      outstandingBalance: 667.444,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  // Edge cases - String handling
  it('should handle very long supplier names', () => {
    const suppliers = [{
      id: '1',
      name: 'A'.repeat(500),
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle special characters in names', () => {
    const suppliers = [{
      id: '1',
      name: '!@#$%^&*(){}[]|\\:;"\'<>?,./~`',
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle unicode characters', () => {
    const suppliers = [{
      id: '1',
      name: 'संस्कृत 中文 العربية 😀',
      phone: '1234567890',
      email: 'test@test.com',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle invalid email formats', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: '1234567890',
      email: 'not-an-email',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle invalid phone formats', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      phone: 'abc-def-ghij',
      email: 'test@test.com',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  // Edge cases - Balance types
  it('should handle all balance types', () => {
    const suppliers = [
      { id: '1', name: 'S1', totalPurchases: 1000, totalPayments: 500, outstandingBalance: 500, balanceType: 'payable', transactionCount: 5 },
      { id: '2', name: 'S2', totalPurchases: 500, totalPayments: 1000, outstandingBalance: -500, balanceType: 'overpaid', transactionCount: 5 },
      { id: '3', name: 'S3', totalPurchases: 1000, totalPayments: 1000, outstandingBalance: 0, balanceType: 'settled', transactionCount: 5 }
    ];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  it('should handle unknown balance type', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'unknown',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(true);
  });

  // Edge cases - File naming
  it('should handle special characters in filename', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers, 'Test/File\\Name:With|Special<Chars>');
    expect(result).toBe(true);
  });

  it('should handle very long filenames', () => {
    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers, 'A'.repeat(300));
    expect(result).toBe(true);
  });

  // Error handling
  it('should handle XLSX write errors gracefully', () => {
    XLSX.writeFile.mockImplementationOnce(() => {
      throw new Error('Write failed');
    });

    const suppliers = [{
      id: '1',
      name: 'Supplier 1',
      totalPurchases: 1000,
      totalPayments: 500,
      outstandingBalance: 500,
      balanceType: 'payable',
      transactionCount: 5
    }];

    const result = exportSuppliersToExcel(suppliers);
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });
});

describe('showExportSuccess', () => {
  beforeEach(() => {
    global.alert = vi.fn();
    console.log = vi.fn();
  });

  it('should show default success message', () => {
    showExportSuccess();
    expect(console.log).toHaveBeenCalledWith('✅ Export Success:', 'Data exported successfully!');
    expect(alert).toHaveBeenCalledWith('Data exported successfully!');
  });

  it('should show custom success message', () => {
    showExportSuccess('Custom message');
    expect(console.log).toHaveBeenCalledWith('✅ Export Success:', 'Custom message');
    expect(alert).toHaveBeenCalledWith('Custom message');
  });

  it('should handle empty message', () => {
    showExportSuccess('');
    expect(alert).toHaveBeenCalledWith('');
  });

  it('should handle very long message', () => {
    const longMessage = 'A'.repeat(1000);
    showExportSuccess(longMessage);
    expect(alert).toHaveBeenCalledWith(longMessage);
  });
});

describe('showExportError', () => {
  beforeEach(() => {
    global.alert = vi.fn();
    console.error = vi.fn();
  });

  it('should show default error message', () => {
    showExportError();
    expect(console.error).toHaveBeenCalledWith('❌ Export Error:', 'Failed to export data. Please try again.');
    expect(alert).toHaveBeenCalledWith('Failed to export data. Please try again.');
  });

  it('should show custom error message', () => {
    showExportError('Custom error');
    expect(console.error).toHaveBeenCalledWith('❌ Export Error:', 'Custom error');
    expect(alert).toHaveBeenCalledWith('Custom error');
  });

  it('should handle null message', () => {
    showExportError(null);
    expect(alert).toHaveBeenCalledWith(null);
  });
});
