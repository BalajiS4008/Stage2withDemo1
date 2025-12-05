# 📘 Invoice Generation - User Guide

## Quick Start Guide

### 🎯 **First-Time Setup (One-Time)**

#### **Step 1: Setup Company Profile**
1. Login as **admin**
2. Click **"Company Profile"** in sidebar
3. Fill in your company details:
   - Company Name
   - Address
   - Phone
   - Email
   - GST Number
4. Upload your company logo (optional)
5. Click **"Save Profile"**

#### **Step 2: Configure Digital Signature (Optional)**
1. Click **"Settings"** in sidebar
2. Scroll down to **"Digital Signature"** section
3. Choose one option:

   **Option A: Upload Signature Image**
   - Click "Upload Image"
   - Select your signature image (JPG, PNG, or WebP)
   - Max size: 500KB
   - Preview will show
   - Click "Save Signature Settings"

   **Option B: Text-Based Signature**
   - Click "Text Signature"
   - Enter your name
   - Choose a signature style:
     - **Cursive** - Elegant, flowing
     - **Handwritten** - Casual, personal
     - **Formal** - Professional, classic
     - **Modern** - Contemporary, clean
   - Preview your signature
   - Click "Save Signature Settings"

   **Option C: No Signature**
   - Select "No Signature" if you don't want to include one

---

## 📝 **Creating an Invoice**

### **Step 1: Start New Invoice**
1. Click **"Invoices"** in sidebar
2. Click **"Create New Invoice"** button

### **Step 2: Fill Invoice Details**

**Invoice Header:**
- Invoice Number: Auto-generated (e.g., INV-0001)
- Date: Select invoice date
- Status: Choose Pending, Paid, or Cancelled

**Company Details (Auto-filled from profile):**
- Company Name
- Address
- Phone
- Email
- GST Number
- *You can edit these for this specific invoice if needed*

**Client Details:**
- Client Name (Required)
- Address
- Phone
- Email

### **Step 3: Add Line Items**

For each item/service:
1. Click **"Add Item"** if you need more rows
2. Fill in:
   - **Description**: What you're billing for (e.g., "Construction Work")
   - **Measurement**: Unit of measure (e.g., "sq ft", "meters", "hours")
   - **Quantity**: How many units
   - **Rate**: Price per unit
   - **Amount**: Auto-calculates (Quantity × Rate)

**Tips:**
- You can add unlimited items
- Remove items by clicking the trash icon
- At least one item is required
- Amount updates automatically

### **Step 4: Payment Details**
- Select payment method: CASH, ONLINE, CHEQUE, or UPI
- Add notes (optional)

### **Step 5: Preview Invoice**
Click **"Preview Invoice"** button

---

## 🎨 **Customizing Your Invoice**

### **In the Preview Screen:**

#### **Left Panel - Settings:**

**1. GST Options:**
- Toggle "Include GST" on/off
- If enabled, adjust GST percentage (default: 18%)
- GST amount and Grand Total update automatically

**2. Custom Message:**
- Enter payment terms, delivery notes, or thank you message
- Max 500 characters
- Shows at bottom of invoice

**3. Select Template:**
Choose from 4 professional templates:

- **Classic**: Traditional layout, clean design
  - Best for: General business use
  
- **Modern**: Contemporary with colored accents
  - Best for: Tech companies, startups
  
- **Minimal**: Simple black & white
  - Best for: Minimalist brands, consultants
  
- **Professional**: Formal with borders
  - Best for: Corporate, legal, accounting

**4. Invoice Summary:**
- Shows Subtotal, GST, and Grand Total
- Updates in real-time

#### **Right Panel - Live Preview:**
- See exactly how your invoice will look
- Includes company logo
- Shows digital signature (if configured)
- Displays custom message
- Reflects selected template style

---

## 💾 **Saving & Generating PDF**

### **Option 1: Download PDF Only**
1. Customize settings as needed
2. Click **"Download PDF"**
3. PDF downloads to your device
4. Invoice is NOT saved to database

### **Option 2: Save Invoice to Database**
1. Customize settings as needed
2. Click **"Save Invoice"**
3. Invoice is saved and appears in invoice list
4. You can generate PDF later

**Recommended:** Click "Save Invoice" to keep a record!

---

## 🔍 **Managing Invoices**

### **Search Invoices:**
- Type in search box to find by:
  - Invoice number (e.g., "INV-0001")
  - Client name (e.g., "ABC Company")

### **Filter Invoices:**
- Click filter dropdown
- Select: All Status, Pending, Paid, or Cancelled

### **View Invoice:**
- Click the **eye icon** (👁)
- Opens preview modal
- Can download PDF from here

### **Edit Invoice:**
- Click the **edit icon** (✏)
- Modify any details
- Click "Preview Invoice" → "Save Invoice"

### **Delete Invoice:**
- Click the **trash icon** (🗑)
- Confirm deletion
- Invoice is permanently removed

---

## 📊 **Understanding Statistics**

**Dashboard Cards Show:**

1. **Total Invoices**: Count of all invoices
2. **Paid**: Number and total amount of paid invoices
3. **Pending**: Number and total amount of pending invoices
4. **Total Revenue**: Sum of all invoice amounts

---

## 💡 **Tips & Best Practices**

### **Invoice Numbering:**
- Automatically sequential (INV-0001, INV-0002, etc.)
- Cannot be changed manually
- Ensures no duplicate numbers

### **Company Details:**
- Set up Company Profile first for auto-fill
- Can override per invoice if needed
- Logo appears in PDF if uploaded

### **Line Items:**
- Be specific in descriptions
- Use measurements for clarity (sq ft, meters, hours)
- Double-check quantities and rates
- Amount auto-calculates to avoid errors

### **GST:**
- Enable only if applicable
- Default 18% can be changed
- Clearly shows GST amount separately

### **Custom Messages:**
- Use for payment terms (e.g., "Payment due in 30 days")
- Add delivery notes
- Include thank you messages
- Keep under 500 characters

### **Templates:**
- Choose based on your industry
- Classic works for most businesses
- Modern for tech/creative
- Professional for formal industries
- Minimal for clean, simple look

### **Digital Signature:**
- Adds professional touch
- Use image for actual signature
- Use text for typed name
- Appears on all PDFs

---

## ❓ **Common Questions**

**Q: Can I edit an invoice after saving?**
A: Yes! Click the edit icon, make changes, and save again.

**Q: Can I change the invoice number?**
A: No, invoice numbers are auto-generated and sequential to prevent duplicates.

**Q: What if I don't have a company logo?**
A: No problem! Invoices work fine without a logo. You can add one later.

**Q: Can I use different templates for different invoices?**
A: Yes! Select template each time you generate a PDF.

**Q: What happens if I delete an invoice?**
A: It's permanently removed. The next invoice will continue the numbering sequence.

**Q: Can I export to Excel?**
A: Currently, only PDF export is available. Excel export coming soon!

**Q: How do I change the invoice prefix (INV)?**
A: This feature is coming soon in Settings.

**Q: Can I add my bank details to invoices?**
A: Use the "Custom Message" field to add bank details or payment instructions.

---

## 🆘 **Troubleshooting**

**Problem: Company details not showing**
- Solution: Go to Company Profile and fill in details

**Problem: Signature not appearing in PDF**
- Solution: Go to Settings → Digital Signature and configure

**Problem: GST not calculating**
- Solution: Make sure "Include GST" is toggled ON in preview

**Problem: Can't add more line items**
- Solution: Click "Add Item" button above the table

**Problem: PDF not downloading**
- Solution: Check browser pop-up blocker settings

**Problem: Invoice not saving**
- Solution: Make sure Client Name is filled (required field)

---

## 🎓 **Example Workflow**

**Creating a Construction Invoice:**

1. Create New Invoice
2. Fill client: "ABC Builders"
3. Add line items:
   - "Mason Work" | sq ft | 1000 | 50 | ₹50,000
   - "Plumbing" | points | 20 | 500 | ₹10,000
   - "Electrical" | points | 15 | 600 | ₹9,000
4. Select payment: CASH
5. Preview Invoice
6. Enable GST (18%)
7. Add message: "Payment due within 15 days"
8. Select "Professional" template
9. Review preview
10. Click "Save Invoice"
11. Click "Download PDF" to get PDF copy

**Result:**
- Invoice saved in database
- PDF downloaded
- Total: ₹81,420 (including GST)
- Professional PDF with signature

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check this guide first
2. Review error messages carefully
3. Make sure all required fields are filled
4. Contact support if problem persists

---

**Happy Invoicing! 🎉**

