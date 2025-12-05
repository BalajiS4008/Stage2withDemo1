import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, calculateTotalPaymentsIn, calculateTotalPaymentsOut } from './dataManager.jsx';
import { downloadBlob } from './downloadHelper';

/**
 * Export data to Excel file with professional formatting
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 * @param {String} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  try {
    console.log('📊 Starting Excel export...', { filename, rowCount: data.length });

    if (!data || data.length === 0) {
      console.warn('⚠️ No data to export');
      return false;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Format data - identify numeric columns and format them appropriately
    const formattedData = data.map(row => {
      const formattedRow = {};
      Object.keys(row).forEach(header => {
        const value = row[header];

        // Check if column header indicates currency (contains "Rs" or "₹")
        const isCurrencyHeader = header.includes('(Rs)') || header.includes('(₹)') ||
                                 header.includes('Amount') || header.includes('Balance');

        // If value is already a number and header indicates currency, keep it as number
        if (isCurrencyHeader && typeof value === 'number') {
          formattedRow[header] = value;
        }
        // Check if column contains currency values (Subtotal, Tax, Discount, Grand Total, etc.)
        else if (['Subtotal', 'Tax', 'Discount', 'Grand Total', 'Budget', 'Revenue', 'Expenses', 'Profit/Loss'].includes(header)) {
          formattedRow[header] = value ? parseFloat(value) : 0;
        }
        // Check if column contains percentage values
        else if (header.includes('%') || header.includes('Margin') || header.includes('Rate')) {
          formattedRow[header] = value ? `${value}%` : '0%';
        }
        // Status columns - capitalize first letter
        else if (header === 'Status') {
          formattedRow[header] = value ? value.charAt(0).toUpperCase() + value.slice(1) : '-';
        }
        // Default - keep as is
        else {
          formattedRow[header] = value !== undefined && value !== null ? value : '-';
        }
      });
      return formattedRow;
    });

    // Create simple worksheet with data
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    // Get headers for formatting and sizing
    const headers = Object.keys(formattedData[0] || {});
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    // Apply number formatting and alignment to all columns
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = headers[C];

      // Determine column type
      const isDateColumn = header && header.toLowerCase().includes('date');
      const isCurrencyHeader = header && (header.includes('(Rs)') ||
                                          header.includes('(₹)') ||
                                          header.includes('Amount') ||
                                          header.includes('Balance'));

      // Apply formatting to all cells in column
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

        if (!worksheet[cellAddress]) continue;

        // Currency columns
        if (isCurrencyHeader && typeof worksheet[cellAddress].v === 'number') {
          worksheet[cellAddress].z = '#,##0.00';
          worksheet[cellAddress].t = 'n';
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          worksheet[cellAddress].s.alignment = { horizontal: 'right', vertical: 'center' };
        }
        // Date columns
        else if (isDateColumn) {
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          worksheet[cellAddress].s.alignment = { horizontal: 'right', vertical: 'center' };
        }
        // String columns (default)
        else {
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          worksheet[cellAddress].s.alignment = { horizontal: 'left', vertical: 'center' };
        }
      }
    }

    // Auto-size columns based on content
    const columnWidths = headers.map((header) => {
      const headerLength = header.length;

      // Check if this is a currency column
      const isCurrencyHeader = header.includes('(Rs)') || header.includes('(₹)') ||
                               header.includes('Amount') || header.includes('Balance');

      const dataLengths = formattedData.map(row => {
        const value = row[header];
        if (!value && value !== 0) return 0;

        // For numeric currency values, calculate the formatted display length
        if (isCurrencyHeader && typeof value === 'number') {
          // Format as it will appear in Excel (with thousand separators)
          const formatted = value.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          return formatted.length;
        }

        return String(value).length;
      });

      const maxLength = Math.max(headerLength, ...dataLengths, 15);
      return { wch: Math.min(maxLength + 2, 60) };
    });
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    console.log('✅ Excel file generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error exporting to Excel:', error);
    return false;
  }
};

/**
 * Export data to CSV file with professional formatting
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToCSV = (data, filename = 'export') => {
  try {
    console.log('📄 Starting CSV export...', { filename, rowCount: data.length });

    if (!data || data.length === 0) {
      console.warn('⚠️ No data to export');
      return false;
    }

    // Format data - identify numeric columns and format them appropriately
    const formattedData = data.map(row => {
      const formattedRow = {};
      Object.keys(row).forEach(header => {
        const value = row[header];

        // Check if column header indicates currency (contains "Rs" or "₹")
        const isCurrencyHeader = header.includes('(Rs)') || header.includes('(₹)') ||
                                 header.includes('Amount') || header.includes('Balance');

        // If value is already a number and header indicates currency, format for CSV
        if (isCurrencyHeader && typeof value === 'number') {
          formattedRow[header] = value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        // Check if column contains currency values
        else if (['Subtotal', 'Tax', 'Discount', 'Grand Total', 'Budget', 'Revenue', 'Expenses', 'Profit/Loss'].includes(header)) {
          formattedRow[header] = value ? parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        }
        // Check if column contains percentage values
        else if (header.includes('%') || header.includes('Margin') || header.includes('Rate')) {
          formattedRow[header] = value ? `${value}%` : '0%';
        }
        // Status columns - capitalize first letter
        else if (header === 'Status') {
          formattedRow[header] = value ? value.charAt(0).toUpperCase() + value.slice(1) : '-';
        }
        // Default - keep as is
        else {
          formattedRow[header] = value !== undefined && value !== null ? value : '-';
        }
      });
      return formattedRow;
    });

    // Get headers from first object
    const headers = Object.keys(formattedData[0]);

    // Escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create simple CSV content
    const csvRows = [
      // Header row
      headers.map(h => escapeCSV(h)).join(','),
      // Data rows
      ...formattedData.map((row) =>
        headers.map((header) => escapeCSV(row[header])).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);

    console.log('✅ CSV file generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error exporting to CSV:', error);
    return false;
  }
};

/**
 * Format Payments In data for export
 * @param {Array} payments - Array of payment objects
 * @param {String} projectName - Name of the project
 */
export const formatPaymentsInForExport = (payments, projectName = '') => {
  return payments.map((payment, index) => ({
    'Sr. No.': index + 1,
    'Project': projectName,
    'Date': formatDate(payment.date),
    'Client Name': payment.clientName || '',
    'Type': payment.type === 'advance' ? 'Advance' : 'Installment',
    'Amount': payment.amount || 0,
    'Description': payment.description || '',
    'Invoice Generated': payment.invoiceGenerated ? 'Yes' : 'No',
    'Invoice Number': payment.invoiceNumber || '',
    'Created At': formatDate(payment.createdAt)
  }));
};

/**
 * Format Payments Out data for export
 * @param {Array} payments - Array of payment objects
 * @param {Object} departments - Departments object for lookup
 */
export const formatPaymentsOutForExport = (payments, departments = {}) => {
  return payments.map((payment, index) => ({
    'Sr. No.': index + 1,
    'Date': formatDate(payment.date),
    'Description': payment.description || '',
    'Department': departments[payment.departmentId]?.name || 'N/A',
    'Amount': payment.amount || 0,
    'Payment Method': payment.paymentMethod || '',
    'Status': payment.approvalStatus || 'pending',
    'Approved By': payment.approvedBy || '',
    'Approved At': payment.approvedAt ? formatDate(payment.approvedAt) : '',
    'Rejection Reason': payment.rejectionReason || '',
    'Created At': formatDate(payment.createdAt)
  }));
};

/**
 * Format Invoices data for export
 * @param {Array} invoices - Array of invoice objects
 */
export const formatInvoicesForExport = (invoices) => {
  return invoices.map((invoice, index) => ({
    'Sr. No.': index + 1,
    'Invoice Number': invoice.invoiceNumber || '',
    'Date': formatDate(invoice.date),
    'Due Date': formatDate(invoice.dueDate),
    'Client Name': invoice.clientName || '',
    'Client Address': invoice.clientAddress || '',
    'Subtotal': invoice.subtotal || 0,
    'Tax': invoice.tax || 0,
    'Discount': invoice.discount || 0,
    'Grand Total': invoice.grandTotal || 0,
    'Status': invoice.status || 'pending',
    'Created At': formatDate(invoice.createdAt)
  }));
};

/**
 * Format Quotations data for export
 * @param {Array} quotations - Array of quotation objects
 */
export const formatQuotationsForExport = (quotations) => {
  return quotations.map((quotation, index) => ({
    'Sr. No.': index + 1,
    'Quotation Number': quotation.quotationNumber || '',
    'Date': formatDate(quotation.date),
    'Valid Until': formatDate(quotation.validUntil),
    'Client Name': quotation.clientName || '',
    'Client Address': quotation.clientAddress || '',
    'Subtotal': quotation.subtotal || 0,
    'Tax': quotation.tax || 0,
    'Discount': quotation.discount || 0,
    'Grand Total': quotation.grandTotal || 0,
    'Status': quotation.status || 'draft',
    'Converted to Invoice': quotation.convertedToInvoice ? 'Yes' : 'No',
    'Created At': formatDate(quotation.createdAt)
  }));
};

/**
 * Format Projects data for export
 * @param {Array} projects - Array of project objects
 */
export const formatProjectsForExport = (projects) => {
  return projects.map((project, index) => {
    const revenue = calculateTotalPaymentsIn(project.paymentsIn || []);
    const expenses = calculateTotalPaymentsOut(project.paymentsOut || []);
    const profit = revenue - expenses;
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;
    const budget = parseFloat(project.totalCommittedAmount) || 0;
    const collectionRate = budget > 0 ? ((revenue / budget) * 100).toFixed(2) : 0;

    return {
      'Sr. No.': index + 1,
      'Project Name': project.name || '',
      'Status': project.status || 'active',
      'Budget': budget,
      'Revenue': revenue,
      'Expenses': expenses,
      'Profit/Loss': profit,
      'Profit Margin %': profitMargin,
      'Collection Rate %': collectionRate,
      'Description': project.description || '',
      'Created At': formatDate(project.createdAt)
    };
  });
};

/**
 * Export Projects to PDF with profit/loss analysis
 * @param {Array} projects - Array of project objects
 * @param {String} filename - Name of the file (without extension)
 */
export const exportProjectsToPDF = (projects, filename = 'Projects_Report') => {
  try {
    console.log('🔍 Starting PDF export...', { projects, filename });

    if (!projects || projects.length === 0) {
      console.warn('⚠️ No projects to export');
      alert('No projects available to export to PDF');
      return false;
    }

    const doc = new jsPDF('landscape'); // Use landscape for better table layout
    console.log('✅ jsPDF instance created');

    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.error('❌ autoTable function is not available');
      alert('PDF export plugin not loaded properly. Please refresh the page and try again.');
      return false;
    }
    console.log('✅ autoTable plugin loaded');

    // Colors
    const primaryColor = [91, 77, 255]; // Primary purple
    const successColor = [16, 185, 129]; // Green
    const dangerColor = [239, 68, 68]; // Red
    const textColor = [55, 65, 81]; // Gray

    // Add header background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 35, 'F'); // Full width header

    // Add title (white text on primary background)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECTS PROFIT & EXPENSE REPORT', 148.5, 18, { align: 'center' });

    // Add date (white text)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated on: ${currentDate}`, 148.5, 26, { align: 'center' });

    // Calculate summary
    console.log('📊 Calculating summary data...');
    const totalRevenue = projects.reduce((sum, p) => sum + calculateTotalPaymentsIn(p.paymentsIn || []), 0);
    const totalExpenses = projects.reduce((sum, p) => sum + calculateTotalPaymentsOut(p.paymentsOut || []), 0);
    const totalProfit = totalRevenue - totalExpenses;
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.totalCommittedAmount) || 0), 0);
    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

    console.log('📈 Summary:', { totalBudget, totalRevenue, totalExpenses, totalProfit });

    // Reset text color for content
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Add summary section with styled boxes
    const summaryY = 45;
    const boxWidth = 65;
    const boxHeight = 25;
    const boxSpacing = 8;
    const startX = 15;

    // Summary boxes data
    const summaryBoxes = [
      { label: 'Total Projects', value: projects.length.toString(), color: [91, 77, 255] },
      { label: 'Total Budget', value: `Rs ${totalBudget.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, color: [59, 130, 246] },
      { label: 'Total Revenue', value: `Rs ${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, color: [16, 185, 129] },
      { label: 'Total Expenses', value: `Rs ${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, color: [245, 158, 11] }
    ];

    summaryBoxes.forEach((box, index) => {
      const x = startX + (index * (boxWidth + boxSpacing));

      // Draw box with colored border
      doc.setDrawColor(box.color[0], box.color[1], box.color[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, summaryY, boxWidth, boxHeight, 2, 2, 'S');

      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(box.label, x + boxWidth / 2, summaryY + 8, { align: 'center' });

      // Value
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.value, x + boxWidth / 2, summaryY + 18, { align: 'center' });
    });

    // Profit/Loss box (larger, centered)
    const profitColor = totalProfit >= 0 ? successColor : dangerColor;
    const profitX = startX + 4 * (boxWidth + boxSpacing);
    doc.setDrawColor(profitColor[0], profitColor[1], profitColor[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(profitX, summaryY, boxWidth, boxHeight, 2, 2, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Total Profit/Loss', profitX + boxWidth / 2, summaryY + 8, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
    doc.text(`Rs ${totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, profitX + boxWidth / 2, summaryY + 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`(${overallMargin}% margin)`, profitX + boxWidth / 2, summaryY + 21, { align: 'center' });

    // Reset text color
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Prepare table data
    console.log('📋 Preparing table data...');
    const tableData = projects.map((project, index) => {
      const revenue = calculateTotalPaymentsIn(project.paymentsIn || []);
      const expenses = calculateTotalPaymentsOut(project.paymentsOut || []);
      const profit = revenue - expenses;
      const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
      const budget = parseFloat(project.totalCommittedAmount) || 0;
      const collectionRate = budget > 0 ? ((revenue / budget) * 100).toFixed(1) : '0';

      return [
        index + 1,
        project.name || 'Untitled Project',
        (project.status || 'active').charAt(0).toUpperCase() + (project.status || 'active').slice(1),
        `Rs ${budget.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        `Rs ${revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        `Rs ${expenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        `Rs ${profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        `${profitMargin}%`,
        `${collectionRate}%`
      ];
    });

    console.log('✅ Table data prepared:', tableData.length, 'rows');

    // Add table
    console.log('📄 Adding autoTable...');
    autoTable(doc, {
      startY: 78,
      head: [['#', 'Project Name', 'Status', 'Budget', 'Revenue', 'Expenses', 'Profit/Loss', 'Margin %', 'Collection %']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        valign: 'middle',
        cellPadding: 4
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 60, halign: 'left' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' },
        6: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        7: { cellWidth: 24, halign: 'center' },
        8: { cellWidth: 24, halign: 'center' }
      },
      didParseCell: function(data) {
        // Color code status column
        if (data.column.index === 2 && data.section === 'body') {
          const status = projects[data.row.index].status;
          if (status === 'completed') {
            data.cell.styles.textColor = successColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'on-hold') {
            data.cell.styles.textColor = [245, 158, 11]; // Orange
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
            data.cell.styles.fontStyle = 'bold';
          }
        }

        // Color code profit/loss column
        if (data.column.index === 6 && data.section === 'body') {
          const value = projects[data.row.index];
          const revenue = calculateTotalPaymentsIn(value.paymentsIn || []);
          const expenses = calculateTotalPaymentsOut(value.paymentsOut || []);
          const profit = revenue - expenses;

          if (profit > 0) {
            data.cell.styles.textColor = successColor;
            data.cell.styles.fillColor = [236, 253, 245]; // Light green
          } else if (profit < 0) {
            data.cell.styles.textColor = dangerColor;
            data.cell.styles.fillColor = [254, 242, 242]; // Light red
          }
        }
      },
      didDrawPage: function(data) {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });

    console.log('✅ AutoTable added successfully');

    // Save the PDF
    console.log('💾 Saving PDF...');
    doc.save(`${filename}.pdf`);
    console.log('✅ PDF saved successfully!');

    return true;
  } catch (error) {
    console.error('❌ Error exporting to PDF:', error);
    console.error('Error details:', error.message, error.stack);
    alert(`Failed to export PDF: ${error.message}`);
    return false;
  }
};

/**
 * Format Departments data for export
 * @param {Array} departments - Array of department objects
 */
export const formatDepartmentsForExport = (departments) => {
  return departments.map((department, index) => ({
    'Sr. No.': index + 1,
    'Department Name': department.name || '',
    'Description': department.description || '',
    'Created At': formatDate(department.createdAt),
    'Updated At': formatDate(department.updatedAt)
  }));
};

/**
 * Export Payments In data to Excel with proper formatting
 * @param {Array} payments - Array of payment objects
 * @param {String} filename - Name of the file (without extension)
 * @param {String} projectName - Name of the project
 */
export const exportPaymentsInToExcel = (payments, filename, projectName) => {
  try {
    console.log('📊 Starting Payments In Excel export...', { filename, rowCount: payments.length });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const advancePayments = payments.filter(p => p.type === 'advance');
    const installmentPayments = payments.filter(p => p.type === 'installment');
    const totalAdvance = advancePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalInstallment = installmentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Format data
    const formattedData = payments.map((payment, index) => ({
      'Sr. No.': index + 1,
      'Date': formatDate(payment.date),
      'Client Name': payment.clientName || '',
      'Type': payment.type === 'advance' ? 'Advance' : 'Installment',
      'Amount': `Rs ${(parseFloat(payment.amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      'Description': payment.description || '',
      'Created At': formatDate(payment.createdAt)
    }));

    const headers = Object.keys(formattedData[0] || {});
    const numCols = headers.length;

    // Create all rows
    const allRows = [
      // Title row
      ['PAYMENTS IN REPORT', ...Array(numCols - 1).fill('')],
      // Project row
      [`Project: ${projectName}`, ...Array(numCols - 1).fill('')],
      // Date row
      [`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, ...Array(numCols - 1).fill('')],
      // Empty row
      Array(numCols).fill(''),
      // Summary boxes
      ['Total Payments', 'Advance Payments', 'Installment Payments', 'Total Amount', ...Array(Math.max(0, numCols - 4)).fill('')],
      [
        payments.length,
        advancePayments.length,
        installmentPayments.length,
        `Rs ${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        ...Array(Math.max(0, numCols - 4)).fill('')
      ],
      // Empty row
      Array(numCols).fill(''),
      // Header row
      headers,
      // Data rows
      ...formattedData.map(row => headers.map(h => row[h]))
    ];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);

    // Helper function
    const getCellRef = (row, col) => XLSX.utils.encode_cell({ r: row, c: col });

    // Style title row
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(0, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "22C55E" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style project row
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(1, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "22C55E" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style date row
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(2, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "22C55E" } },
        font: { color: { rgb: "FFFFFF" }, sz: 10 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style summary labels
    const summaryColors = ['22C55E', '5B4DFF', '10B981', 'F59E0B'];
    for (let col = 0; col < Math.min(4, numCols); col++) {
      const cellRef = getCellRef(4, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: summaryColors[col] } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style summary values
    for (let col = 0; col < Math.min(4, numCols); col++) {
      const cellRef = getCellRef(5, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "FFFFFF" } },
        font: { bold: true, color: { rgb: summaryColors[col] }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style header row
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(7, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "22C55E" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Style data rows
    for (let rowIdx = 0; rowIdx < formattedData.length; rowIdx++) {
      const actualRow = 8 + rowIdx;
      const isEvenRow = rowIdx % 2 === 0;

      for (let col = 0; col < numCols; col++) {
        const cellRef = getCellRef(actualRow, col);
        if (!worksheet[cellRef]) continue;

        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: isEvenRow ? "FFFFFF" : "F9FAFB" } },
          font: { sz: 10 },
          alignment: {
            horizontal: col === 0 ? "center" : (col === 1 || col === 2 || col === 5 || col === 6) ? "left" : "right",
            vertical: "center"
          }
        };
      }
    }

    // Auto-size columns
    const columnWidths = headers.map((header, idx) => {
      const headerLength = header.length;
      const dataLengths = formattedData.map(row => {
        const value = row[header];
        return value ? String(value).length : 0;
      });
      const maxLength = Math.max(headerLength, ...dataLengths, 15);
      return { wch: Math.min(maxLength + 2, 60) };
    });
    worksheet['!cols'] = columnWidths;

    // Set row heights
    worksheet['!rows'] = [
      { hpt: 30 }, // Title
      { hpt: 25 }, // Project
      { hpt: 20 }, // Date
      { hpt: 10 }, // Empty
      { hpt: 25 }, // Summary labels
      { hpt: 25 }, // Summary values
      { hpt: 10 }, // Empty
      { hpt: 25 }  // Headers
    ];

    // Merge cells
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // Project
      { s: { r: 2, c: 0 }, e: { r: 2, c: numCols - 1 } }  // Date
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments In');

    // Generate file
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    console.log('✅ Payments In Excel file generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error exporting Payments In to Excel:', error);
    return false;
  }
};

/**
 * Export Payments In data to CSV
 * @param {Array} payments - Array of payment objects
 * @param {String} filename - Name of the file (without extension)
 * @param {String} projectName - Name of the project
 */
export const exportPaymentsInToCSV = (payments, filename, projectName) => {
  try {
    console.log('📄 Starting Payments In CSV export...', { filename, rowCount: payments.length });

    if (!payments || payments.length === 0) {
      console.warn('⚠️ No data to export');
      return false;
    }

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const advancePayments = payments.filter(p => p.type === 'advance');
    const installmentPayments = payments.filter(p => p.type === 'installment');
    const totalAdvance = advancePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalInstallment = installmentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Format data
    const formattedData = payments.map((payment, index) => ({
      'Sr. No.': index + 1,
      'Date': formatDate(payment.date),
      'Client Name': payment.clientName || '',
      'Type': payment.type === 'advance' ? 'Advance' : 'Installment',
      'Amount': `Rs ${(parseFloat(payment.amount) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      'Description': payment.description || '',
      'Created At': formatDate(payment.createdAt)
    }));

    const headers = Object.keys(formattedData[0]);

    // Escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV content
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const csvRows = [
      '================================================================================',
      'PAYMENTS IN REPORT',
      `Project: ${projectName}`,
      `Generated on: ${currentDate}`,
      '================================================================================',
      '',
      '--------------------------------------------------------------------------------',
      'SUMMARY OVERVIEW',
      '--------------------------------------------------------------------------------',
      '',
      'Total Payments,Advance Payments,Installment Payments,Total Amount',
      `${payments.length},${advancePayments.length},${installmentPayments.length},"Rs ${totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}"`,
      '',
      '--------------------------------------------------------------------------------',
      '',
      'PAYMENT DETAILS',
      '--------------------------------------------------------------------------------',
      '',
      headers.map(h => escapeCSV(h)).join(','),
      ...formattedData.map((row) =>
        headers.map((header) => escapeCSV(row[header])).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ Payments In CSV file generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error exporting Payments In to CSV:', error);
    return false;
  }
};

/**
 * Export Suppliers Report to Excel with professional formatting
 * @param {Array} supplierSummaries - Array of supplier summary objects
 * @param {String} filename - Name of the file (without extension)
 * @param {String} sheetName - Name of the worksheet
 */
export const exportSuppliersToExcel = (supplierSummaries, filename = 'Suppliers_Report', sheetName = 'Suppliers') => {
  try {
    console.log('📊 Starting Suppliers Excel export...', { filename, rowCount: supplierSummaries.length });

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Calculate summary
    const totalPurchases = supplierSummaries.reduce((sum, s) => sum + (s.totalPurchases || 0), 0);
    const totalPayments = supplierSummaries.reduce((sum, s) => sum + (s.totalPayments || 0), 0);
    const totalOutstanding = supplierSummaries.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);

    // Format data
    const formattedData = supplierSummaries.map((s, index) => ({
      'Sr. No.': index + 1,
      'Supplier Name': s.name,
      'Phone': s.phone || '-',
      'Email': s.email || '-',
      'Total Purchases': `Rs ${(s.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'Total Payments': `Rs ${(s.totalPayments || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'Outstanding Balance': `Rs ${(s.outstandingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'Status': s.balanceType === 'payable' ? 'Payable' : s.balanceType === 'overpaid' ? 'Advance' : 'Settled',
      'Transactions': s.transactionCount || 0
    }));

    const headers = Object.keys(formattedData[0] || {});
    const numCols = headers.length;

    // Create all rows
    const allRows = [
      // Title row
      ['ALL SUPPLIERS REPORT', ...Array(numCols - 1).fill('')],
      // Date row
      [`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, ...Array(numCols - 1).fill('')],
      // Empty row
      Array(numCols).fill(''),
      // Summary boxes - Row 1 (Labels)
      ['Total Suppliers', 'Total Purchases', 'Total Payments', 'Total Outstanding', ...Array(numCols - 4).fill('')],
      // Summary boxes - Row 2 (Values)
      [
        supplierSummaries.length,
        `Rs ${totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `Rs ${totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `Rs ${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ...Array(numCols - 4).fill('')
      ],
      // Empty row
      Array(numCols).fill(''),
      // Header row
      headers,
      // Data rows
      ...formattedData.map(row => headers.map(h => row[h]))
    ];

    // Create worksheet from the combined data
    const worksheet = XLSX.utils.aoa_to_sheet(allRows);

    // Helper function to get cell address
    const getCellRef = (row, col) => XLSX.utils.encode_cell({ r: row, c: col });

    // Apply styling to cells
    // Title row (Row 0) - Royal Blue background, white text, bold, centered
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(0, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "29398D" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Date row (Row 1) - Royal Blue background, white text, centered
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(1, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "29398D" } },
        font: { color: { rgb: "FFFFFF" }, sz: 10 },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Summary box labels (Row 3) - Different colors for each box
    const summaryColors = ['29398D', '3B82F6', 'F59E0B', totalOutstanding >= 0 ? 'EF4444' : '10B981'];
    for (let col = 0; col < 4; col++) {
      const cellRef = getCellRef(3, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: summaryColors[col] } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: summaryColors[col] } },
          left: { style: "medium", color: { rgb: summaryColors[col] } },
          right: { style: "medium", color: { rgb: summaryColors[col] } },
          bottom: { style: "thin", color: { rgb: summaryColors[col] } }
        }
      };
    }

    // Summary box values (Row 4) - White background with colored borders
    for (let col = 0; col < 4; col++) {
      const cellRef = getCellRef(4, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "FFFFFF" } },
        font: { bold: true, color: { rgb: summaryColors[col] }, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          left: { style: "medium", color: { rgb: summaryColors[col] } },
          right: { style: "medium", color: { rgb: summaryColors[col] } },
          bottom: { style: "medium", color: { rgb: summaryColors[col] } }
        }
      };
    }

    // Header row (Row 6) - Royal Blue background, white text, bold
    for (let col = 0; col < numCols; col++) {
      const cellRef = getCellRef(6, col);
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: '' };
      worksheet[cellRef].s = {
        fill: { fgColor: { rgb: "29398D" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } }
        }
      };
    }

    // Data rows - Alternating row colors and conditional formatting
    for (let rowIdx = 0; rowIdx < formattedData.length; rowIdx++) {
      const actualRow = 7 + rowIdx;
      const isEvenRow = rowIdx % 2 === 0;

      for (let col = 0; col < numCols; col++) {
        const cellRef = getCellRef(actualRow, col);
        if (!worksheet[cellRef]) continue;

        const baseStyle = {
          fill: { fgColor: { rgb: isEvenRow ? "FFFFFF" : "F9FAFB" } },
          font: { sz: 10 },
          alignment: {
            horizontal: col === 0 ? "center" : (col === 1 || col === 2 || col === 3) ? "left" : "right",
            vertical: "center"
          },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } }
          }
        };

        // Status column (col 7) - color coding
        if (col === 7) {
          const status = supplierSummaries[rowIdx].balanceType;
          if (status === 'payable') {
            baseStyle.font.color = { rgb: "EF4444" };
            baseStyle.font.bold = true;
          } else if (status === 'overpaid') {
            baseStyle.font.color = { rgb: "3B82F6" };
            baseStyle.font.bold = true;
          } else {
            baseStyle.font.color = { rgb: "6B7280" };
            baseStyle.font.bold = true;
          }
        }

        // Outstanding Balance column (col 6) - color coding with background
        if (col === 6) {
          const balance = supplierSummaries[rowIdx].outstandingBalance || 0;
          const balanceType = supplierSummaries[rowIdx].balanceType;
          if (balanceType === 'payable') {
            baseStyle.font.color = { rgb: "EF4444" };
            baseStyle.font.bold = true;
            baseStyle.fill = { fgColor: { rgb: "FEF2F2" } };
          } else if (balanceType === 'overpaid') {
            baseStyle.font.color = { rgb: "3B82F6" };
            baseStyle.font.bold = true;
            baseStyle.fill = { fgColor: { rgb: "EFF6FF" } };
          }
        }

        worksheet[cellRef].s = baseStyle;
      }
    }

    // Auto-size columns based on content
    const columnWidths = headers.map((header, idx) => {
      const headerLength = header.length;
      const dataLengths = formattedData.map(row => {
        const value = row[header];
        return value ? String(value).length : 0;
      });
      const maxLength = Math.max(headerLength, ...dataLengths, 15);
      return { wch: Math.min(maxLength + 2, 60) };
    });
    worksheet['!cols'] = columnWidths;

    // Set row heights for better appearance
    worksheet['!rows'] = [
      { hpt: 30 }, // Title row
      { hpt: 20 }, // Date row
      { hpt: 10 }, // Empty row
      { hpt: 25 }, // Summary labels
      { hpt: 25 }, // Summary values
      { hpt: 10 }, // Empty row
      { hpt: 25 }  // Header row
    ];

    // Merge cells
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }, // Title row
      { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } }, // Date row
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    console.log('✅ Suppliers Excel file generated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error exporting Suppliers to Excel:', error);
    return false;
  }
};

/**
 * Export Materials to PDF with inventory details
 * @param {Array} materials - Array of material objects
 * @param {String} filename - Name of the file (without extension)
 */
export const exportMaterialsToPDF = (materials, filename = 'Materials_Inventory_Report') => {
  try {
    console.log('🔍 Starting Materials PDF export...', { materials, filename });

    if (!materials || materials.length === 0) {
      console.warn('⚠️ No materials to export');
      alert('No materials available to export to PDF');
      return false;
    }

    const doc = new jsPDF('landscape'); // Use landscape for better table layout
    console.log('✅ jsPDF instance created');

    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.error('❌ autoTable function is not available');
      alert('PDF export plugin not loaded properly. Please refresh the page and try again.');
      return false;
    }
    console.log('✅ autoTable plugin loaded');

    // Colors
    const primaryColor = [102, 126, 234]; // Purple gradient
    const successColor = [16, 185, 129]; // Green
    const warningColor = [245, 158, 11]; // Orange
    const dangerColor = [239, 68, 68]; // Red
    const textColor = [55, 65, 81]; // Gray

    // Add header background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 297, 35, 'F'); // Full width header

    // Add title (white text on primary background)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MATERIALS INVENTORY REPORT', 148.5, 18, { align: 'center' });

    // Add date (white text)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generated on: ${currentDate}`, 148.5, 26, { align: 'center' });

    // Calculate summary
    console.log('📊 Calculating summary data...');
    const totalMaterials = materials.length;
    const totalStockValue = materials.reduce((sum, m) => {
      const stock = parseFloat(m.currentStock) || 0;
      const price = parseFloat(m.unitPrice) || 0;
      return sum + (stock * price);
    }, 0);
    const lowStockCount = materials.filter(m => {
      const stock = parseFloat(m.currentStock) || 0;
      const reorderLevel = parseFloat(m.reorderLevel) || 0;
      return stock > 0 && stock <= reorderLevel;
    }).length;
    const outOfStockCount = materials.filter(m => (parseFloat(m.currentStock) || 0) === 0).length;
    const inStockCount = materials.filter(m => {
      const stock = parseFloat(m.currentStock) || 0;
      const reorderLevel = parseFloat(m.reorderLevel) || 0;
      return stock > reorderLevel;
    }).length;

    console.log('📈 Summary:', { totalMaterials, totalStockValue, lowStockCount, outOfStockCount, inStockCount });

    // Reset text color for content
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Add summary section with styled boxes
    const summaryY = 45;
    const boxWidth = 52;
    const boxHeight = 25;
    const boxSpacing = 4.5;
    const startX = 10;

    // Summary boxes data
    const summaryBoxes = [
      { label: 'Total Materials', value: totalMaterials.toString(), color: [102, 126, 234] },
      { label: 'Total Stock Value', value: `Rs ${totalStockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: [59, 130, 246] },
      { label: 'In Stock', value: inStockCount.toString(), color: [16, 185, 129] },
      { label: 'Low Stock', value: lowStockCount.toString(), color: [245, 158, 11] },
      { label: 'Out of Stock', value: outOfStockCount.toString(), color: [239, 68, 68] }
    ];

    summaryBoxes.forEach((box, index) => {
      const x = startX + (index * (boxWidth + boxSpacing));

      // Draw box with colored border
      doc.setDrawColor(box.color[0], box.color[1], box.color[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, summaryY, boxWidth, boxHeight, 2, 2, 'S');

      // Label
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(box.label, x + boxWidth / 2, summaryY + 8, { align: 'center' });

      // Value
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(box.color[0], box.color[1], box.color[2]);
      doc.text(box.value, x + boxWidth / 2, summaryY + 18, { align: 'center' });
    });

    // Reset text color
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    // Prepare table data
    console.log('📋 Preparing table data...');
    const tableData = materials.map((material, index) => {
      const stock = parseFloat(material.currentStock) || 0;
      const unitPrice = parseFloat(material.unitPrice) || 0;
      const stockValue = stock * unitPrice;
      const reorderLevel = parseFloat(material.reorderLevel) || 0;

      let status = 'In Stock';
      if (stock === 0) {
        status = 'Out of Stock';
      } else if (stock <= reorderLevel) {
        status = 'Low Stock';
      }

      return [
        index + 1,
        material.materialCode || '-',
        material.name || 'Untitled Material',
        material.category || '-',
        material.unit || '-',
        stock.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
        `Rs ${unitPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        `Rs ${stockValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        material.location || '-',
        status
      ];
    });

    console.log('✅ Table data prepared:', tableData.length, 'rows');

    // Add table
    console.log('📄 Adding autoTable...');
    autoTable(doc, {
      startY: 78,
      head: [['#', 'Code', 'Material Name', 'Category', 'Unit', 'Stock', 'Unit Price', 'Stock Value', 'Location', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 25, halign: 'left' },
        2: { cellWidth: 50, halign: 'left' },
        3: { cellWidth: 30, halign: 'left' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
        7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 30, halign: 'left' },
        9: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      },
      didParseCell: function(data) {
        // Color code status column
        if (data.column.index === 9 && data.section === 'body') {
          const materialIndex = data.row.index;
          const material = materials[materialIndex];
          const stock = parseFloat(material.currentStock) || 0;
          const reorderLevel = parseFloat(material.reorderLevel) || 0;

          if (stock === 0) {
            data.cell.styles.textColor = dangerColor;
            data.cell.styles.fillColor = [254, 242, 242]; // Light red
          } else if (stock <= reorderLevel) {
            data.cell.styles.textColor = warningColor;
            data.cell.styles.fillColor = [254, 252, 232]; // Light yellow
          } else {
            data.cell.styles.textColor = successColor;
            data.cell.styles.fillColor = [236, 253, 245]; // Light green
          }
        }

        // Color code stock value column
        if (data.column.index === 7 && data.section === 'body') {
          const materialIndex = data.row.index;
          const material = materials[materialIndex];
          const stock = parseFloat(material.currentStock) || 0;
          const unitPrice = parseFloat(material.unitPrice) || 0;
          const stockValue = stock * unitPrice;

          if (stockValue > 0) {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
          }
        }
      },
      didDrawPage: function(data) {
        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });

    console.log('✅ AutoTable added successfully');

    // Save the PDF
    console.log('💾 Saving PDF...');
    doc.save(`${filename}.pdf`);
    console.log('✅ PDF saved successfully!');

    return true;
  } catch (error) {
    console.error('❌ Error exporting to PDF:', error);
    console.error('Error details:', error.message, error.stack);
    alert(`Failed to export PDF: ${error.message}`);
    return false;
  }
};

/**
 * Show success toast notification
 * @param {String} message - Success message
 */
export const showExportSuccess = (message = 'Data exported successfully!') => {
  // You can integrate with your toast notification system here
  console.log('✅ Export Success:', message);
  alert(message);
};

/**
 * Show error toast notification
 * @param {String} message - Error message
 */
export const showExportError = (message = 'Failed to export data. Please try again.') => {
  // You can integrate with your toast notification system here
  console.error('❌ Export Error:', message);
  alert(message);
};

