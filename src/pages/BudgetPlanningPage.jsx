import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Calculator,
  Search,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  CATEGORY_TYPES,
  calculateUtilization,
  calculateVariance,
  getUtilizationColor
} from '../utils/budgetUtils';
import { formatCurrency } from '../utils/changeOrderUtils';
import { deleteProjectBudget } from '../db/dexieDB';
import BudgetPlanningModal from '../components/budget/BudgetPlanningModal';

const BudgetPlanningPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allBudgets = useMemo(() => data.projectBudgets || [], [data.projectBudgets]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const budgetLineItems = useMemo(() => data.budgetLineItems || [], [data.budgetLineItems]);

  // Get project name
  const getProjectName = (projectId) => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Calculate total budget for a project
  const calculateTotalBudget = (budgetId) => {
    const items = budgetLineItems.filter(item => item.budgetId === budgetId);
    return items.reduce((sum, item) => sum + (parseFloat(item.budgetAmount) || 0), 0);
  };

  // Calculate total actual cost for a project
  const calculateTotalActualCost = (budgetId) => {
    const items = budgetLineItems.filter(item => item.budgetId === budgetId);
    return items.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0);
  };

  // Filter and sort budgets
  const filteredBudgets = useMemo(() => {
    let filtered = allBudgets.filter(b => b.isActive);

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(b => b.projectId === parseInt(selectedProject));
    }

    // Category filter (filter by line items)
    if (selectedCategory !== 'all') {
      const budgetIdsWithCategory = budgetLineItems
        .filter(item => item.category === selectedCategory)
        .map(item => item.budgetId);
      filtered = filtered.filter(b => budgetIdsWithCategory.includes(b.id));
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(b => {
        const projectName = getProjectName(b.projectId).toLowerCase();
        const budgetName = (b.budgetName || '').toLowerCase();
        return (
          projectName.includes(searchQuery.toLowerCase()) ||
          budgetName.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by created date descending
    return [...filtered].sort((a, b) =>
      new Date(b.createdDate) - new Date(a.createdDate)
    );
  }, [allBudgets, selectedProject, selectedCategory, searchQuery, budgetLineItems]);

  // Pagination
  const totalPages = Math.ceil(filteredBudgets.length / itemsPerPage);
  const paginatedBudgets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBudgets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBudgets, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalBudgets = allBudgets.filter(b => b.isActive).length;
    const totalBudgetAmount = allBudgets
      .filter(b => b.isActive)
      .reduce((sum, b) => sum + calculateTotalBudget(b.id), 0);
    const totalActualCost = allBudgets
      .filter(b => b.isActive)
      .reduce((sum, b) => sum + calculateTotalActualCost(b.id), 0);
    const totalVariance = totalBudgetAmount - totalActualCost;
    const budgetsOverBudget = allBudgets.filter(b => {
      if (!b.isActive) return false;
      const budget = calculateTotalBudget(b.id);
      const actual = calculateTotalActualCost(b.id);
      return actual > budget;
    }).length;

    return { totalBudgets, totalBudgetAmount, totalActualCost, totalVariance, budgetsOverBudget };
  }, [allBudgets, budgetLineItems]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add budget
  const handleAddBudget = () => {
    setSelectedBudget(null);
    setShowAddModal(true);
  };

  // Handle edit budget
  const handleEditBudget = (budget) => {
    setSelectedBudget(budget);
    setShowAddModal(true);
  };

  // Handle delete budget
  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget? This will also delete all associated line items.')) {
      try {
        await deleteProjectBudget(budgetId);
        showToast('Budget deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting budget:', error);
        showToast('Failed to delete budget', 'danger');
      }
    }
  };

  // Handle modal success
  const handleModalSuccess = (message) => {
    showToast(message, 'success');
  };

  // Get utilization badge
  const getUtilizationBadge = (budget, actual) => {
    const utilization = calculateUtilization(actual, budget);
    const color = getUtilizationColor(utilization);

    return (
      <span className={`badge bg-${color}`}>
        {utilization.toFixed(1)}%
      </span>
    );
  };

  // Get variance badge
  const getVarianceBadge = (variance) => {
    const isPositive = variance >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'success' : 'danger';

    return (
      <span className={`badge bg-${color} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {formatCurrency(Math.abs(variance))}
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
                  <Calculator className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Budgets</h6>
                <h3 className="mb-0">{summaryStats.totalBudgets}</h3>
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
                  <DollarSign className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Budget</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalBudgetAmount)}</h3>
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
                  <TrendingUp className="text-warning" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Actual Cost</h6>
                <h3 className="mb-0">{formatCurrency(summaryStats.totalActualCost)}</h3>
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
                <div className={`bg-${summaryStats.totalVariance >= 0 ? 'success' : 'danger'} bg-opacity-10 rounded p-3`}>
                  {summaryStats.totalVariance >= 0 ? (
                    <CheckCircle className="text-success" size={24} />
                  ) : (
                    <AlertTriangle className="text-danger" size={24} />
                  )}
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Variance</h6>
                <h3 className={`mb-0 text-${summaryStats.totalVariance >= 0 ? 'success' : 'danger'}`}>
                  {formatCurrency(summaryStats.totalVariance)}
                </h3>
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
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search budgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Project Filter */}
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {allProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-md-4">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.values(CATEGORY_TYPES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render budgets table
  const renderBudgetsTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Project Budgets</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <FileSpreadsheet size={16} className="me-1" />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddBudget}>
            <Plus size={16} className="me-1" />
            Create Budget
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Project</th>
                <th>Budget Name</th>
                <th>Total Budget</th>
                <th>Actual Cost</th>
                <th>Variance</th>
                <th>Utilization</th>
                <th>Line Items</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBudgets.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No budgets found. Click "Create Budget" to get started.
                  </td>
                </tr>
              ) : (
                paginatedBudgets.map(budget => {
                  const totalBudget = calculateTotalBudget(budget.id);
                  const totalActual = calculateTotalActualCost(budget.id);
                  const variance = calculateVariance(totalBudget, totalActual);
                  const items = budgetLineItems.filter(item => item.budgetId === budget.id);

                  return (
                    <tr key={budget.id}>
                      <td className="fw-semibold">{getProjectName(budget.projectId)}</td>
                      <td>
                        <div>
                          <div className="fw-medium">{budget.budgetName || 'Main Budget'}</div>
                          <small className="text-muted">
                            Version {budget.version || 1}
                          </small>
                        </div>
                      </td>
                      <td className="fw-semibold text-primary">
                        {formatCurrency(totalBudget)}
                      </td>
                      <td className="fw-semibold">
                        {formatCurrency(totalActual)}
                      </td>
                      <td>
                        {getVarianceBadge(variance)}
                      </td>
                      <td>
                        {getUtilizationBadge(totalBudget, totalActual)}
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {items.length} items
                        </span>
                      </td>
                      <td>
                        {budget.isApproved ? (
                          <span className="badge bg-success d-inline-flex align-items-center gap-1">
                            <CheckCircle size={14} />
                            Approved
                          </span>
                        ) : (
                          <span className="badge bg-warning">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-info"
                            title="View Details"
                          >
                            <PieChart size={14} />
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditBudget(budget)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteBudget(budget.id)}
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
      {totalPages > 1 && (
        <div className="card-footer bg-white border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBudgets.length)} of {filteredBudgets.length} budgets
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
          <h2 className="mb-1">Budget Planning</h2>
          <p className="text-muted mb-0">Create and manage project budgets and cost estimates</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Budgets Table */}
      {renderBudgetsTable()}

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

      {/* Budget Planning Modal */}
      <BudgetPlanningModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        budget={selectedBudget}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default BudgetPlanningPage;
