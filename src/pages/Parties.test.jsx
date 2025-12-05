import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Parties from './Parties';
import { DataProvider } from '../context/DataContext';

// Mock data context
const mockParties = [
  {
    id: '1',
    name: 'Client A',
    phone: '1234567890',
    email: 'clienta@example.com',
    address: '123 Main St',
    type: 'client'
  },
  {
    id: '2',
    name: 'Supplier B',
    phone: '9876543210',
    email: 'supplierb@example.com',
    address: '456 Oak Ave',
    type: 'supplier'
  }
];

const mockData = {
  parties: mockParties
};

const MockDataProvider = ({ children, data = mockData }) => (
  <DataProvider value={{ data, updateData: vi.fn() }}>
    {children}
  </DataProvider>
);

describe('Parties - Basic Rendering', () => {
  it('should render without crashing', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText(/Parties/i)).toBeInTheDocument();
  });

  it('should display add party button', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const addButton = screen.getByRole('button', { name: /add party/i });
    expect(addButton).toBeInTheDocument();
  });

  it('should display search field', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should display filter by type dropdown', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const filterSelect = screen.getByRole('combobox');
    expect(filterSelect).toBeInTheDocument();
  });
});

describe('Parties - Party List Display', () => {
  it('should display all parties', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });

  it('should display party phone numbers', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
  });

  it('should display party emails', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('clienta@example.com')).toBeInTheDocument();
    expect(screen.getByText('supplierb@example.com')).toBeInTheDocument();
  });

  it('should display party types', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText(/client/i)).toBeInTheDocument();
    expect(screen.getByText(/supplier/i)).toBeInTheDocument();
  });

  it('should display action buttons for each party', () => {
    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });
});

describe('Parties - Search Functionality', () => {
  it('should filter parties by name', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Client A');

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.queryByText('Supplier B')).not.toBeInTheDocument();
  });

  it('should filter parties by phone', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, '1234567890');

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.queryByText('Supplier B')).not.toBeInTheDocument();
  });

  it('should filter parties by email', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'supplierb@example.com');

    expect(screen.getByText('Supplier B')).toBeInTheDocument();
    expect(screen.queryByText('Client A')).not.toBeInTheDocument();
  });

  it('should be case insensitive', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'CLIENT A');

    expect(screen.getByText('Client A')).toBeInTheDocument();
  });

  it('should show all parties when search is cleared', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Client A');
    await user.clear(searchInput);

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });

  it('should show no results message when no match', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'NonExistentParty');

    expect(screen.getByText(/no parties found/i)).toBeInTheDocument();
  });
});

describe('Parties - Type Filter', () => {
  it('should filter by client type', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'client');

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.queryByText('Supplier B')).not.toBeInTheDocument();
  });

  it('should filter by supplier type', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'supplier');

    expect(screen.getByText('Supplier B')).toBeInTheDocument();
    expect(screen.queryByText('Client A')).not.toBeInTheDocument();
  });

  it('should show all parties when filter is set to all', async () => {
    const user = userEvent.setup();

    render(
      <MockDataProvider>
        <Parties />
      </MockDataProvider>
    );

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'all');

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });
});

describe('Parties - Combined Search and Filter', () => {
  it('should apply both search and type filter', async () => {
    const user = userEvent.setup();

    const manyParties = {
      parties: [
        ...mockParties,
        { id: '3', name: 'Client C', phone: '1111111111', email: 'clientc@example.com', address: '789 Elm St', type: 'client' }
      ]
    };

    render(
      <MockDataProvider data={manyParties}>
        <Parties />
      </MockDataProvider>
    );

    const filterSelect = screen.getByRole('combobox');
    await user.selectOptions(filterSelect, 'client');

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Client A');

    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.queryByText('Client C')).not.toBeInTheDocument();
    expect(screen.queryByText('Supplier B')).not.toBeInTheDocument();
  });
});

describe('Parties - Empty State', () => {
  it('should show empty state when no parties exist', () => {
    const emptyData = { parties: [] };

    render(
      <MockDataProvider data={emptyData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText(/no parties found/i)).toBeInTheDocument();
  });

  it('should show add party button in empty state', () => {
    const emptyData = { parties: [] };

    render(
      <MockDataProvider data={emptyData}>
        <Parties />
      </MockDataProvider>
    );

    const addButton = screen.getByRole('button', { name: /add party/i });
    expect(addButton).toBeInTheDocument();
  });
});

describe('Parties - Edge Cases - Data', () => {
  it('should handle null parties array', () => {
    const nullData = { parties: null };

    render(
      <MockDataProvider data={nullData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText(/Parties/i)).toBeInTheDocument();
  });

  it('should handle undefined parties array', () => {
    const undefinedData = { parties: undefined };

    render(
      <MockDataProvider data={undefinedData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText(/Parties/i)).toBeInTheDocument();
  });

  it('should handle party with missing fields', () => {
    const incompleteData = {
      parties: [
        { id: '1', name: 'Incomplete Party' }
        // Missing phone, email, address, type
      ]
    };

    render(
      <MockDataProvider data={incompleteData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Incomplete Party')).toBeInTheDocument();
  });

  it('should handle party with null fields', () => {
    const nullFieldsData = {
      parties: [
        {
          id: '1',
          name: 'Null Fields Party',
          phone: null,
          email: null,
          address: null,
          type: null
        }
      ]
    };

    render(
      <MockDataProvider data={nullFieldsData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Null Fields Party')).toBeInTheDocument();
  });

  it('should handle party with undefined fields', () => {
    const undefinedFieldsData = {
      parties: [
        {
          id: '1',
          name: 'Undefined Fields Party',
          phone: undefined,
          email: undefined,
          address: undefined,
          type: undefined
        }
      ]
    };

    render(
      <MockDataProvider data={undefinedFieldsData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Undefined Fields Party')).toBeInTheDocument();
  });

  it('should handle party with empty string fields', () => {
    const emptyStringData = {
      parties: [
        {
          id: '1',
          name: 'Empty Fields Party',
          phone: '',
          email: '',
          address: '',
          type: ''
        }
      ]
    };

    render(
      <MockDataProvider data={emptyStringData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Empty Fields Party')).toBeInTheDocument();
  });
});

describe('Parties - Edge Cases - Large Datasets', () => {
  it('should handle 100 parties', () => {
    const manyParties = {
      parties: Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Party ${i + 1}`,
        phone: `123456${i.toString().padStart(4, '0')}`,
        email: `party${i + 1}@example.com`,
        address: `${i + 1} Main St`,
        type: i % 2 === 0 ? 'client' : 'supplier'
      }))
    };

    render(
      <MockDataProvider data={manyParties}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Party 1')).toBeInTheDocument();
  });

  it('should search efficiently with large dataset', async () => {
    const user = userEvent.setup();

    const manyParties = {
      parties: Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Party ${i + 1}`,
        phone: `123456${i.toString().padStart(4, '0')}`,
        email: `party${i + 1}@example.com`,
        address: `${i + 1} Main St`,
        type: i % 2 === 0 ? 'client' : 'supplier'
      }))
    };

    render(
      <MockDataProvider data={manyParties}>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Party 500');

    expect(screen.getByText('Party 500')).toBeInTheDocument();
  });
});

describe('Parties - Edge Cases - Special Characters', () => {
  it('should handle party name with special characters', () => {
    const specialCharData = {
      parties: [
        {
          id: '1',
          name: "O'Connor & Sons, Inc.",
          phone: '1234567890',
          email: 'test@example.com',
          address: '123 Main St',
          type: 'client'
        }
      ]
    };

    render(
      <MockDataProvider data={specialCharData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText("O'Connor & Sons, Inc.")).toBeInTheDocument();
  });

  it('should handle party name with unicode characters', () => {
    const unicodeData = {
      parties: [
        {
          id: '1',
          name: '日本建設株式会社',
          phone: '1234567890',
          email: 'test@example.com',
          address: '東京都渋谷区',
          type: 'client'
        }
      ]
    };

    render(
      <MockDataProvider data={unicodeData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('日本建設株式会社')).toBeInTheDocument();
  });

  it('should search with special characters', async () => {
    const user = userEvent.setup();

    const specialCharData = {
      parties: [
        {
          id: '1',
          name: "O'Connor & Sons",
          phone: '1234567890',
          email: 'test@example.com',
          address: '123 Main St',
          type: 'client'
        }
      ]
    };

    render(
      <MockDataProvider data={specialCharData}>
        <Parties />
      </MockDataProvider>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "O'Connor");

    expect(screen.getByText("O'Connor & Sons")).toBeInTheDocument();
  });
});

describe('Parties - Edge Cases - Very Long Data', () => {
  it('should handle very long party name', () => {
    const longNameData = {
      parties: [
        {
          id: '1',
          name: 'A'.repeat(500),
          phone: '1234567890',
          email: 'test@example.com',
          address: '123 Main St',
          type: 'client'
        }
      ]
    };

    render(
      <MockDataProvider data={longNameData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
  });

  it('should handle very long email', () => {
    const longEmailData = {
      parties: [
        {
          id: '1',
          name: 'Test Party',
          phone: '1234567890',
          email: 'a'.repeat(100) + '@example.com',
          address: '123 Main St',
          type: 'client'
        }
      ]
    };

    render(
      <MockDataProvider data={longEmailData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Test Party')).toBeInTheDocument();
  });

  it('should handle very long address', () => {
    const longAddressData = {
      parties: [
        {
          id: '1',
          name: 'Test Party',
          phone: '1234567890',
          email: 'test@example.com',
          address: 'A'.repeat(1000),
          type: 'client'
        }
      ]
    };

    render(
      <MockDataProvider data={longAddressData}>
        <Parties />
      </MockDataProvider>
    );

    expect(screen.getByText('Test Party')).toBeInTheDocument();
  });
});

describe('Parties - Duplicate Data', () => {
  it('should handle parties with duplicate names', () => {
    const duplicateData = {
      parties: [
        { id: '1', name: 'Same Name', phone: '1111111111', email: 'email1@example.com', address: 'Address 1', type: 'client' },
        { id: '2', name: 'Same Name', phone: '2222222222', email: 'email2@example.com', address: 'Address 2', type: 'supplier' }
      ]
    };

    render(
      <MockDataProvider data={duplicateData}>
        <Parties />
      </MockDataProvider>
    );

    const names = screen.getAllByText('Same Name');
    expect(names).toHaveLength(2);
  });

  it('should handle parties with duplicate emails', () => {
    const duplicateEmailData = {
      parties: [
        { id: '1', name: 'Party 1', phone: '1111111111', email: 'same@example.com', address: 'Address 1', type: 'client' },
        { id: '2', name: 'Party 2', phone: '2222222222', email: 'same@example.com', address: 'Address 2', type: 'supplier' }
      ]
    };

    render(
      <MockDataProvider data={duplicateEmailData}>
        <Parties />
      </MockDataProvider>
    );

    const emails = screen.getAllByText('same@example.com');
    expect(emails).toHaveLength(2);
  });

  it('should handle parties with duplicate phone numbers', () => {
    const duplicatePhoneData = {
      parties: [
        { id: '1', name: 'Party 1', phone: '1234567890', email: 'email1@example.com', address: 'Address 1', type: 'client' },
        { id: '2', name: 'Party 2', phone: '1234567890', email: 'email2@example.com', address: 'Address 2', type: 'supplier' }
      ]
    };

    render(
      <MockDataProvider data={duplicatePhoneData}>
        <Parties />
      </MockDataProvider>
    );

    const phones = screen.getAllByText('1234567890');
    expect(phones).toHaveLength(2);
  });
});
