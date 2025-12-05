import { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Building2, CheckCircle, Clock, Pause, TrendingUp, DollarSign, X, MoveUp, MoveDown, Filter, Calendar, FileSpreadsheet, FileText, BarChart3, Grid3x3, List, EyeOff, Sparkles, Target, Award, ArrowUpRight, User, Phone, Mail, MapPin } from 'lucide-react';
import { formatCurrency, getProjectSummary, createMilestone, calculateMilestoneAmount } from '../utils/dataManager';
import { exportToExcel, exportToCSV, exportProjectsToPDF, formatProjectsForExport, showExportSuccess, showExportError } from '../utils/exportUtils';
import ProjectDashboard from '../components/ProjectDashboard';

const Projects = () => {
  const { data, currentProject, addProject, updateProject, deleteProject, setCurrentProject, addParty } = useData();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    totalCommittedAmount: '',
    description: '',
    status: 'active',
    milestones: [],
    customerId: '', // Customer selection
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: ''
  });

  const [newMilestone, setNewMilestone] = useState({
    name: '',
    amountType: 'fixed',
    value: ''
  });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Dashboard and view states
  const [showDashboard, setShowDashboard] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // Default to grid for better luxury feel
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // Default 9 items per page (3x3 grid)

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a project name');
      return;
    }

    if (!formData.totalCommittedAmount || parseFloat(formData.totalCommittedAmount) <= 0) {
      alert('Please enter a valid total committed amount');
      return;
    }

    if (editingProject) {
      updateProject(editingProject.id, formData);
    } else {
      addProject(formData.name, formData.totalCommittedAmount, formData.description, formData.milestones);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      totalCommittedAmount: '',
      description: '',
      status: 'active',
      milestones: [],
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: ''
    });
    setNewMilestone({
      name: '',
      amountType: 'fixed',
      value: ''
    });
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setEditingProject(null);
    setShowModal(false);
    setShowCustomerModal(false);
  };

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;
    const customer = data.parties?.find(p => p.id === customerId && (p.type === 'customer' || p.type === 'both'));

    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        customerAddress: customer.address || ''
      });
    } else {
      setFormData({
        ...formData,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: ''
      });
    }
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (!newCustomer.phone.trim()) {
      alert('Please enter customer phone number');
      return;
    }

    try {
      // Add customer to parties database
      const customerData = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        type: 'customer',
        openingBalance: 0,
        balanceType: 'receivable'
      };

      // Save to database
      const savedCustomer = await addParty(customerData);

      // Set the saved customer in form data
      setFormData({
        ...formData,
        customerId: savedCustomer.id,
        customerName: savedCustomer.name,
        customerPhone: savedCustomer.phone || '',
        customerEmail: savedCustomer.email || '',
        customerAddress: savedCustomer.address || ''
      });

      // Reset new customer form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: ''
      });

      setShowCustomerModal(false);

      // Show success message
      alert('Customer added successfully!');
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Get customers from parties
  const customers = useMemo(() => {
    return data.parties?.filter(p => p.type === 'customer' || p.type === 'both') || [];
  }, [data.parties]);

  // Handle export menu toggle
  const handleExportMenuToggle = () => {
    console.log('Export menu toggle clicked, current state:', showExportMenu);
    setShowExportMenu(!showExportMenu);
    console.log('Export menu toggled to:', !showExportMenu);
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim()) {
      alert('Please enter milestone name');
      return;
    }
    if (!newMilestone.value || parseFloat(newMilestone.value) <= 0) {
      alert('Please enter a valid amount/percentage');
      return;
    }

    const milestone = createMilestone(
      newMilestone.name,
      newMilestone.amountType,
      newMilestone.value,
      formData.milestones.length + 1
    );

    setFormData({
      ...formData,
      milestones: [...formData.milestones, milestone]
    });

    setNewMilestone({
      name: '',
      amountType: 'fixed',
      value: ''
    });
  };

  const handleRemoveMilestone = (milestoneId) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter(m => m.id !== milestoneId)
    });
  };

  const handleMoveMilestone = (index, direction) => {
    const newMilestones = [...formData.milestones];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMilestones.length) return;

    [newMilestones[index], newMilestones[targetIndex]] = [newMilestones[targetIndex], newMilestones[index]];

    // Update order numbers
    newMilestones.forEach((m, i) => {
      m.order = i + 1;
    });

    setFormData({
      ...formData,
      milestones: newMilestones
    });
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      totalCommittedAmount: project.totalCommittedAmount,
      description: project.description || '',
      status: project.status || 'active',
      milestones: project.milestones || []
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project? All associated data will be lost.')) {
      deleteProject(id);
    }
  };

  const handleSelectProject = (projectId) => {
    setCurrentProject(projectId);
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'on-hold':
        return <Pause className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30';
      case 'on-hold':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30';
    }
  };

  // Filter projects based on status, timeline, and specific project
  const filteredProjects = useMemo(() => {
    let filtered = [...data.projects];

    // Specific project filter (for dashboard)
    if (selectedProjectFilter !== 'all') {
      filtered = filtered.filter(project => project.id === selectedProjectFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Timeline filter
    if (timelineFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(project => {
        const createdDate = new Date(project.createdAt);
        const projectDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

        switch (timelineFilter) {
          case 'today':
            return projectDate.getTime() === today.getTime();

          case 'this-week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
            return projectDate >= weekStart && projectDate <= weekEnd;

          case 'this-month':
            return createdDate.getMonth() === now.getMonth() &&
                   createdDate.getFullYear() === now.getFullYear();

          case 'last-month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return createdDate.getMonth() === lastMonth.getMonth() &&
                   createdDate.getFullYear() === lastMonth.getFullYear();

          case 'this-quarter':
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const projectQuarter = Math.floor(createdDate.getMonth() / 3);
            return projectQuarter === currentQuarter &&
                   createdDate.getFullYear() === now.getFullYear();

          case 'this-year':
            return createdDate.getFullYear() === now.getFullYear();

          case 'last-30':
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return createdDate >= thirtyDaysAgo;

          case 'last-90':
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(now.getDate() - 90);
            return createdDate >= ninetyDaysAgo;

          case 'custom':
            if (customDateRange.startDate && customDateRange.endDate) {
              const start = new Date(customDateRange.startDate);
              const end = new Date(customDateRange.endDate);
              end.setHours(23, 59, 59, 999); // Include the entire end date
              return createdDate >= start && createdDate <= end;
            }
            return true;

          default:
            return true;
        }
      });
    }

    return filtered;
  }, [data.projects, statusFilter, timelineFilter, customDateRange, selectedProjectFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Page navigation handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of project list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  };

  // Export handlers
  const handleExportToExcel = useCallback(() => {
    if (filteredProjects.length === 0) {
      showExportError('No data to export');
      return;
    }

    const formattedData = formatProjectsForExport(filteredProjects);
    const success = exportToExcel(
      formattedData,
      `Projects_${new Date().toISOString().split('T')[0]}`,
      'Projects'
    );

    if (success) {
      showExportSuccess(`Exported ${filteredProjects.length} project(s) to Excel`);
    } else {
      showExportError('Failed to export to Excel');
    }
  }, [filteredProjects]);

  const handleExportToCSV = useCallback(() => {
    if (filteredProjects.length === 0) {
      showExportError('No data to export');
      return;
    }

    const formattedData = formatProjectsForExport(filteredProjects);
    const success = exportToCSV(
      formattedData,
      `Projects_${new Date().toISOString().split('T')[0]}`
    );

    if (success) {
      showExportSuccess(`Exported ${filteredProjects.length} project(s) to CSV`);
    } else {
      showExportError('Failed to export to CSV');
    }
  }, [filteredProjects]);

  const handleExportToPDF = useCallback(() => {
    if (filteredProjects.length === 0) {
      showExportError('No data to export');
      return;
    }

    const success = exportProjectsToPDF(
      filteredProjects,
      `Projects_Report_${new Date().toISOString().split('T')[0]}`
    );

    if (success) {
      showExportSuccess(`Exported ${filteredProjects.length} project(s) to PDF`);
    } else {
      showExportError('Failed to export to PDF');
    }
  }, [filteredProjects]);

  // Get filter counts
  const filterCounts = useMemo(() => {
    return {
      all: data.projects.length,
      active: data.projects.filter(p => p.status === 'active').length,
      completed: data.projects.filter(p => p.status === 'completed').length,
      onHold: data.projects.filter(p => p.status === 'on-hold').length
    };
  }, [data.projects]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setStatusFilter('all');
    setTimelineFilter('all');
    setSelectedProjectFilter('all');
    setCustomDateRange({ startDate: '', endDate: '' });
  };

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || timelineFilter !== 'all' || selectedProjectFilter !== 'all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Luxury Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Premium Header Section - Compact & Mobile Optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-xl shadow-2xl">
          {/* Decorative Elements - Subtle */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-500/15 to-amber-600/15 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-500/15 to-cyan-600/15 rounded-full blur-2xl"></div>

          <div className="relative p-5 sm:p-6">
            {/* Title Section */}
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg shadow-amber-500/40">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    Construction Sites
                  </h1>
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <p className="text-blue-200 text-sm font-light">
                  Manage premium projects with excellence
                </p>
              </div>
            </div>

            {/* Elegant Stats Row - Single Row for All Screens */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Projects */}
              <div className="group bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-300/30 hover:border-blue-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Target className="w-5 h-5 text-blue-300" />
                  </div>
                  <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Total</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{filterCounts.all}</p>
                <p className="text-sm text-blue-200 font-medium">Projects</p>
              </div>

              {/* Active Projects */}
              <div className="group bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-300/30 hover:border-emerald-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                    <TrendingUp className="w-5 h-5 text-emerald-300" />
                  </div>
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Active</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{filterCounts.active}</p>
                <p className="text-sm text-emerald-200 font-medium">In Progress</p>
              </div>

              {/* Completed Projects */}
              <div className="group bg-gradient-to-br from-yellow-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-300/30 hover:border-yellow-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                    <Award className="w-5 h-5 text-yellow-300" />
                  </div>
                  <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Done</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{filterCounts.completed}</p>
                <p className="text-sm text-yellow-200 font-medium">Completed</p>
              </div>

              {/* On Hold Projects */}
              <div className="group bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-amber-300/30 hover:border-amber-400/50 transition-all duration-300 hover:transform hover:scale-105">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                    <Pause className="w-5 h-5 text-amber-300" />
                  </div>
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Paused</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{filterCounts.onHold}</p>
                <p className="text-sm text-amber-200 font-medium">On Hold</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel - Single Line */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/50 p-4 overflow-visible relative z-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left Side: View Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dashboard Toggle */}
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  showDashboard
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {showDashboard ? <EyeOff className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{showDashboard ? 'Hide' : 'Show'} Dashboard</span>
                </div>
              </button>

              {/* View Mode Toggle */}
              {!showDashboard && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium text-sm transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden md:inline">List</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium text-sm transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span className="hidden md:inline">Grid</span>
                  </button>
                </div>
              )}

              {/* Filters Button */}
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                  showFilterPanel
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {(statusFilter !== 'all' || timelineFilter !== 'all') && (
                    <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full font-bold">
                      {(statusFilter !== 'all' ? 1 : 0) + (timelineFilter !== 'all' ? 1 : 0)}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={handleExportMenuToggle}
                  className={`px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-semibold text-sm shadow-lg transition-all ${
                    showExportMenu ? 'shadow-teal-500/50 ring-2 ring-teal-300' : 'shadow-teal-500/30 hover:shadow-teal-500/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Export {showExportMenu && '▼'}</span>
                  </div>
                </button>

                {/* Export Dropdown - Using absolute positioning */}
                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-[200]"
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 z-[300] overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-3 py-2">
                        <p className="text-white font-semibold text-xs">Export Options</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleExportToExcel();
                            setShowExportMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-emerald-50 transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-sm font-medium text-gray-900">Excel</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExportToCSV();
                            setShowExportMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-900">CSV</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExportToPDF();
                            setShowExportMenu(false);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-600" />
                          <span className="text-sm font-medium text-gray-900">PDF</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* New Project Button */}
              <button
                onClick={() => setShowModal(true)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-indigo-200 overflow-hidden animate-slide-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Filter className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Advanced Filters</h3>
                </div>
                <button
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <CheckCircle className="w-4 h-4 text-indigo-600" />
                    Project Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                        statusFilter === 'all'
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All ({filterCounts.all})
                    </button>
                    <button
                      onClick={() => setStatusFilter('active')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                        statusFilter === 'active'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Active ({filterCounts.active})
                    </button>
                    <button
                      onClick={() => setStatusFilter('completed')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                        statusFilter === 'completed'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Completed ({filterCounts.completed})
                    </button>
                    <button
                      onClick={() => setStatusFilter('on-hold')}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                        statusFilter === 'on-hold'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      On Hold ({filterCounts.onHold})
                    </button>
                  </div>
                </div>

                {/* Timeline Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Timeline
                  </label>
                  <select
                    value={timelineFilter}
                    onChange={(e) => setTimelineFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-700"
                  >
                    <option value="all">All Time</option>
                    <option value="this-month">This Month</option>
                    <option value="this-quarter">This Quarter</option>
                    <option value="this-year">This Year</option>
                    <option value="last-30">Last 30 Days</option>
                    <option value="last-90">Last 90 Days</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
              </div>

              {/* Specific Project Filter (for Dashboard) */}
              {showDashboard && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Specific Project
                  </label>
                  <select
                    value={selectedProjectFilter}
                    onChange={(e) => setSelectedProjectFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-700"
                  >
                    <option value="all">All Projects</option>
                    {data.projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {selectedProjectFilter !== 'all' && (
                    <p className="text-sm text-indigo-600 mt-2 font-medium">
                      Showing dashboard for: <strong>{data.projects.find(p => p.id === selectedProjectFilter)?.name}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Custom Date Range */}
              {timelineFilter === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      min={customDateRange.startDate}
                    />
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-indigo-900 font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Active Filters:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {statusFilter !== 'all' && (
                      <span className="px-4 py-2 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-md border border-indigo-200">
                        Status: {statusFilter}
                      </span>
                    )}
                    {timelineFilter !== 'all' && (
                      <span className="px-4 py-2 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-md border border-indigo-200">
                        Timeline: {timelineFilter.replace('-', ' ')}
                      </span>
                    )}
                    {selectedProjectFilter !== 'all' && (
                      <span className="px-4 py-2 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-md border border-indigo-200">
                        Project: {data.projects.find(p => p.id === selectedProjectFilter)?.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Project Banner - Compact */}
        {currentProject && (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-xl shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl"></div>
            <div className="relative p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Currently Active Project</p>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{currentProject.name}</h2>
                  {currentProject.description && (
                    <p className="text-blue-100 text-sm mt-1 line-clamp-1">{currentProject.description}</p>
                  )}
                </div>
                <div className="hidden sm:block flex-shrink-0">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                    <Building2 className="w-10 h-10 text-white/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard */}
        {showDashboard ? (
          <ProjectDashboard projects={filteredProjects} />
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between px-2">
              <p className="text-sm font-medium text-gray-600">
                Showing <span className="text-lg font-bold text-indigo-600">{filteredProjects.length}</span> of{' '}
                <span className="text-lg font-bold text-gray-900">{data.projects.length}</span> projects
              </p>
            </div>

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Projects Found</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {statusFilter !== 'all' || timelineFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by creating your first project.'}
                  </p>
                  {hasActiveFilters ? (
                    <button
                      onClick={handleClearAllFilters}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowModal(true)}
                      className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl font-semibold shadow-lg shadow-amber-500/50 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create First Project
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
                }>
                  {paginatedProjects.map((project) => {
                  const summary = getProjectSummary(project);
                  const isActive = currentProject?.id === project.id;

                return (
                  <div
                    key={project.id}
                    className={`group relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl ${
                      isActive
                        ? 'border-amber-400 shadow-amber-500/30 ring-4 ring-amber-400/20'
                        : 'border-transparent hover:border-indigo-300'
                    }`}
                    onClick={() => handleSelectProject(project.id)}
                  >
                    {/* Gradient Top Border */}
                    <div className={`h-1.5 ${isActive ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600' : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500'}`}></div>

                    <div className="p-6">
                      {/* Project Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-3 rounded-xl ${isActive ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : 'bg-gradient-to-br from-indigo-500 to-blue-600'} shadow-lg`}>
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-xl text-gray-900 truncate mb-1">{project.name}</h3>
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(project.status)}`}>
                                {getStatusIcon(project.status)}
                                <span className="uppercase tracking-wide">{project.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 hover:scale-110"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Project Stats */}
                      {isAdmin() ? (
                        <div className="space-y-4">
                          {/* Total Contract */}
                          <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Total Contract</span>
                              <DollarSign className="w-5 h-5 text-indigo-600" />
                            </div>
                            <p className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                              {formatCurrency(summary.totalCommitted)}
                            </p>
                          </div>

                          {/* Payment Progress */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Payment Progress</span>
                              <span className="text-sm font-bold text-indigo-600">
                                {summary.percentageReceived.toFixed(1)}%
                              </span>
                            </div>
                            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-500 shadow-lg"
                                style={{ width: `${Math.min(summary.percentageReceived, 100)}%` }}
                              >
                                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 font-medium">
                                Received: <span className="text-emerald-600 font-bold">{formatCurrency(summary.totalReceived)}</span>
                              </span>
                              <span className="text-gray-600 font-medium">
                                Remaining: <span className="text-amber-600 font-bold">{formatCurrency(summary.remainingBalance)}</span>
                              </span>
                            </div>
                          </div>

                          {/* Financial Summary */}
                          <div className="grid grid-cols-2 gap-3 pt-4 border-t-2 border-gray-200">
                            <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                              <p className="text-xs text-red-600 font-bold uppercase tracking-wide mb-1">Expenses</p>
                              <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
                            </div>
                            <div className={`p-3 rounded-xl border-2 ${summary.netBalance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                              <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                Net Balance
                              </p>
                              <p className={`text-lg font-bold ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.netBalance)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Regular User: Basic Info */
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl text-center border border-gray-200">
                          <div className="p-4 bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <Building2 className="w-10 h-10 text-gray-400" />
                          </div>
                          <p className="font-semibold text-gray-700">Project Information</p>
                          <p className="text-xs text-gray-500 mt-2">Financial details are restricted</p>
                        </div>
                      )}

                      {/* Active Indicator */}
                      {isActive && (
                        <div className="mt-5 pt-4 border-t-2 border-amber-200">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active Project</span>
                            <ArrowUpRight className="w-4 h-4 text-amber-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-blue-500/0 group-hover:from-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none rounded-2xl"></div>
                  </div>
                );
                })}
              </div>

              {/* Pagination Controls */}
              {filteredProjects.length > 0 && totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-indigo-100">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 hidden sm:inline">Items per page:</span>
                    <span className="text-sm font-semibold text-gray-700 sm:hidden">Per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="px-4 py-2 rounded-lg border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none bg-white font-medium text-gray-700 transition-all"
                      title="Items per page"
                    >
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                      <option value={18}>18</option>
                      <option value={24}>24</option>
                    </select>
                  </div>

                  {/* Page Info */}
                  <div className="text-sm font-medium text-gray-600 hidden md:block">
                    Showing <span className="font-bold text-indigo-600">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-bold text-indigo-600">{Math.min(currentPage * pageSize, filteredProjects.length)}</span> of{' '}
                    <span className="font-bold text-indigo-600">{filteredProjects.length}</span> projects
                  </div>

                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    {/* First Page Button */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="group relative px-3 py-2 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 text-gray-700"
                      aria-label="First Page"
                    >
                      ««
                      <span className="pagination-tooltip">First Page</span>
                    </button>

                    {/* Previous Page Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="group relative px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 text-gray-700"
                      aria-label="Previous Page"
                    >
                      <span className="hidden sm:inline">« Prev</span>
                      <span className="sm:hidden">«</span>
                      <span className="pagination-tooltip">Previous Page</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`group relative px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                                  : 'hover:bg-indigo-50 text-gray-700'
                              }`}
                              aria-label={`Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                              {currentPage !== pageNum && (
                                <span className="pagination-tooltip">Page {pageNum}</span>
                              )}
                            </button>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return (
                            <span key={pageNum} className="px-2 text-gray-400 flex items-center" title="More pages">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="group relative px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 text-gray-700"
                      aria-label="Next Page"
                    >
                      <span className="hidden sm:inline">Next »</span>
                      <span className="sm:hidden">»</span>
                      <span className="pagination-tooltip">Next Page</span>
                    </button>

                    {/* Last Page Button */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="group relative px-3 py-2 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-50 text-gray-700"
                      aria-label="Last Page"
                    >
                      »»
                      <span className="pagination-tooltip">Last Page</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={resetForm}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-8 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {editingProject ? 'Edit Project' : 'Create New Project'}
                      </h2>
                      <p className="text-blue-100 mt-1">
                        {editingProject ? 'Update project details' : 'Add a new construction site'}
                      </p>
                    </div>
                  </div>
                  {/* Close Button */}
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    type="button"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Customer Selection Section */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-indigo-200">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                      <User className="w-4 h-4 text-indigo-600" />
                      Customer Details
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomerModal(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add New Customer
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Existing Customer</label>
                      <select
                        value={formData.customerId}
                        onChange={handleCustomerSelect}
                        className="w-full px-4 py-2.5 bg-white border-2 border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-sm"
                      >
                        <option value="">-- Select a customer --</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.customerName && (
                      <div className="bg-white p-4 rounded-lg border border-indigo-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-semibold text-gray-700">Name:</span>
                          <span className="text-sm text-gray-900">{formData.customerName}</span>
                        </div>
                        {formData.customerPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-700">Phone:</span>
                            <span className="text-sm text-gray-900">{formData.customerPhone}</span>
                          </div>
                        )}
                        {formData.customerEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-700">Email:</span>
                            <span className="text-sm text-gray-900">{formData.customerEmail}</span>
                          </div>
                        )}
                        {formData.customerAddress && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-indigo-600 mt-0.5" />
                            <span className="text-sm font-semibold text-gray-700">Address:</span>
                            <span className="text-sm text-gray-900 flex-1">{formData.customerAddress}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                    placeholder="e.g., Residential Building - Phase 1"
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    Total Committed Amount (Contract Value) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalCommittedAmount}
                    onChange={(e) => setFormData({ ...formData, totalCommittedAmount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                    placeholder="Enter total contract amount"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    This is the total estimated/agreed construction cost
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                    rows="3"
                    placeholder="Enter project description"
                  />
                </div>

                {/* Project Milestones Section */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                      <Target className="w-5 h-5 text-indigo-600" />
                      Project Milestones / Stages
                    </label>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">Optional</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Define payment stages for this project. You can use fixed amounts or percentages of total project value.
                  </p>

                  {/* Add Milestone Form */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-xl mb-4 space-y-3 border border-indigo-200">
                    <input
                      type="text"
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-indigo-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      placeholder="e.g., G Floor Soil Filling"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newMilestone.amountType}
                        onChange={(e) => setNewMilestone({ ...newMilestone, amountType: e.target.value })}
                        className="px-4 py-3 border-2 border-indigo-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={newMilestone.value}
                        onChange={(e) => setNewMilestone({ ...newMilestone, value: e.target.value })}
                        className="px-4 py-3 border-2 border-indigo-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder={newMilestone.amountType === 'percentage' ? 'e.g., 5' : 'e.g., 20000'}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add Milestone
                      </div>
                    </button>
                  </div>

                  {/* Milestones List */}
                  {formData.milestones.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {formData.milestones.map((milestone, index) => (
                        <div key={milestone.id} className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveMilestone(index, 'up')}
                              disabled={index === 0}
                              className="p-2 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <MoveUp className="w-4 h-4 text-indigo-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveMilestone(index, 'down')}
                              disabled={index === formData.milestones.length - 1}
                              className="p-2 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <MoveDown className="w-4 h-4 text-indigo-600" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {index + 1}. {milestone.name}
                            </p>
                            <p className="text-sm text-gray-600 font-medium">
                              {milestone.amountType === 'percentage'
                                ? `${milestone.value}% ${formData.totalCommittedAmount ? `(${formatCurrency(calculateMilestoneAmount(milestone, formData.totalCommittedAmount))})` : ''}`
                                : formatCurrency(milestone.value)
                              }
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMilestone(milestone.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {editingProject && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Customer Modal */}
        {showCustomerModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            onClick={() => setShowCustomerModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Add New Customer</h3>
                  </div>
                  <button
                    onClick={() => setShowCustomerModal(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    type="button"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-indigo-600" />
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    Address (Optional)
                  </label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    rows="2"
                    placeholder="Enter customer address"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleAddNewCustomer}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all"
                  >
                    Add Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
};

export default Projects;
