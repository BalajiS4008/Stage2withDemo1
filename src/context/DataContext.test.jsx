import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { DataProvider, useData } from './DataContext';
import React from 'react';

// Test component that uses DataContext
const TestComponent = () => {
  const { data, updateData } = useData();

  return (
    <div>
      <div data-testid="data-display">{JSON.stringify(data)}</div>
      <button onClick={() => updateData({ test: 'updated' })}>
        Update Data
      </button>
    </div>
  );
};

describe('DataContext - Basic Functionality', () => {
  it('should provide data context', () => {
    const mockData = { parties: [], invoices: [] };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('parties');
    expect(screen.getByTestId('data-display')).toHaveTextContent('invoices');
  });

  it('should allow updating data', () => {
    const mockUpdateData = vi.fn();
    const mockData = { test: 'initial' };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponent />
      </DataProvider>
    );

    const button = screen.getByRole('button', { name: /update data/i });
    button.click();

    expect(mockUpdateData).toHaveBeenCalledWith({ test: 'updated' });
  });

  it('should provide updateData function', () => {
    const mockData = { parties: [] };
    const mockUpdateData = vi.fn();

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByRole('button', { name: /update data/i })).toBeInTheDocument();
  });
});

describe('DataContext - Data Structure', () => {
  it('should handle empty data object', () => {
    const emptyData = {};

    render(
      <DataProvider value={{ data: emptyData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('{}');
  });

  it('should handle data with parties', () => {
    const mockData = {
      parties: [
        { id: '1', name: 'Party 1' },
        { id: '2', name: 'Party 2' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('Party 1');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Party 2');
  });

  it('should handle data with invoices', () => {
    const mockData = {
      invoices: [
        { id: '1', number: 'INV-001' },
        { id: '2', number: 'INV-002' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('INV-001');
    expect(screen.getByTestId('data-display')).toHaveTextContent('INV-002');
  });

  it('should handle data with quotations', () => {
    const mockData = {
      quotations: [
        { id: '1', number: 'QUO-001' },
        { id: '2', number: 'QUO-002' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('QUO-001');
    expect(screen.getByTestId('data-display')).toHaveTextContent('QUO-002');
  });

  it('should handle data with projects', () => {
    const mockData = {
      projects: [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('Project 1');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Project 2');
  });

  it('should handle data with settings', () => {
    const mockData = {
      settings: {
        companyProfile: { companyName: 'Test Company' },
        invoiceSettings: { prefix: 'INV' }
      }
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('Test Company');
    expect(screen.getByTestId('data-display')).toHaveTextContent('INV');
  });

  it('should handle complete data structure', () => {
    const completeData = {
      parties: [{ id: '1', name: 'Party 1' }],
      invoices: [{ id: '1', number: 'INV-001' }],
      quotations: [{ id: '1', number: 'QUO-001' }],
      projects: [{ id: '1', name: 'Project 1' }],
      settings: {
        companyProfile: { companyName: 'Test Company' }
      }
    };

    render(
      <DataProvider value={{ data: completeData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('Party 1');
    expect(screen.getByTestId('data-display')).toHaveTextContent('INV-001');
    expect(screen.getByTestId('data-display')).toHaveTextContent('QUO-001');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Project 1');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Test Company');
  });
});

describe('DataContext - Edge Cases - Null/Undefined', () => {
  it('should handle null data', () => {
    render(
      <DataProvider value={{ data: null, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('null');
  });

  it('should handle undefined data', () => {
    render(
      <DataProvider value={{ data: undefined, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });

  it('should handle null parties array', () => {
    const mockData = { parties: null };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('null');
  });

  it('should handle undefined parties array', () => {
    const mockData = { parties: undefined };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });

  it('should handle null updateData function', () => {
    const mockData = { parties: [] };

    render(
      <DataProvider value={{ data: mockData, updateData: null }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });
});

describe('DataContext - Edge Cases - Empty Arrays', () => {
  it('should handle empty parties array', () => {
    const mockData = { parties: [] };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('[]');
  });

  it('should handle empty invoices array', () => {
    const mockData = { invoices: [] };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('[]');
  });

  it('should handle all empty arrays', () => {
    const mockData = {
      parties: [],
      invoices: [],
      quotations: [],
      projects: []
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('parties');
    expect(screen.getByTestId('data-display')).toHaveTextContent('invoices');
    expect(screen.getByTestId('data-display')).toHaveTextContent('quotations');
    expect(screen.getByTestId('data-display')).toHaveTextContent('projects');
  });
});

describe('DataContext - Edge Cases - Large Datasets', () => {
  it('should handle 1000 parties', () => {
    const mockData = {
      parties: Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Party ${i + 1}`
      }))
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });

  it('should handle 1000 invoices', () => {
    const mockData = {
      invoices: Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        number: `INV-${i + 1}`
      }))
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });

  it('should handle large combined dataset', () => {
    const mockData = {
      parties: Array.from({ length: 500 }, (_, i) => ({ id: `${i + 1}`, name: `Party ${i + 1}` })),
      invoices: Array.from({ length: 500 }, (_, i) => ({ id: `${i + 1}`, number: `INV-${i + 1}` })),
      quotations: Array.from({ length: 500 }, (_, i) => ({ id: `${i + 1}`, number: `QUO-${i + 1}` })),
      projects: Array.from({ length: 500 }, (_, i) => ({ id: `${i + 1}`, name: `Project ${i + 1}` }))
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });
});

describe('DataContext - Edge Cases - Special Characters', () => {
  it('should handle party names with special characters', () => {
    const mockData = {
      parties: [
        { id: '1', name: "O'Connor & Sons, Inc." },
        { id: '2', name: '<Script>Alert("XSS")</Script>' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent("O'Connor");
  });

  it('should handle unicode characters', () => {
    const mockData = {
      parties: [
        { id: '1', name: '日本建設株式会社' },
        { id: '2', name: 'Müller GmbH' },
        { id: '3', name: 'Société française' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('日本建設株式会社');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Müller');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Société');
  });

  it('should handle emoji in data', () => {
    const mockData = {
      parties: [
        { id: '1', name: 'Party 🏗️ Construction' },
        { id: '2', name: '🏢 Building Co.' }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('🏗️');
    expect(screen.getByTestId('data-display')).toHaveTextContent('🏢');
  });
});

describe('DataContext - Edge Cases - Deep Nesting', () => {
  it('should handle deeply nested data', () => {
    const mockData = {
      settings: {
        companyProfile: {
          nested: {
            deep: {
              very: {
                deeply: {
                  nested: {
                    value: 'test'
                  }
                }
              }
            }
          }
        }
      }
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('test');
  });

  it('should handle nested arrays', () => {
    const mockData = {
      parties: [
        {
          id: '1',
          name: 'Party 1',
          contacts: [
            { id: 'c1', name: 'Contact 1' },
            { id: 'c2', name: 'Contact 2' }
          ]
        }
      ]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toHaveTextContent('Contact 1');
    expect(screen.getByTestId('data-display')).toHaveTextContent('Contact 2');
  });
});

describe('DataContext - Edge Cases - Circular References', () => {
  it('should handle data without circular references', () => {
    const mockData = {
      parties: [{ id: '1', name: 'Party 1' }]
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <TestComponent />
      </DataProvider>
    );

    expect(screen.getByTestId('data-display')).toBeInTheDocument();
  });
});

describe('DataContext - Update Operations', () => {
  it('should call updateData with correct arguments', () => {
    const mockUpdateData = vi.fn();
    const mockData = { parties: [] };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponent />
      </DataProvider>
    );

    const button = screen.getByRole('button', { name: /update data/i });
    button.click();

    expect(mockUpdateData).toHaveBeenCalledTimes(1);
    expect(mockUpdateData).toHaveBeenCalledWith({ test: 'updated' });
  });

  it('should handle multiple updateData calls', () => {
    const mockUpdateData = vi.fn();
    const mockData = { parties: [] };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponent />
      </DataProvider>
    );

    const button = screen.getByRole('button', { name: /update data/i });
    button.click();
    button.click();
    button.click();

    expect(mockUpdateData).toHaveBeenCalledTimes(3);
  });

  it('should handle updateData with empty object', () => {
    const mockUpdateData = vi.fn();
    const mockData = { parties: [] };

    const TestComponentEmpty = () => {
      const { updateData } = useData();
      return <button onClick={() => updateData({})}>Update Empty</button>;
    };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponentEmpty />
      </DataProvider>
    );

    const button = screen.getByRole('button', { name: /update empty/i });
    button.click();

    expect(mockUpdateData).toHaveBeenCalledWith({});
  });

  it('should handle updateData with null', () => {
    const mockUpdateData = vi.fn();
    const mockData = { parties: [] };

    const TestComponentNull = () => {
      const { updateData } = useData();
      return <button onClick={() => updateData(null)}>Update Null</button>;
    };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponentNull />
      </DataProvider>
    );

    const button = screen.getByRole('button', { name: /update null/i });
    button.click();

    expect(mockUpdateData).toHaveBeenCalledWith(null);
  });

  it('should handle updateData with array', () => {
    const mockUpdateData = vi.fn();
    const mockData = { parties: [] };

    const TestComponentArray = () => {
      const { updateData } = useData();
      return <button onClick={() => updateData([1, 2, 3])}>Update Array</button>;
    };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <TestComponentArray />
      </DataProvider>
    );

    const button = screen.getByRole('button', { name: /update array/i });
    button.click();

    expect(mockUpdateData).toHaveBeenCalledWith([1, 2, 3]);
  });
});

describe('DataContext - Multiple Consumers', () => {
  it('should provide same data to multiple consumers', () => {
    const mockData = { parties: [{ id: '1', name: 'Shared Party' }] };

    const Consumer1 = () => {
      const { data } = useData();
      return <div data-testid="consumer1">{data.parties[0].name}</div>;
    };

    const Consumer2 = () => {
      const { data } = useData();
      return <div data-testid="consumer2">{data.parties[0].name}</div>;
    };

    render(
      <DataProvider value={{ data: mockData, updateData: vi.fn() }}>
        <Consumer1 />
        <Consumer2 />
      </DataProvider>
    );

    expect(screen.getByTestId('consumer1')).toHaveTextContent('Shared Party');
    expect(screen.getByTestId('consumer2')).toHaveTextContent('Shared Party');
  });

  it('should allow multiple consumers to call updateData', () => {
    const mockUpdateData = vi.fn();
    const mockData = { parties: [] };

    const Consumer1 = () => {
      const { updateData } = useData();
      return <button onClick={() => updateData({ from: 'consumer1' })}>Update 1</button>;
    };

    const Consumer2 = () => {
      const { updateData } = useData();
      return <button onClick={() => updateData({ from: 'consumer2' })}>Update 2</button>;
    };

    render(
      <DataProvider value={{ data: mockData, updateData: mockUpdateData }}>
        <Consumer1 />
        <Consumer2 />
      </DataProvider>
    );

    const button1 = screen.getByRole('button', { name: /update 1/i });
    const button2 = screen.getByRole('button', { name: /update 2/i });

    button1.click();
    button2.click();

    expect(mockUpdateData).toHaveBeenCalledTimes(2);
    expect(mockUpdateData).toHaveBeenNthCalledWith(1, { from: 'consumer1' });
    expect(mockUpdateData).toHaveBeenNthCalledWith(2, { from: 'consumer2' });
  });
});
