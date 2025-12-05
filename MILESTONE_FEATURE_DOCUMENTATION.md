# Project Milestone & Automatic Bill Generation Feature

## Overview

This feature allows admin users to define project milestones/stages with installment amounts and automatically generates bills when payments are recorded for specific milestones.

---

## 1. Project Milestone Management (Admin Only)

### Creating a Project with Milestones

When creating or editing a project, admins can now define multiple milestones/stages:

**Location:** Projects Page → Create/Edit Project Modal

**Milestone Fields:**
- **Milestone Name**: Description of the stage (e.g., "G Floor Soil Filling")
- **Amount Type**: Choose between:
  - **Fixed Amount**: Enter a specific monetary value (e.g., ₹20,000)
  - **Percentage**: Enter a percentage of total project value (e.g., 5%)
- **Order**: Milestones can be reordered using up/down arrows

### Example Milestone Setup

**Project:** ABC Construction - Total Value ₹1,000,000

**Milestones:**
1. G Floor Soil Filling - 2% (₹20,000)
2. G Floor Wall Completion - 5% (₹50,000)
3. First Floor Slab - 3% (₹30,000)
4. First Floor Wall Completion - 5% (₹50,000)
5. Roof Slab - 10% (₹100,000)

---

## 2. Recording Payments with Milestones

### Payments In Page Enhancement

When recording a payment in the "Payments In" page:

**New Field:** "Project Milestone / Stage" dropdown
- Shows all milestones defined for the current project
- Displays: Stage number, name, and calculated amount
- Completed milestones are marked with ✓
- Optional field - can record payments without selecting a milestone

**Auto-fill Amount:**
- When a milestone is selected, the amount field is automatically filled with the milestone's calculated amount
- Can be manually adjusted if needed

**Auto-Bill Indicator:**
- When a milestone is selected, a message appears: "Auto-bill will be generated for this milestone"

---

## 3. Automatic Bill Generation

### What Happens When Payment is Recorded

When a payment is recorded with a milestone selected:

1. **Payment is saved** to the database
2. **Invoice is automatically generated** with:
   - Client name (from payment or project name)
   - Payment date
   - Status: "Paid"
   - Line item: Milestone name and amount
   - Notes section includes:
     - Confirmation of payment received for current milestone
     - Reminder of next pending milestone (if any)

### Invoice Structure

**Example Auto-Generated Invoice:**

```
Invoice #INV-001
Date: 2024-01-15
Status: Paid

Client: ABC Construction

Items:
- G Floor Soil Filling (Stage 1) - ₹20,000

Subtotal: ₹20,000
Total: ₹20,000

Notes:
Payment received for G Floor Soil Filling.

Next Payment Due: G Floor Wall Completion - ₹50,000
```

---

## 4. Data Structure

### Project Schema (Updated)

```javascript
{
  id: string,
  name: string,
  totalCommittedAmount: number,
  description: string,
  status: 'active' | 'completed' | 'on-hold',
  milestones: [
    {
      id: string,
      name: string,
      amountType: 'fixed' | 'percentage',
      value: number,
      order: number,
      status: 'pending' | 'completed' | 'paid',
      completedDate: string | null,
      createdAt: string
    }
  ],
  // ... other fields
}
```

### Payment Schema (Updated)

```javascript
{
  id: string,
  amount: number,
  date: string,
  type: 'advance' | 'installment',
  description: string,
  clientName: string,
  milestoneId: string | null, // NEW: Links payment to milestone
  attachments: [],
  // ... other fields
}
```

### Invoice Schema (Updated)

```javascript
{
  id: string,
  // ... standard invoice fields
  milestoneId: string | null, // NEW: Links invoice to milestone
  paymentId: string | null,   // NEW: Links invoice to payment
  notes: string // Includes next milestone reminder
}
```

---

## 5. Usage Workflow

### Step-by-Step Guide

**Step 1: Create Project with Milestones**
1. Navigate to Projects page
2. Click "Create New Project"
3. Enter project name and total committed amount
4. Scroll to "Project Milestones / Stages" section
5. Add milestones:
   - Enter milestone name
   - Select amount type (Fixed or Percentage)
   - Enter value
   - Click "Add Milestone"
6. Reorder milestones if needed using up/down arrows
7. Click "Create Project"

**Step 2: Record Payment for Milestone**
1. Select the project
2. Navigate to "Payments In" page
3. Click "Add Payment"
4. Select milestone from dropdown
5. Amount is auto-filled (can be adjusted)
6. Fill in other details (date, client name, etc.)
7. Click "Add Payment"

**Step 3: View Auto-Generated Bill**
1. Navigate to "Invoices" page
2. Find the auto-generated invoice
3. Invoice shows:
   - Milestone name and amount
   - Payment received confirmation
   - Next milestone reminder

---

## 6. Key Features

✅ **Flexible Payment Structure**: Support for both fixed amounts and percentages
✅ **Automatic Calculations**: Percentage-based milestones auto-calculate based on total project value
✅ **Milestone Ordering**: Drag-and-drop style reordering with up/down arrows
✅ **Auto-Bill Generation**: Invoices created automatically when milestone payments are recorded
✅ **Next Stage Reminders**: Auto-generated bills include information about upcoming milestones
✅ **Optional Usage**: Milestones are optional - can still record payments without them
✅ **Theme Compatible**: Works seamlessly with both Tailwind and Bootstrap themes
✅ **Admin Only**: Milestone management restricted to admin users for security

---

## 7. Technical Implementation

### Files Modified

1. **src/utils/dataManager.jsx**
   - Added `createMilestone()` helper function
   - Added `calculateMilestoneAmount()` helper function
   - Updated `getDefaultProject()` to include milestones array

2. **src/context/DataContext.jsx**
   - Updated `addProject()` to accept milestones parameter

3. **src/pages/Projects.jsx**
   - Added milestone management UI in project form
   - Added milestone state management
   - Added milestone CRUD operations (add, remove, reorder)

4. **src/pages/PaymentsIn.jsx**
   - Added milestone selection dropdown
   - Added `generateMilestoneBill()` function
   - Updated payment submission to trigger auto-bill generation

### Database Schema

No database migration required - Dexie.js automatically handles new fields.

---

## 8. Future Enhancements (Optional)

- Milestone status tracking (pending → in-progress → completed)
- Milestone completion dates
- Progress visualization (progress bar showing completed milestones)
- Milestone-based project analytics
- Bulk milestone templates for common project types
- Milestone dependencies (Stage 2 can't start until Stage 1 is paid)

---

## 9. Testing Checklist

- [ ] Create project with fixed amount milestones
- [ ] Create project with percentage-based milestones
- [ ] Create project with mixed milestone types
- [ ] Reorder milestones using up/down arrows
- [ ] Edit project and modify milestones
- [ ] Record payment without selecting milestone
- [ ] Record payment with milestone selected
- [ ] Verify auto-bill generation
- [ ] Check invoice includes next milestone reminder
- [ ] Test in both Tailwind and Bootstrap themes
- [ ] Verify admin-only access to milestone management

---

**Feature Status:** ✅ Complete and Ready for Testing
**Compatibility:** Both Tailwind and Bootstrap themes
**Access Level:** Admin users only for milestone management

