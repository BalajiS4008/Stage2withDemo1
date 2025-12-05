# Testing Guide for Construction Billing Software

## 🧪 Testing Stack

This project uses the following **FREE** testing tools:

1. **Vitest** - Fast unit test framework (Jest-compatible)
2. **React Testing Library** - Component testing utilities
3. **@testing-library/jest-dom** - Custom matchers for DOM elements
4. **@testing-library/user-event** - User interaction simulation
5. **Vitest UI** - Visual test runner interface

## 📦 Installation

Install all testing dependencies:

```bash
npm install
```

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (recommended during development)
```bash
npm test -- --watch
```

### Run tests with UI (visual interface)
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- InvoiceFormModal.test.jsx
```

### Run tests matching a pattern
```bash
npm test -- --grep "Due Date"
```

## 📝 Test File Structure

### Naming Convention
- Place test files next to the source files
- Use `.test.js` or `.test.jsx` extension
- Example: `InvoiceFormModal.jsx` → `InvoiceFormModal.test.jsx`

### Test Organization
```javascript
describe('Component/Function Name', () => {
  describe('Feature/Functionality', () => {
    it('should do something specific', () => {
      // Test code
    });
  });
});
```

## 🎯 Edge Cases to Test

### 1. **Input Validation Edge Cases**
- **Null/Undefined**: What happens when data is missing?
- **Empty strings**: How does the app handle `""`?
- **Special characters**: Can it handle `!@#$%^&*()`?
- **Very long strings**: Test with 1000+ character strings
- **Numbers as strings**: Does `"123"` work where numbers expected?
- **Negative numbers**: How are `-100` values handled?
- **Zero values**: Test with `0`, `0.00`, etc.
- **Infinity/NaN**: Does math handle `Infinity` and `NaN`?

### 2. **Date Edge Cases**
- **Invalid dates**: `"invalid-date"`, `"2024-13-45"`
- **Leap year dates**: `"2024-02-29"`
- **Year boundaries**: `"1900-01-01"`, `"2099-12-31"`
- **Null dates**: `null`, `undefined`
- **Different formats**: ISO, timestamps, Date objects

### 3. **Array/List Edge Cases**
- **Empty arrays**: `[]`
- **Single item**: `[item]`
- **Very large arrays**: 1000+ items
- **Null/undefined items**: `[null, undefined, item]`
- **Duplicate items**: `[item, item, item]`

### 4. **Form Edge Cases**
- **Required field validation**: Leave required fields empty
- **Field dependencies**: Field A affects Field B
- **Form submission**: Multiple rapid submissions
- **Browser autofill**: Pre-filled form data
- **Copy-paste data**: Pasted vs. typed content

### 5. **Status/State Edge Cases**
- **Transition testing**: Status changes (pending → paid → cancelled)
- **Conditional rendering**: Fields that appear/disappear based on state
- **Default states**: Initial values on load
- **Persisted state**: Data after page refresh

### 6. **Number/Currency Edge Cases**
```javascript
// Test these values
const edgeCases = [
  0,                    // Zero
  -0,                   // Negative zero
  0.01,                 // Very small positive
  -0.01,                // Very small negative
  999999999.99,         // Very large
  -999999999.99,        // Very large negative
  Number.MAX_VALUE,     // Maximum JS number
  Number.MIN_VALUE,     // Minimum JS number
  Infinity,             // Infinity
  -Infinity,            // Negative infinity
  NaN,                  // Not a number
  "123",                // String number
  "123.45",             // String decimal
  "",                   // Empty string
  null,                 // Null
  undefined,            // Undefined
];
```

### 7. **Text Edge Cases**
```javascript
const textEdgeCases = [
  "",                                // Empty
  " ",                               // Single space
  "   ",                             // Multiple spaces
  "a",                               // Single character
  "a".repeat(1000),                  // Very long text
  "Test\nNew Line",                  // Newline
  "Test\tTab",                       // Tab
  "Test  Multiple  Spaces",          // Multiple spaces
  "<script>alert('XSS')</script>",   // XSS attempt
  "'; DROP TABLE users; --",         // SQL injection attempt
  "!@#$%^&*(){}[]|\\:;\"'<>?,./",   // Special characters
  "😀🎉🚀",                          // Emojis
  "संस्कृत",                        // Unicode
];
```

## 📚 Example Test Cases

### Testing a Utility Function
```javascript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  // Positive case
  it('should format positive numbers', () => {
    expect(formatCurrency(1000)).toBe('₹1,000.00');
  });

  // Edge cases
  it('should handle null', () => {
    expect(formatCurrency(null)).toBe('₹0.00');
  });

  it('should handle negative numbers', () => {
    expect(formatCurrency(-500)).toBe('₹-500.00');
  });

  it('should handle very large numbers', () => {
    expect(formatCurrency(1000000000)).toBe('₹1,000,000,000.00');
  });
});
```

### Testing a React Component
```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InvoiceForm from './InvoiceForm';

describe('InvoiceForm', () => {
  // Rendering test
  it('should render form fields', () => {
    render(<InvoiceForm />);
    expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
  });

  // User interaction test
  it('should update field value on input', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    const input = screen.getByLabelText(/Client Name/i);
    await user.type(input, 'John Doe');

    expect(input).toHaveValue('John Doe');
  });

  // Edge case: empty submission
  it('should show error on empty form submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<InvoiceForm onSubmit={onSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /submit/i });
    await user.click(submitBtn);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
  });

  // Edge case: special characters
  it('should accept special characters in notes', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    const notesField = screen.getByLabelText(/Notes/i);
    await user.type(notesField, '!@#$%^&*()');

    expect(notesField).toHaveValue('!@#$%^&*()');
  });
});
```

### Testing Conditional Rendering
```javascript
describe('Due Date Field', () => {
  it('should show when status is pending', () => {
    render(<InvoiceForm status="pending" />);
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
  });

  it('should hide when status is paid', () => {
    render(<InvoiceForm status="paid" />);
    expect(screen.queryByLabelText(/Due Date/i)).not.toBeInTheDocument();
  });

  it('should reappear when status changes back to pending', async () => {
    const user = userEvent.setup();
    render(<InvoiceForm />);

    // Change to paid
    const statusSelect = screen.getByLabelText(/Status/i);
    await user.selectOptions(statusSelect, 'paid');
    expect(screen.queryByLabelText(/Due Date/i)).not.toBeInTheDocument();

    // Change back to pending
    await user.selectOptions(statusSelect, 'pending');
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();
  });
});
```

## 🏆 Best Practices

### 1. **Test Behavior, Not Implementation**
✅ Good: Test that clicking "Save" saves the data
❌ Bad: Test that clicking "Save" calls `handleSave()` function

### 2. **Use Accessible Queries**
Prefer queries that mirror how users interact:
```javascript
// Preferred (accessible)
screen.getByLabelText(/Client Name/i)
screen.getByRole('button', { name: /Save/i })
screen.getByText(/Error message/i)

// Avoid (implementation details)
screen.getByTestId('client-name-input')
container.querySelector('.client-name')
```

### 3. **Test Edge Cases First**
Focus on what can break:
- Null/undefined values
- Empty states
- Boundary values
- Invalid inputs

### 4. **Mock External Dependencies**
```javascript
import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
};
global.localStorage = mockLocalStorage;

// Mock API calls
vi.mock('./api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: [] }))
}));
```

### 5. **Use Descriptive Test Names**
```javascript
// ✅ Good
it('should display error when invoice number is empty', () => {});

// ❌ Bad
it('works', () => {});
```

## 📊 Coverage Goals

Aim for:
- **80%+ overall coverage**
- **100% coverage** for critical business logic (calculations, validations)
- **90%+ coverage** for utility functions
- **70%+ coverage** for UI components

## 🔧 Troubleshooting

### Tests failing with "cannot find module"
```bash
npm install
```

### Tests timing out
Increase timeout in test:
```javascript
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Mock not working
Clear mocks between tests:
```javascript
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});
```

## 📖 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎓 Example Test Checklist

When creating tests for a new feature, ensure you test:

- [ ] Renders without errors
- [ ] Displays correct initial state
- [ ] Handles user input correctly
- [ ] Validates required fields
- [ ] Shows/hides conditional elements
- [ ] Handles null/undefined gracefully
- [ ] Handles empty strings
- [ ] Handles very long strings
- [ ] Handles special characters
- [ ] Handles edge case numbers (0, negative, very large)
- [ ] Handles invalid dates
- [ ] Updates state correctly
- [ ] Calls callbacks with correct parameters
- [ ] Displays error messages appropriately
- [ ] Works with keyboard navigation
- [ ] Works with screen readers (accessibility)

---

**Happy Testing! 🎉**
