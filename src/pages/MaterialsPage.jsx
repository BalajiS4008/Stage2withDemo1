import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingDown,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import MaterialFormModal from '../components/materials/MaterialFormModal';
import { deleteMaterial } from '../db/dexieDB';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  generateMaterialCode,
  isBelowReorderLevel,
  calculateStockValue,
  getMaterialStatusColor,
  formatStockQuantity,
  getLowStockMaterials,
  calculateTotalInventoryValue
} from '../utils/materialUtils';
import { exportToExcel, exportMaterialsToPDF } from '../utils/exportUtils';

const MaterialsPage = () => {
  const { data, user } = useData();
  const { isBootstrap } = useTheme();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get materials from data
  const allMaterials = useMemo(() => data.materials || [], [data.materials]);

  // Filter and sort materials
  const filteredMaterials = useMemo(() => {
    let filtered = allMaterials.filter(m => m.isActive);

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    // Low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter(m =>
        isBelowReorderLevel(m.currentStock, m.reorderLevel)
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.materialCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'stock') {
      filtered = [...filtered].sort((a, b) => (b.currentStock || 0) - (a.currentStock || 0));
    } else if (sortBy === 'value') {
      filtered = [...filtered].sort((a, b) =>
        calculateStockValue(b.currentStock, b.unitPrice) - calculateStockValue(a.currentStock, a.unitPrice)
      );
    } else if (sortBy === 'date') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.lastUpdated || 0);
        const dateB = new Date(b.createdAt || b.lastUpdated || 0);
        return dateB - dateA; // Most recent first
      });
    }

    return filtered;
  }, [allMaterials, selectedCategory, showLowStockOnly, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMaterials, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalMaterials = allMaterials.filter(m => m.isActive).length;
    const lowStockCount = getLowStockMaterials(allMaterials).length;
    const totalValue = calculateTotalInventoryValue(allMaterials);
    const outOfStockCount = allMaterials.filter(m => m.isActive && m.currentStock === 0).length;

    return { totalMaterials, lowStockCount, totalValue, outOfStockCount };
  }, [allMaterials]);

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

  // Handle add material
  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setShowAddModal(true);
  };

  // Handle edit material
  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setShowAddModal(true);
  };

  // Handle delete material
  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      try {
        await deleteMaterial(materialId);
        showToast('Material deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting material:', error);
        showToast('Failed to delete material', 'danger');
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
      const exportData = filteredMaterials.map(material => ({
        'Material Code': material.materialCode,
        'Name': material.name,
        'Description': material.description || '-',
        'Category': material.category,
        'Unit': material.unit,
        'Current Stock': material.currentStock,
        'Reorder Level': material.reorderLevel,
        'Unit Price (₹)': parseFloat(material.unitPrice || 0),
        'Stock Value (₹)': parseFloat(calculateStockValue(material.currentStock, material.unitPrice)),
        'Supplier': material.supplier || '-',
        'Location': material.location || '-',
        'Status': material.currentStock === 0 ? 'Out of Stock' :
                  isBelowReorderLevel(material.currentStock, material.reorderLevel) ? 'Low Stock' : 'In Stock'
      }));

      const filename = `Materials_Inventory_${new Date().toISOString().split('T')[0]}`;
      exportToExcel(exportData, filename, 'Materials');
      showToast('Materials exported to Excel successfully', 'success');
    } catch (error) {
      console.error('Error exporting materials to Excel:', error);
      showToast('Failed to export materials to Excel', 'danger');
    }
  };

  // Handle export to PDF
  const handleExportPDF = () => {
    try {
      const filename = `Materials_Inventory_${new Date().toISOString().split('T')[0]}`;
      exportMaterialsToPDF(filteredMaterials, filename);
      showToast('Materials exported to PDF successfully', 'success');
    } catch (error) {
      console.error('Error exporting materials to PDF:', error);
      showToast('Failed to export materials to PDF', 'danger');
    }
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
              Total Materials
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: '#1a202c' }}>
              {summaryStats.totalMaterials}
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
                <AlertTriangle className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Low Stock Alerts
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: '#1a202c' }}>
              {summaryStats.lowStockCount}
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
                <BarChart3 className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Total Inventory Value
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '1.5rem', color: '#1a202c' }}>
              ₹{summaryStats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <TrendingDown className="text-white" size={24} />
              </div>
            </div>
            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600' }}>
              Out of Stock
            </h6>
            <h2 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: '#1a202c' }}>
              {summaryStats.outOfStockCount}
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
          <div className="col-md-4">
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
                placeholder="Search materials by name or code..."
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

          {/* Category Filter */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <option value="all">All Categories</option>
              {MATERIAL_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                borderRadius: '8px',
                borderColor: '#e2e8f0',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock</option>
              <option value="value">Sort by Value</option>
              <option value="date">Sort by Date Added</option>
            </select>
          </div>

          {/* Low Stock Toggle */}
          <div className="col-md-3">
            <div className="form-check form-switch d-flex align-items-center">
              <input
                className="form-check-input me-2"
                type="checkbox"
                id="lowStockFilter"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                style={{
                  width: '48px',
                  height: '24px',
                  cursor: 'pointer'
                }}
              />
              <label className="form-check-label" htmlFor="lowStockFilter" style={{
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                color: '#4a5568'
              }}>
                Show Low Stock Only
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render premium materials table
  const renderMaterialsTable = () => (
    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3 px-4" style={{
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
      }}>
        <h5 className="mb-0 fw-bold" style={{ color: '#1a202c', fontSize: '1.1rem' }}>
          Materials Inventory
        </h5>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Material Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Unit Price</th>
                <th>Stock Value</th>
                <th>Storage Location</th>
                <th>User Entry Details</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMaterials.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-4 text-muted">
                    No materials found. Click "Add Material" to get started.
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map(material => {
                  const stockValue = calculateStockValue(material.currentStock, material.unitPrice);
                  const isLowStock = isBelowReorderLevel(material.currentStock, material.reorderLevel);
                  const statusColor = getMaterialStatusColor(material.currentStock, material.reorderLevel);

                  return (
                    <tr key={material.id}>
                      <td className="fw-semibold">{material.materialCode}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{material.name}</div>
                          {material.description && (
                            <small className="text-muted">{material.description}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{material.category}</span>
                      </td>
                      <td>
                        <span className={`fw-semibold ${isLowStock ? 'text-warning' : ''}`}>
                          {formatStockQuantity(material.currentStock, material.unit)}
                        </span>
                      </td>
                      <td className="text-muted">
                        {formatStockQuantity(material.reorderLevel, material.unit)}
                      </td>
                      <td>₹{parseFloat(material.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="fw-semibold">₹{stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                          {material.location || '-'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {material.createdBy && (
                            <div className="text-muted">
                              <span className="fw-medium text-dark">Created:</span> {material.createdBy}
                              {material.createdAt && (
                                <div className="small" style={{ fontSize: '0.75rem' }}>
                                  {new Date(material.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {material.updatedBy && material.updatedBy !== material.createdBy && (
                            <div className="text-muted mt-1">
                              <span className="fw-medium text-dark">Updated:</span> {material.updatedBy}
                              {material.updatedAt && (
                                <div className="small" style={{ fontSize: '0.75rem' }}>
                                  {new Date(material.updatedAt).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {!material.createdBy && !material.updatedBy && (
                            <span className="text-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${statusColor}`}>
                          {material.currentStock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditMaterial(material)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteMaterial(material.id)}
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

      {/* Pagination */}
      {filteredMaterials.length > 0 && (
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
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-muted small">
                entries (Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length})
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
                    // Show first page, last page, current page, and pages around current
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
                    Materials Management
                  </h2>
                </div>
                <p className="mb-0" style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.95rem' }}>
                  Manage inventory, track stock levels, and control material costs
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
                  onClick={handleAddMaterial}
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
                  Add Material
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

      {/* Materials Table */}
      {renderMaterialsTable()}

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

      {/* Material Form Modal */}
      <MaterialFormModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default MaterialsPage;
