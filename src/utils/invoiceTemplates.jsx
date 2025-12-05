import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './dataManager.jsx';
import { addImageToPDF, addSignatureToPDF } from './pdfHelpers';
import { generateDocumentPDF } from './documentTemplates';

/**
 * Generate Invoice PDF
 * Now uses the shared document template system for automatic sync with Quotation
 * Any template updates in documentTemplates.jsx will reflect in both Invoice and Quotation
 */
export const generateInvoicePDF = (invoice) => {
  try {
    // Use shared document template generator
    return generateDocumentPDF(invoice, 'invoice');
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    alert('Failed to generate invoice PDF. Please try again.');
  }
};

// Helper function to check if content will overflow page
const checkPageOverflow = (doc, currentY, contentHeight) => {
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  if (currentY + contentHeight > pageHeight - margin) {
    doc.addPage();
    return 20; // Return top margin for new page
  }

  return currentY;
};

// ===== LICERIA TEMPLATE =====
const generateLiceriaTemplate = (invoice) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Color scheme
    const navyBlue = [30, 58, 95];    // #1e3a5f
    const skyBlue = [38, 169, 224];   // #26a9e0
    const lightGray = [245, 245, 245]; // #f5f5f5
    const white = [255, 255, 255];

    // Ensure required fields have valid values
    const invoiceNumber = String(invoice.invoiceNumber || 'INV-001');
    const companyName = String(invoice.companyName || 'Company Name');
    const clientName = String(invoice.clientName || 'Client Name');
    const paymentMethod = String(invoice.paymentMethod || 'Cash');
    const status = String(invoice.status || 'pending');

    // Top decorative stripe (12mm height matching UI h-12)
    doc.setFillColor(...skyBlue);
    doc.rect(0, 0, pageWidth / 3, 12, 'F');
    doc.setFillColor(...navyBlue);
    doc.rect(pageWidth / 3, 0, pageWidth / 3, 12, 'F');
    doc.setFillColor(...skyBlue);
    doc.rect((pageWidth / 3) * 2, 0, pageWidth / 3, 12, 'F');

    // Company Logo and Name - Top Right (matching UI)
    if (invoice.companyLogo) {
      // Logo box with border
      doc.setDrawColor(...skyBlue);
      doc.setLineWidth(0.8);
      doc.roundedRect(pageWidth - 60, 18, 45, 18, 2, 2);

      addImageToPDF(doc, invoice.companyLogo, pageWidth - 58, 20, 14, 14);

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...navyBlue);
      doc.text(companyName.substring(0, 15), pageWidth - 40, 28, { align: 'left' });

      if (invoice.companyGST) {
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`GST: ${invoice.companyGST}`, pageWidth - 40, 33);
      }
    } else {
      // Box with gradient effect (navy background)
      doc.setFillColor(...navyBlue);
      doc.roundedRect(pageWidth - 60, 18, 45, 18, 2, 2, 'F');

      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...white);
      doc.text(companyName.substring(0, 15), pageWidth - 55, 28, { align: 'left' });

      if (invoice.companyGST) {
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(`GST: ${invoice.companyGST}`, pageWidth - 55, 33);
      }
    }

    // INVOICE Title (left side - matching UI)
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...navyBlue);
    doc.text('INVOICE', 15, 30);

    // Status Badge (matching UI)
    let statusColor;
    let statusText = status.toUpperCase();
    if (status === 'paid') {
      statusColor = [34, 197, 94]; // green
    } else if (status === 'cancelled') {
      statusColor = [239, 68, 68]; // red
    } else {
      statusColor = [250, 204, 21]; // yellow
    }

    doc.setFillColor(...statusColor);
    doc.roundedRect(15, 35, 25, 6, 3, 3, 'F');
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    if (status === 'pending') {
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setTextColor(255, 255, 255);
    }
    doc.text(statusText, 27.5, 39.5, { align: 'center' });

    let yPos = 55;

    // Invoice Details and Payment Method Row - Two Columns
    // Left: Invoice Details
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.setFont(undefined, 'normal');
    doc.text('INVOICE NO:', 15, yPos);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...navyBlue);
    doc.setFontSize(8);
    doc.text(invoiceNumber, 48, yPos);

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('INVOICE DATE:', 15, yPos + 5);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(invoice.date ? formatDate(invoice.date) : 'N/A', 48, yPos + 5);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('DUE DATE:', 15, yPos + 10);
    doc.setFont(undefined, 'bold');
    if (status === 'pending' && invoice.dueDate) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    doc.text(invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A', 48, yPos + 10);

    // Right: Payment Method Box (matching UI with detailed fields)
    doc.setFillColor(...navyBlue);
    doc.roundedRect(pageWidth - 85, yPos - 5, 70, 28, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('PAYMENT METHOD', pageWidth - 50, yPos, { align: 'center' });
    doc.setDrawColor(...white);
    doc.setLineWidth(0.2);
    doc.line(pageWidth - 82, yPos + 1.5, pageWidth - 18, yPos + 1.5);

    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.text('Method:', pageWidth - 82, yPos + 6);
    doc.setFont(undefined, 'bold');
    doc.text(paymentMethod, pageWidth - 60, yPos + 6);

    doc.setFont(undefined, 'normal');
    doc.text('Account No:', pageWidth - 82, yPos + 10);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.companyPhone || 'N/A', pageWidth - 60, yPos + 10);

    doc.setFont(undefined, 'normal');
    doc.text('Account Name:', pageWidth - 82, yPos + 14);
    doc.setFont(undefined, 'bold');
    const acctName = clientName.substring(0, 12);
    doc.text(acctName, pageWidth - 60, yPos + 14);

    doc.setFont(undefined, 'normal');
    doc.text('Branch:', pageWidth - 82, yPos + 18);
    doc.setFont(undefined, 'bold');
    const branchName = companyName.substring(0, 12);
    doc.text(branchName, pageWidth - 60, yPos + 18);

    // Company Contact & Bill To Section
    yPos += 35;

    // Company Contact Box (left)
    doc.setDrawColor(...navyBlue);
    doc.setLineWidth(0.8);
    doc.roundedRect(15, yPos, 90, 28, 2, 2);

    doc.setFillColor(...navyBlue);
    doc.roundedRect(15, yPos, 90, 6, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('COMPANY CONTACT', 18, yPos + 4);

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`  ${invoice.companyPhone || 'N/A'}`, 18, yPos + 11);
    doc.text(`  ${invoice.companyEmail || 'N/A'}`, 18, yPos + 16);
    const compAddr = (invoice.companyAddress || 'N/A').split('\n')[0];
    doc.text(`  ${compAddr.substring(0, 35)}`, 18, yPos + 21);

    // Bill To Box (right)
    doc.setDrawColor(...navyBlue);
    doc.setLineWidth(0.8);
    doc.roundedRect(pageWidth - 80, yPos, 65, 28, 2, 2);

    doc.setFillColor(...navyBlue);
    doc.roundedRect(pageWidth - 80, yPos, 65, 6, 2, 2, 'F');

    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('BILL TO', pageWidth - 77, yPos + 4);

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(clientName, pageWidth - 77, yPos + 11);

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    if (invoice.clientAddress) {
      const billAddr = invoice.clientAddress.split('\n')[0];
      doc.text(billAddr.substring(0, 25), pageWidth - 77, yPos + 16);
    }
    doc.text(invoice.clientPhone || 'N/A', pageWidth - 77, yPos + 21);

    // Items Table
    yPos += 38;

    // Determine which columns to show based on data
    const hasMeasurement = invoice.items.some(item => item.measurementValue > 0);
    const hasGST = invoice.items.some(item => item.gstValue > 0);

    // Build table columns dynamically (matching UI)
    const columns = ['DESCRIPTION'];
    if (hasMeasurement) {
      columns.push('AREA');
      columns.push('UNIT');
    }
    columns.push('QTY', 'RATE');
    if (hasGST) columns.push('GST');
    columns.push('AMOUNT');

    // Build table rows (matching UI)
    const rows = invoice.items.map((item, index) => {
      const row = [
        item.description || item.name || '-'
      ];

      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }

      // Ensure values are numbers
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = parseFloat(item.amount) || 0;
      const gstValue = parseFloat(item.gstValue) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;

      row.push(
        quantity.toString(),
        `Rs ${rate.toFixed(2)}`
      );

      if (hasGST) {
        // Show both GST rate and value like UI
        row.push(`${Math.round(gstRate)}%\nRs ${gstValue.toFixed(2)}`);
      }

      row.push(`Rs ${amount.toFixed(2)}`);
      return row;
    });

    // Column styles (matching UI)
    const columnStyles = {
      0: { cellWidth: hasMeasurement ? 45 : 65, halign: 'left' } // DESCRIPTION
    };

    let colIndex = 1;
    if (hasMeasurement) {
      columnStyles[colIndex] = { cellWidth: 20, halign: 'center' }; // AREA
      colIndex++;
      columnStyles[colIndex] = { cellWidth: 18, halign: 'center' }; // UNIT
      colIndex++;
    }
    columnStyles[colIndex] = { cellWidth: 15, halign: 'center' }; // QTY
    columnStyles[colIndex + 1] = { cellWidth: 25, halign: 'right' }; // RATE
    if (hasGST) {
      columnStyles[colIndex + 2] = { cellWidth: 22, halign: 'center' }; // GST
      columnStyles[colIndex + 3] = { cellWidth: 28, halign: 'right' }; // AMOUNT
    } else {
      columnStyles[colIndex + 2] = { cellWidth: 28, halign: 'right' }; // AMOUNT
    }

    autoTable(doc, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: navyBlue, // Gradient effect simulated with navy
        textColor: white,
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 7,
        textColor: navyBlue,
        cellPadding: 2.5,
        minCellHeight: 8
      },
      columnStyles: columnStyles,
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Very light gray like UI
      },
      styles: {
        lineColor: [229, 231, 235], // Light gray border
        lineWidth: 0.1
      }
    });

    // Bottom section - Two column layout matching preview
    let bottomY = doc.lastAutoTable.finalY + 12;

    // Check if we need a new page for the bottom section
    bottomY = checkPageOverflow(doc, bottomY, 80);

    // Left column X position and width
    const leftColX = 15;
    const leftColW = 95;

    // Right column X position and width
    const rightColX = pageWidth - 80;
    const rightColW = 65;

    // Track Y position for left column
    let leftY = bottomY;

    // LEFT COLUMN: Terms and Conditions
    if (invoice.termsAndConditions) {
      // Light gray background box with blue left border
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(leftColX, leftY, leftColW, 25, 2, 2, 'F');

      // Blue left border
      doc.setDrawColor(38, 169, 224);
      doc.setLineWidth(2);
      doc.line(leftColX, leftY, leftColX, leftY + 25);

      // Title
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...navyBlue);
      doc.text('TERMS AND CONDITIONS', leftColX + 4, leftY + 5);

      // Content
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(55, 65, 81);
      const termsLines = doc.splitTextToSize(invoice.termsAndConditions, leftColW - 8);
      doc.text(termsLines.slice(0, 3), leftColX + 4, leftY + 10);

      leftY += 30;
    }

    // LEFT COLUMN: Notes
    if (invoice.customMessage) {
      // Light blue background box with navy left border
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(leftColX, leftY, leftColW, 25, 2, 2, 'F');

      // Navy left border
      doc.setDrawColor(...navyBlue);
      doc.setLineWidth(2);
      doc.line(leftColX, leftY, leftColX, leftY + 25);

      // Title
      doc.setFontSize(7);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(...navyBlue);
      doc.text('NOTES', leftColX + 4, leftY + 5);

      // Content
      doc.setFontSize(6);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(55, 65, 81);
      const notesLines = doc.splitTextToSize(invoice.customMessage, leftColW - 8);
      doc.text(notesLines.slice(0, 3), leftColX + 4, leftY + 10);

      leftY += 30;
    }

    // LEFT COLUMN: Thank You Section (always show) - matching UI
    doc.setFillColor(...navyBlue);
    doc.roundedRect(leftColX, leftY, leftColW, 28, 2, 2, 'F');

    // Title with border
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('THANK YOU FOR YOUR BUSINESS!', leftColX + 4, leftY + 6);

    doc.setDrawColor(...white);
    doc.setLineWidth(0.2);
    doc.line(leftColX + 4, leftY + 8, leftColX + leftColW - 4, leftY + 8);

    // Contact info with icons
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...white);

    // Phone
    doc.text('Phone:', leftColX + 4, leftY + 13);
    doc.text(invoice.companyPhone || 'N/A', leftColX + 16, leftY + 13);

    // Email
    doc.text('Email:', leftColX + 4, leftY + 18);
    doc.text(invoice.companyEmail || 'N/A', leftColX + 16, leftY + 18);

    // Address
    doc.text('Address:', leftColX + 4, leftY + 23);
    const addr = (invoice.companyAddress || 'N/A').split('\n')[0];
    doc.text(addr.substring(0, 35), leftColX + 20, leftY + 23);

    // RIGHT COLUMN: Invoice Summary
    // Outer border
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(1);
    doc.roundedRect(rightColX, bottomY, rightColW, 55, 2, 2);

    // Header section with gradient effect (simulated with light gray)
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(rightColX, bottomY, rightColW, 8, 2, 2, 'F');

    // Header bottom border (navy)
    doc.setDrawColor(...navyBlue);
    doc.setLineWidth(1);
    doc.line(rightColX, bottomY + 8, rightColX + rightColW, bottomY + 8);

    // Header text
    doc.setFontSize(7);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...navyBlue);
    doc.text('INVOICE SUMMARY', rightColX + 4, bottomY + 5);

    // Totals content
    let totY = bottomY + 14;
    doc.setFontSize(7);

    // Ensure totals are numbers
    const subtotal = parseFloat(invoice.subtotal) || 0;
    const gstAmount = parseFloat(invoice.gstAmount) || 0;
    const grandTotal = parseFloat(invoice.grandTotal) || 0;

    // Calculate item GST total
    const itemGstTotal = invoice.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    // Subtotal
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Subtotal:', rightColX + 4, totY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Rs ${subtotal.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

    // Light border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
    totY += 6;

    // Item GST (if applicable and has values)
    if (hasGST && itemGstTotal > 0) {
      doc.setFont(undefined, 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text('Item GST:', rightColX + 4, totY);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(22, 163, 74); // Green color
      doc.text(`Rs ${itemGstTotal.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

      doc.setDrawColor(229, 231, 235);
      doc.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
      totY += 6;
    }

    // Invoice GST (if applicable and different from item GST)
    if (invoice.gstEnabled && gstAmount > 0) {
      doc.setFont(undefined, 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(`Tax (${invoice.gstPercentage || 0}%):`, rightColX + 4, totY);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(22, 163, 74);
      doc.text(`Rs ${gstAmount.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

      doc.setDrawColor(229, 231, 235);
      doc.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
      totY += 6;
    }

    // Discount
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Discount:', rightColX + 4, totY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Rs 0.00', rightColX + rightColW - 4, totY, { align: 'right' });

    doc.setDrawColor(229, 231, 235);
    doc.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
    totY += 8;

    // Grand Total Box (matching UI gradient style)
    doc.setFillColor(...navyBlue);
    doc.roundedRect(rightColX + 3, totY - 2, rightColW - 6, 14, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...white);
    doc.text('GRAND TOTAL:', rightColX + 6, totY + 5);
    doc.setFontSize(13);
    doc.text(`Rs ${grandTotal.toFixed(2)}`, rightColX + rightColW - 6, totY + 5, { align: 'right' });

    // Bottom decorative stripe (matching UI h-16 which is ~16mm)
    const stripeY = pageHeight - 16;
    doc.setFillColor(...skyBlue);
    doc.rect(0, stripeY, pageWidth / 3, 16, 'F');
    doc.setFillColor(...navyBlue);
    doc.rect(pageWidth / 3, stripeY, pageWidth / 3, 16, 'F');
    doc.setFillColor(...skyBlue);
    doc.rect((pageWidth / 3) * 2, stripeY, pageWidth / 3, 16, 'F');

    // Save PDF
    doc.save(`${invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateLiceriaTemplate:', error);
    throw error;
  }
};

// ===== CORPORATE TEMPLATE =====
const generateCorporateTemplate = (invoice) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Color scheme - Navy Blue and Gold
    const navyBlue = [21, 47, 88];
    const gold = [184, 134, 11];
    const lightGray = [245, 245, 245];

    // Ensure required fields have valid values
    const invoiceNumber = String(invoice.invoiceNumber || 'INV-001');

    // Header with navy blue background
    doc.setFillColor(...navyBlue);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Company logo (if available)
    if (invoice.companyLogo) {
      addImageToPDF(doc, invoice.companyLogo, 15, 8, 25, 25);
    }

    // Company name and details in white
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.companyName || 'Company Name', invoice.companyLogo ? 45 : 15, 18);

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    let yPos = 24;
    if (invoice.companyAddress) {
      const lines = invoice.companyAddress.split('\n');
      lines.forEach((line, idx) => {
        doc.text(line, invoice.companyLogo ? 45 : 15, yPos + (idx * 4));
      });
      yPos += lines.length * 4;
    }
    if (invoice.companyPhone) doc.text(`  ${invoice.companyPhone}`, invoice.companyLogo ? 45 : 15, yPos);
    if (invoice.companyEmail) doc.text(`  ${invoice.companyEmail}`, invoice.companyLogo ? 45 : 15, yPos + 4);

    // INVOICE text (right side with gold)
    doc.setTextColor(...gold);
    doc.setFontSize(26);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', pageWidth - 15, 25, { align: 'right' });

    // Invoice details section
    yPos = 50;

    // Invoice info box
    doc.setDrawColor(...navyBlue);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, yPos, 85, 25, 1, 1);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text('Invoice No:', 20, yPos + 6);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(invoiceNumber, 45, yPos + 6);

    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text('Invoice Date:', 20, yPos + 12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.date ? formatDate(invoice.date) : 'N/A', 45, yPos + 12);

    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text('Due Date:', 20, yPos + 18);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A', 45, yPos + 18);

    // Bill To section
    doc.setDrawColor(...navyBlue);
    doc.roundedRect(pageWidth - 75, yPos, 60, 25, 1, 1);

    doc.setFillColor(...navyBlue);
    doc.roundedRect(pageWidth - 75, yPos, 60, 7, 1, 1, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('BILL TO', pageWidth - 72, yPos + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(invoice.clientName || 'Client Name', pageWidth - 72, yPos + 12);

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    if (invoice.clientAddress) {
      doc.text(invoice.clientAddress.split('\n')[0], pageWidth - 72, yPos + 17);
    }
    if (invoice.clientPhone) {
      doc.text(invoice.clientPhone, pageWidth - 72, yPos + 21);
    }

    // Items table
    yPos += 35;

    const hasDescription = invoice.items.some(item => item.description);
    const hasMeasurement = invoice.items.some(item => item.measurementValue > 0);
    const hasGST = invoice.items.some(item => item.gstValue > 0);

    const columns = ['#', 'Item'];
    if (hasDescription) columns.push('Description');
    if (hasMeasurement) columns.push('Area');
    columns.push('Qty', 'Rate', 'Amount');
    if (hasGST) columns.push('GST');

    const rows = invoice.items.map((item, index) => {
      const row = [
        (index + 1).toString(),
        item.name
      ];
      if (hasDescription) row.push(item.description || '-');
      if (hasMeasurement) row.push(item.measurementValue ? item.measurementValue.toString() : '-');

      // Ensure values are numbers
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = parseFloat(item.amount) || 0;
      const gstValue = parseFloat(item.gstValue) || 0;

      row.push(
        quantity.toString(),
        `Rs ${rate.toFixed(2)}`,
        `Rs ${amount.toFixed(2)}`
      );
      if (hasGST) row.push(gstValue > 0 ? `Rs ${gstValue.toFixed(2)}` : 'Rs 0.00');
      return row;
    });

    autoTable(doc, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: navyBlue,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: lightGray
      }
    });

    // Totals section
    let totalsY = doc.lastAutoTable.finalY + 10;
    totalsY = checkPageOverflow(doc, totalsY, 40);

    const totalsX = pageWidth - 70;

    // Ensure totals are numbers
    const subtotal = parseFloat(invoice.subtotal) || 0;
    const gstAmount = parseFloat(invoice.gstAmount) || 0;
    const grandTotal = parseFloat(invoice.grandTotal) || 0;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);

    doc.text('Subtotal:', totalsX, totalsY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Rs ${subtotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });

    totalsY += 7;
    if (invoice.gstEnabled || invoice.itemGstEnabled) {
      doc.setFont(undefined, 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Tax:', totalsX, totalsY);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 150, 0);
      doc.text(`Rs ${gstAmount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
      totalsY += 7;
    }

    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Discount:', totalsX, totalsY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Rs 0.00', pageWidth - 15, totalsY, { align: 'right' });

    totalsY += 10;
    doc.setFillColor(...navyBlue);
    doc.rect(totalsX - 5, totalsY - 6, 65, 12, 'F');

    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL:', totalsX, totalsY + 2);
    doc.setFontSize(14);
    doc.text(`Rs ${grandTotal.toFixed(2)}`, pageWidth - 15, totalsY + 2, { align: 'right' });

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

    // Save PDF
    doc.save(`${invoiceNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateCorporateTemplate:', error);
    throw error;
  }
};

// ===== CLASSIC TEMPLATE =====
const generateClassicTemplate = (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add company logo if available
  addImageToPDF(doc, invoice.companyLogo, 15, 15, 30, 30);

  // Company details
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(invoice.companyName || 'Company Name', 50, 25);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (invoice.companyAddress) {
    const addressLines = invoice.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 50, 32 + (index * 5));
    });
  }
  const addressHeight = invoice.companyAddress ? invoice.companyAddress.split('\n').length * 5 : 0;
  if (invoice.companyPhone) doc.text(`Phone: ${invoice.companyPhone}`, 50, 37 + addressHeight);
  if (invoice.companyEmail) doc.text(`Email: ${invoice.companyEmail}`, 50, 42 + addressHeight);
  if (invoice.companyGST) doc.text(`GST: ${invoice.companyGST}`, 50, 47 + addressHeight);

  // Invoice title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', pageWidth - 15, 25, { align: 'right' });

  // Invoice details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber || 'N/A'}`, pageWidth - 15, 35, { align: 'right' });
  doc.text(`Date: ${invoice.date ? formatDate(invoice.date) : 'N/A'}`, pageWidth - 15, 42, { align: 'right' });
  if (invoice.dueDate) {
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth - 15, 49, { align: 'right' });
  }

  // Bill to section
  let yPos = 70;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Bill To:', 15, yPos);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.clientName || 'Client Name', 15, yPos + 7);
  if (invoice.clientAddress) {
    const clientAddrLines = invoice.clientAddress.split('\n');
    clientAddrLines.forEach((line, index) => {
      doc.text(line, 15, yPos + 14 + (index * 5));
    });
  }
  if (invoice.clientPhone) {
    doc.text(`Phone: ${invoice.clientPhone}`, 15, yPos + 24);
  }

  // Items table
  yPos += 40;

  const hasDescription = invoice.items.some(item => item.description);
  const hasMeasurement = invoice.items.some(item => item.measurementValue > 0);
  const hasGST = invoice.items.some(item => item.gstValue > 0);

  const columns = ['#', 'Item'];
  if (hasDescription) columns.push('Description');
  if (hasMeasurement) columns.push('Area');
  columns.push('Qty', 'Rate', 'Amount');
  if (hasGST) columns.push('GST');

  const rows = invoice.items.map((item, index) => {
    const row = [
      (index + 1).toString(),
      item.name
    ];
    if (hasDescription) row.push(item.description || '-');
    if (hasMeasurement) row.push(item.measurementValue ? item.measurementValue.toString() : '-');

    // Ensure values are numbers
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const amount = parseFloat(item.amount) || 0;
    const gstValue = parseFloat(item.gstValue) || 0;

    row.push(
      quantity.toString(),
      `Rs ${rate.toFixed(2)}`,
      `Rs ${amount.toFixed(2)}`
    );
    if (hasGST) row.push(gstValue > 0 ? `Rs ${gstValue.toFixed(2)}` : 'Rs 0.00');
    return row;
  });

  autoTable(doc, {
    startY: yPos,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255
    }
  });

  // Totals
  let totalsY = doc.lastAutoTable.finalY + 10;
  const totalsX = pageWidth - 70;

  // Ensure totals are numbers
  const subtotal = parseFloat(invoice.subtotal) || 0;
  const gstAmount = parseFloat(invoice.gstAmount) || 0;
  const grandTotal = parseFloat(invoice.grandTotal) || 0;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`Rs ${subtotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });

  totalsY += 7;
  if (invoice.gstEnabled || invoice.itemGstEnabled) {
    doc.text('Tax:', totalsX, totalsY);
    doc.text(`Rs ${gstAmount.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });
    totalsY += 7;
  }

  doc.text('Discount:', totalsX, totalsY);
  doc.text('Rs 0.00', pageWidth - 15, totalsY, { align: 'right' });

  totalsY += 10;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', totalsX, totalsY);
  doc.text(`Rs ${grandTotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: 'right' });

  // Notes
  if (invoice.customMessage) {
    totalsY += 15;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 15, totalsY);
    doc.setFont(undefined, 'normal');
    const noteLines = doc.splitTextToSize(invoice.customMessage, pageWidth - 30);
    doc.text(noteLines, 15, totalsY + 7);
  }

  doc.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
};

// Placeholder templates (to be implemented)
const generateModernTemplate = (invoice) => {
  console.log('Modern template not yet implemented, using classic template');
  return generateClassicTemplate(invoice);
};

const generateMinimalTemplate = (invoice) => {
  console.log('Minimal template not yet implemented, using classic template');
  return generateClassicTemplate(invoice);
};

const generateProfessionalTemplate = (invoice) => {
  console.log('Professional template not yet implemented, using classic template');
  return generateClassicTemplate(invoice);
};
