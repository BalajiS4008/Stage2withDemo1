import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddPartyModal from './AddPartyModal';

describe('AddPartyModal - Basic Rendering', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should render without crashing', () => {
    render(<AddPartyModal {...defaultProps} />);
    expect(screen.getByText(/Add Party/i)).toBeInTheDocument();
  });

  it('should display name field', () => {
    render(<AddPartyModal {...defaultProps} />);
    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('should display phone field', () => {
    render(<AddPartyModal {...defaultProps} />);
    const phoneInput = screen.getByLabelText(/Phone/i);
    expect(phoneInput).toBeInTheDocument();
  });

  it('should display email field', () => {
    render(<AddPartyModal {...defaultProps} />);
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('should display address field', () => {
    render(<AddPartyModal {...defaultProps} />);
    const addressInput = screen.getByLabelText(/Address/i);
    expect(addressInput).toBeInTheDocument();
  });

  it('should display party type selector', () => {
    render(<AddPartyModal {...defaultProps} />);
    const typeSelect = screen.getByLabelText(/Party Type/i);
    expect(typeSelect).toBeInTheDocument();
  });

  it('should display save button', () => {
    render(<AddPartyModal {...defaultProps} />);
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should display cancel button', () => {
    render(<AddPartyModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });
});

describe('AddPartyModal - Edit Mode', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should show "Edit Party" title when editing', () => {
    const party = {
      id: '1',
      name: 'Test Party',
      phone: '1234567890',
      email: 'test@test.com',
      address: '123 Test St',
      type: 'client'
    };

    render(<AddPartyModal {...defaultProps} party={party} />);
    expect(screen.getByText(/Edit Party/i)).toBeInTheDocument();
  });

  it('should populate fields with existing party data', () => {
    const party = {
      id: '1',
      name: 'Test Party',
      phone: '1234567890',
      email: 'test@test.com',
      address: '123 Test St',
      type: 'client'
    };

    render(<AddPartyModal {...defaultProps} party={party} />);

    expect(screen.getByDisplayValue('Test Party')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();
  });
});

describe('AddPartyModal - User Input', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should accept text input in name field', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.type(nameInput, 'John Doe');
    expect(nameInput).toHaveValue('John Doe');
  });

  it('should accept phone number input', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '9876543210');
    expect(phoneInput).toHaveValue('9876543210');
  });

  it('should accept email input', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'john@example.com');
    expect(emailInput).toHaveValue('john@example.com');
  });

  it('should accept address input', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    await user.type(addressInput, '123 Main Street');
    expect(addressInput).toHaveValue('123 Main Street');
  });

  it('should allow changing party type', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const typeSelect = screen.getByLabelText(/Party Type/i);
    await user.selectOptions(typeSelect, 'supplier');
    expect(typeSelect).toHaveValue('supplier');
  });
});

describe('AddPartyModal - Party Types', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should have client option', () => {
    render(<AddPartyModal {...defaultProps} />);
    const typeSelect = screen.getByLabelText(/Party Type/i);
    expect(typeSelect).toContainHTML('client');
  });

  it('should have supplier option', () => {
    render(<AddPartyModal {...defaultProps} />);
    const typeSelect = screen.getByLabelText(/Party Type/i);
    expect(typeSelect).toContainHTML('supplier');
  });

  it('should default to client type', () => {
    render(<AddPartyModal {...defaultProps} />);
    const typeSelect = screen.getByLabelText(/Party Type/i);
    expect(typeSelect).toHaveValue('client');
  });
});

describe('AddPartyModal - Form Submission', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should call onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<AddPartyModal {...defaultProps} onSave={onSave} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.type(nameInput, 'Test Party');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(onSave).toHaveBeenCalled();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<AddPartyModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});

describe('AddPartyModal - Edge Cases - Name Field', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle empty name', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toHaveValue('');
  });

  it('should handle very long name', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    const longName = 'a'.repeat(500);
    await user.type(nameInput, longName);
    expect(nameInput.value.length).toBeGreaterThanOrEqual(500);
  });

  it('should handle special characters in name', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    const specialName = "O'Connor & Sons, Inc.";
    await user.type(nameInput, specialName);
    expect(nameInput).toHaveValue(specialName);
  });

  it('should handle unicode characters in name', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    const unicodeName = '日本建設株式会社';
    await user.type(nameInput, unicodeName);
    expect(nameInput).toHaveValue(unicodeName);
  });

  it('should handle name with numbers', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.type(nameInput, 'Company 123');
    expect(nameInput).toHaveValue('Company 123');
  });

  it('should handle name with only spaces', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.type(nameInput, '     ');
    expect(nameInput).toHaveValue('     ');
  });
});

describe('AddPartyModal - Edge Cases - Phone Field', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle 10-digit phone number', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '9876543210');
    expect(phoneInput).toHaveValue('9876543210');
  });

  it('should handle phone number with country code', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '+919876543210');
    expect(phoneInput).toHaveValue('+919876543210');
  });

  it('should handle phone number with dashes', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '987-654-3210');
    expect(phoneInput).toHaveValue('987-654-3210');
  });

  it('should handle phone number with spaces', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '987 654 3210');
    expect(phoneInput).toHaveValue('987 654 3210');
  });

  it('should handle phone number with parentheses', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '(987) 654-3210');
    expect(phoneInput).toHaveValue('(987) 654-3210');
  });

  it('should handle empty phone number', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    expect(phoneInput).toHaveValue('');
  });

  it('should handle very long phone number', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '12345678901234567890');
    expect(phoneInput.value.length).toBeGreaterThan(10);
  });

  it('should handle phone number with letters', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const phoneInput = screen.getByLabelText(/Phone/i);
    await user.type(phoneInput, '1-800-COMPANY');
    expect(phoneInput).toHaveValue('1-800-COMPANY');
  });
});

describe('AddPartyModal - Edge Cases - Email Field', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle valid email format', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should handle email with subdomain', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'test@mail.example.com');
    expect(emailInput).toHaveValue('test@mail.example.com');
  });

  it('should handle email with plus sign', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'test+label@example.com');
    expect(emailInput).toHaveValue('test+label@example.com');
  });

  it('should handle email with dots', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'test.user@example.com');
    expect(emailInput).toHaveValue('test.user@example.com');
  });

  it('should handle email with numbers', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'test123@example.com');
    expect(emailInput).toHaveValue('test123@example.com');
  });

  it('should handle empty email', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toHaveValue('');
  });

  it('should handle invalid email format', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'invalid-email');
    expect(emailInput).toHaveValue('invalid-email');
  });

  it('should handle very long email', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    const longEmail = 'a'.repeat(100) + '@example.com';
    await user.type(emailInput, longEmail);
    expect(emailInput.value.length).toBeGreaterThan(100);
  });

  it('should handle email with unicode domain', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'test@日本.com');
    expect(emailInput).toHaveValue('test@日本.com');
  });
});

describe('AddPartyModal - Edge Cases - Address Field', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle short address', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    await user.type(addressInput, '123 St');
    expect(addressInput).toHaveValue('123 St');
  });

  it('should handle very long address', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    const longAddress = 'a'.repeat(1000);
    await user.type(addressInput, longAddress);
    expect(addressInput.value.length).toBeGreaterThanOrEqual(1000);
  });

  it('should handle multiline address', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    const multilineAddress = '123 Main St\nApt 4B\nNew York, NY 10001';
    await user.type(addressInput, multilineAddress);
    expect(addressInput.value).toContain('123 Main St');
  });

  it('should handle address with special characters', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    await user.type(addressInput, '123 O\'Connor St, Apt #4B');
    expect(addressInput).toHaveValue('123 O\'Connor St, Apt #4B');
  });

  it('should handle address with unicode characters', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    await user.type(addressInput, '東京都渋谷区1-2-3');
    expect(addressInput).toHaveValue('東京都渋谷区1-2-3');
  });

  it('should handle empty address', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const addressInput = screen.getByLabelText(/Address/i);
    expect(addressInput).toHaveValue('');
  });
});

describe('AddPartyModal - Edge Cases - Null/Undefined Props', () => {
  it('should handle null party prop', () => {
    const props = {
      party: null,
      onClose: vi.fn(),
      onSave: vi.fn()
    };
    render(<AddPartyModal {...props} />);
    expect(screen.getByText(/Add Party/i)).toBeInTheDocument();
  });

  it('should handle undefined party prop', () => {
    const props = {
      party: undefined,
      onClose: vi.fn(),
      onSave: vi.fn()
    };
    render(<AddPartyModal {...props} />);
    expect(screen.getByText(/Add Party/i)).toBeInTheDocument();
  });

  it('should handle party with missing fields', () => {
    const party = {
      id: '1',
      name: 'Test Party'
      // Missing phone, email, address, type
    };
    const props = {
      party,
      onClose: vi.fn(),
      onSave: vi.fn()
    };
    render(<AddPartyModal {...props} />);
    expect(screen.getByDisplayValue('Test Party')).toBeInTheDocument();
  });

  it('should handle party with null fields', () => {
    const party = {
      id: '1',
      name: 'Test Party',
      phone: null,
      email: null,
      address: null,
      type: null
    };
    const props = {
      party,
      onClose: vi.fn(),
      onSave: vi.fn()
    };
    render(<AddPartyModal {...props} />);
    expect(screen.getByDisplayValue('Test Party')).toBeInTheDocument();
  });

  it('should handle party with undefined fields', () => {
    const party = {
      id: '1',
      name: 'Test Party',
      phone: undefined,
      email: undefined,
      address: undefined,
      type: undefined
    };
    const props = {
      party,
      onClose: vi.fn(),
      onSave: vi.fn()
    };
    render(<AddPartyModal {...props} />);
    expect(screen.getByDisplayValue('Test Party')).toBeInTheDocument();
  });
});

describe('AddPartyModal - Edge Cases - Form State', () => {
  const defaultProps = {
    party: null,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  it('should handle rapid input changes', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.type(nameInput, 'ABC');
    await user.clear(nameInput);
    await user.type(nameInput, 'XYZ');
    expect(nameInput).toHaveValue('XYZ');
  });

  it('should handle copy-paste input', async () => {
    const user = userEvent.setup();
    render(<AddPartyModal {...defaultProps} />);

    const nameInput = screen.getByLabelText(/Name/i);
    await user.click(nameInput);
    await user.paste('Pasted Name');
    expect(nameInput).toHaveValue('Pasted Name');
  });

  it('should handle clearing all fields', async () => {
    const user = userEvent.setup();
    const party = {
      id: '1',
      name: 'Test Party',
      phone: '1234567890',
      email: 'test@test.com',
      address: '123 Test St',
      type: 'client'
    };

    render(<AddPartyModal {...defaultProps} party={party} />);

    const nameInput = screen.getByDisplayValue('Test Party');
    await user.clear(nameInput);
    expect(nameInput).toHaveValue('');
  });
});
