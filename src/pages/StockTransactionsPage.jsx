import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Calendar,
  Package,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  TRANSACTION_TYPES
} from '../utils/materialUtils';
import { deleteStockTransaction } from '../db/dexieDB';
import StockTransactionFormModal from '../components/stockTransactions/StockTransactionFormModal';
import { exportToExcel } from '../utils/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StockTransactionsPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allTransactions = useMemo(() => data.stockTransactions || [], [data.stockTransactions]);
  const allMaterials = useMemo(() => data.materials || [], [data.materials]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);

  // Helper function to get material name
  const getMaterialName = (materialId) => {
    const material = allMaterials.find(m => m.id === materialId);
    return material ? material.name : 'Unknown Material';
  };

  // Helper function to get project name
  const getProjectName = (projectId) => {
    if (!projectId) return '-';
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.transactionType === selectedType);
    }

    // Material filter
    if (selectedMaterial !== 'all') {
      filtered = filtered.filter(t => t.materialId === parseInt(selectedMaterial));
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === parseInt(selectedProject));
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.transactionDate);
        const startDate = new Date(dateRange.start);
        return transDate >= startDate;
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => {
        const transDate = new Date(t.transactionDate);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        return transDate <= endDate;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t => {
        const materialName = getMaterialName(t.materialId).toLowerCase();
        const projectName = getProjectName(t.projectId).toLowerCase();
        const refNumber = (t.referenceNumber || '').toLowerCase();
        return (
          materialName.includes(searchQuery.toLowerCase()) ||
          projectName.includes(searchQuery.toLowerCase()) ||
          refNumber.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by date descending
    return [...filtered].sort((a, b) =>
      new Date(b.transactionDate) - new Date(a.transactionDate)
    );
  }, [allTransactions, selectedType, selectedMaterial, selectedProject, dateRange, searchQuery, allMaterials, allProjects]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalIn = allTransactions
      .filter(t => t.transactionType === TRANSACTION_TYPES.IN)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalOut = allTransactions
      .filter(t => t.transactionType === TRANSACTION_TYPES.OUT)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return {
      totalTransactions: allTransactions.length,
      totalIn,
      totalOut,
      netValue: totalIn - totalOut
    };
  }, [allTransactions]);

  // Reset to page 1 when filters change and current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add transaction
  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setShowAddModal(true);
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowAddModal(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction? This will affect stock levels.')) {
      try {
        await deleteStockTransaction(transactionId);
        showToast('Transaction deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast('Failed to delete transaction', 'danger');
      }
    }
  };

  // Handle modal success
  const handleModalSuccess = (message) => {
    showToast(message, 'success');
  };

  // Handle export to Excel
  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredTransactions.map(transaction => {
        const material = allMaterials.find(m => m.id === parseInt(transaction.materialId));
        return {
          'Transaction No.': transaction.transactionNumber || '-',
          'Date': new Date(transaction.transactionDate).toLocaleDateString('en-IN'),
          'Type': transaction.transactionType,
          'Material Code': material?.materialCode || '-',
          'Material Name': getMaterialName(transaction.materialId),
          'Quantity': parseFloat(transaction.quantity || 0).toFixed(2),
          'Unit': material?.unit || '-',
          'Rate (₹)': parseFloat(transaction.rate || 0),
          'Amount (₹)': parseFloat(transaction.amount || 0),
          'Project': getProjectName(transaction.projectId),
          'Performed By': transaction.performedBy || '-',
          'Reference': transaction.referenceNumber || '-',
          'Notes': transaction.notes || '-'
        };
      });

      const filename = `Stock_Transactions_${new Date().toISOString().split('T')[0]}`;
      exportToExcel(exportData, filename, 'Stock Transactions');
      showToast('Stock transactions exported to Excel successfully', 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('Failed to export to Excel', 'danger');
    }
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Stock Transactions Report', 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 28);
      doc.text(`Total Transactions: ${filteredTransactions.length}`, 14, 34);

      // Prepare table data
      const tableData = filteredTransactions.map(transaction => {
        const material = allMaterials.find(m => m.id === parseInt(transaction.materialId));
        return [
          transaction.transactionNumber || '-',
          new Date(transaction.transactionDate).toLocaleDateString('en-IN'),
          transaction.transactionType,
          getMaterialName(transaction.materialId),
          `${parseFloat(transaction.quantity || 0).toFixed(2)} ${material?.unit || ''}`,
          `₹${parseFloat(transaction.rate || 0).toLocaleString('en-IN')}`,
          `₹${parseFloat(transaction.amount || 0).toLocaleString('en-IN')}`,
          getProjectName(transaction.projectId),
          transaction.performedBy || '-'
        ];
      });

      // Add table
      autoTable(doc, {
        startY: 40,
        head: [['Trans. No.', 'Date', 'Type', 'Material', 'Quantity', 'Rate', 'Amount', 'Project', 'Performed By']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [102, 126, 234],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 8
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 45 },
          4: { cellWidth: 25 },
          5: { cellWidth: 22 },
          6: { cellWidth: 25 },
          7: { cellWidth: 40 },
          8: { cellWidth: 30 }
        },
        margin: { top: 40 }
      });

      // Save the PDF
      const filename = `Stock_Transactions_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      showToast('Stock transactions exported to PDF successfully', 'success');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showToast('Failed to export to PDF', 'danger');
    }
  };

  // Get transaction type badge
  const getTypeBadge = (type) => {
    const badges = {
      [TRANSACTION_TYPES.IN]: { bg: 'success', icon: TrendingUp, text: 'Stock IN' },
      [TRANSACTION_TYPES.OUT]: { bg: 'danger', icon: TrendingDown, text: 'Stock OUT' },
      [TRANSACTION_TYPES.ADJUSTMENT]: { bg: 'warning', icon: Package, text: 'Adjustment' },
      [TRANSACTION_TYPES.RETURN]: { bg: 'info', icon: TrendingUp, text: 'Return' }
    };
    return badges[type] || { bg: 'secondary', icon: Package, text: type };
  };

  // Render premium summary cards
  const renderSummaryCards = () => (
    <div className="row g-4 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100 hover-lift" style={{
          borderRadius: '12px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="rounded-circle p-3" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}>
                <Package className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Total Transactions
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: '#1a202c' }}>
              {summaryStats.totalTransactions}
            </h2>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100 hover-lift" style={{
          borderRadius: '12px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="rounded-circle p-3" style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                boxShadow: '0 4px 12px rgba(79, 172, 254, 0.4)'
              }}>
                <TrendingUp className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Stock IN Value
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '1.5rem', color: '#1a202c' }}>
              ₹{summaryStats.totalIn.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100 hover-lift" style={{
          borderRadius: '12px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="rounded-circle p-3" style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)'
              }}>
                <TrendingDown className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Stock OUT Value
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '1.5rem', color: '#1a202c' }}>
              ₹{summaryStats.totalOut.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100 hover-lift" style={{
          borderRadius: '12px',
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'pointer'
        }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="rounded-circle p-3" style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                boxShadow: '0 4px 12px rgba(250, 112, 154, 0.4)'
              }}>
                <Package className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Net Value
            </h6>
            <h2 className={`mb-0 fw-bold ${summaryStats.netValue >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '1.5rem' }}>
              ₹{Math.abs(summaryStats.netValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );

  // Render premium filters
  const renderFilters = () => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
      <div className="card-body p-4">
        <div className="row g-3 align-items-center">
          {/* Search */}
          <div className="col-md-3">
            <div className="input-group" style={{ borderRadius: '8px' }}>
              <span className="input-group-text bg-white border-end-0" style={{
                borderTopLeftRadius: '8px',
                borderBottomLeftRadius: '8px',
                borderColor: '#e2e8f0'
              }}>
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderTopRightRadius: '8px',
                  borderBottomRightRadius: '8px',
                  borderColor: '#e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Types</option>
              <option value={TRANSACTION_TYPES.IN}>Stock IN</option>
              <option value={TRANSACTION_TYPES.OUT}>Stock OUT</option>
              <option value={TRANSACTION_TYPES.ADJUSTMENT}>Adjustment</option>
              <option value={TRANSACTION_TYPES.RETURN}>Return</option>
            </select>
          </div>

          {/* Material Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Materials</option>
              {allMaterials.filter(m => m.isActive).map(material => (
                <option key={material.id} value={material.id}>
                  {material.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="col-md-3">
            <div className="input-group">
              <input
                type="date"
                className="form-control"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                placeholder="Start Date"
                style={{
                  borderRadius: '8px 0 0 8px',
                  borderColor: '#e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
              <span className="input-group-text" style={{ borderColor: '#e2e8f0', fontSize: '0.85rem' }}>to</span>
              <input
                type="date"
                className="form-control"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                placeholder="End Date"
                style={{
                  borderRadius: '0 8px 8px 0',
                  borderColor: '#e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render premium transactions table
  const renderTransactionsTable = () => (
    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4" style={{
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
      }}>
        <h5 className="mb-0 fw-bold" style={{ color: '#1a202c', fontSize: '1.1rem' }}>
          Stock Transactions
        </h5>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Transaction No.</th>
                <th>Date</th>
                <th>Type</th>
                <th>Material</th>
                <th>Quantity (Unit)</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Project</th>
                <th>Performed By</th>
                <th>Reference</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    No transactions found. Click "Add Transaction" to get started.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(transaction => {
                  const typeBadge = getTypeBadge(transaction.transactionType);
                  const TypeIcon = typeBadge.icon;
                  const material = allMaterials.find(m => m.id === parseInt(transaction.materialId));

                  return (
                    <tr key={transaction.id}>
                      <td className="fw-semibold">
                        {transaction.transactionNumber || '-'}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {new Date(transaction.transactionDate).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${typeBadge.bg} d-inline-flex align-items-center gap-1`}>
                          <TypeIcon size={12} />
                          {typeBadge.text}
                        </span>
                      </td>
                      <td>
                        <div className={`fw-medium ${!material ? 'text-danger' : ''}`}>
                          {getMaterialName(transaction.materialId)}
                        </div>
                        {material && (
                          <small className="text-muted">{material.materialCode}</small>
                        )}
                        {!material && (
                          <small className="text-danger">Material ID: {transaction.materialId} (Not found)</small>
                        )}
                      </td>
                      <td className="fw-semibold">
                        {material ?
                          `${parseFloat(transaction.quantity || 0).toFixed(2)} ${material.unit}` :
                          `${parseFloat(transaction.quantity || 0).toFixed(2)}`
                        }
                      </td>
                      <td>
                        {transaction.rate ?
                          `₹${parseFloat(transaction.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : '-'
                        }
                      </td>
                      <td className="fw-semibold">
                        ₹{parseFloat(transaction.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>{getProjectName(transaction.projectId)}</td>
                      <td>
                        <span className="text-muted">{transaction.performedBy || '-'}</span>
                      </td>
                      <td>
                        <span className="text-muted small">{transaction.referenceNumber || '-'}</span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditTransaction(transaction)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Pagination */}
      {filteredTransactions.length > 0 && (
        <div className="card-footer bg-white border-top">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Show</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-muted small">
                entries (Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length})
              </span>
            </div>
            {totalPages > 1 && (
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + index;
                    } else {
                      pageNumber = currentPage - 2 + index;
                    }

                    return (
                      <li key={index} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid py-4">
      {/* Premium Styling */}
      <style>{`
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15) !important;
        }
        .table-hover tbody tr:hover {
          background-color: #f8fafc;
          cursor: pointer;
        }
        .pagination .page-link {
          border-radius: 6px !important;
          margin: 0 2px;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          font-weight: 500;
        }
        .pagination .page-item.active .page-link {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
        }
        .pagination .page-link:hover:not(.active) {
          background-color: #f7fafc;
          border-color: #cbd5e0;
        }
      `}</style>

      {/* Premium Header with gradient background */}
      <div className="mb-4">
        <div className="card border-0 shadow-lg" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <div className="card-body py-4 px-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div style={{ color: '#ffffff' }}>
                <div className="d-flex align-items-center mb-2">
                  <div className="me-3">
                    <Package size={32} style={{ color: '#ffffff', opacity: 0.95 }} />
                  </div>
                  <h2 className="mb-0 fw-bold" style={{ color: '#ffffff' }}>
                    Stock Transactions
                  </h2>
                </div>
                <p className="mb-0" style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.95rem' }}>
                  Track all stock movements, manage inventory IN/OUT operations and adjustments
                </p>
              </div>
              <div className="d-flex gap-2">
                {/* Export Dropdown */}
                <div className="btn-group shadow-sm" role="group">
                  <button
                    className="btn btn-light"
                    onClick={handleExportExcel}
                    style={{
                      borderRadius: '8px 0 0 8px',
                      fontWeight: '500',
                      padding: '8px 16px',
                      border: 'none'
                    }}
                  >
                    <FileSpreadsheet size={16} className="me-2" />
                    Export to Excel
                  </button>
                  <button
                    className="btn btn-light"
                    onClick={handleExportPDF}
                    style={{
                      borderRadius: '0 8px 8px 0',
                      fontWeight: '500',
                      padding: '8px 16px',
                      border: 'none',
                      borderLeft: '1px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    <FileText size={16} className="me-2" />
                    Export to PDF
                  </button>
                </div>
                <button
                  className="btn shadow-sm"
                  onClick={handleAddTransaction}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                    padding: '8px 16px',
                    backgroundColor: '#fbbf24',
                    color: '#1a202c',
                    border: 'none'
                  }}
                >
                  <Plus size={16} className="me-2" />
                  Add Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Transactions Table */}
      {renderTransactionsTable()}

      {/* Toast Notification */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div className={`alert alert-${toast.type} alert-dismissible fade show`} role="alert">
            {toast.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setToast({ ...toast, show: false })}
            />
          </div>
        </div>
      )}

      {/* Stock Transaction Form Modal */}
      <StockTransactionFormModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default StockTransactionsPage;
