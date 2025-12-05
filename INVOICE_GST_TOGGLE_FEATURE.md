# Invoice GST Column Toggle Feature

## Summary

Added a new checkbox in the **GST Configuration** section that allows users to **enable/disable the GST column** in the line items table. When disabled, the GST column is completely hidden, and GST calculations are set to 0.

## Features Added

### ✅ **Enable/Disable Item GST Column**
- New checkbox: "Enable Item GST Column"
- Located at the top of the GST Configuration section
- Controls visibility of the GST column in the description table
- Controls whether GST is calculated for line items

### ✅ **Dynamic Table Layout**
- When **GST column is enabled**: Shows GST column (10% width)
- When **GST column is disabled**: Hides GST column, redistributes width to Description and Amount

### ✅ **Smart Calculation**
- When enabled: GST Value = (area × qty × rate) × GST%
- When disabled: GST Value = 0, Amount = base amount only

## Visual Design

### GST Configuration Section

```
┌─────────────────────────────────────────────────────┐
│ GST Configuration                                   │
├─────────────────────────────────────────────────────┤
│ ☑ Enable Item GST Column                           │
│   Show/hide GST column in line items table         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ☑ Enable Overall GST (only visible when above ☑)   │
│   Apply same GST rate to entire invoice            │
│                                                     │
│ 📌 GST Options:                                     │
│ • Overall GST ON: Apply 18% to entire subtotal     │
│ • Overall GST OFF: Use individual item GST rates   │
└─────────────────────────────────────────────────────┘
```

### Table Layout Changes

**When GST Column is Enabled (itemGstEnabled = true)**:
```
| Description | Area | Unit | Qty  | Rate | GST  | Amount | Actions |
|    18%      | 12%  | 8%   | 13%  | 13%  | 10%  | 14%    | 4%      |
```

**When GST Column is Disabled (itemGstEnabled = false)**:
```
| Description | Area | Unit | Qty  | Rate | Amount | Actions |
|    23%      | 12%  | 8%   | 13%  | 13%  | 19%    | 4%      |
```

Width changes:
- Description: 18% → 23% (+5%)
- Amount: 14% → 19% (+5%)
- GST: 10% → 0% (hidden)

## User Flow

### Scenario 1: Disable GST for Entire Invoice

**Steps**:
1. Open Invoice form
2. Scroll to "GST Configuration"
3. **Uncheck** "Enable Item GST Column"
4. GST column disappears from table
5. All amounts show base values only (no GST)

**Result**:
```
Invoice with NO GST:
- Item 1: Area(10) × Qty(2) × Rate(500) = ₹10,000
- Item 2: Area(5) × Qty(3) × Rate(200) = ₹3,000
- Subtotal: ₹13,000
- GST: ₹0
- Grand Total: ₹13,000
```

### Scenario 2: Enable GST with Different Rates

**Steps**:
1. Open Invoice form
2. **Check** "Enable Item GST Column"
3. GST column appears in table
4. Set different GST rates for each item:
   - Item 1: 18%
   - Item 2: 12%
5. GST values calculate automatically

**Result**:
```
Invoice with Individual GST:
- Item 1: Base(₹10,000) + GST(₹1,800) = ₹11,800
- Item 2: Base(₹3,000) + GST(₹360) = ₹3,360
- Subtotal: ₹13,000
- GST: ₹2,160
- Grand Total: ₹15,160
```

## Code Changes

### 1. New State Field

**File**: `src/components/InvoiceFormModal.jsx:38`

```javascript
itemGstEnabled: invoice?.itemGstEnabled !== undefined ? invoice.itemGstEnabled : true
```

**Purpose**: Controls whether the GST column is visible and GST is calculated.

### 2. Recalculate on Toggle

**File**: `src/components/InvoiceFormModal.jsx:59-78`

```javascript
// Recalculate all items when itemGstEnabled changes
useEffect(() => {
  const newItems = formData.items.map(item => {
    const measurementValue = parseFloat(item.measurementValue) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstRate = parseFloat(item.gstRate) || 0;

    const baseAmount = measurementValue * quantity * rate;
    const gstValue = formData.itemGstEnabled ? (baseAmount * gstRate) / 100 : 0;

    return {
      ...item,
      gstValue,
      amount: baseAmount + gstValue
    };
  });

  setFormData(prev => ({ ...prev, items: newItems }));
}, [formData.itemGstEnabled]);
```

**Purpose**: When user toggles the checkbox, all line items recalculate their GST and amounts.

### 3. Updated Calculation Functions

**Files Modified**:
- `handleItemChange()` - Line 102
- `handleIncrement()` - Line 125
- `handleDecrement()` - Line 145

**Change**:
```javascript
// Before
const gstValue = (baseAmount * gstRate) / 100;

// After
const gstValue = formData.itemGstEnabled ? (baseAmount * gstRate) / 100 : 0;
```

**Purpose**: Only calculate GST when the feature is enabled.

### 4. Conditional Table Header

**File**: `src/components/InvoiceFormModal.jsx:443-453`

```jsx
<tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
  <th style={{width: formData.itemGstEnabled ? '18%' : '23%'}}>Description</th>
  <th style={{width: '12%'}}>Area</th>
  <th style={{width: '8%'}}>Unit</th>
  <th style={{width: '13%'}}>Qty</th>
  <th style={{width: '13%'}}>Rate (₹)</th>
  {formData.itemGstEnabled && (
    <th style={{width: '10%'}}>GST</th>
  )}
  <th style={{width: formData.itemGstEnabled ? '14%' : '19%'}}>Amount (₹)</th>
  <th style={{width: '4%'}}></th>
</tr>
```

**Purpose**: Show/hide GST column header, adjust Description and Amount widths.

### 5. Conditional Table Cell

**File**: `src/components/InvoiceFormModal.jsx:563-605`

```jsx
{formData.itemGstEnabled && (
  <td className="py-3 px-2">
    <div className="flex flex-col items-center gap-1">
      {/* GST Rate Input with +/- buttons */}
      <div className="flex items-center gap-0.5 w-full">
        {/* ... GST controls ... */}
      </div>
      {/* Display calculated GST value */}
      <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded w-full text-center">
        ₹{(item.gstValue || 0).toFixed(2)}
      </div>
    </div>
  </td>
)}
```

**Purpose**: Show/hide GST cell in table body for each row.

### 6. Updated GST Configuration UI

**File**: `src/components/InvoiceFormModal.jsx:656-697`

```jsx
{/* Enable/Disable Item GST Column */}
<div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-yellow-300">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={formData.itemGstEnabled}
      onChange={(e) => setFormData({ ...formData, itemGstEnabled: e.target.checked })}
      className="w-5 h-5 text-primary-600 rounded"
    />
    <div>
      <span className="text-sm font-medium text-gray-700">Enable Item GST Column</span>
      <p className="text-xs text-gray-500">Show/hide GST column in line items table</p>
    </div>
  </label>
</div>

{formData.itemGstEnabled && (
  <>
    {/* Overall GST options only shown when item GST is enabled */}
  </>
)}
```

**Purpose**: Add new checkbox and conditionally show/hide overall GST options.

## Benefits

1. ✅ **Flexibility** - Users can choose to include or exclude GST entirely
2. ✅ **Cleaner UI** - When GST not needed, table is simpler and wider
3. ✅ **Better UX** - More space for Description and Amount when GST hidden
4. ✅ **Professional** - Supports both GST and non-GST invoices
5. ✅ **Automatic** - Calculations update instantly when toggling

## Use Cases

### Use Case 1: Non-GST Invoice
**Scenario**: Small vendor who doesn't charge GST

**Action**:
1. Uncheck "Enable Item GST Column"
2. Fill in Description, Area, Qty, Rate
3. Amounts calculate without GST

**Result**: Clean invoice with no GST line items

### Use Case 2: Mixed GST Invoice
**Scenario**: Some items taxable, some exempt

**Action**:
1. Check "Enable Item GST Column"
2. Uncheck "Enable Overall GST"
3. Set GST rate to 0% for exempt items
4. Set GST rate to 18% for taxable items

**Result**: Accurate GST calculation per item

### Use Case 3: Uniform GST Invoice
**Scenario**: All items have same GST rate (18%)

**Action**:
1. Check "Enable Item GST Column"
2. Check "Enable Overall GST"
3. Set overall GST to 18%

**Result**: All items automatically use 18% GST

## Testing

### Test Case 1: Toggle GST Column
```
Steps:
1. Create new invoice with 2 items
2. Set Area=10, Qty=1, Rate=100 for both
3. Check "Enable Item GST Column" → GST column appears
4. Uncheck "Enable Item GST Column" → GST column disappears

Expected:
- When enabled: Amount = ₹1,180 (₹1,000 + ₹180 GST)
- When disabled: Amount = ₹1,000 (no GST)

✅ PASSED
```

### Test Case 2: Width Adjustment
```
Steps:
1. Open invoice form
2. Observe column widths with GST enabled
3. Uncheck "Enable Item GST Column"
4. Observe Description and Amount columns expand

Expected:
- Description: 18% → 23%
- Amount: 14% → 19%
- GST column: Hidden

✅ PASSED
```

### Test Case 3: Recalculation
```
Steps:
1. Add item: Area=10, Qty=2, Rate=500, GST=18%
2. Verify Amount = ₹11,800
3. Uncheck "Enable Item GST Column"
4. Verify Amount = ₹10,000

Expected:
- GST value changes from ₹1,800 to ₹0
- Amount changes from ₹11,800 to ₹10,000
- Subtotal and Grand Total update accordingly

✅ PASSED
```

## Data Structure

### Invoice Data Model

```javascript
{
  invoiceNumber: "INV-0001",
  date: "2024-11-20",
  itemGstEnabled: true,  // ← NEW FIELD
  gstEnabled: true,
  gstPercentage: 18,
  items: [
    {
      id: "item-1",
      description: "Construction Work",
      measurementValue: 10,
      unit: "sq.ft",
      quantity: 2,
      rate: 500,
      gstRate: 18,
      gstValue: 1800,     // Automatically 0 if itemGstEnabled = false
      amount: 11800       // Automatically excludes GST if itemGstEnabled = false
    }
  ],
  subtotal: 10000,
  gstAmount: 1800,       // Sum of all item gstValues
  grandTotal: 11800
}
```

## Backward Compatibility

### Existing Invoices
```javascript
// Old invoice without itemGstEnabled field
{
  invoiceNumber: "INV-0001",
  items: [...],
  gstEnabled: true
}

// Will be loaded as:
{
  invoiceNumber: "INV-0001",
  items: [...],
  itemGstEnabled: true,  // ← Defaults to true
  gstEnabled: true
}
```

**Result**: Existing invoices will have GST column enabled by default, maintaining current behavior.

## Summary of Files Modified

1. ✅ **src/components/InvoiceFormModal.jsx**
   - Line 38: Added `itemGstEnabled` state
   - Lines 59-78: Added useEffect to recalculate on toggle
   - Line 102: Updated `handleItemChange`
   - Line 125: Updated `handleIncrement`
   - Line 145: Updated `handleDecrement`
   - Lines 443-453: Conditional table header
   - Lines 563-605: Conditional table cell
   - Lines 656-697: New GST toggle UI

## Future Enhancements (Optional)

1. 🔄 Remember user preference (localStorage)
2. 🔄 Add tooltip explaining when to use GST vs non-GST
3. 🔄 Keyboard shortcut to toggle (Ctrl+G)
4. 🔄 Bulk enable/disable GST for existing invoices

---

**Status**: ✅ **COMPLETED**
**Date**: 2024-11-20
**Version**: 4.0 (GST Toggle Feature)
**Application**: http://localhost:3001
