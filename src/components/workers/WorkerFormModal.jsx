import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { X, AlertCircle } from 'lucide-react';
import {
  WORKER_TYPES,
  SKILL_CATEGORIES,
  WORKER_STATUS,
  WAGE_TYPES,
  generateWorkerCode
} from '../../utils/laborUtils';
import {
  getWorkers
} from '../../db/dexieDB';

const WorkerFormModal = ({ show, onClose, worker, onSuccess }) => {
  const { data, user, addWorker: addWorkerToContext, updateWorker: updateWorkerInContext } = useData();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    workerCode: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    workerType: WORKER_TYPES.PERMANENT,
    skillCategory: '',
    wageType: WAGE_TYPES.DAILY,
    wageRate: 0,
    currentProject: '',
    joiningDate: new Date().toISOString().split('T')[0],
    aadharNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    bankIFSC: '',
    emergencyContact: '',
    emergencyContactName: '',
    status: WORKER_STATUS.ACTIVE,
    notes: ''
  });

  // Get active projects
  const activeProjects = (data.projects || []).filter(p => p.status === 'Active');

  // Initialize form when worker prop changes
  useEffect(() => {
    if (worker) {
      setFormData({
        workerCode: worker.workerCode || '',
        name: worker.name || '',
        phone: worker.phone || '',
        email: worker.email || '',
        address: worker.address || '',
        workerType: worker.workerType || WORKER_TYPES.PERMANENT,
        skillCategory: worker.skillCategory || '',
        wageType: worker.wageType || WAGE_TYPES.DAILY,
        wageRate: worker.wageRate || 0,
        currentProject: worker.currentProject || '',
        joiningDate: worker.joiningDate || new Date().toISOString().split('T')[0],
        aadharNumber: worker.aadharNumber || '',
        panNumber: worker.panNumber || '',
        bankAccountNumber: worker.bankAccountNumber || '',
        bankIFSC: worker.bankIFSC || '',
        emergencyContact: worker.emergencyContact || '',
        emergencyContactName: worker.emergencyContactName || '',
        status: worker.status || WORKER_STATUS.ACTIVE,
        notes: worker.notes || ''
      });
    } else {
      // Generate worker code for new worker
      const generateCode = async () => {
        const existingWorkers = await getWorkers(user.id, user.role === 'admin');
        const newCode = generateWorkerCode(existingWorkers);
        setFormData(prev => ({ ...prev, workerCode: newCode }));
      };
      generateCode();
    }
  }, [worker, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Worker name is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.workerType) {
      newErrors.workerType = 'Worker type is required';
    }

    if (!formData.skillCategory) {
      newErrors.skillCategory = 'Skill category is required';
    }

    if (!formData.wageType) {
      newErrors.wageType = 'Wage type is required';
    }

    const wageRate = parseFloat(formData.wageRate);
    if (isNaN(wageRate) || wageRate <= 0) {
      newErrors.wageRate = 'Wage rate must be greater than 0';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
      newErrors.aadharNumber = 'Aadhar number must be 12 digits';
    }

    if (formData.panNumber && !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.panNumber.toUpperCase())) {
      newErrors.panNumber = 'Invalid PAN format (e.g., ABCDE1234F)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const workerData = {
        ...formData,
        wageRate: parseFloat(formData.wageRate),
        currentProject: formData.currentProject ? parseInt(formData.currentProject) : null,
        phone: formData.phone.replace(/\D/g, ''),
        panNumber: formData.panNumber.toUpperCase(),
        aadharNumber: formData.aadharNumber.replace(/\s/g, '')
      };

      if (worker) {
        // Update existing worker using DataContext
        await updateWorkerInContext(worker.id, workerData);
      } else {
        // Add new worker using DataContext
        await addWorkerToContext(workerData);
      }

      onSuccess(worker ? 'Worker updated successfully' : 'Worker added successfully');
      handleClose();
    } catch (error) {
      console.error('Error saving worker:', error);
      setErrors({ submit: 'Failed to save worker. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      workerCode: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      workerType: WORKER_TYPES.PERMANENT,
      skillCategory: '',
      wageType: WAGE_TYPES.DAILY,
      wageRate: 0,
      currentProject: '',
      joiningDate: new Date().toISOString().split('T')[0],
      aadharNumber: '',
      panNumber: '',
      bankAccountNumber: '',
      bankIFSC: '',
      emergencyContact: '',
      emergencyContactName: '',
      status: WORKER_STATUS.ACTIVE,
      notes: ''
    });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1050 }}
        tabIndex="-1"
        role="dialog"
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                {worker ? 'Edit Worker' : 'Add New Worker'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                disabled={loading}
              />
            </div>

            {/* Body */}
            <div className="modal-body">
              <form onSubmit={handleSubmit} id="workerForm">
                {/* Error Alert */}
                {errors.submit && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <AlertCircle size={20} className="me-2" />
                    {errors.submit}
                  </div>
                )}

                {/* Basic Information */}
                <h6 className="border-bottom pb-2 mb-3">Basic Information</h6>

                {/* Worker Code */}
                <div className="mb-3">
                  <label className="form-label">Worker Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.workerCode}
                    readOnly
                  />
                  <small className="form-text text-muted">
                    Auto-generated unique code
                  </small>
                </div>

                <div className="row">
                  {/* Name */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      disabled={loading}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      disabled={loading}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  {/* Email */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                  </div>

                  {/* Joining Date */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Joining Date</label>
                    <input
                      type="date"
                      className="form-control"
                      name="joiningDate"
                      value={formData.joiningDate}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Full address"
                    disabled={loading}
                  />
                </div>

                {/* Employment Details */}
                <h6 className="border-bottom pb-2 mb-3 mt-4">Employment Details</h6>

                <div className="row">
                  {/* Worker Type */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Worker Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.workerType ? 'is-invalid' : ''}`}
                      name="workerType"
                      value={formData.workerType}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Type</option>
                      {Object.values(WORKER_TYPES).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.workerType && (
                      <div className="invalid-feedback">{errors.workerType}</div>
                    )}
                  </div>

                  {/* Skill Category */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Skill Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.skillCategory ? 'is-invalid' : ''}`}
                      name="skillCategory"
                      value={formData.skillCategory}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Skill</option>
                      {SKILL_CATEGORIES.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                    {errors.skillCategory && (
                      <div className="invalid-feedback">{errors.skillCategory}</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      {Object.values(WORKER_STATUS).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  {/* Wage Type */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Wage Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.wageType ? 'is-invalid' : ''}`}
                      name="wageType"
                      value={formData.wageType}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      {Object.values(WAGE_TYPES).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.wageType && (
                      <div className="invalid-feedback">{errors.wageType}</div>
                    )}
                  </div>

                  {/* Wage Rate */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Wage Rate (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.wageRate ? 'is-invalid' : ''}`}
                      name="wageRate"
                      value={formData.wageRate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {errors.wageRate && (
                      <div className="invalid-feedback">{errors.wageRate}</div>
                    )}
                  </div>

                  {/* Current Project */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Current Project</label>
                    <select
                      className="form-select"
                      name="currentProject"
                      value={formData.currentProject}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Unassigned</option>
                      {activeProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Identity & Banking Details */}
                <h6 className="border-bottom pb-2 mb-3 mt-4">Identity & Banking Details</h6>

                <div className="row">
                  {/* Aadhar Number */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Aadhar Number</label>
                    <input
                      type="text"
                      className={`form-control ${errors.aadharNumber ? 'is-invalid' : ''}`}
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleChange}
                      placeholder="XXXX XXXX XXXX"
                      maxLength="14"
                      disabled={loading}
                    />
                    {errors.aadharNumber && (
                      <div className="invalid-feedback">{errors.aadharNumber}</div>
                    )}
                  </div>

                  {/* PAN Number */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">PAN Number</label>
                    <input
                      type="text"
                      className={`form-control ${errors.panNumber ? 'is-invalid' : ''}`}
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength="10"
                      disabled={loading}
                    />
                    {errors.panNumber && (
                      <div className="invalid-feedback">{errors.panNumber}</div>
                    )}
                  </div>
                </div>

                <div className="row">
                  {/* Bank Account Number */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={handleChange}
                      placeholder="Account number"
                      disabled={loading}
                    />
                  </div>

                  {/* Bank IFSC */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Bank IFSC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      name="bankIFSC"
                      value={formData.bankIFSC}
                      onChange={handleChange}
                      placeholder="IFSC code"
                      maxLength="11"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <h6 className="border-bottom pb-2 mb-3 mt-4">Emergency Contact</h6>

                <div className="row">
                  {/* Emergency Contact Name */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      placeholder="Name of emergency contact"
                      disabled={loading}
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      placeholder="Emergency contact number"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Additional notes or remarks"
                    disabled={loading}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="workerForm"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  worker ? 'Update Worker' : 'Add Worker'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkerFormModal;
