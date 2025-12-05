import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './dataManager.jsx';
import { addImageToPDF, addSignatureToPDF } from './pdfHelpers';
import { generateDocumentPDF } from './documentTemplates';

/**
 * Generate Quotation PDF
 * Now uses the shared document template system for automatic sync with Invoice
 * Any template updates in documentTemplates.jsx will reflect in both Invoice and Quotation
 * This includes the new Liceria template and all improvements
 */
export const generateQuotationPDF = (quotation) => {
  try {
    // Use shared document template generator
    return generateDocumentPDF(quotation, 'quotation');
  } catch (error) {
    console.error('Error generating quotation PDF:', error);
    alert('Failed to generate quotation PDF. Please try again.');
  }
};

// ===== CLASSIC TEMPLATE =====
const generateClassicQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add company logo if available
  addImageToPDF(doc, quotation.companyLogo, 15, 15, 30, 30);

  // Company details
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(quotation.companyName || 'Company Name', 50, 25);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (quotation.companyAddress) {
    const addressLines = quotation.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 50, 32 + (index * 5));
    });
  }
  const addressHeight = quotation.companyAddress ? quotation.companyAddress.split('\n').length * 5 : 0;
  if (quotation.companyPhone) doc.text(`Phone: ${quotation.companyPhone}`, 50, 37 + addressHeight);
  if (quotation.companyEmail) doc.text(`Email: ${quotation.companyEmail}`, 50, 42 + addressHeight);
  if (quotation.companyGST) doc.text(`GST: ${quotation.companyGST}`, 50, 47 + addressHeight);

  // Quotation title and details
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(37, 99, 235); // Blue color
  doc.text('QUOTATION', pageWidth - 15, 25, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Quotation No: ${quotation.quotationNumber}`, pageWidth - 15, 32, { align: 'right' });
  doc.text(`Date: ${formatDate(quotation.date)}`, pageWidth - 15, 37, { align: 'right' });
  doc.text(`Valid Until: ${formatDate(quotation.expiryDate)}`, pageWidth - 15, 42, { align: 'right' });
  doc.text(`Status: ${quotation.status?.toUpperCase()}`, pageWidth - 15, 47, { align: 'right' });

  // Client details
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTATION FOR:', 15, 70);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(quotation.clientName, 15, 77);
  if (quotation.clientAddress) {
    const clientAddressLines = quotation.clientAddress.split('\n');
    clientAddressLines.forEach((line, index) => {
      doc.text(line, 15, 82 + (index * 5));
    });
  }
  const clientAddressHeight = quotation.clientAddress ? quotation.clientAddress.split('\n').length * 5 : 0;
  if (quotation.clientPhone) doc.text(`Phone: ${quotation.clientPhone}`, 15, 87 + clientAddressHeight);
  if (quotation.clientEmail) doc.text(`Email: ${quotation.clientEmail}`, 15, 92 + clientAddressHeight);

  // Line items table
  const tableData = quotation.items.map(item => [
    item.description,
    item.measurement || '-',
    item.quantity,
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Description', 'Measurement', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontSize: 10 }, // Blue color
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { halign: 'right', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 }
    }
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  
  doc.text('Subtotal:', pageWidth - 70, finalY);
  doc.text(formatCurrency(quotation.subtotal), pageWidth - 15, finalY, { align: 'right' });
  
  if (quotation.gstEnabled) {
    doc.text(`GST (${quotation.gstPercentage}%):`, pageWidth - 70, finalY + 6);
    doc.text(formatCurrency(quotation.gstAmount), pageWidth - 15, finalY + 6, { align: 'right' });
  }
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Grand Total:', pageWidth - 70, finalY + 14);
  doc.text(formatCurrency(quotation.grandTotal), pageWidth - 15, finalY + 14, { align: 'right' });

  // Payment method
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Method: ${quotation.paymentMethod}`, 15, finalY + 14);

  // Notes
  if (quotation.notes) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions:', 15, finalY + 28);
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 30);
    doc.text(notesLines, 15, finalY + 33);
  }

  // Signature
  addSignature(doc, quotation, finalY + (quotation.notes ? 50 : 30));

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Thank you for your business!', pageWidth / 2, 275, { align: 'center' });
  doc.text(`This quotation is valid until ${formatDate(quotation.expiryDate)}`, pageWidth / 2, 280, { align: 'center' });

  // Save PDF
  doc.save(`${quotation.quotationNumber}.pdf`);
};

// Helper function to add signature to PDF
const addSignature = (doc, quotation, yPosition) => {
  const signatureSettings = quotation.signatureSettings;
  if (!signatureSettings || signatureSettings.type === 'none') return;

  const pageWidth = doc.internal.pageSize.width;

  // Add signature label
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text('Authorized Signature:', pageWidth - 70, yPosition);

  if (signatureSettings.type === 'image' && signatureSettings.image) {
    try {
      // Add signature image
      doc.addImage(signatureSettings.image, 'PNG', pageWidth - 70, yPosition + 3, 50, 20);
    } catch (e) {
      console.log('Could not add signature image');
    }
  } else if (signatureSettings.type === 'text' && signatureSettings.text) {
    // Add text signature
    doc.setTextColor(0);
    const fontMap = {
      cursive: 'times',
      handwritten: 'times',
      formal: 'times',
      modern: 'helvetica'
    };
    doc.setFont(fontMap[signatureSettings.font] || 'times', 'italic');
    doc.setFontSize(16);
    doc.text(signatureSettings.text, pageWidth - 70, yPosition + 15);
  }

  // Add line under signature
  doc.setLineWidth(0.5);
  doc.setDrawColor(150);
  doc.line(pageWidth - 70, yPosition + 25, pageWidth - 20, yPosition + 25);
};

// ===== MODERN TEMPLATE =====
const generateModernQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Purple gradient header (simulated with purple background)
  doc.setFillColor(128, 90, 213); // Purple
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Add company logo if available
  if (quotation.companyLogo) {
    addImageToPDF(doc, quotation.companyLogo, 15, 10, 30, 30);
  }

  // Company details in white on purple background
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(quotation.companyName || 'Company Name', 50, 20);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  let yPos = 27;
  if (quotation.companyAddress) {
    const addressLines = quotation.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 50, yPos + (index * 4));
    });
    yPos += addressLines.length * 4;
  }
  if (quotation.companyPhone) doc.text(`Phone: ${quotation.companyPhone}`, 50, yPos);
  if (quotation.companyEmail) doc.text(`Email: ${quotation.companyEmail}`, 50, yPos + 4);

  // Quotation title and details (right side, white on purple)
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTATION', pageWidth - 15, 20, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`No: ${quotation.quotationNumber}`, pageWidth - 15, 28, { align: 'right' });
  doc.text(`Date: ${formatDate(quotation.date)}`, pageWidth - 15, 33, { align: 'right' });
  doc.text(`Valid Until: ${formatDate(quotation.expiryDate)}`, pageWidth - 15, 38, { align: 'right' });
  doc.text(`Status: ${quotation.status?.toUpperCase()}`, pageWidth - 15, 43, { align: 'right' });

  // Reset text color to black
  doc.setTextColor(0, 0, 0);

  // Client details
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(128, 90, 213); // Purple
  doc.text('QUOTATION FOR:', 15, 65);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(quotation.clientName, 15, 72);
  let clientY = 77;
  if (quotation.clientAddress) {
    const clientAddressLines = quotation.clientAddress.split('\n');
    clientAddressLines.forEach((line, index) => {
      doc.text(line, 15, clientY + (index * 5));
    });
    clientY += clientAddressLines.length * 5;
  }
  if (quotation.clientPhone) doc.text(`Phone: ${quotation.clientPhone}`, 15, clientY);
  if (quotation.clientEmail) doc.text(`Email: ${quotation.clientEmail}`, 15, clientY + 5);

  // Line items table
  const tableData = quotation.items.map(item => [
    item.description,
    item.measurement || '-',
    item.quantity,
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]);

  autoTable(doc, {
    startY: 105,
    head: [['Description', 'Measurement', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [128, 90, 213], fontSize: 10 }, // Purple
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { halign: 'right', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 }
    }
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);

  doc.text('Subtotal:', pageWidth - 70, finalY);
  doc.text(formatCurrency(quotation.subtotal), pageWidth - 15, finalY, { align: 'right' });

  if (quotation.gstEnabled) {
    doc.text(`GST (${quotation.gstPercentage}%):`, pageWidth - 70, finalY + 6);
    doc.text(formatCurrency(quotation.gstAmount), pageWidth - 15, finalY + 6, { align: 'right' });
  }

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(128, 90, 213); // Purple
  doc.text('Grand Total:', pageWidth - 70, finalY + 14);
  doc.text(formatCurrency(quotation.grandTotal), pageWidth - 15, finalY + 14, { align: 'right' });

  // Reset color
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Method: ${quotation.paymentMethod}`, 15, finalY + 14);

  // Notes
  if (quotation.notes) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions:', 15, finalY + 28);
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 30);
    doc.text(notesLines, 15, finalY + 33);
  }

  // Signature
  addSignature(doc, quotation, finalY + (quotation.notes ? 50 : 30));

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Thank you for your business!', pageWidth / 2, 275, { align: 'center' });
  doc.text(`This quotation is valid until ${formatDate(quotation.expiryDate)}`, pageWidth / 2, 280, { align: 'center' });

  // Save PDF
  doc.save(`${quotation.quotationNumber}.pdf`);
};

// ===== MINIMAL TEMPLATE =====
const generateMinimalQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add company logo if available
  if (quotation.companyLogo) {
    addImageToPDF(doc, quotation.companyLogo, 15, 15, 25, 25);
  }

  // Company details - minimal style
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(quotation.companyName || 'Company Name', 45, 22);

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  let yPos = 28;
  if (quotation.companyAddress) {
    const addressLines = quotation.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 45, yPos + (index * 4));
    });
    yPos += addressLines.length * 4;
  }
  if (quotation.companyPhone) doc.text(`T: ${quotation.companyPhone}`, 45, yPos);
  if (quotation.companyEmail) doc.text(`E: ${quotation.companyEmail}`, 45, yPos + 4);

  // Quotation title and details (right side)
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTATION', pageWidth - 15, 22, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.text(quotation.quotationNumber, pageWidth - 15, 30, { align: 'right' });
  doc.text(formatDate(quotation.date), pageWidth - 15, 35, { align: 'right' });
  doc.text(`Valid: ${formatDate(quotation.expiryDate)}`, pageWidth - 15, 40, { align: 'right' });

  // Horizontal line
  doc.setLineWidth(1);
  doc.line(15, 50, pageWidth - 15, 50);

  // Client details
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('TO:', 15, 60);

  doc.setFont(undefined, 'normal');
  doc.text(quotation.clientName, 15, 66);
  let clientY = 71;
  if (quotation.clientAddress) {
    const clientAddressLines = quotation.clientAddress.split('\n');
    clientAddressLines.forEach((line, index) => {
      doc.text(line, 15, clientY + (index * 4));
    });
    clientY += clientAddressLines.length * 4;
  }
  if (quotation.clientPhone) doc.text(`T: ${quotation.clientPhone}`, 15, clientY);
  if (quotation.clientEmail) doc.text(`E: ${quotation.clientEmail}`, 15, clientY + 4);

  // Line items table - minimal style
  const tableData = quotation.items.map(item => [
    item.description,
    item.measurement || '-',
    item.quantity,
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Measurement', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { halign: 'right', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 }
    }
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);

  doc.text('Subtotal:', pageWidth - 70, finalY);
  doc.text(formatCurrency(quotation.subtotal), pageWidth - 15, finalY, { align: 'right' });

  if (quotation.gstEnabled) {
    doc.text(`GST (${quotation.gstPercentage}%):`, pageWidth - 70, finalY + 6);
    doc.text(formatCurrency(quotation.gstAmount), pageWidth - 15, finalY + 6, { align: 'right' });
  }

  // Line above total
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 70, finalY + 10, pageWidth - 15, finalY + 10);

  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', pageWidth - 70, finalY + 16);
  doc.text(formatCurrency(quotation.grandTotal), pageWidth - 15, finalY + 16, { align: 'right' });

  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text(`Payment: ${quotation.paymentMethod}`, 15, finalY + 16);

  // Notes
  if (quotation.notes) {
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Terms:', 15, finalY + 28);
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 30);
    doc.text(notesLines, 15, finalY + 33);
  }

  // Signature
  addSignature(doc, quotation, finalY + (quotation.notes ? 50 : 30));

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('Thank you', pageWidth / 2, 275, { align: 'center' });
  doc.text(`Valid until ${formatDate(quotation.expiryDate)}`, pageWidth / 2, 280, { align: 'center' });

  // Save PDF
  doc.save(`${quotation.quotationNumber}.pdf`);
};

// ===== PROFESSIONAL TEMPLATE =====
const generateProfessionalQuotationPDF = (quotation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Dark gray header
  doc.setFillColor(50, 50, 50); // Dark gray
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Add company logo if available
  if (quotation.companyLogo) {
    addImageToPDF(doc, quotation.companyLogo, 15, 12, 30, 30);
  }

  // Company details in white on dark background
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(quotation.companyName || 'Company Name', 50, 22);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  let yPos = 29;
  if (quotation.companyAddress) {
    const addressLines = quotation.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 50, yPos + (index * 4));
    });
    yPos += addressLines.length * 4;
  }
  if (quotation.companyPhone) doc.text(`Phone: ${quotation.companyPhone}`, 50, yPos);
  if (quotation.companyEmail) doc.text(`Email: ${quotation.companyEmail}`, 50, yPos + 4);
  if (quotation.companyGST) doc.text(`GST: ${quotation.companyGST}`, 50, yPos + 8);

  // Quotation title and details (right side, white on dark)
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.text('QUOTATION', pageWidth - 15, 22, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`No: ${quotation.quotationNumber}`, pageWidth - 15, 30, { align: 'right' });
  doc.text(`Date: ${formatDate(quotation.date)}`, pageWidth - 15, 35, { align: 'right' });
  doc.text(`Valid Until: ${formatDate(quotation.expiryDate)}`, pageWidth - 15, 40, { align: 'right' });
  doc.text(`Status: ${quotation.status?.toUpperCase()}`, pageWidth - 15, 45, { align: 'right' });

  // Reset text color to black
  doc.setTextColor(0, 0, 0);

  // Client details box
  doc.setFillColor(245, 245, 245); // Light gray
  doc.rect(15, 65, pageWidth - 30, 35, 'F');

  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text('QUOTATION FOR:', 20, 73);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(quotation.clientName, 20, 80);
  let clientY = 85;
  if (quotation.clientAddress) {
    const clientAddressLines = quotation.clientAddress.split('\n');
    clientAddressLines.forEach((line, index) => {
      doc.text(line, 20, clientY + (index * 4));
    });
    clientY += clientAddressLines.length * 4;
  }
  if (quotation.clientPhone) doc.text(`Phone: ${quotation.clientPhone}`, 20, clientY);
  if (quotation.clientEmail) doc.text(`Email: ${quotation.clientEmail}`, 20, clientY + 4);

  // Line items table
  const tableData = quotation.items.map(item => [
    item.description,
    item.measurement || '-',
    item.quantity,
    formatCurrency(item.rate),
    formatCurrency(item.amount)
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Description', 'Measurement', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 30 },
      2: { halign: 'right', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 35 }
    }
  });

  // Totals box
  const finalY = doc.lastAutoTable.finalY + 10;

  // Totals background
  doc.setFillColor(245, 245, 245);
  doc.rect(pageWidth - 75, finalY - 5, 60, 25, 'F');

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.text('Subtotal:', pageWidth - 70, finalY);
  doc.text(formatCurrency(quotation.subtotal), pageWidth - 20, finalY, { align: 'right' });

  if (quotation.gstEnabled) {
    doc.text(`GST (${quotation.gstPercentage}%):`, pageWidth - 70, finalY + 6);
    doc.text(formatCurrency(quotation.gstAmount), pageWidth - 20, finalY + 6, { align: 'right' });
  }

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text('Grand Total:', pageWidth - 70, finalY + 14);
  doc.text(formatCurrency(quotation.grandTotal), pageWidth - 20, finalY + 14, { align: 'right' });

  // Reset color
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Method: ${quotation.paymentMethod}`, 15, finalY + 14);

  // Notes
  if (quotation.notes) {
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Terms & Conditions:', 15, finalY + 30);
    doc.setFont(undefined, 'normal');
    const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 30);
    doc.text(notesLines, 15, finalY + 35);
  }

  // Signature
  addSignature(doc, quotation, finalY + (quotation.notes ? 52 : 32));

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('Thank you for your business!', pageWidth / 2, 275, { align: 'center' });
  doc.text(`This quotation is valid until ${formatDate(quotation.expiryDate)}`, pageWidth / 2, 280, { align: 'center' });

  // Save PDF
  doc.save(`${quotation.quotationNumber}.pdf`);
};

