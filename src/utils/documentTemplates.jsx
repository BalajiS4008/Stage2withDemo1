import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './dataManager.jsx';
import { addImageToPDF, addSignatureToPDF } from './pdfHelpers';

// Helper function to check if content will overflow page
const checkPageOverflow = (pdf, currentY, contentHeight) => {
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;

  if (currentY + contentHeight > pageHeight - margin) {
    pdf.addPage();
    return margin;
  }
  return currentY;
};

/**
 * Shared Document Template Generator
 * This file contains reusable PDF generation logic for both Invoice and Quotation
 * Any updates here will automatically reflect in both modules
 */

// Document Type Configuration
export const DOCUMENT_TYPES = {
  INVOICE: {
    title: 'INVOICE',
    numberLabel: 'Invoice No',
    dateLabel: 'Invoice Date',
    showPaymentMethod: true,
    showPaymentStatus: true,
    showDueDate: true,
    showValidityDate: false,
    statusOptions: ['paid', 'pending', 'cancelled']
  },
  QUOTATION: {
    title: 'QUOTATION',
    numberLabel: 'Quotation No',
    dateLabel: 'Quotation Date',
    showPaymentMethod: false,
    showPaymentStatus: false,
    showDueDate: false,
    showValidityDate: true,
    statusOptions: ['draft', 'sent', 'accepted', 'rejected']
  }
};

// Color schemes
const COLORS = {
  navyBlue: [30, 58, 95],
  skyBlue: [38, 169, 224],
  lightGray: [245, 245, 245],
  white: [255, 255, 255],
  green: [34, 197, 94],
  red: [239, 68, 68],
  yellow: [250, 204, 21],
  // Corporate colors
  corporateBlue: [30, 64, 175],
  corporateGold: [234, 179, 8],
  // Modern colors
  modernBlue: [37, 99, 235],
  modernPurple: [147, 51, 234],
  // Classic colors
  classicBlue: [59, 130, 246],
  // Minimal colors
  black: [0, 0, 0],
  darkGray: [75, 85, 99],
  // Professional colors
  professionalBlue: [37, 99, 235]
};

/**
 * Main Document PDF Generator
 * @param {Object} document - Document data
 * @param {String} documentType - 'invoice' or 'quotation'
 */
export const generateDocumentPDF = (document, documentType = 'invoice') => {
  const template = document.template || 'classic';
  const config = documentType === 'invoice' ? DOCUMENT_TYPES.INVOICE : DOCUMENT_TYPES.QUOTATION;

  switch (template) {
    case 'liceria':
      return generateLiceriaTemplate(document, config);
    case 'corporate':
      return generateCorporateTemplate(document, config);
    case 'modern':
      return generateModernTemplate(document, config);
    case 'minimal':
      return generateMinimalTemplate(document, config);
    case 'professional':
      return generateProfessionalTemplate(document, config);
    case 'classic':
    default:
      return generateClassicTemplate(document, config);
  }
};

/**
 * Helper function to get font size based on settings
 */
const getFontSizes = (fontSize = 'medium') => {
  switch (fontSize) {
    case 'small':
      return { header: 6, body: 6, rowHeight: 7 };
    case 'large':
      return { header: 8, body: 8, rowHeight: 9 };
    case 'medium':
    default:
      return { header: 7, body: 7, rowHeight: 8 };
  }
};

/**
 * Liceria & Co. Template - Professional Blue Corporate Design
 */
const generateLiceriaTemplate = (doc, config) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const fontSize = getFontSizes(doc.fontSize);

    // Ensure required fields
    const documentNumber = String(doc.invoiceNumber || doc.quotationNumber || 'DOC-001');
    const companyName = String(doc.companyName || 'Company Name');
    const clientName = String(doc.clientName || 'Client Name');
    const paymentMethod = String(doc.paymentMethod || 'Cash');
    const status = String(doc.status || 'pending');

    // Top decorative stripe (12mm height matching UI h-12)
    pdf.setFillColor(...COLORS.skyBlue);
    pdf.rect(0, 0, pageWidth / 3, 12, 'F');
    pdf.setFillColor(...COLORS.navyBlue);
    pdf.rect(pageWidth / 3, 0, pageWidth / 3, 12, 'F');
    pdf.setFillColor(...COLORS.skyBlue);
    pdf.rect((pageWidth / 3) * 2, 0, pageWidth / 3, 12, 'F');

    // Company Logo and Name - Top Right
    if (doc.companyLogo) {
      pdf.setDrawColor(...COLORS.skyBlue);
      pdf.setLineWidth(0.8);
      pdf.roundedRect(pageWidth - 60, 18, 45, 18, 2, 2);
      addImageToPDF(pdf, doc.companyLogo, pageWidth - 58, 20, 14, 14);

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...COLORS.navyBlue);
      pdf.text(companyName.substring(0, 15), pageWidth - 40, 28, { align: 'left' });

      if (doc.companyGST) {
        pdf.setFontSize(6);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`GST: ${doc.companyGST}`, pageWidth - 40, 33);
      }
    } else {
      pdf.setFillColor(...COLORS.navyBlue);
      pdf.roundedRect(pageWidth - 60, 18, 45, 18, 2, 2, 'F');

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text(companyName.substring(0, 15), pageWidth - 55, 28, { align: 'left' });

      if (doc.companyGST) {
        pdf.setFontSize(6);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(255, 255, 255);
        pdf.text(`GST: ${doc.companyGST}`, pageWidth - 55, 33);
      }
    }

    // Document Title (left side)
    pdf.setFontSize(32);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.navyBlue);
    pdf.text(config.title, 15, 30);

    // Status Badge
    let statusColor;
    let statusText = status.toUpperCase();
    if (status === 'paid' || status === 'accepted') {
      statusColor = COLORS.green;
    } else if (status === 'cancelled' || status === 'rejected') {
      statusColor = COLORS.red;
    } else {
      statusColor = COLORS.yellow;
    }

    pdf.setFillColor(...statusColor);
    pdf.roundedRect(15, 35, 25, 6, 3, 3, 'F');
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    if (status === 'pending' || status === 'draft') {
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.setTextColor(255, 255, 255);
    }
    pdf.text(statusText, 27.5, 39.5, { align: 'center' });

    let yPos = 55;

    // Document Details
    pdf.setFontSize(7);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${config.numberLabel}:`, 15, yPos);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.navyBlue);
    pdf.setFontSize(8);
    pdf.text(documentNumber, 48, yPos);

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text(`${config.dateLabel}:`, 15, yPos + 5);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(doc.date ? formatDate(doc.date) : 'N/A', 48, yPos + 5);

    // Due Date or Validity Date
    if (config.showDueDate) {
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text('DUE DATE:', 15, yPos + 10);
      pdf.setFont(undefined, 'bold');
      if (status === 'pending' && doc.dueDate) {
        pdf.setTextColor(220, 38, 38);
      } else {
        pdf.setTextColor(0, 0, 0);
      }
      pdf.text(doc.dueDate ? formatDate(doc.dueDate) : 'N/A', 48, yPos + 10);
    } else if (config.showValidityDate) {
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(128, 128, 128);
      pdf.text('VALID UNTIL:', 15, yPos + 10);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(doc.validityDate ? formatDate(doc.validityDate) : 'N/A', 48, yPos + 10);
    }

    // Payment Method Box (only for invoices)
    if (config.showPaymentMethod) {
      pdf.setFillColor(...COLORS.navyBlue);
      pdf.roundedRect(pageWidth - 85, yPos - 5, 70, 28, 2, 2, 'F');

      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...COLORS.white);
      pdf.text('PAYMENT METHOD', pageWidth - 50, yPos, { align: 'center' });
      pdf.setDrawColor(...COLORS.white);
      pdf.setLineWidth(0.2);
      pdf.line(pageWidth - 82, yPos + 1.5, pageWidth - 18, yPos + 1.5);

      pdf.setFontSize(6);
      pdf.setFont(undefined, 'normal');
      pdf.text('Method:', pageWidth - 82, yPos + 6);
      pdf.setFont(undefined, 'bold');
      pdf.text(paymentMethod, pageWidth - 60, yPos + 6);

      pdf.setFont(undefined, 'normal');
      pdf.text('Account No:', pageWidth - 82, yPos + 10);
      pdf.setFont(undefined, 'bold');
      pdf.text(doc.companyPhone || 'N/A', pageWidth - 60, yPos + 10);

      pdf.setFont(undefined, 'normal');
      pdf.text('Account Name:', pageWidth - 82, yPos + 14);
      pdf.setFont(undefined, 'bold');
      const acctName = clientName.substring(0, 12);
      pdf.text(acctName, pageWidth - 60, yPos + 14);

      pdf.setFont(undefined, 'normal');
      pdf.text('Branch:', pageWidth - 82, yPos + 18);
      pdf.setFont(undefined, 'bold');
      const branchName = companyName.substring(0, 12);
      pdf.text(branchName, pageWidth - 60, yPos + 18);
    }

    // Company Contact & Bill To Section
    yPos += 38;

    // Company Contact Box (left)
    pdf.setDrawColor(...COLORS.navyBlue);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(15, yPos, 90, 28, 2, 2);

    pdf.setFillColor(...COLORS.navyBlue);
    pdf.roundedRect(15, yPos, 90, 6, 2, 2, 'F');

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.white);
    pdf.text('COMPANY CONTACT', 18, yPos + 4);

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Phone: ${doc.companyPhone || 'N/A'}`, 18, yPos + 11);
    pdf.text(`Email: ${doc.companyEmail || 'N/A'}`, 18, yPos + 16);
    const compAddr = (doc.companyAddress || 'N/A').split('\n')[0];
    pdf.text(`Address: ${compAddr.substring(0, 30)}`, 18, yPos + 21);

    // Bill To Box (right)
    pdf.setDrawColor(...COLORS.navyBlue);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(pageWidth - 80, yPos, 65, 28, 2, 2);

    pdf.setFillColor(...COLORS.navyBlue);
    pdf.roundedRect(pageWidth - 80, yPos, 65, 6, 2, 2, 'F');

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.white);
    pdf.text('BILL TO', pageWidth - 77, yPos + 4);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(clientName, pageWidth - 77, yPos + 11);

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    if (doc.clientAddress) {
      const billAddr = doc.clientAddress.split('\n')[0];
      pdf.text(billAddr.substring(0, 25), pageWidth - 77, yPos + 16);
    }
    pdf.text(doc.clientPhone || 'N/A', pageWidth - 77, yPos + 21);

    // Items Table
    yPos += 38;
    const hasMeasurement = doc.items.some(item => item.measurementValue > 0);
    const showGSTColumn = doc.itemGstEnabled || false;

    const columns = ['DESCRIPTION'];
    if (hasMeasurement) {
      columns.push('AREA');
      columns.push('UNIT');
    }
    columns.push('QTY', 'RATE (Rs)', 'GST');
    if (!showGSTColumn) {
      columns.pop(); // Remove GST column if not enabled
    }
    columns.push('AMOUNT (Rs)');

    const rows = doc.items.map((item) => {
      const row = [item.description || item.name || '-'];

      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }

      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = parseFloat(item.amount) || 0;
      const gstValue = parseFloat(item.gstValue) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;

      row.push(quantity.toString(), rate.toFixed(2));

      if (showGSTColumn) {
        row.push(`${Math.round(gstRate)}%\n${gstValue.toFixed(2)}`);
      }

      row.push(amount.toFixed(2));
      return row;
    });

    const columnStyles = {
      0: { cellWidth: hasMeasurement ? 45 : 65, halign: 'left' }
    };

    let colIndex = 1;
    if (hasMeasurement) {
      columnStyles[colIndex] = { cellWidth: 20, halign: 'center' };
      colIndex++;
      columnStyles[colIndex] = { cellWidth: 18, halign: 'center' };
      colIndex++;
    }
    columnStyles[colIndex] = { cellWidth: 15, halign: 'center' };
    columnStyles[colIndex + 1] = { cellWidth: 25, halign: 'right' };
    if (showGSTColumn) {
      columnStyles[colIndex + 2] = { cellWidth: 22, halign: 'center' };
      columnStyles[colIndex + 3] = { cellWidth: 28, halign: 'right' };
    } else {
      columnStyles[colIndex + 2] = { cellWidth: 28, halign: 'right' };
    }

    autoTable(pdf, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.navyBlue,
        textColor: COLORS.white,
        fontSize: fontSize.header,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: fontSize.body,
        textColor: COLORS.navyBlue,
        cellPadding: 2.5,
        minCellHeight: fontSize.rowHeight
      },
      columnStyles: columnStyles,
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      styles: {
        lineColor: [229, 231, 235],
        lineWidth: 0.1
      }
    });

    // Bottom section
    let bottomY = pdf.lastAutoTable.finalY + 12;
    bottomY = checkPageOverflow(pdf, bottomY, 80);

    const leftColX = 15;
    const leftColW = 95;
    const rightColX = pageWidth - 80;
    const rightColW = 65;

    let leftY = bottomY;

    // Terms and Conditions
    if (doc.termsAndConditions) {
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(leftColX, leftY, leftColW, 25, 2, 2, 'F');
      pdf.setDrawColor(38, 169, 224);
      pdf.setLineWidth(2);
      pdf.line(leftColX, leftY, leftColX, leftY + 25);

      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...COLORS.navyBlue);
      pdf.text('TERMS AND CONDITIONS', leftColX + 4, leftY + 5);

      pdf.setFontSize(6);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(55, 65, 81);
      const termsLines = pdf.splitTextToSize(doc.termsAndConditions, leftColW - 8);
      pdf.text(termsLines.slice(0, 3), leftColX + 4, leftY + 10);

      leftY += 30;
    }

    // Notes
    if (doc.customMessage || doc.notes) {
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(leftColX, leftY, leftColW, 25, 2, 2, 'F');
      pdf.setDrawColor(...COLORS.navyBlue);
      pdf.setLineWidth(2);
      pdf.line(leftColX, leftY, leftColX, leftY + 25);

      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...COLORS.navyBlue);
      pdf.text('NOTES', leftColX + 4, leftY + 5);

      pdf.setFontSize(6);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(55, 65, 81);
      const notesLines = pdf.splitTextToSize(doc.customMessage || doc.notes, leftColW - 8);
      pdf.text(notesLines.slice(0, 3), leftColX + 4, leftY + 10);

      leftY += 30;
    }

    // Signature Section
    if (doc.signatureSettings && doc.signatureSettings.type !== 'none') {
      addSignatureToPDF(pdf, doc.signatureSettings, pageWidth, leftY);
      leftY += 30;
    }

    // Thank You Section
    pdf.setFillColor(...COLORS.navyBlue);
    pdf.roundedRect(leftColX, leftY, leftColW, 28, 2, 2, 'F');

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.white);
    pdf.text('THANK YOU FOR YOUR BUSINESS!', leftColX + 4, leftY + 6);

    pdf.setDrawColor(...COLORS.white);
    pdf.setLineWidth(0.2);
    pdf.line(leftColX + 4, leftY + 8, leftColX + leftColW - 4, leftY + 8);

    pdf.setFontSize(6);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(...COLORS.white);

    pdf.text('Phone:', leftColX + 4, leftY + 13);
    pdf.text(doc.companyPhone || 'N/A', leftColX + 16, leftY + 13);

    pdf.text('Email:', leftColX + 4, leftY + 18);
    pdf.text(doc.companyEmail || 'N/A', leftColX + 16, leftY + 18);

    pdf.text('Address:', leftColX + 4, leftY + 23);
    const addr = (doc.companyAddress || 'N/A').split('\n')[0];
    pdf.text(addr.substring(0, 35), leftColX + 20, leftY + 23);

    // RIGHT COLUMN: Summary
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(1);
    pdf.roundedRect(rightColX, bottomY, rightColW, 60, 2, 2);

    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(rightColX, bottomY, rightColW, 8, 2, 2, 'F');

    pdf.setDrawColor(...COLORS.navyBlue);
    pdf.setLineWidth(1);
    pdf.line(rightColX, bottomY + 8, rightColX + rightColW, bottomY + 8);

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.navyBlue);
    pdf.text(`${config.title} SUMMARY`, rightColX + 4, bottomY + 5);

    let totY = bottomY + 14;
    pdf.setFontSize(7);

    const subtotal = parseFloat(doc.subtotal) || 0;
    const gstAmount = parseFloat(doc.gstAmount) || 0;
    const grandTotal = parseFloat(doc.grandTotal) || 0;
    const itemGstTotal = doc.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    // Subtotal
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text('Subtotal:', rightColX + 4, totY);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Rs ${subtotal.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
    totY += 6;

    // Item GST
    if (showGSTColumn && itemGstTotal > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text('Item GST:', rightColX + 4, totY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(22, 163, 74);
      pdf.text(`Rs ${itemGstTotal.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

      pdf.setDrawColor(229, 231, 235);
      pdf.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
      totY += 6;
    }

    // Invoice GST
    if (doc.gstEnabled && gstAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Tax (${doc.gstPercentage || 0}%):`, rightColX + 4, totY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(22, 163, 74);
      pdf.text(`Rs ${gstAmount.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

      pdf.setDrawColor(229, 231, 235);
      pdf.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
      totY += 6;
    }

    // Discount
    const discount = parseFloat(doc.discount) || 0;
    const discountType = doc.discountType || 'amount';
    const discountAmount = parseFloat(doc.discountAmount) || 0;

    if (discount > 0 && discountAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Discount ${discountType === 'percentage' ? `(${discount}%)` : ''}:`, rightColX + 4, totY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`- Rs ${discountAmount.toFixed(2)}`, rightColX + rightColW - 4, totY, { align: 'right' });

      pdf.setDrawColor(229, 231, 235);
      pdf.line(rightColX + 4, totY + 2, rightColX + rightColW - 4, totY + 2);
      totY += 6;
    }

    // Grand Total Box
    pdf.setFillColor(...COLORS.navyBlue);
    pdf.roundedRect(rightColX + 3, totY - 2, rightColW - 6, 14, 2, 2, 'F');

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(...COLORS.white);
    pdf.text('GRAND TOTAL:', rightColX + 6, totY + 5);
    pdf.setFontSize(13);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, rightColX + rightColW - 6, totY + 5, { align: 'right' });

    // Bottom decorative stripe
    const stripeY = pageHeight - 16;
    pdf.setFillColor(...COLORS.skyBlue);
    pdf.rect(0, stripeY, pageWidth / 3, 16, 'F');
    pdf.setFillColor(...COLORS.navyBlue);
    pdf.rect(pageWidth / 3, stripeY, pageWidth / 3, 16, 'F');
    pdf.setFillColor(...COLORS.skyBlue);
    pdf.rect((pageWidth / 3) * 2, stripeY, pageWidth / 3, 16, 'F');

    // Save PDF
    pdf.save(`${documentNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateLiceriaTemplate:', error);
    throw error;
  }
};

/**
 * Corporate Template - Navy Blue & Gold Professional Design
 */
const generateCorporateTemplate = (doc, config) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const fontSize = getFontSizes(doc.fontSize);

    const documentNumber = String(doc.invoiceNumber || doc.quotationNumber || 'DOC-001');
    const companyName = String(doc.companyName || 'Company Name');
    const clientName = String(doc.clientName || 'Client Name');
    const paymentMethod = String(doc.paymentMethod || 'Cash');
    const status = String(doc.status || 'pending');

    // Header with gradient effect (simulated with overlapping rectangles)
    pdf.setFillColor(30, 64, 175); // Deep blue
    pdf.rect(0, 0, pageWidth, 50, 'F');

    pdf.setFillColor(234, 179, 8); // Gold accent stripe
    pdf.rect(0, 48, pageWidth, 2, 'F');

    // Company Logo
    if (doc.companyLogo) {
      addImageToPDF(pdf, doc.companyLogo, 15, 10, 20, 20);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(companyName, 40, 20);

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      if (doc.companyAddress) {
        pdf.text(doc.companyAddress.split('\n')[0].substring(0, 40), 40, 26);
      }
      if (doc.companyPhone) pdf.text(`Phone: ${doc.companyPhone}`, 40, 31);
      if (doc.companyEmail) pdf.text(`Email: ${doc.companyEmail}`, 40, 36);
    } else {
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(companyName, 15, 25);
    }

    // Document Title and Number (right side)
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(234, 179, 8); // Gold
    pdf.text(config.title, pageWidth - 15, 25, { align: 'right' });

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${config.numberLabel}: ${documentNumber}`, pageWidth - 15, 35, { align: 'right' });
    pdf.text(`Date: ${doc.date ? formatDate(doc.date) : 'N/A'}`, pageWidth - 15, 41, { align: 'right' });

    // Status Badge
    let yPos = 60;
    let statusColor;
    if (status === 'paid' || status === 'accepted') {
      statusColor = COLORS.green;
    } else if (status === 'cancelled' || status === 'rejected') {
      statusColor = COLORS.red;
    } else {
      statusColor = COLORS.yellow;
    }

    pdf.setFillColor(...statusColor);
    pdf.roundedRect(15, yPos, 30, 8, 2, 2, 'F');
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255);
    pdf.text(status.toUpperCase(), 30, yPos + 5.5, { align: 'center' });

    yPos += 15;

    // Bill To and Company Details Side by Side
    const boxHeight = 35;

    // Bill To (Left)
    pdf.setDrawColor(30, 64, 175);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPos, 90, boxHeight);

    pdf.setFillColor(30, 64, 175);
    pdf.rect(15, yPos, 90, 8, 'F');

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('BILL TO', 18, yPos + 5.5);

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(clientName, 18, yPos + 14);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    if (doc.clientAddress) pdf.text(doc.clientAddress.split('\n')[0].substring(0, 35), 18, yPos + 20);
    if (doc.clientPhone) pdf.text(`Phone: ${doc.clientPhone}`, 18, yPos + 26);
    if (doc.clientEmail) pdf.text(`Email: ${doc.clientEmail}`, 18, yPos + 32);

    // Payment Details (Right) - only for invoices
    if (config.showPaymentMethod) {
      pdf.setDrawColor(234, 179, 8);
      pdf.setLineWidth(0.5);
      pdf.rect(110, yPos, pageWidth - 125, boxHeight);

      pdf.setFillColor(234, 179, 8);
      pdf.rect(110, yPos, pageWidth - 125, 8, 'F');

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('PAYMENT INFO', 113, yPos + 5.5);

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Method: ${paymentMethod}`, 113, yPos + 14);

      if (config.showDueDate && doc.dueDate) {
        pdf.text(`Due Date: ${formatDate(doc.dueDate)}`, 113, yPos + 20);
      }
    }

    yPos += boxHeight + 10;

    // Items Table
    const hasMeasurement = doc.items.some(item => item.measurementValue > 0);
    const showGSTColumn = doc.itemGstEnabled || false;

    const columns = ['Description'];
    if (hasMeasurement) {
      columns.push('Area', 'Unit');
    }
    columns.push('Qty', 'Rate (Rs)', 'GST');
    if (!showGSTColumn) {
      columns.pop(); // Remove GST column if not enabled
    }
    columns.push('Amount (Rs)');

    const rows = doc.items.map((item) => {
      const row = [item.description || '-'];
      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }
      row.push(
        (parseFloat(item.quantity) || 0).toString(),
        (parseFloat(item.rate) || 0).toFixed(2)
      );
      if (showGSTColumn) {
        row.push(`${Math.round(parseFloat(item.gstRate) || 0)}%\n${(parseFloat(item.gstValue) || 0).toFixed(2)}`);
      }
      row.push((parseFloat(item.amount) || 0).toFixed(2));
      return row;
    });

    autoTable(pdf, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 64, 175],
        textColor: [255, 255, 255],
        fontSize: fontSize.header,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: fontSize.body,
        minCellHeight: fontSize.rowHeight
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: hasMeasurement ? 45 : 70 },
        [columns.length - 1]: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Totals Section
    let totalsY = pdf.lastAutoTable.finalY + 10;
    totalsY = checkPageOverflow(pdf, totalsY, 60);

    const totalsX = pageWidth - 75;
    const totalsW = 60;

    const subtotal = parseFloat(doc.subtotal) || 0;
    const gstAmount = parseFloat(doc.gstAmount) || 0;
    const discount = parseFloat(doc.discount) || 0;
    const discountAmount = parseFloat(doc.discountAmount) || 0;
    const grandTotal = parseFloat(doc.grandTotal) || 0;
    const itemGstTotal = doc.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);

    // Subtotal
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('Subtotal:', totalsX, totalsY);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Rs ${subtotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
    pdf.line(totalsX, totalsY + 2, totalsX + totalsW, totalsY + 2);
    totalsY += 7;

    // GST
    if (showGSTColumn && itemGstTotal > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text('Item GST:', totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${itemGstTotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      pdf.line(totalsX, totalsY + 2, totalsX + totalsW, totalsY + 2);
      totalsY += 7;
    }

    if (doc.gstEnabled && gstAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Tax (${doc.gstPercentage || 0}%):`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${gstAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      pdf.line(totalsX, totalsY + 2, totalsX + totalsW, totalsY + 2);
      totalsY += 7;
    }

    // Discount
    if (discount > 0 && discountAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Discount ${doc.discountType === 'percentage' ? `(${discount}%)` : ''}:`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`- Rs ${discountAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      pdf.line(totalsX, totalsY + 2, totalsX + totalsW, totalsY + 2);
      totalsY += 7;
    }

    // Grand Total
    pdf.setFillColor(30, 64, 175);
    pdf.roundedRect(totalsX - 2, totalsY - 3, totalsW + 4, 12, 2, 2, 'F');

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('GRAND TOTAL:', totalsX + 2, totalsY + 4);
    pdf.setFontSize(13);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, totalsX + totalsW - 2, totalsY + 4, { align: 'right' });

    // Notes and Terms at bottom
    let bottomY = totalsY + 15;

    if (doc.notes || doc.customMessage) {
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(30, 64, 175);
      pdf.text('NOTES:', 15, bottomY);

      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      const notesLines = pdf.splitTextToSize(doc.notes || doc.customMessage, 90);
      pdf.text(notesLines.slice(0, 3), 15, bottomY + 5);
    }

    if (doc.termsAndConditions) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Terms & Conditions:', 15, pageHeight - 25);

      pdf.setFont(undefined, 'normal');
      const termsLines = pdf.splitTextToSize(doc.termsAndConditions, pageWidth - 30);
      pdf.text(termsLines.slice(0, 2), 15, pageHeight - 20);
    }

    // Signature
    if (doc.signatureSettings && doc.signatureSettings.type !== 'none') {
      addSignatureToPDF(pdf, doc.signatureSettings, pageWidth, pageHeight - 50);
    }

    // Footer
    pdf.setFillColor(234, 179, 8);
    pdf.rect(0, pageHeight - 10, pageWidth, 10, 'F');

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 5, { align: 'center' });

    pdf.save(`${documentNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateCorporateTemplate:', error);
    throw error;
  }
};

/**
 * Classic Template - Traditional Business Design
 */
const generateClassicTemplate = (doc, config) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const fontSize = getFontSizes(doc.fontSize);

    const documentNumber = String(doc.invoiceNumber || doc.quotationNumber || 'DOC-001');
    const companyName = String(doc.companyName || 'Company Name');
    const clientName = String(doc.clientName || 'Client Name');
    const status = String(doc.status || 'pending');

    let yPos = 20;

    // Header Section
    if (doc.companyLogo) {
      addImageToPDF(pdf, doc.companyLogo, 15, yPos, 25, 25);

      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text(companyName, 45, yPos + 8);

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      if (doc.companyAddress) pdf.text(doc.companyAddress.split('\n')[0], 45, yPos + 14);
      if (doc.companyPhone) pdf.text(`Phone: ${doc.companyPhone}`, 45, yPos + 19);
      if (doc.companyEmail) pdf.text(`Email: ${doc.companyEmail}`, 45, yPos + 24);
    } else {
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text(companyName, 15, yPos + 10);
    }

    // Document Title and Details (Right Side)
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text(config.title, pageWidth - 15, yPos + 10, { align: 'right' });

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${config.numberLabel}: ${documentNumber}`, pageWidth - 15, yPos + 18, { align: 'right' });
    pdf.text(`Date: ${doc.date ? formatDate(doc.date) : 'N/A'}`, pageWidth - 15, yPos + 24, { align: 'right' });

    if (config.showDueDate && doc.dueDate) {
      pdf.setTextColor(220, 38, 38);
      pdf.text(`Due Date: ${formatDate(doc.dueDate)}`, pageWidth - 15, yPos + 30, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
    }

    // Status Badge
    yPos += 35;
    let statusColor;
    if (status === 'paid' || status === 'accepted') {
      statusColor = COLORS.green;
    } else if (status === 'cancelled' || status === 'rejected') {
      statusColor = COLORS.red;
    } else {
      statusColor = COLORS.yellow;
    }

    pdf.setFillColor(...statusColor);
    pdf.roundedRect(pageWidth - 45, yPos, 30, 8, 2, 2, 'F');
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255);
    pdf.text(status.toUpperCase(), pageWidth - 30, yPos + 5.5, { align: 'center' });

    yPos += 15;

    // Divider Line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(15, yPos, pageWidth - 15, yPos);

    yPos += 10;

    // Bill To Section
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(15, yPos, 90, 35, 2, 2, 'F');
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, yPos, 90, 35, 2, 2);

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('BILL TO:', 18, yPos + 7);

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(clientName, 18, yPos + 14);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    if (doc.clientAddress) pdf.text(doc.clientAddress.split('\n')[0].substring(0, 35), 18, yPos + 20);
    if (doc.clientPhone) pdf.text(`Phone: ${doc.clientPhone}`, 18, yPos + 26);
    if (doc.clientEmail) pdf.text(`Email: ${doc.clientEmail}`, 18, yPos + 32);

    // Payment Method (Right) - only for invoices
    if (config.showPaymentMethod) {
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(110, yPos, pageWidth - 125, 35, 2, 2, 'F');
      pdf.setDrawColor(156, 163, 175);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(110, yPos, pageWidth - 125, 35, 2, 2);

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(75, 85, 99);
      pdf.text('PAYMENT METHOD:', 113, yPos + 7);

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(doc.paymentMethod || 'Cash', 113, yPos + 14);
    }

    yPos += 45;

    // Items Table
    const hasMeasurement = doc.items.some(item => item.measurementValue > 0);
    const showGSTColumn = doc.itemGstEnabled || false;

    const columns = ['Description'];
    if (hasMeasurement) {
      columns.push('Area', 'Unit');
    }
    columns.push('Qty', 'Rate (Rs)', 'GST');
    if (!showGSTColumn) {
      columns.pop(); // Remove GST column if not enabled
    }
    if (showGSTColumn) columns.push('GST');
    columns.push('Amount (Rs)');

    const rows = doc.items.map((item) => {
      const row = [item.description || '-'];
      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }
      row.push(
        (parseFloat(item.quantity) || 0).toString(),
        (parseFloat(item.rate) || 0).toFixed(2)
      );
      if (showGSTColumn) {
        row.push(`${Math.round(parseFloat(item.gstRate) || 0)}%\nRs ${(parseFloat(item.gstValue) || 0).toFixed(2)}`);
      }
      row.push((parseFloat(item.amount) || 0).toFixed(2));
      return row;
    });

    autoTable(pdf, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontSize: fontSize.header,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: fontSize.body,
        minCellHeight: fontSize.rowHeight
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: hasMeasurement ? 45 : 70 },
        [columns.length - 1]: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Totals
    let totalsY = pdf.lastAutoTable.finalY + 10;
    totalsY = checkPageOverflow(pdf, totalsY, 60);

    const totalsX = pageWidth - 75;
    const totalsW = 60;

    const subtotal = parseFloat(doc.subtotal) || 0;
    const gstAmount = parseFloat(doc.gstAmount) || 0;
    const discount = parseFloat(doc.discount) || 0;
    const discountAmount = parseFloat(doc.discountAmount) || 0;
    const grandTotal = parseFloat(doc.grandTotal) || 0;
    const itemGstTotal = doc.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(totalsX - 5, totalsY - 5, totalsW + 10, 50, 2, 2, 'F');
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(totalsX - 5, totalsY - 5, totalsW + 10, 50, 2, 2);

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('Subtotal:', totalsX, totalsY);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Rs ${subtotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
    totalsY += 6;

    if (showGSTColumn && itemGstTotal > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text('Item GST:', totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${itemGstTotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    if (doc.gstEnabled && gstAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Tax (${doc.gstPercentage || 0}%):`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${gstAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    if (discount > 0 && discountAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Discount ${doc.discountType === 'percentage' ? `(${discount}%)` : ''}:`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`- Rs ${discountAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.line(totalsX, totalsY, totalsX + totalsW, totalsY);
    totalsY += 5;

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(59, 130, 246);
    pdf.text('GRAND TOTAL:', totalsX, totalsY);
    pdf.setFontSize(13);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });

    // Notes and Terms
    let bottomY = totalsY + 10;

    if (doc.notes || doc.customMessage) {
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('NOTES:', 15, bottomY);

      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      const notesLines = pdf.splitTextToSize(doc.notes || doc.customMessage, 90);
      pdf.text(notesLines.slice(0, 3), 15, bottomY + 5);
      bottomY += 20;
    }

    if (doc.termsAndConditions) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Terms & Conditions:', 15, bottomY);

      pdf.setFont(undefined, 'normal');
      const termsLines = pdf.splitTextToSize(doc.termsAndConditions, pageWidth - 30);
      pdf.text(termsLines.slice(0, 2), 15, bottomY + 5);
    }

    // Signature
    if (doc.signatureSettings && doc.signatureSettings.type !== 'none') {
      addSignatureToPDF(pdf, doc.signatureSettings, pageWidth, pageHeight - 50);
    }

    // Footer
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });

    pdf.save(`${documentNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateClassicTemplate:', error);
    throw error;
  }
};

/**
 * Modern Template - Contemporary Design with Blue/Purple Gradient
 */
const generateModernTemplate = (doc, config) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const fontSize = getFontSizes(doc.fontSize);

    const documentNumber = String(doc.invoiceNumber || doc.quotationNumber || 'DOC-001');
    const companyName = String(doc.companyName || 'Company Name');
    const clientName = String(doc.clientName || 'Client Name');
    const status = String(doc.status || 'pending');

    // Gradient Header (simulated with color transitions)
    pdf.setFillColor(37, 99, 235); // Blue
    pdf.rect(0, 0, pageWidth, 60, 'F');

    // Overlay for gradient effect
    pdf.setFillColor(147, 51, 234); // Purple - right side
    pdf.setGState(new pdf.GState({ opacity: 0.3 }));
    pdf.rect(pageWidth / 2, 0, pageWidth / 2, 60, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    // Decorative elements
    pdf.setFillColor(255, 255, 255);
    pdf.setGState(new pdf.GState({ opacity: 0.1 }));
    pdf.circle(pageWidth - 30, 20, 25, 'F');
    pdf.circle(20, 50, 15, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    // Company Info
    if (doc.companyLogo) {
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(12, 12, 30, 30, 3, 3, 'F');
      addImageToPDF(pdf, doc.companyLogo, 15, 15, 24, 24);

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(companyName, 48, 23);

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      if (doc.companyPhone) pdf.text(`📞 ${doc.companyPhone}`, 48, 30);
      if (doc.companyEmail) pdf.text(`✉ ${doc.companyEmail}`, 48, 36);
    } else {
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(companyName, 15, 25);
    }

    // Document Title
    pdf.setFontSize(32);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(config.title, pageWidth - 15, 30, { align: 'right' });

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${config.numberLabel}: ${documentNumber}`, pageWidth - 15, 40, { align: 'right' });
    pdf.text(`Date: ${doc.date ? formatDate(doc.date) : 'N/A'}`, pageWidth - 15, 47, { align: 'right' });

    // Status Badge
    let yPos = 70;
    let statusColor;
    if (status === 'paid' || status === 'accepted') {
      statusColor = COLORS.green;
    } else if (status === 'cancelled' || status === 'rejected') {
      statusColor = COLORS.red;
    } else {
      statusColor = COLORS.yellow;
    }

    pdf.setFillColor(...statusColor);
    pdf.roundedRect(15, yPos, 35, 10, 3, 3, 'F');
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255);
    pdf.text(status.toUpperCase(), 32.5, yPos + 6.5, { align: 'center' });
    pdf.setTextColor(0, 0, 0);

    yPos += 18;

    // Bill To Section (with modern card design)
    pdf.setFillColor(249, 250, 251);
    pdf.roundedRect(15, yPos, 90, 38, 3, 3, 'F');

    // Accent bar
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(15, yPos, 5, 38, 3, 3, 'F');

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text('BILL TO', 23, yPos + 7);

    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(clientName, 23, yPos + 15);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    if (doc.clientAddress) pdf.text(doc.clientAddress.split('\n')[0].substring(0, 32), 23, yPos + 21);
    if (doc.clientPhone) pdf.text(`📞 ${doc.clientPhone}`, 23, yPos + 27);
    if (doc.clientEmail) pdf.text(`✉ ${doc.clientEmail}`, 23, yPos + 33);

    // Payment Info (Right) - only for invoices
    if (config.showPaymentMethod) {
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(110, yPos, pageWidth - 125, 38, 3, 3, 'F');

      pdf.setFillColor(147, 51, 234);
      pdf.roundedRect(110, yPos, 5, 38, 3, 3, 'F');

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(147, 51, 234);
      pdf.text('PAYMENT', 118, yPos + 7);

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(doc.paymentMethod || 'Cash', 118, yPos + 15);

      if (config.showDueDate && doc.dueDate) {
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Due: ${formatDate(doc.dueDate)}`, 118, yPos + 22);
      }
    }

    yPos += 48;

    // Items Table
    const hasMeasurement = doc.items.some(item => item.measurementValue > 0);
    const showGSTColumn = doc.itemGstEnabled || false;

    const columns = ['Description'];
    if (hasMeasurement) {
      columns.push('Area', 'Unit');
    }
    columns.push('Qty', 'Rate (Rs)', 'GST');
    if (!showGSTColumn) {
      columns.pop(); // Remove GST column if not enabled
    }
    if (showGSTColumn) columns.push('GST');
    columns.push('Amount (Rs)');

    const rows = doc.items.map((item) => {
      const row = [item.description || '-'];
      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }
      row.push(
        (parseFloat(item.quantity) || 0).toString(),
        (parseFloat(item.rate) || 0).toFixed(2)
      );
      if (showGSTColumn) {
        row.push(`${Math.round(parseFloat(item.gstRate) || 0)}%\nRs ${(parseFloat(item.gstValue) || 0).toFixed(2)}`);
      }
      row.push((parseFloat(item.amount) || 0).toFixed(2));
      return row;
    });

    autoTable(pdf, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'plain',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: fontSize.header,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: fontSize.body,
        minCellHeight: fontSize.rowHeight
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: hasMeasurement ? 45 : 70 },
        [columns.length - 1]: { halign: 'right', fontStyle: 'bold' }
      }
    });

    // Totals with gradient background
    let totalsY = pdf.lastAutoTable.finalY + 10;
    totalsY = checkPageOverflow(pdf, totalsY, 60);

    const totalsX = pageWidth - 80;
    const totalsW = 65;

    const subtotal = parseFloat(doc.subtotal) || 0;
    const gstAmount = parseFloat(doc.gstAmount) || 0;
    const discount = parseFloat(doc.discount) || 0;
    const discountAmount = parseFloat(doc.discountAmount) || 0;
    const grandTotal = parseFloat(doc.grandTotal) || 0;
    const itemGstTotal = doc.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('Subtotal:', totalsX, totalsY);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Rs ${subtotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
    totalsY += 6;

    if (showGSTColumn && itemGstTotal > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text('Item GST:', totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${itemGstTotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    if (doc.gstEnabled && gstAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Tax (${doc.gstPercentage || 0}%):`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${gstAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    if (discount > 0 && discountAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Discount ${doc.discountType === 'percentage' ? `(${discount}%)` : ''}:`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`- Rs ${discountAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    // Grand Total with gradient
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(totalsX - 3, totalsY - 2, totalsW + 6, 14, 3, 3, 'F');

    pdf.setFillColor(147, 51, 234);
    pdf.setGState(new pdf.GState({ opacity: 0.5 }));
    pdf.roundedRect(totalsX + totalsW / 2, totalsY - 2, totalsW / 2 + 3, 14, 3, 3, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('GRAND TOTAL:', totalsX + 2, totalsY + 6);
    pdf.setFontSize(14);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, totalsX + totalsW - 2, totalsY + 6, { align: 'right' });

    // Notes and Terms
    let bottomY = totalsY + 18;

    if (doc.notes || doc.customMessage) {
      pdf.setFillColor(239, 246, 255);
      pdf.roundedRect(15, bottomY, pageWidth - 30, 20, 2, 2, 'F');

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text('📝 NOTES', 18, bottomY + 5);

      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      const notesLines = pdf.splitTextToSize(doc.notes || doc.customMessage, pageWidth - 40);
      pdf.text(notesLines.slice(0, 2), 18, bottomY + 10);
      bottomY += 25;
    }

    if (doc.termsAndConditions) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Terms & Conditions:', 15, bottomY);

      pdf.setFont(undefined, 'normal');
      const termsLines = pdf.splitTextToSize(doc.termsAndConditions, pageWidth - 30);
      pdf.text(termsLines.slice(0, 2), 15, bottomY + 5);
    }

    // Signature
    if (doc.signatureSettings && doc.signatureSettings.type !== 'none') {
      addSignatureToPDF(pdf, doc.signatureSettings, pageWidth, pageHeight - 50);
    }

    // Footer
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(150, 150, 150);
    pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });

    pdf.save(`${documentNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateModernTemplate:', error);
    throw error;
  }
};

/**
 * Minimal Template - Clean Black & White Design
 */
const generateMinimalTemplate = (doc, config) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const fontSize = getFontSizes(doc.fontSize);

    const documentNumber = String(doc.invoiceNumber || doc.quotationNumber || 'DOC-001');
    const companyName = String(doc.companyName || 'Company Name');
    const clientName = String(doc.clientName || 'Client Name');
    const status = String(doc.status || 'pending');

    let yPos = 25;

    // Simple Header - Company Name
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(companyName.toUpperCase(), 15, yPos);

    // Contact Info
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(100, 100, 100);
    if (doc.companyAddress) pdf.text(doc.companyAddress.split('\n')[0], 15, yPos + 7);
    if (doc.companyPhone) pdf.text(`T: ${doc.companyPhone}`, 15, yPos + 12);
    if (doc.companyEmail) pdf.text(`E: ${doc.companyEmail}`, 15, yPos + 17);

    // Document Title (Right)
    pdf.setFontSize(32);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(config.title, pageWidth - 15, yPos + 5, { align: 'right' });

    yPos += 25;

    // Thick divider line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.line(15, yPos, pageWidth - 15, yPos);

    yPos += 10;

    // Document Details
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${config.numberLabel}:`, 15, yPos);
    pdf.setFont(undefined, 'bold');
    pdf.text(documentNumber, 50, yPos);

    pdf.setFont(undefined, 'normal');
    pdf.text('Date:', 15, yPos + 6);
    pdf.setFont(undefined, 'bold');
    pdf.text(doc.date ? formatDate(doc.date) : 'N/A', 50, yPos + 6);

    if (config.showDueDate && doc.dueDate) {
      pdf.setFont(undefined, 'normal');
      pdf.text('Due Date:', 15, yPos + 12);
      pdf.setFont(undefined, 'bold');
      pdf.text(formatDate(doc.dueDate), 50, yPos + 12);
      yPos += 6;
    }

    // Status
    pdf.setFont(undefined, 'normal');
    pdf.text('Status:', 15, yPos + 18);
    pdf.setFont(undefined, 'bold');
    pdf.text(status.toUpperCase(), 50, yPos + 18);

    yPos += 30;

    // Bill To
    pdf.setFontSize(7);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('BILL TO:', 15, yPos);

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text(clientName, 15, yPos + 6);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    if (doc.clientAddress) pdf.text(doc.clientAddress.split('\n')[0], 15, yPos + 12);
    if (doc.clientPhone) pdf.text(doc.clientPhone, 15, yPos + 18);
    if (doc.clientEmail) pdf.text(doc.clientEmail, 15, yPos + 24);

    // Payment Method (Right) - only for invoices
    if (config.showPaymentMethod) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.text('PAYMENT:', pageWidth - 15, yPos, { align: 'right' });

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text(doc.paymentMethod || 'Cash', pageWidth - 15, yPos + 6, { align: 'right' });
    }

    yPos += 35;

    // Items Table
    const hasMeasurement = doc.items.some(item => item.measurementValue > 0);
    const showGSTColumn = doc.itemGstEnabled || false;

    const columns = ['DESCRIPTION'];
    if (hasMeasurement) {
      columns.push('AREA', 'UNIT');
    }
    columns.push('QTY', 'RATE (Rs)', 'GST');
    if (!showGSTColumn) {
      columns.pop(); // Remove GST column if not enabled
    }
    if (showGSTColumn) columns.push('GST');
    columns.push('AMOUNT (Rs)');

    const rows = doc.items.map((item) => {
      const row = [item.description || '-'];
      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }
      row.push(
        (parseFloat(item.quantity) || 0).toString(),
        (parseFloat(item.rate) || 0).toFixed(2)
      );
      if (showGSTColumn) {
        row.push(`${Math.round(parseFloat(item.gstRate) || 0)}%\nRs ${(parseFloat(item.gstValue) || 0).toFixed(2)}`);
      }
      row.push((parseFloat(item.amount) || 0).toFixed(2));
      return row;
    });

    autoTable(pdf, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'plain',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontSize: fontSize.header,
        fontStyle: 'normal',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: fontSize.body,
        textColor: [0, 0, 0],
        minCellHeight: fontSize.rowHeight
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: hasMeasurement ? 45 : 70 },
        [columns.length - 1]: { halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      }
    });

    // Totals
    let totalsY = pdf.lastAutoTable.finalY + 10;
    totalsY = checkPageOverflow(pdf, totalsY, 60);

    const totalsX = pageWidth - 70;
    const totalsW = 55;

    const subtotal = parseFloat(doc.subtotal) || 0;
    const gstAmount = parseFloat(doc.gstAmount) || 0;
    const discount = parseFloat(doc.discount) || 0;
    const discountAmount = parseFloat(doc.discountAmount) || 0;
    const grandTotal = parseFloat(doc.grandTotal) || 0;
    const itemGstTotal = doc.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.text('Subtotal:', totalsX, totalsY);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Rs ${subtotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(totalsX, totalsY + 1, totalsX + totalsW, totalsY + 1);
    totalsY += 6;

    if (showGSTColumn && itemGstTotal > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text('Item GST:', totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Rs ${itemGstTotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.line(totalsX, totalsY + 1, totalsX + totalsW, totalsY + 1);
      totalsY += 6;
    }

    if (doc.gstEnabled && gstAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Tax (${doc.gstPercentage || 0}%):`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.text(`Rs ${gstAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.line(totalsX, totalsY + 1, totalsX + totalsW, totalsY + 1);
      totalsY += 6;
    }

    if (discount > 0 && discountAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Discount ${doc.discountType === 'percentage' ? `(${discount}%)` : ''}:`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.text(`- Rs ${discountAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.line(totalsX, totalsY + 1, totalsX + totalsW, totalsY + 1);
      totalsY += 6;
    }

    // Grand Total - Black Box
    pdf.setFillColor(0, 0, 0);
    pdf.rect(totalsX - 2, totalsY - 1, totalsW + 4, 10, 'F');

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('TOTAL:', totalsX + 2, totalsY + 6);
    pdf.setFontSize(12);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, totalsX + totalsW - 2, totalsY + 6, { align: 'right' });
    pdf.setTextColor(0, 0, 0);

    // Notes
    let bottomY = totalsY + 15;

    if (doc.notes || doc.customMessage) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.text('NOTES', 15, bottomY);

      pdf.setFont(undefined, 'normal');
      const notesLines = pdf.splitTextToSize(doc.notes || doc.customMessage, pageWidth - 30);
      pdf.text(notesLines.slice(0, 3), 15, bottomY + 5);
      bottomY += 20;
    }

    if (doc.termsAndConditions) {
      pdf.setFontSize(6);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      const termsLines = pdf.splitTextToSize(doc.termsAndConditions, pageWidth - 30);
      pdf.text(termsLines.slice(0, 2), 15, bottomY);
    }

    // Signature
    if (doc.signatureSettings && doc.signatureSettings.type !== 'none') {
      addSignatureToPDF(pdf, doc.signatureSettings, pageWidth, pageHeight - 50);
    }

    // Footer - simple line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    pdf.save(`${documentNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateMinimalTemplate:', error);
    throw error;
  }
};

/**
 * Professional Template - Formal Design with Blue Accents
 */
const generateProfessionalTemplate = (doc, config) => {
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const fontSize = getFontSizes(doc.fontSize);

    const documentNumber = String(doc.invoiceNumber || doc.quotationNumber || 'DOC-001');
    const companyName = String(doc.companyName || 'Company Name');
    const clientName = String(doc.clientName || 'Client Name');
    const status = String(doc.status || 'pending');

    // Double border frame
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(2);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);

    let yPos = 25;

    // Header with company logo
    if (doc.companyLogo) {
      pdf.setFillColor(37, 99, 235);
      pdf.roundedRect(17, yPos - 3, 32, 32, 2, 2, 'F');
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(19, yPos - 1, 28, 28, 2, 2, 'F');
      addImageToPDF(pdf, doc.companyLogo, 21, yPos + 1, 24, 24);

      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text(companyName, 55, yPos + 8);

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(75, 85, 99);
      if (doc.companyAddress) pdf.text(doc.companyAddress.split('\n')[0], 55, yPos + 14);
      if (doc.companyPhone) pdf.text(`Phone: ${doc.companyPhone}`, 55, yPos + 19);
      if (doc.companyEmail) pdf.text(`Email: ${doc.companyEmail}`, 55, yPos + 24);
    } else {
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text(companyName, 20, yPos + 10);
    }

    // Document Title Box
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(pageWidth - 75, yPos - 3, 58, 18, 2, 2, 'F');

    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(config.title, pageWidth - 46, yPos + 9, { align: 'center' });

    // Document details in structured box
    yPos += 25;

    pdf.setFillColor(243, 244, 246);
    pdf.roundedRect(pageWidth - 75, yPos, 58, 28, 2, 2, 'F');
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(pageWidth - 75, yPos, 58, 28, 2, 2);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(75, 85, 99);
    pdf.text(`${config.numberLabel}:`, pageWidth - 72, yPos + 6);
    pdf.setFont(undefined, 'normal');
    pdf.text(documentNumber, pageWidth - 72, yPos + 11);

    pdf.setFont(undefined, 'bold');
    pdf.text('Date:', pageWidth - 72, yPos + 18);
    pdf.setFont(undefined, 'normal');
    pdf.text(doc.date ? formatDate(doc.date) : 'N/A', pageWidth - 72, yPos + 23);

    // Status Badge
    yPos += 35;
    let statusColor;
    if (status === 'paid' || status === 'accepted') {
      statusColor = COLORS.green;
    } else if (status === 'cancelled' || status === 'rejected') {
      statusColor = COLORS.red;
    } else {
      statusColor = COLORS.yellow;
    }

    pdf.setFillColor(...statusColor);
    pdf.roundedRect(20, yPos, 32, 9, 2, 2, 'F');
    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255, status === 'pending' || status === 'draft' ? 0 : 255);
    pdf.text(status.toUpperCase(), 36, yPos + 6, { align: 'center' });
    pdf.setTextColor(0, 0, 0);

    yPos += 15;

    // Bill To Section (Professional Card)
    pdf.setFillColor(247, 250, 252);
    pdf.roundedRect(20, yPos, 85, 36, 2, 2, 'F');
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(20, yPos, 85, 36, 2, 2);

    // Title bar
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(20, yPos, 85, 7, 2, 2, 'F');

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('BILL TO', 23, yPos + 4.5);

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text(clientName, 23, yPos + 13);

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(75, 85, 99);
    if (doc.clientAddress) pdf.text(doc.clientAddress.split('\n')[0].substring(0, 32), 23, yPos + 19);
    if (doc.clientPhone) pdf.text(`Phone: ${doc.clientPhone}`, 23, yPos + 25);
    if (doc.clientEmail) pdf.text(`Email: ${doc.clientEmail}`, 23, yPos + 31);

    // Payment Details (Right) - only for invoices
    if (config.showPaymentMethod) {
      pdf.setFillColor(247, 250, 252);
      pdf.roundedRect(110, yPos, pageWidth - 127, 36, 2, 2, 'F');
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(110, yPos, pageWidth - 127, 36, 2, 2);

      pdf.setFillColor(37, 99, 235);
      pdf.roundedRect(110, yPos, pageWidth - 127, 7, 2, 2, 'F');

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('PAYMENT DETAILS', 113, yPos + 4.5);

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text('Method:', 113, yPos + 13);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(doc.paymentMethod || 'Cash', 113, yPos + 18);

      if (config.showDueDate && doc.dueDate) {
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(37, 99, 235);
        pdf.text('Due Date:', 113, yPos + 25);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(220, 38, 38);
        pdf.text(formatDate(doc.dueDate), 113, yPos + 30);
      }
    }

    yPos += 45;

    // Items Table
    const hasMeasurement = doc.items.some(item => item.measurementValue > 0);
    const showGSTColumn = doc.itemGstEnabled || false;

    const columns = ['Description'];
    if (hasMeasurement) {
      columns.push('Area', 'Unit');
    }
    columns.push('Qty', 'Rate (Rs)', 'GST');
    if (!showGSTColumn) {
      columns.pop(); // Remove GST column if not enabled
    }
    if (showGSTColumn) columns.push('GST');
    columns.push('Amount (Rs)');

    const rows = doc.items.map((item) => {
      const row = [item.description || '-'];
      if (hasMeasurement) {
        row.push(item.measurementValue ? item.measurementValue.toString() : '-');
        row.push(item.unit || '-');
      }
      row.push(
        (parseFloat(item.quantity) || 0).toString(),
        (parseFloat(item.rate) || 0).toFixed(2)
      );
      if (showGSTColumn) {
        row.push(`${Math.round(parseFloat(item.gstRate) || 0)}%\nRs ${(parseFloat(item.gstValue) || 0).toFixed(2)}`);
      }
      row.push((parseFloat(item.amount) || 0).toFixed(2));
      return row;
    });

    autoTable(pdf, {
      startY: yPos,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: fontSize.header,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: fontSize.body,
        minCellHeight: fontSize.rowHeight
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: hasMeasurement ? 45 : 70 },
        [columns.length - 1]: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 }
    });

    // Totals Section
    let totalsY = pdf.lastAutoTable.finalY + 10;
    totalsY = checkPageOverflow(pdf, totalsY, 60);

    const totalsX = pageWidth - 80;
    const totalsW = 60;

    const subtotal = parseFloat(doc.subtotal) || 0;
    const gstAmount = parseFloat(doc.gstAmount) || 0;
    const discount = parseFloat(doc.discount) || 0;
    const discountAmount = parseFloat(doc.discountAmount) || 0;
    const grandTotal = parseFloat(doc.grandTotal) || 0;
    const itemGstTotal = doc.items.reduce((sum, item) => sum + (parseFloat(item.gstValue) || 0), 0);

    pdf.setFillColor(247, 250, 252);
    pdf.roundedRect(totalsX - 5, totalsY - 5, totalsW + 10, 50, 2, 2, 'F');
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(totalsX - 5, totalsY - 5, totalsW + 10, 50, 2, 2);

    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text('Subtotal:', totalsX, totalsY);
    pdf.setFont(undefined, 'bold');
    pdf.text(`Rs ${subtotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
    totalsY += 6;

    if (showGSTColumn && itemGstTotal > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text('Item GST:', totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${itemGstTotal.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    if (doc.gstEnabled && gstAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Tax (${doc.gstPercentage || 0}%):`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Rs ${gstAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    if (discount > 0 && discountAmount > 0) {
      pdf.setFont(undefined, 'normal');
      pdf.text(`Discount ${doc.discountType === 'percentage' ? `(${discount}%)` : ''}:`, totalsX, totalsY);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`- Rs ${discountAmount.toFixed(2)}`, totalsX + totalsW, totalsY, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      totalsY += 6;
    }

    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(1);
    pdf.line(totalsX, totalsY, totalsX + totalsW, totalsY);
    totalsY += 5;

    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(totalsX - 3, totalsY - 2, totalsW + 6, 13, 2, 2, 'F');

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('GRAND TOTAL:', totalsX + 2, totalsY + 7);
    pdf.setFontSize(13);
    pdf.text(`Rs ${grandTotal.toFixed(2)}`, totalsX + totalsW - 2, totalsY + 7, { align: 'right' });

    // Notes and Terms
    let bottomY = totalsY + 18;

    if (doc.notes || doc.customMessage) {
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(37, 99, 235);
      pdf.text('NOTES:', 20, bottomY);

      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(0, 0, 0);
      const notesLines = pdf.splitTextToSize(doc.notes || doc.customMessage, 85);
      pdf.text(notesLines.slice(0, 3), 20, bottomY + 5);
      bottomY += 20;
    }

    if (doc.termsAndConditions) {
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Terms & Conditions:', 20, bottomY);

      pdf.setFont(undefined, 'normal');
      const termsLines = pdf.splitTextToSize(doc.termsAndConditions, pageWidth - 40);
      pdf.text(termsLines.slice(0, 2), 20, bottomY + 5);
    }

    // Signature
    if (doc.signatureSettings && doc.signatureSettings.type !== 'none') {
      addSignatureToPDF(pdf, doc.signatureSettings, pageWidth, pageHeight - 40);
    }

    // Professional Footer
    pdf.setFillColor(37, 99, 235);
    pdf.rect(10, pageHeight - 20, pageWidth - 20, 10, 'F');

    pdf.setFontSize(8);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Thank you for your business!', pageWidth / 2, pageHeight - 14, { align: 'center' });

    pdf.save(`${documentNumber}.pdf`);
  } catch (error) {
    console.error('Error in generateProfessionalTemplate:', error);
    throw error;
  }
};
