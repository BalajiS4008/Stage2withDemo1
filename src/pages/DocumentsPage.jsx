import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  FolderOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Eye,
  Share2,
  FileText,
  Image,
  File,
  Archive,
  Clock,
  User,
  Filter
} from 'lucide-react';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  ACCESS_LEVELS,
  getDocumentIcon,
  formatFileSize,
  getFileExtension,
  calculateStorageUsage,
  searchDocuments
} from '../utils/documentUtils';
import { deleteDocument } from '../db/dexieDB';

const DocumentsPage = () => {
  const { data, user } = useData();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get data
  const allDocuments = useMemo(() => data.documents || [], [data.documents]);
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const documentVersions = useMemo(() => data.documentVersions || [], [data.documentVersions]);

  // Get project name
  const getProjectName = (projectId) => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Get latest version number
  const getLatestVersion = (documentId) => {
    const versions = documentVersions.filter(v => v.documentId === documentId);
    if (versions.length === 0) return '1.0';
    const latestVersion = versions.reduce((max, v) => {
      const vNum = parseFloat(v.versionNumber);
      return vNum > max ? vNum : max;
    }, 1.0);
    return latestVersion.toFixed(1);
  };

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments;

    // Only show active documents by default
    if (selectedStatus === 'all') {
      filtered = filtered.filter(d => d.status === DOCUMENT_STATUS.ACTIVE);
    } else {
      filtered = filtered.filter(d => d.status === selectedStatus);
    }

    // Project filter
    if (selectedProject !== 'all') {
      filtered = filtered.filter(d => d.projectId === parseInt(selectedProject));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(d => {
        const projectName = getProjectName(d.projectId).toLowerCase();
        const fileName = (d.fileName || '').toLowerCase();
        const description = (d.description || '').toLowerCase();
        const tags = (d.tags || []).join(' ').toLowerCase();
        return (
          projectName.includes(searchQuery.toLowerCase()) ||
          fileName.includes(searchQuery.toLowerCase()) ||
          description.includes(searchQuery.toLowerCase()) ||
          tags.includes(searchQuery.toLowerCase())
        );
      });
    }

    // Sort by uploaded date descending
    return [...filtered].sort((a, b) =>
      new Date(b.uploadedDate) - new Date(a.uploadedDate)
    );
  }, [allDocuments, selectedProject, selectedCategory, selectedStatus, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocuments, currentPage, itemsPerPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalDocuments = allDocuments.filter(d => d.status === DOCUMENT_STATUS.ACTIVE).length;
    const totalSize = allDocuments
      .filter(d => d.status === DOCUMENT_STATUS.ACTIVE)
      .reduce((sum, d) => sum + (parseFloat(d.fileSize) || 0), 0);
    const recentUploads = allDocuments.filter(d => {
      const uploadDate = new Date(d.uploadedDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return uploadDate >= weekAgo && d.status === DOCUMENT_STATUS.ACTIVE;
    }).length;
    const totalCategories = new Set(allDocuments.map(d => d.category)).size;

    return { totalDocuments, totalSize, recentUploads, totalCategories };
  }, [allDocuments]);

  // Show toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Handle add document
  const handleAddDocument = () => {
    setSelectedDocument(null);
    setShowAddModal(true);
  };

  // Handle edit document
  const handleEditDocument = (document) => {
    setSelectedDocument(document);
    setShowAddModal(true);
  };

  // Handle delete document
  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(documentId);
        showToast('Document deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting document:', error);
        showToast('Failed to delete document', 'danger');
      }
    }
  };

  // Handle view document
  const handleViewDocument = (document) => {
    // In a real app, this would open the document viewer
    showToast('Document viewer will be implemented', 'info');
  };

  // Handle download document
  const handleDownloadDocument = (document) => {
    // In a real app, this would trigger download
    showToast('Document download will be implemented', 'info');
  };

  // Handle share document
  const handleShareDocument = (document) => {
    // In a real app, this would open share modal
    showToast('Document sharing will be implemented', 'info');
  };

  // Get category badge color
  const getCategoryColor = (category) => {
    const colors = {
      [DOCUMENT_CATEGORIES.CONTRACT]: 'primary',
      [DOCUMENT_CATEGORIES.PERMIT]: 'success',
      [DOCUMENT_CATEGORIES.DRAWING]: 'info',
      [DOCUMENT_CATEGORIES.SPECIFICATION]: 'warning',
      [DOCUMENT_CATEGORIES.INVOICE]: 'danger',
      [DOCUMENT_CATEGORIES.PHOTO]: 'secondary',
      [DOCUMENT_CATEGORIES.REPORT]: 'dark',
      [DOCUMENT_CATEGORIES.CERTIFICATE]: 'success',
      [DOCUMENT_CATEGORIES.CORRESPONDENCE]: 'info',
      [DOCUMENT_CATEGORIES.OTHER]: 'secondary'
    };
    return colors[category] || 'secondary';
  };

  // Get file icon
  const getFileIcon = (fileName) => {
    const ext = getFileExtension(fileName);
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return <Image size={20} className="text-primary" />;
    } else if (['.pdf'].includes(ext)) {
      return <FileText size={20} className="text-danger" />;
    } else if (['.doc', '.docx'].includes(ext)) {
      return <FileText size={20} className="text-info" />;
    } else if (['.xls', '.xlsx'].includes(ext)) {
      return <FileText size={20} className="text-success" />;
    } else if (['.zip', '.rar'].includes(ext)) {
      return <Archive size={20} className="text-warning" />;
    } else {
      return <File size={20} className="text-secondary" />;
    }
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
                  <FolderOpen className="text-primary" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Documents</h6>
                <h3 className="mb-0">{summaryStats.totalDocuments}</h3>
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
                  <Archive className="text-info" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Total Storage</h6>
                <h3 className="mb-0">{formatFileSize(summaryStats.totalSize)}</h3>
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
                  <Clock className="text-success" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Recent Uploads</h6>
                <h3 className="mb-0">{summaryStats.recentUploads}</h3>
                <small className="text-muted">Last 7 days</small>
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
                  <Filter className="text-warning" size={24} />
                </div>
              </div>
              <div className="flex-grow-1 ms-3">
                <h6 className="text-muted mb-1">Categories</h6>
                <h3 className="mb-0">{summaryStats.totalCategories}</h3>
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
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.values(DOCUMENT_CATEGORIES).map(category => (
                <option key={category} value={category}>{category}</option>
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
              <option value="all">Active Only</option>
              {Object.values(DOCUMENT_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render documents table
  const renderDocumentsTable = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Documents</h5>
        <button className="btn btn-primary btn-sm" onClick={handleAddDocument}>
          <Plus size={16} className="me-1" />
          Upload Document
        </button>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '50px' }}>Type</th>
                <th>File Name</th>
                <th>Project</th>
                <th>Category</th>
                <th>Size</th>
                <th>Version</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDocuments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No documents found. Click "Upload Document" to get started.
                  </td>
                </tr>
              ) : (
                paginatedDocuments.map(document => {
                  const version = getLatestVersion(document.id);

                  return (
                    <tr key={document.id}>
                      <td className="text-center">
                        {getFileIcon(document.fileName)}
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span className="fw-semibold">{document.fileName}</span>
                          {document.description && (
                            <small className="text-muted text-truncate" style={{ maxWidth: '250px' }}>
                              {document.description}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{getProjectName(document.projectId)}</td>
                      <td>
                        <span className={`badge bg-${getCategoryColor(document.category)}`}>
                          {document.category}
                        </span>
                      </td>
                      <td className="text-muted">
                        {formatFileSize(document.fileSize)}
                      </td>
                      <td>
                        <span className="badge bg-secondary">v{version}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <User size={14} className="text-muted" />
                          <small>{document.uploadedBy || 'Unknown'}</small>
                        </div>
                      </td>
                      <td>
                        {new Date(document.uploadedDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewDocument(document)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleDownloadDocument(document)}
                            title="Download"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => handleShareDocument(document)}
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-warning"
                            onClick={() => handleEditDocument(document)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteDocument(document.id)}
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} of {filteredDocuments.length} documents
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
          <h2 className="mb-1">Document Management</h2>
          <p className="text-muted mb-0">Organize and manage project documents with version control</p>
        </div>
      </div>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Filters */}
      {renderFilters()}

      {/* Documents Table */}
      {renderDocumentsTable()}

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

      {/* TODO: Add Document Upload Modal */}
    </div>
  );
};

export default DocumentsPage;
