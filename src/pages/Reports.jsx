import { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  FileCheck,
  Filter,
  FileSpreadsheet,
  Printer,
  Download,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { exportToExcel, exportToCSV, showExportSuccess, showExportError } from '../utils/exportUtils';
import { isAdmin, filterByUserRole, getRecordCreators, getUserDisplayName } from '../utils/authUtils';
import Pagination from '../components/reports/Pagination';
import PageSizeSelector from '../components/reports/PageSizeSelector';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const { data } = useData();
  const { user } = useAuth();

  // Report types
  const reportTypes = [
    { id: 'projects', name: 'Projects Report', icon: Building2, color: 'blue' },
    { id: 'payments-in', name: 'Payments In Report', icon: TrendingUp, color: 'green' },
    { id: 'payments-out', name: 'Payments Out Report', icon: TrendingDown, color: 'red' },
    { id: 'invoices', name: 'Invoices Report', icon: FileText, color: 'purple' },
    { id: 'quotations', name: 'Quotations Report', icon: FileCheck, color: 'orange' },
    { id: 'parties', name: 'Parties Report', icon: Users, color: 'pink' }
  ];

  // State
  const [selectedReport, setSelectedReport] = useState('projects');
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: 'all',
    projectId: 'all',
    status: 'all'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // User filtering state (for admins)
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Get customers from parties
  const customers = useMemo(() => {
    return data.parties?.filter(p => p.type === 'customer' || p.type === 'both') || [];
  }, [data.parties]);

  // Get all users who have created records (for admin filter)
  const recordCreators = useMemo(() => {
    if (!isAdmin(user)) return [];

    // Combine all data sources to find unique creators
    const allRecords = [
      ...(data.projects || []),
      ...(data.invoices || []),
      ...(data.quotations || []),
      ...(data.parties || [])
    ];

    return getRecordCreators(allRecords, data.users || [], 'createdBy');
  }, [data, user]);

  // Filter report types based on search
  const filteredReportTypes = useMemo(() => {
    if (!reportSearchTerm) return reportTypes;
    return reportTypes.filter(report =>
      report.name.toLowerCase().includes(reportSearchTerm.toLowerCase())
    );
  }, [reportSearchTerm]);

  // Generate report data based on selected report and filters
  const reportData = useMemo(() => {
    const { dateFrom, dateTo, customerId, projectId, status } = filters;

    // Helper to filter by date
    const filterByDate = (items, dateField = 'createdAt') => {
      return items.filter(item => {
        if (!dateFrom && !dateTo) return true;
        const itemDate = new Date(item[dateField]);
        const fromDate = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
        const toDate = dateTo ? new Date(dateTo) : new Date('2100-12-31');
        toDate.setHours(23, 59, 59, 999);
        return itemDate >= fromDate && itemDate <= toDate;
      });
    };

    switch (selectedReport) {
      case 'projects': {
        let projects = [...data.projects];

        // Apply user/role based filtering first
        projects = filterByUserRole(projects, user, selectedUserId, 'createdBy');

        // Apply other filters
        projects = filterByDate(projects);
        if (customerId !== 'all') projects = projects.filter(p => p.customerId === customerId);
        if (status !== 'all') projects = projects.filter(p => p.status === status);

        return projects.map(p => ({
          id: p.id,
          name: p.name,
          customer: data.parties?.find(party => party.id === p.customerId)?.name || '-',
          totalAmount: p.totalCommittedAmount || 0,
          status: p.status,
          createdAt: new Date(p.createdAt).toLocaleDateString(),
          description: p.description || '-'
        }));
      }

      case 'payments-in': {
        // Filter projects first based on user role
        const userProjects = filterByUserRole(data.projects, user, selectedUserId, 'createdBy');

        // Collect all payments from filtered projects
        let payments = [];
        userProjects.forEach(project => {
          if (project.paymentsIn && Array.isArray(project.paymentsIn)) {
            project.paymentsIn.forEach(payment => {
              payments.push({
                ...payment,
                projectId: project.id,
                projectName: project.name
              });
            });
          }
        });

        payments = filterByDate(payments, 'date');
        if (projectId !== 'all') payments = payments.filter(p => p.projectId === projectId);

        return payments.map(p => ({
          id: p.id,
          project: p.projectName || '-',
          amount: p.amount || 0,
          date: new Date(p.date).toLocaleDateString(),
          paymentMode: p.paymentMode || '-',
          reference: p.referenceNumber || '-',
          description: p.description || '-'
        }));
      }

      case 'payments-out': {
        // Filter projects first based on user role
        const userProjects = filterByUserRole(data.projects, user, selectedUserId, 'createdBy');

        // Collect all payments from filtered projects
        let payments = [];
        userProjects.forEach(project => {
          if (project.paymentsOut && Array.isArray(project.paymentsOut)) {
            project.paymentsOut.forEach(payment => {
              payments.push({
                ...payment,
                projectId: project.id,
                projectName: project.name
              });
            });
          }
        });

        payments = filterByDate(payments, 'date');
        if (projectId !== 'all') payments = payments.filter(p => p.projectId === projectId);

        return payments.map(p => ({
          id: p.id,
          project: p.projectName || '-',
          amount: p.amount || 0,
          date: new Date(p.date).toLocaleDateString(),
          paymentMode: p.paymentMode || '-',
          department: data.departments?.find(d => d.id === p.department)?.name || '-',
          description: p.description || '-'
        }));
      }

      case 'invoices': {
        let invoices = [...data.invoices];

        // Apply user/role based filtering
        invoices = filterByUserRole(invoices, user, selectedUserId, 'createdBy');

        // Apply other filters
        invoices = filterByDate(invoices);
        if (projectId !== 'all') invoices = invoices.filter(i => i.projectId === projectId);
        if (status !== 'all') invoices = invoices.filter(i => i.status === status);

        return invoices.map(i => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber || '-',
          project: data.projects?.find(proj => proj.id === i.projectId)?.name || '-',
          customer: data.parties?.find(p => p.id === i.customerId)?.name || '-',
          amount: i.total || 0,
          status: i.status,
          date: new Date(i.date).toLocaleDateString(),
          dueDate: i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '-'
        }));
      }

      case 'quotations': {
        let quotations = [...data.quotations];

        // Apply user/role based filtering
        quotations = filterByUserRole(quotations, user, selectedUserId, 'createdBy');

        // Apply other filters
        quotations = filterByDate(quotations);
        if (customerId !== 'all') quotations = quotations.filter(q => q.customerId === customerId);
        if (status !== 'all') quotations = quotations.filter(q => q.status === status);

        return quotations.map(q => ({
          id: q.id,
          quotationNumber: q.quotationNumber || '-',
          customer: data.parties?.find(p => p.id === q.customerId)?.name || '-',
          amount: q.total || 0,
          status: q.status,
          date: new Date(q.date).toLocaleDateString(),
          validUntil: q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'
        }));
      }

      case 'parties': {
        let parties = [...data.parties];

        // Apply user/role based filtering
        parties = filterByUserRole(parties, user, selectedUserId, 'createdBy');

        return parties.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          phone: p.phone || '-',
          email: p.email || '-',
          address: p.address || '-',
          openingBalance: p.openingBalance || 0
        }));
      }

      default:
        return [];
    }
  }, [selectedReport, filters, data, user, selectedUserId]);

  // Pagination calculations
  const paginatedData = useMemo(() => {
    if (pageSize === -1) return reportData; // Show all

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return reportData.slice(startIndex, endIndex);
  }, [reportData, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === -1) return 1;
    return Math.ceil(reportData.length / pageSize);
  }, [reportData.length, pageSize]);

  // Reset to page 1 when filters, report type, or page size changes
  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleReportChange = useCallback((newReport) => {
    setSelectedReport(newReport);
    setCurrentPage(1); // Reset to first page
    handleResetFilters();
  }, []);

  // Get table columns based on selected report
  const getTableColumns = () => {
    switch (selectedReport) {
      case 'projects':
        return ['Name', 'Customer', 'Total Amount (₹)', 'Status', 'Created Date', 'Description'];
      case 'payments-in':
        return ['Project', 'Amount (₹)', 'Date', 'Payment Mode', 'Reference', 'Description'];
      case 'payments-out':
        return ['Project', 'Amount (₹)', 'Date', 'Payment Mode', 'Department', 'Description'];
      case 'invoices':
        return ['Invoice #', 'Project', 'Customer', 'Amount (₹)', 'Status', 'Date', 'Due Date'];
      case 'quotations':
        return ['Quotation #', 'Customer', 'Amount (₹)', 'Status', 'Date', 'Valid Until'];
      case 'parties':
        return ['Name', 'Type', 'Phone', 'Email', 'Address', 'Opening Balance (₹)'];
      default:
        return [];
    }
  };

  // Helper function to identify currency columns
  const isCurrencyColumn = (key) => {
    return key === 'totalAmount' || key === 'amount' || key === 'openingBalance';
  };

  // Helper function to determine column type and CSS class
  const getColumnClass = (columnName, value) => {
    // Date columns
    if (columnName.toLowerCase().includes('date')) {
      return 'date-col text-right';
    }

    // Currency/Number columns
    if (columnName.includes('(₹)') || columnName.includes('(Rs)') ||
        columnName.includes('Amount') || columnName.includes('Balance') ||
        typeof value === 'number') {
      return 'number-col currency-col text-right';
    }

    // String columns (default)
    return 'string-col text-left';
  };

  // Helper function to format currency value (without symbol)
  const formatCurrencyValue = (value) => {
    if (value === null || value === undefined || value === '-') return '-';
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return '-';
    return numValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Helper function to format column name for export
  const formatColumnForExport = (columnName) => {
    // Special handling for specific column names to preserve capitalization
    const specialCases = {
      'Invoice #': 'Invoice #',
      'Quotation #': 'Quotation #'
    };

    if (specialCases[columnName]) {
      return specialCases[columnName].replace('(₹)', '(Rs)');
    }

    // Replace currency symbol with Rs and ensure proper capitalization
    return columnName
      .replace('(₹)', '(Rs)')
      .split(' ')
      .map(word => {
        // Keep acronyms uppercase
        if (word === 'Rs' || word === '#') return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  // Helper function to get properly formatted export data
  const getExportData = () => {
    const columns = getTableColumns();
    const dataKeys = Object.keys(reportData[0] || {}).filter(key => key !== 'id');

    return reportData.map((row, index) => {
      const exportRow = {};

      // Add serial number as first column
      exportRow['S.NO'] = index + 1;

      // Map each data field to its corresponding formatted column header
      dataKeys.forEach((key, idx) => {
        const columnHeader = columns[idx];
        const formattedHeader = formatColumnForExport(columnHeader);
        let value = row[key];

        // Format currency values for export (numeric value for Excel)
        if (isCurrencyColumn(key)) {
          value = typeof value === 'number' ? value : (parseFloat(value) || 0);
        }

        exportRow[formattedHeader] = value;
      });

      return exportRow;
    });
  };

  // Export handlers
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      showExportError('No data to export');
      return;
    }

    const exportData = getExportData();

    const success = exportToExcel(
      exportData,
      `${selectedReport}_report_${new Date().toISOString().split('T')[0]}`,
      selectedReport.toUpperCase()
    );

    if (success) {
      showExportSuccess(`Exported ${reportData.length} records to Excel`);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      showExportError('No data to export');
      return;
    }

    const exportData = getExportData();

    const success = exportToCSV(
      exportData,
      `${selectedReport}_report_${new Date().toISOString().split('T')[0]}`
    );

    if (success) {
      showExportSuccess(`Exported ${reportData.length} records to CSV`);
    }
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) {
      showExportError('No data to export');
      return;
    }

    try {
      const reportName = reportTypes.find(r => r.id === selectedReport)?.name || 'Report';
      const columns = getTableColumns();

      // Replace ₹ symbol with Rs for PDF export to avoid encoding issues
      const pdfColumns = columns.map(col => col.replace('(₹)', '(Rs)'));

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add header
      doc.setFontSize(18);
      doc.setTextColor(124, 58, 237); // Purple color
      doc.text(reportName, 14, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // Gray color
      const metaText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()} | Total Records: ${reportData.length}`;
      doc.text(metaText, 14, 22);

      // Prepare table data
      const tableHeaders = [['#', ...pdfColumns]];
      const tableData = reportData.map((row, index) => {
        const rowData = [index + 1];
        Object.keys(row).filter(key => key !== 'id').forEach(key => {
          if (isCurrencyColumn(key)) {
            rowData.push(formatCurrencyValue(row[key]));
          } else {
            rowData.push(row[key] || '-');
          }
        });
        return rowData;
      });

      // Define column styles based on report type
      const getColumnStyles = () => {
        const baseStyles = {
          0: { cellWidth: 10, halign: 'center' } // # column
        };

        switch (selectedReport) {
          case 'projects':
            return {
              ...baseStyles,
              1: { cellWidth: 'auto' }, // Name
              2: { cellWidth: 'auto' }, // Customer
              3: { cellWidth: 25, halign: 'right' }, // Total Amount (₹)
              4: { cellWidth: 20, halign: 'center' }, // Status
              5: { cellWidth: 25 }, // Created Date
              6: { cellWidth: 'auto' } // Description
            };
          case 'payments-in':
            return {
              ...baseStyles,
              1: { cellWidth: 'auto' }, // Project
              2: { cellWidth: 25, halign: 'right' }, // Amount (₹)
              3: { cellWidth: 25 }, // Date
              4: { cellWidth: 25 }, // Payment Mode
              5: { cellWidth: 25 }, // Reference
              6: { cellWidth: 'auto' } // Description
            };
          case 'payments-out':
            return {
              ...baseStyles,
              1: { cellWidth: 'auto' }, // Project
              2: { cellWidth: 25, halign: 'right' }, // Amount (₹)
              3: { cellWidth: 25 }, // Date
              4: { cellWidth: 25 }, // Payment Mode
              5: { cellWidth: 'auto' }, // Department
              6: { cellWidth: 'auto' } // Description
            };
          case 'invoices':
            return {
              ...baseStyles,
              1: { cellWidth: 25 }, // Invoice #
              2: { cellWidth: 'auto' }, // Project
              3: { cellWidth: 'auto' }, // Customer
              4: { cellWidth: 25, halign: 'right' }, // Amount (₹)
              5: { cellWidth: 20, halign: 'center' }, // Status
              6: { cellWidth: 25 }, // Date
              7: { cellWidth: 25 } // Due Date
            };
          case 'quotations':
            return {
              ...baseStyles,
              1: { cellWidth: 28 }, // Quotation #
              2: { cellWidth: 'auto' }, // Customer
              3: { cellWidth: 25, halign: 'right' }, // Amount (₹)
              4: { cellWidth: 20, halign: 'center' }, // Status
              5: { cellWidth: 25 }, // Date
              6: { cellWidth: 25 } // Valid Until
            };
          case 'parties':
            return {
              ...baseStyles,
              1: { cellWidth: 'auto' }, // Name
              2: { cellWidth: 20 }, // Type
              3: { cellWidth: 28 }, // Phone
              4: { cellWidth: 'auto' }, // Email
              5: { cellWidth: 'auto' }, // Address
              6: { cellWidth: 30, halign: 'right' } // Opening Balance (₹)
            };
          default:
            return baseStyles;
        }
      };

      // Add table using autoTable
      autoTable(doc, {
        startY: 28,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [124, 58, 237], // Purple
          textColor: [255, 255, 255], // White
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 2,
          halign: 'left',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [55, 65, 81], // Dark gray
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // Light gray
        },
        columnStyles: getColumnStyles(),
        margin: { top: 28, right: 14, bottom: 14, left: 14 },
        styles: {
          cellPadding: 2,
          lineColor: [229, 231, 235],
          lineWidth: 0.1,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        tableWidth: 'auto'
      });

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Generated by Construction Billing System - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      showExportSuccess(`PDF downloaded: ${fileName}`);
    } catch (error) {
      console.error('PDF export error:', error);
      showExportError('Failed to generate PDF: ' + error.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      customerId: 'all',
      projectId: 'all',
      status: 'all'
    });
    setSelectedUserId('all'); // Reset user filter
    setCurrentPage(1); // Reset pagination
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except the table */
          body * {
            visibility: hidden;
          }

          .print-area, .print-area * {
            visibility: visible;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }

          /* Column alignment for print */
          .number-col, .date-col, .currency-col {
            text-align: right;
          }

          .string-col {
            text-align: left;
          }

          /* Table styling for print */
          table {
            width: 100%;
            font-size: 10px;
            border-collapse: collapse;
            page-break-inside: auto;
          }

          thead {
            display: table-header-group;
          }

          tbody {
            display: table-row-group;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          th, td {
            border: 1px solid #ddd;
            padding: 4px 6px;
            font-size: 9px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          th {
            background-color: #7c3aed !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            text-align: left;
          }

          /* Print header */
          .print-header {
            display: block !important;
            margin-bottom: 20px;
            border-bottom: 2px solid #7c3aed;
            padding-bottom: 10px;
          }

          .print-header h1 {
            font-size: 24px;
            color: #1f2937;
            margin: 0 0 5px 0;
          }

          .print-header p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 rounded-xl shadow-2xl p-6 no-print">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  Reports & Analytics
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </h1>
                <p className="text-blue-200 text-sm">Generate and export comprehensive reports</p>
              </div>
            </div>
            {/* Admin View Indicator */}
            {isAdmin(user) && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                <Users className="w-3 h-3" />
                Admin View
                {selectedUserId !== 'all' && (
                  <span className="ml-1 px-2 py-0.5 bg-purple-200 rounded-full">
                    Filtered by User
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Single Column Layout */}
        <div className="space-y-6">
          {/* Filter Section */}
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 p-6 no-print">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-600" />
                Filters
              </h2>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Report Type with Search */}
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="relative">
                  <select
                    value={selectedReport}
                    onChange={(e) => {
                      setSelectedReport(e.target.value);
                      handleResetFilters();
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                  >
                    {filteredReportTypes.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.name}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-90" />
                </div>
              </div>
              {/* Date From */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  min={filters.dateFrom}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Customer Filter - Show for specific reports */}
              {(selectedReport === 'projects' || selectedReport === 'quotations') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer
                  </label>
                  <select
                    value={filters.customerId}
                    onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Customers</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project Filter - Show for specific reports */}
              {(selectedReport === 'payments-in' || selectedReport === 'payments-out' || selectedReport === 'invoices') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project
                  </label>
                  <select
                    value={filters.projectId}
                    onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Projects</option>
                    {data.projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter - Show for specific reports */}
              {(selectedReport === 'projects' || selectedReport === 'invoices' || selectedReport === 'quotations') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              )}

              {/* User Filter - Admin Only */}
              {isAdmin(user) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Filter by User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setCurrentPage(1); // Reset pagination
                    }}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="all">All Users</option>
                    {recordCreators.map(creator => (
                      <option key={creator.id || creator.uid} value={creator.id || creator.uid}>
                        {getUserDisplayName(creator)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

            {/* Export Buttons & Count */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 p-4 no-print">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm font-medium text-gray-600">
                Total Records: <span className="text-2xl font-bold text-purple-600">{reportData.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-sm">Export to Excel</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-sm">Export to CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">Export to PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  <span className="text-sm">Print Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 p-4 no-print">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Page Size Selector */}
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                totalRecords={reportData.length}
              />

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalRecords={reportData.length}
                pageSize={pageSize === -1 ? reportData.length : pageSize}
              />
            </div>
          </div>

            {/* Data Table */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 overflow-hidden print-area">
              {/* Print Header - Only visible when printing */}
              <div className="print-header" style={{ display: 'none' }}>
                <h1>
                  {reportTypes.find(r => r.id === selectedReport)?.name || 'Report'}
                </h1>
                <p>Generated on {new Date().toLocaleDateString()} | Total Records: {reportData.length}</p>
              </div>

              <div className="overflow-x-auto">
                {reportData.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Found</h3>
                  <p className="text-gray-600">Try adjusting your filters to see results</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">#</th>
                      {getTableColumns().map((column, index) => (
                        <th key={index} className="px-4 py-3 text-left text-xs font-bold uppercase">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((row, index) => {
                      const globalIndex = (currentPage - 1) * (pageSize === -1 ? reportData.length : pageSize) + index + 1;
                      return (
                        <tr key={row.id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{globalIndex}</td>
                          {Object.keys(row).filter(key => key !== 'id').map((key, colIndex) => {
                            const column = getTableColumns()[colIndex];
                            const value = row[key];
                            const columnClass = getColumnClass(column, value);

                            return (
                              <td
                                key={colIndex}
                                className={`px-4 py-3 text-sm text-gray-700 ${columnClass}`}
                              >
                                {key === 'status' ? (
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    row[key] === 'active' || row[key] === 'paid' ? 'bg-green-100 text-green-800' :
                                    row[key] === 'completed' ? 'bg-blue-100 text-blue-800' :
                                    row[key] === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {row[key]}
                                  </span>
                                ) : isCurrencyColumn(key) ? (
                                  formatCurrencyValue(row[key])
                                ) : (
                                  row[key]
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
