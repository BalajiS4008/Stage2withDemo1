import React, { useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Tag, Lock, Briefcase, Building2, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToCSV, formatDepartmentsForExport, showExportSuccess, showExportError } from '../utils/exportUtils';

const Departments = () => {
  const { currentProject, addDepartment, deleteDepartment } = useData();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [departmentName, setDepartmentName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!departmentName.trim()) {
      alert('Please enter a department name');
      return;
    }

    if (!currentProject) {
      alert('Please select a project first');
      return;
    }

    // Check if department already exists
    const exists = currentProject.departments.some(
      d => d.name.toLowerCase() === departmentName.trim().toLowerCase()
    );

    if (exists) {
      alert('A department with this name already exists');
      return;
    }

    addDepartment(departmentName.trim());
    setDepartmentName('');
    setShowModal(false);
  };

  const handleDelete = (id, isDefault) => {
    if (isDefault) {
      alert('Cannot delete default departments');
      return;
    }

    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartment(id);
    }
  };

  // Count expenses per department
  const getExpenseCount = (departmentId) => {
    if (!currentProject) return 0;
    return currentProject.paymentsOut.filter(p => p.departmentId === departmentId).length;
  };

  // Export handlers
  const handleExportToExcel = useCallback(() => {
    if (!currentProject || currentProject.departments.length === 0) {
      showExportError('No data to export');
      return;
    }

    const formattedData = formatDepartmentsForExport(currentProject.departments);
    const success = exportToExcel(
      formattedData,
      `Departments_${currentProject.name}_${new Date().toISOString().split('T')[0]}`,
      'Departments'
    );

    if (success) {
      showExportSuccess(`Exported ${currentProject.departments.length} department(s) to Excel`);
    } else {
      showExportError('Failed to export to Excel');
    }
  }, [currentProject]);

  const handleExportToCSV = useCallback(() => {
    if (!currentProject || currentProject.departments.length === 0) {
      showExportError('No data to export');
      return;
    }

    const formattedData = formatDepartmentsForExport(currentProject.departments);
    const success = exportToCSV(
      formattedData,
      `Departments_${currentProject.name}_${new Date().toISOString().split('T')[0]}`
    );

    if (success) {
      showExportSuccess(`Exported ${currentProject.departments.length} department(s) to CSV`);
    } else {
      showExportError('Failed to export to CSV');
    }
  }, [currentProject]);

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600">Please select a construction project first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-600">{currentProject.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage expense categories and departments</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative group">
            <button
              className="btn btn-secondary flex items-center gap-2 justify-center w-full sm:w-auto"
              title="Export data"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Export
            </button>
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-2">
                <button
                  onClick={handleExportToExcel}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Export to Excel
                </button>
                <button
                  onClick={handleExportToCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  Export to CSV
                </button>
              </div>
            </div>
          </div>
          {isAdmin() && (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2 justify-center text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Add</span>
              <span className="hidden sm:inline">Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Notice */}
      {!isAdmin() && (
        <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-900">Admin Access Required</h3>
              <p className="text-warning-700 mt-1">
                Only administrators can add or delete departments. Please contact your admin if you need to modify departments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentProject.departments.map((dept) => {
          const expenseCount = getExpenseCount(dept.id);
          
          return (
            <div
              key={dept.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Briefcase className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{dept.name}</h3>
                    {dept.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Tag className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                </div>
                {!dept.isDefault && isAdmin() && (
                  <button
                    onClick={() => handleDelete(dept.id, dept.isDefault)}
                    className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-gray-900">{expenseCount}</span>
                </div>
              </div>
            </div>
          );
        })}

        {currentProject.departments.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No departments available</p>
            {isAdmin() && (
              <p className="text-sm mt-1">Click "Add Department" to create your first department</p>
            )}
          </div>
        )}
      </div>

      {/* Default Departments Info */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Default Departments
        </h3>
        <p className="text-primary-800 text-sm mb-3">
          The following departments are included by default and cannot be deleted:
        </p>
        <div className="flex flex-wrap gap-2">
          {currentProject.departments
            .filter(d => d.isDefault)
            .map(dept => (
              <span
                key={dept.id}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
              >
                {dept.name}
              </span>
            ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add New Department
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Department Name *</label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="input"
                    placeholder="e.g., Carpentry, Roofing, etc."
                    required
                    autoFocus
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter a unique name for the department
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    Add Department
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDepartmentName('');
                      setShowModal(false);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;

