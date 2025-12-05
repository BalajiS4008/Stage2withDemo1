import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceFormModal from './InvoiceFormModal';
import { DataProvider } from '../context/DataContext';

// Mock data context
const mockData = {
  settings: {
    companyProfile: {
      companyName: 'Test Company',
      address: '123 Test St',
      phone: '1234567890',
      email: 'test@example.com',
      gstNumber: 'GST123',
      logo: ''
    },
    invoiceSettings: {
      prefix: 'INV',
      nextNumber: 1
    },
    measurementUnits: ['sq.ft', 'kg', 'piece', 'meter', 'ft']
  }
};

const MockDataProvider = ({ children }) => (
  <DataProvider value={{ data: mockData }}>
    {children}
  </DataProvider>
);

describe('InvoiceFormModal - Basic Rendering', () => {
  const defaultProps = {
    invoice: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should render without crashing', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Invoice Details/i)).toBeInTheDocument();
  });

  it('should display company name field', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const companyNameInput = screen.getByLabelText(/Company Name/i);
    expect(companyNameInput).toBeInTheDocument();
  });

  it('should display client name field', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const clientNameInput = screen.getByLabelText(/Client Name/i);
    expect(clientNameInput).toBeInTheDocument();
  });
});

describe('InvoiceFormModal - Due Date Feature', () => {
  const defaultProps = {
    invoice: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should show due date field when status is pending', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    // Due date should be visible by default (status is pending)
    const dueDateInput = screen.getByLabelText(/Due Date/i);
    expect(dueDateInput).toBeInTheDocument();
  });

  it('should hide due date field when status is paid', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    // Change status to paid
    const statusSelect = screen.getByLabelText(/Payment Status/i);
    await user.selectOptions(statusSelect, 'paid');

    // Due date should not be visible
    const dueDateInput = screen.queryByLabelText(/Due Date/i);
    expect(dueDateInput).not.toBeInTheDocument();
  });

  it('should show due date field when status is changed back to pending', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    // Change status to paid
    const statusSelect = screen.getByLabelText(/Payment Status/i);
    await user.selectOptions(statusSelect, 'paid');

    // Change back to pending
    await user.selectOptions(statusSelect, 'pending');

    // Due date should be visible again
    const dueDateInput = screen.getByLabelText(/Due Date/i);
    expect(dueDateInput).toBeInTheDocument();
  });

  it('should set minimum date for due date to invoice date', () => {
    const invoice = {
      date: '2024-01-15'
    };

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} invoice={invoice} />
      </MockDataProvider>
    );

    const dueDateInput = screen.getByLabelText(/Due Date/i);
    expect(dueDateInput).toHaveAttribute('min', '2024-01-15');
  });
});

describe('InvoiceFormModal - Terms & Conditions Feature', () => {
  const defaultProps = {
    invoice: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should display terms and conditions textarea', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    expect(termsTextarea).toBeInTheDocument();
  });

  it('should have 4 rows for terms and conditions textarea', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    expect(termsTextarea).toHaveAttribute('rows', '4');
  });

  it('should accept text input in terms and conditions', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const testText = 'Payment due within 30 days';

    await user.type(termsTextarea, testText);
    expect(termsTextarea).toHaveValue(testText);
  });

  it('should preserve existing terms and conditions when editing', () => {
    const invoice = {
      termsAndConditions: 'Existing terms and conditions'
    };

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} invoice={invoice} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    expect(termsTextarea).toHaveValue('Existing terms and conditions');
  });
});

describe('InvoiceFormModal - Edge Cases', () => {
  const defaultProps = {
    invoice: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle null invoice prop', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} invoice={null} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Invoice Details/i)).toBeInTheDocument();
  });

  it('should handle undefined invoice prop', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} invoice={undefined} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Invoice Details/i)).toBeInTheDocument();
  });

  it('should handle missing company profile', () => {
    const emptyData = {
      settings: {
        invoiceSettings: { prefix: 'INV', nextNumber: 1 },
        measurementUnits: ['sq.ft']
      }
    };

    const EmptyDataProvider = ({ children }) => (
      <DataProvider value={{ data: emptyData }}>
        {children}
      </DataProvider>
    );

    render(
      <EmptyDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </EmptyDataProvider>
    );

    expect(screen.getByText(/Invoice Details/i)).toBeInTheDocument();
  });

  it('should handle very long terms and conditions text', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const longText = 'a'.repeat(1000);

    await user.type(termsTextarea, longText);
    expect(termsTextarea.value.length).toBeGreaterThanOrEqual(1000);
  });

  it('should handle special characters in terms and conditions', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const specialText = '!@#$%^&*(){}[]<>?/\\|';

    await user.type(termsTextarea, specialText);
    expect(termsTextarea).toHaveValue(specialText);
  });

  it('should handle multiline text in terms and conditions', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const multilineText = 'Line 1\nLine 2\nLine 3';

    await user.type(termsTextarea, multilineText);
    expect(termsTextarea.value).toContain('Line 1');
    expect(termsTextarea.value).toContain('Line 2');
  });
});

describe('InvoiceFormModal - Status Validation', () => {
  const defaultProps = {
    invoice: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should have all status options available', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const statusSelect = screen.getByLabelText(/Payment Status/i);
    expect(statusSelect).toContainHTML('pending');
    expect(statusSelect).toContainHTML('paid');
    expect(statusSelect).toContainHTML('overdue');
    expect(statusSelect).toContainHTML('cancelled');
  });

  it('should default to pending status', () => {
    render(
      <MockDataProvider>
        <InvoiceFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const statusSelect = screen.getByLabelText(/Payment Status/i);
    expect(statusSelect).toHaveValue('pending');
  });
});
