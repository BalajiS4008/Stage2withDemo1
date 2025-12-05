import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  getOverallSupplierBalance, 
  getProjectWiseBreakdown,
  calculateRunningBalance 
} from './supplierBalanceUtils';

/**
 * Generate Supplier Statement PDF (Corporate Blue Template)
 * @param {Object} supplier - Supplier data
 * @param {Array} transactions - All supplier transactions
 * @param {Array} projects - All projects
 * @param {Object} settings - Company settings
 */
export const generateSupplierStatementPDF = (supplier, transactions, projects, settings = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Define colors (Corporate Blue theme)
  const royalBlue = [41, 57, 141]; // #29398D
  const yellow = [255, 193, 7]; // #FFC107
  const lightGray = [245, 245, 245]; // #F5F5F5

  // ===== NAVY BLUE HEADER SECTION =====
  doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // ===== COMPANY LOGO =====
  if (settings.companyLogo) {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 15, 25, 25, 'F');
    try {
      doc.addImage(settings.companyLogo, 'PNG', 16, 16, 23, 23);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // ===== COMPANY INFORMATION =====
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName || 'Company Name', 45, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const companyAddress1 = settings.companyAddress?.split('\n')[0] || '';
  const companyAddress2 = settings.companyAddress?.split('\n')[1] || '';
  doc.text(companyAddress1, 45, 31);
  doc.text(companyAddress2, 45, 36);
  doc.text(`Phone: ${settings.companyPhone || ''}`, 45, 42);
  doc.text(`Email: ${settings.companyEmail || ''}`, 45, 48);

  // ===== DOCUMENT TITLE (Right side) =====
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPPLIER STATEMENT', pageWidth - 15, 30, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 38, { align: 'right' });

  // ===== SUPPLIER INFORMATION SECTION =====
  let yPos = 70;

  // Yellow accent bar
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SUPPLIER DETAILS', 17, yPos);

  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', 17, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.name, 45, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Contact:', 17, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.phone || 'N/A', 45, yPos);

  if (supplier.email) {
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(supplier.email, 45, yPos);
  }
  if (supplier.address) {
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Address:', 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(supplier.address, 45, yPos);
  }

  // ===== OVERALL BALANCE SUMMARY =====
  yPos += 12;
  const overallBalance = getOverallSupplierBalance(transactions, supplier.id);

  // Light gray background for summary
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 35, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OVERALL BALANCE SUMMARY', 17, yPos + 2);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Create three columns
  const col1X = 20;
  const col2X = 85;
  const col3X = 145;

  // Column 1: Total Purchases
  doc.setFont('helvetica', 'bold');
  doc.text('Total Purchases:', col1X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`₹${overallBalance.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col1X, yPos + 6);

  // Column 2: Total Payments
  doc.setFont('helvetica', 'bold');
  doc.text('Total Payments:', col2X, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`₹${overallBalance.totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col2X, yPos + 6);

  // Column 3: Outstanding Balance
  yPos += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const balanceColor = overallBalance.rawBalance > 0 ? [220, 38, 38] :
                       overallBalance.rawBalance < 0 ? [22, 163, 74] : [100, 100, 100];
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.text('Outstanding Balance:', 20, yPos);
  doc.setFontSize(12);
  doc.text(
    `₹${Math.abs(overallBalance.outstandingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${
      overallBalance.balanceType === 'payable' ? '(Payable)' :
      overallBalance.balanceType === 'overpaid' ? '(Advance)' :
      '(Settled)'
    }`,
    20,
    yPos + 6
  );
  yPos += 2;

  // ===== PROJECT-WISE BREAKDOWN =====
  yPos += 15;
  doc.setTextColor(0, 0, 0);
  
  // Yellow accent bar
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT-WISE BREAKDOWN', 17, yPos);

  yPos += 10;
  const projectBreakdown = getProjectWiseBreakdown(transactions, supplier.id, projects);

  if (projectBreakdown.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Project', 'Purchases (Rs.)', 'Payments (Rs.)', 'Outstanding (Rs.)', 'Status']],
      body: projectBreakdown.map(p => [
        p.projectName,
        p.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        p.totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        p.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        p.balanceType === 'payable' ? 'Payable' :
        p.balanceType === 'overpaid' ? 'Advance' : 'Settled'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: royalBlue,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
        4: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No project breakdown available', 17, yPos);
    yPos += 15;
  }

  // ===== TRANSACTION HISTORY =====
  // Yellow accent bar
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION HISTORY', 17, yPos);

  yPos += 10;

  // Filter and sort transactions
  let supplierTransactions = transactions.filter(t => t.supplierId === supplier.id);

  if (supplierTransactions.length > 0) {
    // Calculate running balance
    const transactionsWithBalance = calculateRunningBalance(supplierTransactions);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Project', 'Type', 'Description', 'Purchase (Rs.)', 'Payment (Rs.)', 'Balance (Rs.)']],
      body: transactionsWithBalance.map(t => {
        const project = projects.find(p => p.id === t.projectId);
        return [
          new Date(t.date).toLocaleDateString('en-IN'),
          project ? project.name : 'Unknown',
          (t.type === 'purchase' || t.type === 'credit') ? 'Purchase' : 'Payment',
          t.description.substring(0, 35) + (t.description.length > 35 ? '...' : ''),
          (t.type === 'purchase' || t.type === 'credit') ? t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
          (t.type === 'payment' || t.type === 'debit') ? t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
          Math.abs(t.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        ];
      }),
      theme: 'striped',
      headStyles: {
        fillColor: royalBlue,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 22, halign: 'center' },
        1: { cellWidth: 32, halign: 'left' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 42, halign: 'left' },
        4: { cellWidth: 24, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { left: 15, right: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No transactions found', 17, yPos);
    yPos += 10;
  }

  // ===== FOOTER WITH PAGE NUMBERS =====
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 20;

    doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
    doc.rect(0, footerY, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated statement', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 14, { align: 'center' });

    // Page number on the right
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, footerY + 11, { align: 'right' });
  }

  // Save PDF
  const fileName = `${supplier.name.replace(/[^a-z0-9]/gi, '_')}_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  console.log('✅ PDF generated:', fileName);
};

/**
 * Generate Comprehensive Excel Report for Supplier
 * @param {Object} supplier - Supplier data
 * @param {Array} transactions - All supplier transactions
 * @param {Array} projects - All projects
 */
export const generateSupplierExcelReport = (supplier, transactions, projects) => {
  const wb = XLSX.utils.book_new();

  // ===== SHEET 1: SUMMARY =====
  const overallBalance = getOverallSupplierBalance(transactions, supplier.id);

  const summaryData = [
    ['SUPPLIER STATEMENT'],
    [''],
    ['Supplier Information'],
    ['Name', supplier.name],
    ['Contact', supplier.phone],
    ['Email', supplier.email || 'N/A'],
    ['Address', supplier.address || 'N/A'],
    [''],
    ['Overall Balance Summary'],
    ['Total Purchases (₹)', overallBalance.totalPurchases.toFixed(2)],
    ['Total Payments (₹)', overallBalance.totalPayments.toFixed(2)],
    ['Outstanding Balance (₹)', overallBalance.outstandingBalance.toFixed(2)],
    ['Balance Type', overallBalance.balanceType === 'payable' ? 'You Owe' :
                     overallBalance.balanceType === 'overpaid' ? 'Overpaid' : 'Settled'],
    [''],
    ['Report Generated', new Date().toLocaleString()]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // ===== SHEET 2: PROJECT-WISE BREAKDOWN =====
  const projectBreakdown = getProjectWiseBreakdown(transactions, supplier.id, projects);

  const projectData = [
    ['PROJECT-WISE BREAKDOWN'],
    [''],
    ['Project', 'Purchases (₹)', 'Payments (₹)', 'Outstanding (₹)', 'Status']
  ];

  projectBreakdown.forEach(p => {
    projectData.push([
      p.projectName,
      p.totalPurchases.toFixed(2),
      p.totalPayments.toFixed(2),
      p.outstandingBalance.toFixed(2),
      p.balanceType === 'payable' ? 'You Owe' :
      p.balanceType === 'overpaid' ? 'Overpaid' : 'Settled'
    ]);
  });

  const wsProjects = XLSX.utils.aoa_to_sheet(projectData);
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Project Breakdown');

  // ===== SHEET 3: TRANSACTION HISTORY =====
  let supplierTransactions = transactions.filter(t => t.supplierId === supplier.id);
  const transactionsWithBalance = calculateRunningBalance(supplierTransactions);

  const transactionData = [
    ['TRANSACTION HISTORY'],
    [''],
    ['Date', 'Project', 'Type', 'Description', 'Purchase (₹)', 'Payment (₹)', 'Balance (₹)', 'Payment Mode', 'Entry By', 'Entry Date/Time']
  ];

  transactionsWithBalance.forEach(t => {
    const project = projects.find(p => p.id === t.projectId);
    transactionData.push([
      new Date(t.date).toLocaleDateString(),
      project ? project.name : 'Unknown',
      (t.type === 'purchase' || t.type === 'credit') ? 'Purchase' : 'Payment',
      t.description,
      (t.type === 'purchase' || t.type === 'credit') ? t.amount.toFixed(2) : '',
      (t.type === 'payment' || t.type === 'debit') ? t.amount.toFixed(2) : '',
      Math.abs(t.runningBalance).toFixed(2),
      t.paymentMode || '-',
      t.entryBy,
      new Date(t.entryDateTime).toLocaleString()
    ]);
  });

  const wsTransactions = XLSX.utils.aoa_to_sheet(transactionData);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

  // Save Excel file
  const fileName = `${supplier.name.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);

  console.log('✅ Excel report generated:', fileName);
};

/**
 * Generate Project-Specific Supplier Report (PDF)
 * @param {Object} supplier - Supplier data
 * @param {string} projectId - Project ID
 * @param {string} projectName - Project name
 * @param {Array} transactions - All supplier transactions
 * @param {Object} settings - Company settings
 */
export const generateProjectSupplierReportPDF = (supplier, projectId, projectName, transactions, settings = {}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Define colors
  const royalBlue = [41, 57, 141];
  const yellow = [255, 193, 7];
  const lightGray = [245, 245, 245];

  // ===== HEADER =====
  doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Company logo
  if (settings.companyLogo) {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 15, 25, 25, 'F');
    try {
      doc.addImage(settings.companyLogo, 'PNG', 16, 16, 23, 23);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Company info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName || 'Company Name', 45, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const companyAddress1 = settings.companyAddress?.split('\n')[0] || '';
  const companyAddress2 = settings.companyAddress?.split('\n')[1] || '';
  doc.text(companyAddress1, 45, 31);
  doc.text(companyAddress2, 45, 36);
  doc.text(`Phone: ${settings.companyPhone || ''}`, 45, 42);
  doc.text(`Email: ${settings.companyEmail || ''}`, 45, 48);

  // Document title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT STATEMENT', pageWidth - 15, 28, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 36, { align: 'right' });

  // ===== SUPPLIER & PROJECT INFO =====
  let yPos = 70;

  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS', 17, yPos);

  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Supplier: ${supplier.name}`, 15, yPos);
  yPos += 6;
  doc.text(`Project: ${projectName}`, 15, yPos);
  yPos += 6;
  doc.text(`Contact: ${supplier.phone}`, 15, yPos);
  yPos += 10;

  // ===== PROJECT BALANCE =====
  const projectTransactions = transactions.filter(t =>
    t.supplierId === supplier.id && t.projectId === projectId
  );

  const totalPurchases = projectTransactions
    .filter(t => t.type === 'purchase' || t.type === 'credit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalPayments = projectTransactions
    .filter(t => t.type === 'payment' || t.type === 'debit')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const balance = totalPurchases - totalPayments;

  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(15, yPos - 3, pageWidth - 30, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT BALANCE', 17, yPos + 3);

  doc.setFont('helvetica', 'normal');
  yPos += 10;
  doc.text(`Purchases: ₹${totalPurchases.toFixed(2)}`, 17, yPos);
  doc.text(`Payments: ₹${totalPayments.toFixed(2)}`, 80, yPos);

  const balanceColor = balance > 0 ? [220, 38, 38] : balance < 0 ? [22, 163, 74] : [100, 100, 100];
  doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Balance: ₹${Math.abs(balance).toFixed(2)} ${balance > 0 ? '(Give)' : balance < 0 ? '(Get)' : '(Settled)'}`,
    140,
    yPos
  );

  // ===== TRANSACTIONS =====
  yPos += 15;
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTIONS', 17, yPos);

  yPos += 10;

  if (projectTransactions.length > 0) {
    const transactionsWithBalance = calculateRunningBalance(projectTransactions);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Description', 'Purchase (₹)', 'Payment (₹)', 'Balance (₹)']],
      body: transactionsWithBalance.map(t => [
        new Date(t.date).toLocaleDateString(),
        (t.type === 'purchase' || t.type === 'credit') ? 'Purchase' : 'Payment',
        t.description.substring(0, 40) + (t.description.length > 40 ? '...' : ''),
        (t.type === 'purchase' || t.type === 'credit') ? t.amount.toFixed(2) : '-',
        (t.type === 'payment' || t.type === 'debit') ? t.amount.toFixed(2) : '-',
        Math.abs(t.runningBalance).toFixed(2)
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: royalBlue,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 }
      },
      margin: { left: 15, right: 15 }
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No transactions found', 17, yPos);
  }

  // ===== FOOTER =====
  const footerY = pageHeight - 20;
  doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.rect(0, footerY, pageWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated statement', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 14, { align: 'center' });

  // Save PDF
  const fileName = `${supplier.name.replace(/[^a-z0-9]/gi, '_')}_${projectName.replace(/[^a-z0-9]/gi, '_')}_Statement.pdf`;
  doc.save(fileName);

  console.log('✅ Project PDF generated:', fileName);
};

/**
 * Generate All Suppliers Report PDF
 * @param {Array} supplierSummaries - Array of supplier summary data
 * @param {Object} settings - Company settings
 * @param {string} dateRange - Date range filter
 * @param {string} customStartDate - Custom start date
 * @param {string} customEndDate - Custom end date
 * @param {string} projectFilter - Project filter name
 */
export const generateAllSuppliersReportPDF = (
  supplierSummaries,
  settings = {},
  dateRange = 'all',
  customStartDate = '',
  customEndDate = '',
  projectFilter = 'All Projects'
) => {
  try {
    console.log('📄 Starting All Suppliers PDF generation...', {
      suppliersCount: supplierSummaries.length,
      dateRange,
      projectFilter
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Define colors
    const royalBlue = [41, 57, 141];
    const yellow = [255, 193, 7];
    const lightGray = [245, 245, 245];

    // ===== HEADER =====
    doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Company Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.companyName || 'Company Name', pageWidth / 2, 20, { align: 'center' });

    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('ALL SUPPLIERS REPORT', pageWidth / 2, 30, { align: 'center' });

    // Date Range
    let dateRangeText = 'All Time';
    if (dateRange === 'last30') dateRangeText = 'Last 30 Days';
    else if (dateRange === 'last90') dateRangeText = 'Last 90 Days';
    else if (dateRange === 'lastQuarter') dateRangeText = 'Last Quarter';
    else if (dateRange === 'custom' && customStartDate) {
      dateRangeText = `${new Date(customStartDate).toLocaleDateString()} - ${customEndDate ? new Date(customEndDate).toLocaleDateString() : 'Present'}`;
    }

    doc.setFontSize(10);
    doc.text(`Period: ${dateRangeText} | Project: ${projectFilter}`, pageWidth / 2, 40, { align: 'center' });

    // ===== SUMMARY SECTION =====
    let yPos = 60;

    const totalPurchases = supplierSummaries.reduce((sum, s) => sum + s.totalPurchases, 0);
    const totalPayments = supplierSummaries.reduce((sum, s) => sum + s.totalPayments, 0);
    const totalOutstanding = supplierSummaries.reduce((sum, s) => sum + s.outstandingBalance, 0);

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(14, yPos, pageWidth - 28, 25, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL SUMMARY', 20, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Suppliers: ${supplierSummaries.length}`, 20, yPos + 15);
    doc.text(`Total Purchases: Rs. ${totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 70, yPos + 15);
    doc.text(`Total Payments: Rs. ${totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 130, yPos + 15);
    doc.text(`Total Outstanding: Rs. ${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, yPos + 21);

    yPos += 35;

    // ===== SUPPLIERS TABLE =====
    autoTable(doc, {
      startY: yPos,
      head: [[
        'Sr.',
        'Supplier Name',
        'Contact',
        'Purchases (Rs.)',
        'Payments (Rs.)',
        'Outstanding (Rs.)',
        'Status'
      ]],
      body: supplierSummaries.map((s, index) => [
        index + 1,
        s.name,
        s.phone || s.email || '-',
        s.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        s.totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        s.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        s.balanceType === 'payable' ? 'Payable' :
        s.balanceType === 'overpaid' ? 'Advance' : 'Settled'
      ]),
      headStyles: {
        fillColor: royalBlue,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [0, 0, 0]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 45 },
        2: { halign: 'left', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'center', cellWidth: 20 }
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      margin: { left: 14, right: 14 }
    });

    // ===== FOOTER WITH PAGE NUMBERS =====
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 20;

      doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
      doc.rect(0, footerY, pageWidth, 20, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is a computer-generated report', pageWidth / 2, footerY + 8, { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 14, { align: 'center' });

      // Page number on the right
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, footerY + 11, { align: 'right' });
    }

    // Save PDF
    const fileName = `All_Suppliers_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    console.log('✅ All Suppliers Report PDF generated:', fileName);
    return true;
  } catch (error) {
    console.error('❌ Error generating All Suppliers PDF:', error);
    console.error('Error details:', error.message, error.stack);
    throw error; // Re-throw to be caught by the calling function
  }
};

/**
 * Generate Transaction History PDF for Supplier
 * @param {Object} supplier - Supplier data
 * @param {Array} transactions - Filtered transactions with running balance
 * @param {Array} projects - All projects
 * @param {string} projectName - Project name (if filtered by project)
 * @param {Object} settings - Company settings
 */
export const generateTransactionHistoryPDF = (
  supplier,
  transactions,
  projects,
  projectName = null,
  settings = {}
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Define colors
  const royalBlue = [41, 57, 141];
  const yellow = [255, 193, 7];
  const lightGray = [245, 245, 245];

  // ===== HEADER =====
  doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
  doc.rect(0, 0, pageWidth, 55, 'F');

  // Company logo
  if (settings.companyLogo) {
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 15, 25, 25, 'F');
    try {
      doc.addImage(settings.companyLogo, 'PNG', 16, 16, 23, 23);
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  // Company info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName || 'Company Name', 45, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const companyAddress1 = settings.companyAddress?.split('\n')[0] || '';
  const companyAddress2 = settings.companyAddress?.split('\n')[1] || '';
  doc.text(companyAddress1, 45, 31);
  if (companyAddress2) doc.text(companyAddress2, 45, 36);
  doc.text(`Phone: ${settings.companyPhone || ''}`, 45, 42);
  doc.text(`Email: ${settings.companyEmail || ''}`, 45, 48);

  // Document title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION HISTORY', pageWidth - 15, 30, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 15, 38, { align: 'right' });

  // ===== SUPPLIER & PROJECT INFO =====
  let yPos = 70;

  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS', 17, yPos);

  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Supplier:', 17, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.name, 45, yPos);

  if (projectName) {
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Project:', 17, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(projectName, 45, yPos);
  }

  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Contact:', 17, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.phone || 'N/A', 45, yPos);

  // ===== SUMMARY =====
  yPos += 12;

  if (transactions.length > 0) {
    const totalPurchases = transactions
      .filter(t => t.type === 'purchase' || t.type === 'credit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalPayments = transactions
      .filter(t => t.type === 'payment' || t.type === 'debit')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const currentBalance = transactions[0].runningBalance;

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPos - 5, pageWidth - 30, 45, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 17, yPos + 2);

    yPos += 10;
    doc.setFontSize(10);

    // Two columns for Purchases and Payments
    const col1X = 20;
    const col2X = 100;

    // Total Purchases
    doc.setFont('helvetica', 'bold');
    doc.text('Total Purchases:', col1X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col1X, yPos + 6);

    // Total Payments
    doc.setFont('helvetica', 'bold');
    doc.text('Total Payments:', col2X, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rs. ${totalPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col2X, yPos + 6);

    // Current Balance on new row
    yPos += 14;
    const balanceColor = currentBalance > 0 ? [220, 38, 38] :
                        currentBalance < 0 ? [22, 163, 74] : [100, 100, 100];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Current Balance:', col1X, yPos);

    // Balance amount on next line
    yPos += 7;
    doc.setFontSize(12);
    const balanceText = `Rs. ${Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(balanceText, col1X, yPos);

    // Status text on separate line below the balance
    yPos += 6;
    const statusText = currentBalance > 0 ? '(Payable)' :
                      currentBalance < 0 ? '(Advance)' :
                      '(Settled)';

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(statusText, col1X, yPos);
  }

  // ===== TRANSACTIONS TABLE =====
  yPos += 18;
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(yellow[0], yellow[1], yellow[2]);
  doc.rect(15, yPos - 5, pageWidth - 30, 8, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTIONS', 17, yPos);

  yPos += 10;

  if (transactions.length > 0) {
    const tableHeaders = projectName
      ? ['Date', 'Type', 'Description', 'Purchase\n(Rs.)', 'Payment\n(Rs.)', 'Balance\n(Rs.)']
      : ['Date', 'Project', 'Type', 'Description', 'Purchase\n(Rs.)', 'Payment\n(Rs.)', 'Balance\n(Rs.)'];

    const tableBody = transactions.map(t => {
      const project = projects.find(p => p.id === t.projectId);
      const row = [
        new Date(t.date).toLocaleDateString('en-IN'),
        (t.type === 'purchase' || t.type === 'credit') ? 'Purchase' : 'Payment',
        t.description.substring(0, 30) + (t.description.length > 30 ? '...' : ''),
        (t.type === 'purchase' || t.type === 'credit') ? t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
        (t.type === 'payment' || t.type === 'debit') ? t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-',
        Math.abs(t.runningBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ];

      if (!projectName) {
        row.splice(1, 0, project ? project.name : 'Unknown');
      }

      return row;
    });

    const columnStyles = projectName
      ? {
          0: { cellWidth: 24, halign: 'center' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 52, halign: 'left' },
          3: { cellWidth: 28, halign: 'right' },
          4: { cellWidth: 28, halign: 'right' },
          5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
        }
      : {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 30, halign: 'left' },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 38, halign: 'left' },
          4: { cellWidth: 27, halign: 'right' },
          5: { cellWidth: 27, halign: 'right' },
          6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
        };

    autoTable(doc, {
      startY: yPos,
      head: [tableHeaders],
      body: tableBody,
      theme: 'striped',
      headStyles: {
        fillColor: royalBlue,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles,
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      },
      margin: { left: 15, right: 15 }
    });
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('No transactions found', 17, yPos);
  }

  // ===== FOOTER WITH PAGE NUMBERS =====
  const totalPages = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 20;

    doc.setFillColor(royalBlue[0], royalBlue[1], royalBlue[2]);
    doc.rect(0, footerY, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is a computer-generated report', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY + 14, { align: 'center' });

    // Page number on the right
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, footerY + 11, { align: 'right' });
  }

  // Save PDF
  const fileName = projectName
    ? `${supplier.name.replace(/[^a-z0-9]/gi, '_')}_${projectName.replace(/[^a-z0-9]/gi, '_')}_Transactions_${new Date().toISOString().split('T')[0]}.pdf`
    : `${supplier.name.replace(/[^a-z0-9]/gi, '_')}_All_Transactions_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(fileName);

  console.log('✅ Transaction History PDF generated:', fileName);
};
