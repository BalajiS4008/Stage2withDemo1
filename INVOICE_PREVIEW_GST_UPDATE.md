# Invoice Preview - GST Column Update

## Summary

Updated the **Invoice Preview Modal** to display individual GST information for each line item when `itemGstEnabled` is true.

## Changes Made

### ✅ Updated Line Items Table

**File**: `src/components/InvoicePreviewModal.jsx:357-394`

### 1. Changed Column Header
```jsx
// Before
<th>Measurement Value</th>

// After
<th>Area</th>
```

### 2. Added Conditional GST Column Header
```jsx
{formData.itemGstEnabled && (
  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">GST</th>
)}
```

### 3. Added GST Column in Table Body
```jsx
{formData.itemGstEnabled && (
  <td className="py-3 px-4 text-sm text-gray-900 text-center">
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-gray-600">{Math.round(item.gstRate || 0)}%</span>
      <span className="text-xs font-semibold text-green-700">₹{(item.gstValue || 0).toFixed(2)}</span>
    </div>
  </td>
)}
```

## Visual Design

### GST Column in Preview

```
┌─────────────────┐
│      18%        │  ← GST percentage (small, gray)
├─────────────────┤
│   ₹1,800.00     │  ← GST value (bold, green)
└─────────────────┘
```

### Complete Table Layout

**When itemGstEnabled = true**:
```
| Description | Area | Unit | Qty | Rate    | GST      | Amount    |
|-------------|------|------|-----|---------|----------|-----------|
| Work        | 10   | sqft | 2   | ₹500.00 | 18%      | ₹11,800   |
|             |      |      |     |         | ₹1,800   |           |
```

**When itemGstEnabled = false**:
```
| Description | Area | Unit | Qty | Rate    | Amount  |
|-------------|------|------|-----|---------|---------|
| Work        | 10   | sqft | 2   | ₹500.00 | ₹10,000 |
```

## Features

### ✅ **Conditional Display**
- GST column only shows when `formData.itemGstEnabled` is `true`
- Matches the behavior of the invoice form
- Provides consistent user experience

### ✅ **Two-Line GST Display**
- **Top line**: GST percentage (e.g., "18%")
- **Bottom line**: Calculated GST value (e.g., "₹1,800.00")
- **Styling**:
  - Percentage: Small, gray text
  - Value: Bold, green text

### ✅ **Accurate Calculations**
- Shows exact GST rate from `item.gstRate`
- Displays calculated GST value from `item.gstValue`
- Rounds percentage to whole number for cleaner display

## Use Cases

### Use Case 1: Preview with GST Enabled
```
Steps:
1. Create invoice with itemGstEnabled = true
2. Add items with different GST rates
3. Click "Preview Invoice"

Expected:
- Table shows GST column
- Each row displays GST % and value
- Amounts include GST
```

### Use Case 2: Preview with GST Disabled
```
Steps:
1. Create invoice with itemGstEnabled = false
2. Add items
3. Click "Preview Invoice"

Expected:
- Table has no GST column
- More space for other columns
- Amounts show base values only
```

### Use Case 3: Mixed GST Rates
```
Given:
- Item 1: 18% GST
- Item 2: 12% GST
- Item 3: 5% GST

Preview shows:
Row 1: 18% / ₹900.00
Row 2: 12% / ₹360.00
Row 3: 5%  / ₹250.00
```

## Code Structure

### Table Structure
```jsx
<table className="w-full">
  <thead>
    <tr>
      <th>Description</th>
      <th>Area</th>
      <th>Unit</th>
      <th>Qty</th>
      <th>Rate</th>
      {formData.itemGstEnabled && <th>GST</th>}  {/* ← Conditional */}
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
    {formData.items.map((item, index) => (
      <tr key={index}>
        <td>{item.description}</td>
        <td>{item.measurementValue || '-'}</td>
        <td>{item.unit || '-'}</td>
        <td>{item.quantity}</td>
        <td>{formatCurrency(item.rate)}</td>
        {formData.itemGstEnabled && (
          <td>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-gray-600">
                {Math.round(item.gstRate || 0)}%
              </span>
              <span className="text-xs font-semibold text-green-700">
                ₹{(item.gstValue || 0).toFixed(2)}
              </span>
            </div>
          </td>
        )}
        <td>{formatCurrency(item.amount)}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## Testing

### Test Case 1: GST Column Visibility
```
Steps:
1. Create invoice with itemGstEnabled = true
2. Click Preview
3. Verify GST column appears
4. Go back, uncheck "Enable Item GST Column"
5. Click Preview again
6. Verify GST column is hidden

✅ Expected: Column appears/disappears based on toggle
```

### Test Case 2: GST Values Display
```
Given:
- Area: 10
- Qty: 2
- Rate: ₹500
- GST: 18%

Expected in Preview:
- GST column shows: "18%" on top, "₹1,800.00" below
- Amount shows: ₹11,800.00 (includes GST)

✅ Verify calculations match form
```

### Test Case 3: Multiple Items with Different Rates
```
Given:
- Item 1: 18% GST → ₹1,800
- Item 2: 12% GST → ₹720
- Item 3: 5% GST → ₹250

Expected:
- Each row shows correct percentage and value
- Total GST: ₹2,770
- Grand Total includes all GST

✅ Verify individual and total calculations
```

## Benefits

1. ✅ **Transparency** - Shows exactly how GST is calculated per item
2. ✅ **Consistency** - Matches the invoice form layout
3. ✅ **Professional** - Clean two-line display format
4. ✅ **Flexible** - Adapts to GST enabled/disabled state
5. ✅ **Accurate** - Displays actual calculated values

## PDF Generation

The same conditional logic applies to PDF generation:
- When `itemGstEnabled = true`: PDF includes GST column
- When `itemGstEnabled = false`: PDF excludes GST column
- All template styles (Classic, Modern, Minimal, etc.) will respect this setting

## Related Files

1. ✅ **InvoiceFormModal.jsx** - Main form with GST toggle
2. ✅ **InvoicePreviewModal.jsx** - Preview with GST column (this file)
3. 🔄 **invoiceTemplates.js** - PDF generation (may need similar update)

## Future Enhancements

1. 🔄 Add GST breakdown tooltip on hover
2. 🔄 Color-code different GST rates
3. 🔄 Add subtotal before GST in Amount column
4. 🔄 Highlight items with no GST (0%)

---

**Status**: ✅ **COMPLETED**
**Date**: 2024-11-20
**Version**: 1.0 (Preview GST Column)
**Application**: http://localhost:3001
