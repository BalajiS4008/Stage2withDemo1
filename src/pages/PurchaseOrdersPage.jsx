import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  ShoppingCart,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Filter,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import {
  PO_STATUS,
  generatePONumber,
  calculatePOTotal,
  getPOStatusColor,
  formatCurrency
} from '../utils/materialUtils';
import { deletePurchaseOrder } from '../db/dexieDB';
import PurchaseOrderFormModal from '../components/purchaseOrders/PurchaseOrderFormModal';
import PurchaseOrderViewModal from '../components/purchaseOrders/PurchaseOrderViewModal';

const PurchaseOrdersPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allPOs = useMemo(() => data.purchaseOrders || [], [data.purchaseOrders]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const allParties = useMemo(() => data.parties || [], [data.parties]);

  // Get supplier (party) name
  const getSupplierName = (supplierId) => {
    const supplier = allParties.find(p => p.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  // Get project name
  const getProjectName = (projectId) => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'N/A';
  };

  // Get unique suppliers from parties
  const suppliers = useMemo(() =>
    allParties.filter(p => p.type === 'Vendor' || p.type === 'Both'),
    [allParties]
  );

  // Filter and sort POs
  const filteredPOs = useMemo(() => {
    let filtered = allPOs;

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(po => po.status === selectedStatus);
    }

    // Supplier filter
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter(po => po.supplierId === parseInt(selectedSupplier));
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(po => po.projectId === parseInt(selectedProject));
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(po => {
        const orderDate = new Date(po.orderDate);
        const startDate = new Date(dateRange.start);
        return orderDate >= startDate;
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(po => {
        const orderDate = new Date(po.orderDate);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59);
        return orderDate <= endDate;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(po => {
        const poNumber = (po.poNumber || '').toLowerCase();
        const supplierName = getSupplierName(po.supplierId).toLowerCase();
        const projectName = getProjectName(po.projectId).toLowerCase();
        return (
          poNumber.includes(searchQuery.toLowerCase()) ||
          supplierName.includes(searchQuery.toLowerCase()) ||
          projectName.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by order date descending
    return [...filtered].sort((a, b) =>
      new Date(b.orderDate) - new Date(a.orderDate)
    );
  }, [allPOs, selectedStatus, selectedSupplier, selectedProject, dateRange, searchQuery, allParties, allProjects]);

  // Pagination
  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const paginatedPOs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPOs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPOs, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalPOs = allPOs.length;
    const pendingPOs = allPOs.filter(po => po.status === PO_STATUS.PENDING).length;
    const approvedPOs = allPOs.filter(po => po.status === PO_STATUS.APPROVED).length;
    const totalValue = allPOs
      .filter(po => po.status !== PO_STATUS.CANCELLED)
      .reduce((sum, po) => sum + (parseFloat(po.totalAmount) || 0), 0);

    return { totalPOs, pendingPOs, approvedPOs, totalValue };
  }, [allPOs]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add PO
  const handleAddPO = () => {
    setSelectedPO(null);
    setShowAddModal(true);
  };

  // Handle edit PO
  const handleEditPO = (po) => {
    setSelectedPO(po);
    setShowAddModal(true);
  };

  // Handle view PO
  const handleViewPO = (po) => {
    setSelectedPO(po);
    setShowViewModal(true);
  };

  // Handle delete PO
  const handleDeletePO = async (poId) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deletePurchaseOrder(poId);
        showToast('Purchase order deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting PO:', error);
        showToast('Failed to delete purchase order', 'danger');
      }
    }
  };

  // Handle modal success
  const handleModalSuccess = (message) => {
    showToast(message, 'success');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const color = getPOStatusColor(status);

    // Map status to actual icon components
    const iconMap = {
      'DRAFT': FileText,
      'SENT': Clock,
      'PENDING': Clock,
      'APPROVED': CheckCircle,
      'RECEIVED': Package,
      'CANCELLED': XCircle
    };

    const Icon = iconMap[status] || FileText;

    return (
      <span className={`badge bg-${color} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  // Render summary cards
  const renderSummaryCards = () => (
    <div className="row g-3 mb-4">
      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-primary bg-opacity-10 rounded p-3">
                  <ShoppingCart className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total POs</h6>
                <h3 className="mb-0">{summaryStats.totalPOs}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-warning bg-opacity-10 rounded p-3">
                  <Clock className="text-warning" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Pending</h6>
                <h3 className="mb-0">{summaryStats.pendingPOs}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-success bg-opacity-10 rounded p-3">
                  <CheckCircle className="text-success" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Approved</h6>
                <h3 className="mb-0">{summaryStats.approvedPOs}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-shrink-0">
                <div className="bg-info bg-opacity-10 rounded p-3">
                  <TrendingUp className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Value</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalValue)}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render filters
  const renderFilters = () => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3">
          {/* Search */}
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search POs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.values(PO_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="col-md-3">
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="date"
                  className="form-control"
                  placeholder="From"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="col-6">
                <input
                  type="date"
                  className="form-control"
                  placeholder="To"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render POs table
  const renderPOsTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Purchase Orders</h5>
        <button className="btn btn-primary btn-sm" onClick={handleAddPO}>
          <Plus size={16} className="me-1" />
          New Purchase Order
        </button>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>PO Number</th>
                <th>Order Date</th>
                <th>Supplier</th>
                <th>Project</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Expected Delivery</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPOs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No purchase orders found. Click "New Purchase Order" to get started.
                  </td>
                </tr>
              ) : (
                paginatedPOs.map(po => (
                  <tr key={po.id}>
                    <td className="fw-semibold">{po.poNumber}</td>
                    <td>{new Date(po.orderDate).toLocaleDateString('en-IN')}</td>
                    <td>{getSupplierName(po.supplierId)}</td>
                    <td>{getProjectName(po.projectId)}</td>
                    <td>
                      <span className="badge bg-secondary">
                        {po.items?.length || 0} items
                      </span>
                    </td>
                    <td className="fw-semibold">{formatCurrency(po.totalAmount)}</td>
                    <td>{getStatusBadge(po.status)}</td>
                    <td>
                      {po.expectedDeliveryDate
                        ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN')
                        : '-'}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-info"
                          onClick={() => handleViewPO(po)}
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditPO(po)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeletePO(po.id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-footer bg-white border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPOs.length)} of {filteredPOs.length} purchase orders
            </div>
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
                {[...Array(totalPages)].map((_, index) => (
                  <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  </li>
                ))}
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
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Purchase Orders</h2>
          <p className="text-muted mb-0">Create and manage purchase orders for materials</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* POs Table */}
      {renderPOsTable()}

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

      {/* Purchase Order Form Modal */}
      <PurchaseOrderFormModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
        onSuccess={handleModalSuccess}
      />

      {/* Purchase Order View Modal */}
      <PurchaseOrderViewModal
        show={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
      />
    </div>
  );
};

export default PurchaseOrdersPage;
