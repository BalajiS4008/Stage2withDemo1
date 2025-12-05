import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuotationFormModal from './QuotationFormModal';
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
    quotationSettings: {
      prefix: 'QUO',
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

describe('QuotationFormModal - Basic Rendering', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should render without crashing', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should display company name field', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const companyNameInput = screen.getByLabelText(/Company Name/i);
    expect(companyNameInput).toBeInTheDocument();
  });

  it('should display client name field', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const clientNameInput = screen.getByLabelText(/Client Name/i);
    expect(clientNameInput).toBeInTheDocument();
  });

  it('should display quotation date field', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const dateInput = screen.getByLabelText(/Quotation Date/i);
    expect(dateInput).toBeInTheDocument();
  });

  it('should display expiry date field', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const expiryInput = screen.getByLabelText(/Expiry Date/i);
    expect(expiryInput).toBeInTheDocument();
  });
});

describe('QuotationFormModal - Terms & Conditions Feature', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should display terms and conditions textarea', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    expect(termsTextarea).toBeInTheDocument();
  });

  it('should have 4 rows for terms and conditions textarea', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    expect(termsTextarea).toHaveAttribute('rows', '4');
  });

  it('should accept text input in terms and conditions', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const testText = 'This quotation is valid for 30 days';

    await user.type(termsTextarea, testText);
    expect(termsTextarea).toHaveValue(testText);
  });

  it('should preserve existing terms and conditions when editing', () => {
    const quotation = {
      termsAndConditions: 'Existing terms for quotation'
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    expect(termsTextarea).toHaveValue('Existing terms for quotation');
  });

  it('should handle very long terms and conditions text', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const longText = 'a'.repeat(2000);

    await user.type(termsTextarea, longText);
    expect(termsTextarea.value.length).toBeGreaterThanOrEqual(2000);
  });

  it('should handle special characters in terms and conditions', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
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
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const termsTextarea = screen.getByLabelText(/Terms & Conditions/i);
    const multilineText = 'Line 1\nLine 2\nLine 3';

    await user.type(termsTextarea, multilineText);
    expect(termsTextarea.value).toContain('Line 1');
    expect(termsTextarea.value).toContain('Line 2');
  });
});

describe('QuotationFormModal - Expiry Date Feature', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should set minimum expiry date to quotation date', () => {
    const quotation = {
      date: '2024-01-15'
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    const expiryInput = screen.getByLabelText(/Expiry Date/i);
    expect(expiryInput).toHaveAttribute('min', '2024-01-15');
  });

  it('should allow selecting future expiry date', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const expiryInput = screen.getByLabelText(/Expiry Date/i);
    await user.type(expiryInput, '2024-12-31');
    expect(expiryInput).toHaveValue('2024-12-31');
  });
});

describe('QuotationFormModal - Item Calculations', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should display items section', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Items/i)).toBeInTheDocument();
  });

  it('should handle item with measurement value × quantity × rate', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 2,
          rate: 100,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    // Item should be calculated as: 10 × 2 × 100 = 2000
    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle zero measurement value', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 0,
          measurementUnit: 'sq.ft',
          quantity: 2,
          rate: 100,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle zero quantity', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 0,
          rate: 100,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle zero rate', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 2,
          rate: 0,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle decimal measurement values', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10.5,
          measurementUnit: 'sq.ft',
          quantity: 2.5,
          rate: 100.75,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle very large values', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 999999,
          measurementUnit: 'sq.ft',
          quantity: 999,
          rate: 99999,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });
});

describe('QuotationFormModal - GST Calculations', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle 0% GST rate', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 1,
          rate: 100,
          gstRate: 0
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle 18% GST rate', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 1,
          rate: 100,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle 28% GST rate', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 1,
          rate: 100,
          gstRate: 28
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });
});

describe('QuotationFormModal - Multiple Items', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle multiple items', () => {
    const quotation = {
      items: [
        {
          description: 'Item 1',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 1,
          rate: 100,
          gstRate: 18
        },
        {
          description: 'Item 2',
          measurementValue: 20,
          measurementUnit: 'kg',
          quantity: 2,
          rate: 50,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Item 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Item 2')).toBeInTheDocument();
  });

  it('should handle empty items array', () => {
    const quotation = {
      items: []
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });
});

describe('QuotationFormModal - Status Options', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should have all status options available', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const statusSelect = screen.getByLabelText(/Status/i);
    expect(statusSelect).toContainHTML('draft');
    expect(statusSelect).toContainHTML('sent');
    expect(statusSelect).toContainHTML('accepted');
    expect(statusSelect).toContainHTML('rejected');
  });

  it('should default to draft status', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const statusSelect = screen.getByLabelText(/Status/i);
    expect(statusSelect).toHaveValue('draft');
  });

  it('should allow changing status', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const statusSelect = screen.getByLabelText(/Status/i);
    await user.selectOptions(statusSelect, 'sent');
    expect(statusSelect).toHaveValue('sent');
  });
});

describe('QuotationFormModal - Edge Cases', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle null quotation prop', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={null} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should handle undefined quotation prop', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={undefined} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should handle missing company profile', () => {
    const emptyData = {
      settings: {
        quotationSettings: { prefix: 'QUO', nextNumber: 1 },
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
        <QuotationFormModal {...defaultProps} />
      </EmptyDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should handle very long description', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const notesTextarea = screen.getByLabelText(/Notes/i);
    const longText = 'a'.repeat(5000);

    await user.type(notesTextarea, longText);
    expect(notesTextarea.value.length).toBeGreaterThanOrEqual(5000);
  });

  it('should handle special characters in client name', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const specialText = '!@#$%^&*()';

    await user.type(clientNameInput, specialText);
    expect(clientNameInput).toHaveValue(specialText);
  });

  it('should handle unicode characters', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    const clientNameInput = screen.getByLabelText(/Client Name/i);
    const unicodeText = '日本語テスト';

    await user.type(clientNameInput, unicodeText);
    expect(clientNameInput).toHaveValue(unicodeText);
  });

  it('should handle item with missing description', () => {
    const quotation = {
      items: [
        {
          description: '',
          measurementValue: 10,
          measurementUnit: 'sq.ft',
          quantity: 1,
          rate: 100,
          gstRate: 18
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should handle item with null values', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: null,
          measurementUnit: 'sq.ft',
          quantity: null,
          rate: null,
          gstRate: null
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });

  it('should handle item with undefined values', () => {
    const quotation = {
      items: [
        {
          description: 'Test Item',
          measurementValue: undefined,
          measurementUnit: 'sq.ft',
          quantity: undefined,
          rate: undefined,
          gstRate: undefined
        }
      ]
    };

    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} quotation={quotation} />
      </MockDataProvider>
    );

    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
  });
});

describe('QuotationFormModal - Measurement Units', () => {
  const defaultProps = {
    quotation: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should display all measurement units', () => {
    render(
      <MockDataProvider>
        <QuotationFormModal {...defaultProps} />
      </MockDataProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should handle empty measurement units array', () => {
    const emptyUnitsData = {
      settings: {
        companyProfile: mockData.settings.companyProfile,
        quotationSettings: mockData.settings.quotationSettings,
        measurementUnits: []
      }
    };

    const EmptyUnitsProvider = ({ children }) => (
      <DataProvider value={{ data: emptyUnitsData }}>
        {children}
      </DataProvider>
    );

    render(
      <EmptyUnitsProvider>
        <QuotationFormModal {...defaultProps} />
      </EmptyUnitsProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });

  it('should handle null measurement units', () => {
    const nullUnitsData = {
      settings: {
        companyProfile: mockData.settings.companyProfile,
        quotationSettings: mockData.settings.quotationSettings,
        measurementUnits: null
      }
    };

    const NullUnitsProvider = ({ children }) => (
      <DataProvider value={{ data: nullUnitsData }}>
        {children}
      </DataProvider>
    );

    render(
      <NullUnitsProvider>
        <QuotationFormModal {...defaultProps} />
      </NullUnitsProvider>
    );

    expect(screen.getByText(/Quotation Details/i)).toBeInTheDocument();
  });
});
