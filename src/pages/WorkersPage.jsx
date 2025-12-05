import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Briefcase,
  Phone,
  MapPin,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  WORKER_TYPES,
  SKILL_CATEGORIES,
  WORKER_STATUS,
  generateWorkerCode,
  getWorkerStatusColor,
  getWorkerTypeColor,
  formatPhoneNumber,
  calculateWorkerStats
} from '../utils/laborUtils';
import { deleteWorker } from '../db/dexieDB';
import WorkerFormModal from '../components/workers/WorkerFormModal';

const WorkersPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allWorkers = useMemo(() => data.workers || [], [data.workers]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);

  // Get project name
  const getProjectName = (projectId) => {
    if (!projectId) return 'Unassigned';
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Filter and sort workers
  const filteredWorkers = useMemo(() => {
    let filtered = allWorkers;

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(w => w.workerType === selectedType);
    }

    // Skill filter
    if (selectedSkill !== 'all') {
      filtered = filtered.filter(w => w.skillCategory === selectedSkill);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(w => w.status === selectedStatus);
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(w => w.currentProject === parseInt(selectedProject));
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(w =>
        w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.workerCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone?.includes(searchQuery) ||
        w.skillCategory?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by name
    return [...filtered].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allWorkers, selectedType, selectedSkill, selectedStatus, selectedProject, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const paginatedWorkers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWorkers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWorkers, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalWorkers = allWorkers.length;
    const activeWorkers = allWorkers.filter(w => w.status === WORKER_STATUS.ACTIVE).length;
    const permanentWorkers = allWorkers.filter(w => w.workerType === WORKER_TYPES.PERMANENT).length;
    const contractWorkers = allWorkers.filter(w => w.workerType === WORKER_TYPES.CONTRACT).length;

    return { totalWorkers, activeWorkers, permanentWorkers, contractWorkers };
  }, [allWorkers]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add worker
  const handleAddWorker = () => {
    setSelectedWorker(null);
    setShowAddModal(true);
  };

  // Handle edit worker
  const handleEditWorker = (worker) => {
    setSelectedWorker(worker);
    setShowAddModal(true);
  };

  // Handle delete worker
  const handleDeleteWorker = async (workerId) => {
    if (window.confirm('Are you sure you want to delete this worker? This action cannot be undone.')) {
      try {
        await deleteWorker(workerId);
        showToast('Worker deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting worker:', error);
        showToast('Failed to delete worker', 'danger');
      }
    }
  };

  // Handle modal success
  const handleModalSuccess = (message) => {
    showToast(message, 'success');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const color = getWorkerStatusColor(status);
    const Icon = status === WORKER_STATUS.ACTIVE ? UserCheck : UserX;
    return (
      <span className={`badge bg-${color} d-inline-flex align-items-center gap-1`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  // Get worker type badge
  const getTypeBadge = (type) => {
    const color = getWorkerTypeColor(type);
    return (
      <span className={`badge bg-${color}`}>
        {type}
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
                  <Users className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Workers</h6>
                <h3 className="mb-0">{summaryStats.totalWorkers}</h3>
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
                  <UserCheck className="text-success" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Active Workers</h6>
                <h3 className="mb-0">{summaryStats.activeWorkers}</h3>
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
                  <Briefcase className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Permanent</h6>
                <h3 className="mb-0">{summaryStats.permanentWorkers}</h3>
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
                <h6 className="text-muted mb-1">Contract</h6>
                <h3 className="mb-0">{summaryStats.contractWorkers}</h3>
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
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Worker Type Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              {Object.values(WORKER_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Skill Category Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="all">All Skills</option>
              {SKILL_CATEGORIES.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.values(WORKER_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="col-md-3">
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
        </div>
      </div>
    </div>
  );

  // Render workers table
  const renderWorkersTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Workers Directory</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">
            <FileSpreadsheet size={16} className="me-1" />
            Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddWorker}>
            <Plus size={16} className="me-1" />
            Add Worker
          </button>
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Worker Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Skill Category</th>
                <th>Contact</th>
                <th>Current Project</th>
                <th>Wage Rate</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWorkers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No workers found. Click "Add Worker" to get started.
                  </td>
                </tr>
              ) : (
                paginatedWorkers.map(worker => (
                  <tr key={worker.id}>
                    <td className="fw-semibold">{worker.workerCode}</td>
                    <td>
                      <div>
                        <div className="fw-medium">{worker.name}</div>
                        {worker.address && (
                          <small className="text-muted d-flex align-items-center gap-1">
                            <MapPin size={12} />
                            {worker.address}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>{getTypeBadge(worker.workerType)}</td>
                    <td>
                      <span className="badge bg-secondary">{worker.skillCategory}</span>
                    </td>
                    <td>
                      {worker.phone && (
                        <div className="d-flex align-items-center gap-1">
                          <Phone size={14} className="text-muted" />
                          <span>{formatPhoneNumber(worker.phone)}</span>
                        </div>
                      )}
                    </td>
                    <td>{getProjectName(worker.currentProject)}</td>
                    <td className="fw-semibold">
                      ₹{parseFloat(worker.wageRate || 0).toLocaleString('en-IN')}
                      <small className="text-muted d-block">{worker.wageType}</small>
                    </td>
                    <td>{getStatusBadge(worker.status)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => handleEditWorker(worker)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteWorker(worker.id)}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWorkers.length)} of {filteredWorkers.length} workers
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
          <h2 className="mb-1">Workers Management</h2>
          <p className="text-muted mb-0">Manage workforce, skills, and assignments</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Workers Table */}
      {renderWorkersTable()}

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

      {/* Worker Form Modal */}
      <WorkerFormModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedWorker(null);
        }}
        worker={selectedWorker}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default WorkersPage;
