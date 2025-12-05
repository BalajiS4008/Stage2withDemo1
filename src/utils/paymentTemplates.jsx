import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './dataManager.jsx';
import { addImageToPDF, addSignatureToPDF } from './pdfHelpers';

/**
 * Generate Payment Receipt PDF
 * @param {Object} paymentData - Payment data object
 * @param {Object} projectData - Project data object
 * @param {Object} settingsData - Company settings data
 * @returns {jsPDF} PDF document
 */
export const generatePaymentReceiptPDF = (paymentData, projectData, settingsData = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Add company logo if available
  if (settingsData.companyLogo) {
    addImageToPDF(doc, settingsData.companyLogo, 15, 15, 30, 30);
  }

  // Company details
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(settingsData.companyName || 'Company Name', 50, 25);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (settingsData.companyAddress) {
    const addressLines = settingsData.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 50, 32 + (index * 5));
    });
  }
  const addressHeight = settingsData.companyAddress ? settingsData.companyAddress.split('\n').length * 5 : 0;
  if (settingsData.companyPhone) doc.text(`Phone: ${settingsData.companyPhone}`, 50, 37 + addressHeight);
  if (settingsData.companyEmail) doc.text(`Email: ${settingsData.companyEmail}`, 50, 42 + addressHeight);
  if (settingsData.companyGST) doc.text(`GST: ${settingsData.companyGST}`, 50, 47 + addressHeight);

  // Receipt title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(16, 185, 129); // Success green
  doc.text('PAYMENT RECEIPT', pageWidth - 15, 25, { align: 'right' });
  
  // Receipt details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Receipt No: ${paymentData.id || 'N/A'}`, pageWidth - 15, 32, { align: 'right' });
  doc.text(`Date: ${formatDate(paymentData.date)}`, pageWidth - 15, 37, { align: 'right' });
  doc.text(`Payment Type: ${paymentData.type === 'advance' ? 'Advance' : 'Installment'}`, pageWidth - 15, 42, { align: 'right' });

  // Client/Project details
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('RECEIVED FROM:', 15, 70);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(paymentData.clientName || projectData?.name || 'N/A', 15, 77);
  if (projectData) {
    doc.text(`Project: ${projectData.name}`, 15, 82);
    if (projectData.location) {
      doc.text(`Location: ${projectData.location}`, 15, 87);
    }
  }

  // Payment details box
  const boxY = 100;
  doc.setFillColor(240, 253, 244); // Light green background
  doc.rect(15, boxY, pageWidth - 30, 50, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.rect(15, boxY, pageWidth - 30, 50);

  // Amount
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Amount Received:', 20, boxY + 15);
  doc.setFontSize(24);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(paymentData.amount), pageWidth - 20, boxY + 15, { align: 'right' });

  // Payment details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  
  if (paymentData.milestoneId && projectData?.milestones) {
    const milestone = projectData.milestones.find(m => m.id === paymentData.milestoneId);
    if (milestone) {
      doc.text(`Milestone: ${milestone.name}`, 20, boxY + 28);
      doc.text(`Stage: ${milestone.stage || 'N/A'}`, 20, boxY + 35);
    }
  }

  if (paymentData.description) {
    doc.text(`Description: ${paymentData.description}`, 20, boxY + 42);
  }

  // Payment summary table
  const tableData = [
    ['Payment Type', paymentData.type === 'advance' ? 'Advance Payment' : 'Installment Payment'],
    ['Payment Date', formatDate(paymentData.date)],
    ['Amount', formatCurrency(paymentData.amount)],
    ['Payment Method', 'CASH'],
  ];

  if (paymentData.milestoneId && projectData?.milestones) {
    const milestone = projectData.milestones.find(m => m.id === paymentData.milestoneId);
    if (milestone) {
      tableData.push(['Milestone', milestone.name]);
    }
  }

  autoTable(doc, {
    startY: boxY + 60,
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 120 }
    }
  });

  // Notes section
  let finalY = doc.lastAutoTable.finalY + 15;
  
  if (paymentData.description || paymentData.notes) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 15, finalY);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const notes = paymentData.description || paymentData.notes || '';
    const splitNotes = doc.splitTextToSize(notes, pageWidth - 30);
    doc.text(splitNotes, 15, finalY + 7);
    finalY += 7 + (splitNotes.length * 5);
  }

  // Signature section
  finalY = Math.max(finalY + 20, pageHeight - 60);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Received By:', 15, finalY);
  doc.line(15, finalY + 15, 80, finalY + 15);
  doc.text('Signature', 15, finalY + 20);

  // Add signature if available
  if (settingsData.signature) {
    addSignatureToPDF(doc, settingsData.signature, 15, finalY - 10, 50, 20);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your payment!', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  doc.save(`Payment_Receipt_${paymentData.id || 'N/A'}_${formatDate(paymentData.date)}.pdf`);

  return doc;
};

/**
 * Preview Payment Receipt PDF (returns blob for preview)
 * @param {Object} paymentData - Payment data object
 * @param {Object} projectData - Project data object
 * @param {Object} settingsData - Company settings data
 * @returns {Blob} PDF blob for preview
 */
export const previewPaymentReceiptPDF = (paymentData, projectData, settingsData = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Add company logo if available
  if (settingsData.companyLogo) {
    addImageToPDF(doc, settingsData.companyLogo, 15, 15, 30, 30);
  }

  // Company details
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text(settingsData.companyName || 'Company Name', 50, 25);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  if (settingsData.companyAddress) {
    const addressLines = settingsData.companyAddress.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 50, 32 + (index * 5));
    });
  }
  const addressHeight = settingsData.companyAddress ? settingsData.companyAddress.split('\n').length * 5 : 0;
  if (settingsData.companyPhone) doc.text(`Phone: ${settingsData.companyPhone}`, 50, 37 + addressHeight);
  if (settingsData.companyEmail) doc.text(`Email: ${settingsData.companyEmail}`, 50, 42 + addressHeight);
  if (settingsData.companyGST) doc.text(`GST: ${settingsData.companyGST}`, 50, 47 + addressHeight);

  // Receipt title
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(16, 185, 129); // Success green
  doc.text('PAYMENT RECEIPT', pageWidth - 15, 25, { align: 'right' });

  // Receipt details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Receipt No: ${paymentData.id || 'N/A'}`, pageWidth - 15, 32, { align: 'right' });
  doc.text(`Date: ${formatDate(paymentData.date)}`, pageWidth - 15, 37, { align: 'right' });
  doc.text(`Payment Type: ${paymentData.type === 'advance' ? 'Advance' : 'Installment'}`, pageWidth - 15, 42, { align: 'right' });

  // Client/Project details
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('RECEIVED FROM:', 15, 70);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(paymentData.clientName || projectData?.name || 'N/A', 15, 77);
  if (projectData) {
    doc.text(`Project: ${projectData.name}`, 15, 82);
    if (projectData.location) {
      doc.text(`Location: ${projectData.location}`, 15, 87);
    }
  }

  // Payment details box
  const boxY = 100;
  doc.setFillColor(240, 253, 244); // Light green background
  doc.rect(15, boxY, pageWidth - 30, 50, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.rect(15, boxY, pageWidth - 30, 50);

  // Amount
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Amount Received:', 20, boxY + 15);
  doc.setFontSize(24);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(paymentData.amount), pageWidth - 20, boxY + 15, { align: 'right' });

  // Payment details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);

  if (paymentData.milestoneId && projectData?.milestones) {
    const milestone = projectData.milestones.find(m => m.id === paymentData.milestoneId);
    if (milestone) {
      doc.text(`Milestone: ${milestone.name}`, 20, boxY + 28);
      doc.text(`Stage: ${milestone.stage || 'N/A'}`, 20, boxY + 35);
    }
  }

  if (paymentData.description) {
    doc.text(`Description: ${paymentData.description}`, 20, boxY + 42);
  }

  // Payment summary table
  const tableData = [
    ['Payment Type', paymentData.type === 'advance' ? 'Advance Payment' : 'Installment Payment'],
    ['Payment Date', formatDate(paymentData.date)],
    ['Amount', formatCurrency(paymentData.amount)],
    ['Payment Method', 'CASH'],
  ];

  if (paymentData.milestoneId && projectData?.milestones) {
    const milestone = projectData.milestones.find(m => m.id === paymentData.milestoneId);
    if (milestone) {
      tableData.push(['Milestone', milestone.name]);
    }
  }

  autoTable(doc, {
    startY: boxY + 60,
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 120 }
    }
  });

  // Notes section
  let finalY = doc.lastAutoTable.finalY + 15;

  if (paymentData.description || paymentData.notes) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 15, finalY);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const notes = paymentData.description || paymentData.notes || '';
    const splitNotes = doc.splitTextToSize(notes, pageWidth - 30);
    doc.text(splitNotes, 15, finalY + 7);
    finalY += 7 + (splitNotes.length * 5);
  }

  // Signature section
  finalY = Math.max(finalY + 20, pageHeight - 60);

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Received By:', 15, finalY);
  doc.line(15, finalY + 15, 80, finalY + 15);
  doc.text('Signature', 15, finalY + 20);

  // Add signature if available
  if (settingsData.signature) {
    addSignatureToPDF(doc, settingsData.signature, 15, finalY - 10, 50, 20);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your payment!', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Generated on ${formatDate(new Date())}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Return blob for preview
  return doc.output('blob');
};

export default { generatePaymentReceiptPDF, previewPaymentReceiptPDF };

