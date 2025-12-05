import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  X,
  Save,
  Calculator,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  Users,
  Percent,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  RETENTION_STATUS,
  calculateRetentionAmount,
  calculateScheduledReleaseDate,
  RELEASE_TYPES,
  formatCurrency
} from '../../utils/retentionUtils';
import { addRetentionAccount, updateRetentionAccount } from '../../db/dexieDB';

const AddRetentionModal = ({ show, onClose, retention, onSuccess }) => {
  const { data, user } = useData();

  // Get data
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const allInvoices = useMemo(() => data.invoices || [], [data.invoices]);
  const allParties = useMemo(() => data.parties || [], [data.parties]);

  // Initial form state
  const initialFormData = {
    projectId: '',
    partyId: '',
    invoiceId: '',
    invoiceNumber: '',
    invoiceAmount: '',
    retentionPercentage: '10',
    retentionAmount: '',
    retentionDate: new Date().toISOString().split('T')[0],
    releaseType: RELEASE_TYPES.TIME_BASED,
    defectLiabilityPeriod: '90', // days
    warrantyPeriod: '12', // months
    scheduledReleaseDate: '',
    status: RETENTION_STATUS.ACTIVE,
    description: '',
    terms: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load retention data when editing
  useEffect(() => {
    if (retention && show) {
      setFormData({
        projectId: retention.projectId?.toString() || '',
        partyId: retention.partyId?.toString() || '',
        invoiceId: retention.invoiceId?.toString() || '',
        invoiceNumber: retention.invoiceNumber || '',
        invoiceAmount: retention.invoiceAmount?.toString() || '',
        retentionPercentage: retention.retentionPercentage?.toString() || '10',
        retentionAmount: retention.retentionAmount?.toString() || '',
        retentionDate: retention.retentionDate ? new Date(retention.retentionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        releaseType: retention.releaseType || RELEASE_TYPES.TIME_BASED,
        defectLiabilityPeriod: retention.defectLiabilityPeriod?.toString() || '90',
        warrantyPeriod: retention.warrantyPeriod?.toString() || '12',
        scheduledReleaseDate: retention.scheduledReleaseDate ? new Date(retention.scheduledReleaseDate).toISOString().split('T')[0] : '',
        status: retention.status || RETENTION_STATUS.ACTIVE,
        description: retention.description || '',
        terms: retention.terms || ''
      });
    } else if (!retention && show) {
      setFormData(initialFormData);
      setErrors({});
    }
  }, [retention, show]);

  // Calculate retention amount when invoice amount or percentage changes
  useEffect(() => {
    if (formData.invoiceAmount && formData.retentionPercentage) {
      const amount = calculateRetentionAmount(
        parseFloat(formData.invoiceAmount),
        parseFloat(formData.retentionPercentage)
      );
      setFormData(prev => ({ ...prev, retentionAmount: amount.toFixed(2) }));
    }
  }, [formData.invoiceAmount, formData.retentionPercentage]);

  // Calculate scheduled release date when retention date or period changes
  useEffect(() => {
    if (formData.retentionDate && formData.releaseType) {
      let daysAfter = 0;
      let monthsAfter = 0;

      switch (formData.releaseType) {
        case RELEASE_TYPES.TIME_BASED:
          daysAfter = parseInt(formData.defectLiabilityPeriod) || 0;
          break;
        case RELEASE_TYPES.WARRANTY_END:
          monthsAfter = parseInt(formData.warrantyPeriod) || 12;
          break;
        case RELEASE_TYPES.ON_COMPLETION:
          // Release on same date as retention date
          daysAfter = 0;
          break;
        default:
          daysAfter = 90;
      }

      const releaseDate = calculateScheduledReleaseDate(
        formData.retentionDate,
        formData.releaseType,
        daysAfter,
        monthsAfter
      );

      setFormData(prev => ({
        ...prev,
        scheduledReleaseDate: releaseDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.retentionDate, formData.releaseType, formData.defectLiabilityPeriod, formData.warrantyPeriod]);

  // Get filtered invoices based on selected project
  const projectInvoices = useMemo(() => {
    if (!formData.projectId) return [];
    return allInvoices.filter(inv => inv.projectId === parseInt(formData.projectId));
  }, [formData.projectId, allInvoices]);

  // Handle invoice selection
  const handleInvoiceSelect = (invoiceId) => {
    const invoice = allInvoices.find(inv => inv.id === parseInt(invoiceId));
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoiceId: invoiceId,
        invoiceNumber: invoice.invoiceNumber || '',
        invoiceAmount: invoice.totalAmount?.toString() || '',
        partyId: invoice.customerId?.toString() || prev.partyId
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        invoiceId: invoiceId,
        invoiceNumber: '',
        invoiceAmount: '',
        partyId: ''
      }));
    }
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }
    if (!formData.partyId) {
      newErrors.partyId = 'Party is required';
    }
    if (!formData.invoiceAmount || parseFloat(formData.invoiceAmount) <= 0) {
      newErrors.invoiceAmount = 'Invoice amount must be greater than 0';
    }
    if (!formData.retentionPercentage || parseFloat(formData.retentionPercentage) <= 0) {
      newErrors.retentionPercentage = 'Retention percentage must be greater than 0';
    }
    if (parseFloat(formData.retentionPercentage) > 20) {
      newErrors.retentionPercentage = 'Retention percentage should not exceed 20%';
    }
    if (!formData.retentionDate) {
      newErrors.retentionDate = 'Retention date is required';
    }
    if (!formData.releaseType) {
      newErrors.releaseType = 'Release type is required';
    }
    if (!formData.scheduledReleaseDate) {
      newErrors.scheduledReleaseDate = 'Scheduled release date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const retentionData = {
        projectId: parseInt(formData.projectId),
        partyId: parseInt(formData.partyId),
        invoiceId: formData.invoiceId ? parseInt(formData.invoiceId) : null,
        invoiceNumber: formData.invoiceNumber || '',
        invoiceAmount: parseFloat(formData.invoiceAmount) || 0,
        retentionPercentage: parseFloat(formData.retentionPercentage) || 0,
        retentionAmount: parseFloat(formData.retentionAmount) || 0,
        retentionDate: formData.retentionDate,
        releaseType: formData.releaseType,
        defectLiabilityPeriod: parseInt(formData.defectLiabilityPeriod) || 0,
        warrantyPeriod: parseInt(formData.warrantyPeriod) || 0,
        scheduledReleaseDate: formData.scheduledReleaseDate,
        status: formData.status,
        description: formData.description || '',
        terms: formData.terms || '',
        createdDate: retention?.createdDate || new Date().toISOString()
      };

      if (retention?.id) {
        await updateRetentionAccount(retention.id, retentionData);
        onSuccess('Retention updated successfully');
      } else {
        await addRetentionAccount(retentionData, user.id);
        onSuccess('Retention added successfully');
      }

      handleClose();
    } catch (error) {
      console.error('Error saving retention:', error);
      setErrors({ submit: 'Failed to save retention. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  // Calculate summary
  const summary = useMemo(() => {
    const invoiceAmt = parseFloat(formData.invoiceAmount) || 0;
    const retentionPct = parseFloat(formData.retentionPercentage) || 0;
    const retentionAmt = parseFloat(formData.retentionAmount) || 0;
    const payableAmount = invoiceAmt - retentionAmt;

    return {
      invoiceAmount: invoiceAmt,
      retentionPercentage: retentionPct,
      retentionAmount: retentionAmt,
      payableAmount: payableAmount,
      daysUntilRelease: formData.scheduledReleaseDate
        ? Math.ceil((new Date(formData.scheduledReleaseDate) - new Date(formData.retentionDate)) / (1000 * 60 * 60 * 24))
        : 0
    };
  }, [formData.invoiceAmount, formData.retentionPercentage, formData.retentionAmount, formData.scheduledReleaseDate, formData.retentionDate]);

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <DollarSign size={20} />
              {retention ? 'Edit Retention' : 'Add Retention'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
              disabled={loading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Error Alert */}
              {errors.submit && (
                <div className="alert alert-danger d-flex align-items-center gap-2">
                  <AlertCircle size={20} />
                  {errors.submit}
                </div>
              )}

              {/* Summary Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card border-0 bg-light h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-muted mb-1">
                        <FileText size={16} />
                        <small>Invoice Amount</small>
                      </div>
                      <h5 className="mb-0 text-dark">{formatCurrency(summary.invoiceAmount)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-warning bg-opacity-10 h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-warning mb-1">
                        <Percent size={16} />
                        <small>Retention ({summary.retentionPercentage}%)</small>
                      </div>
                      <h5 className="mb-0 text-warning">{formatCurrency(summary.retentionAmount)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-success bg-opacity-10 h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-success mb-1">
                        <TrendingUp size={16} />
                        <small>Payable Now</small>
                      </div>
                      <h5 className="mb-0 text-success">{formatCurrency(summary.payableAmount)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-info bg-opacity-10 h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-info mb-1">
                        <Calendar size={16} />
                        <small>Days Until Release</small>
                      </div>
                      <h5 className="mb-0 text-info">{summary.daysUntilRelease} days</h5>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <Building2 size={18} />
                    Basic Information
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {/* Project */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Project <span className="text-danger">*</span>
                      </label>
                      <select
                        name="projectId"
                        className={`form-select ${errors.projectId ? 'is-invalid' : ''}`}
                        value={formData.projectId}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="">Select Project</option>
                        {allProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      {errors.projectId && (
                        <div className="invalid-feedback">{errors.projectId}</div>
                      )}
                    </div>

                    {/* Party */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Party (Customer) <span className="text-danger">*</span>
                      </label>
                      <select
                        name="partyId"
                        className={`form-select ${errors.partyId ? 'is-invalid' : ''}`}
                        value={formData.partyId}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="">Select Party</option>
                        {allParties
                          .filter(p => p.type === 'customer')
                          .map(party => (
                            <option key={party.id} value={party.id}>
                              {party.name}
                            </option>
                          ))}
                      </select>
                      {errors.partyId && (
                        <div className="invalid-feedback">{errors.partyId}</div>
                      )}
                    </div>

                    {/* Invoice Selection (Optional) */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Link to Invoice (Optional)
                      </label>
                      <select
                        name="invoiceId"
                        className="form-select"
                        value={formData.invoiceId}
                        onChange={(e) => handleInvoiceSelect(e.target.value)}
                        disabled={loading || !formData.projectId}
                      >
                        <option value="">Select Invoice (or enter manually)</option>
                        {projectInvoices.map(invoice => (
                          <option key={invoice.id} value={invoice.id}>
                            {invoice.invoiceNumber} - {formatCurrency(invoice.totalAmount)}
                          </option>
                        ))}
                      </select>
                      <small className="text-muted">
                        Select an invoice to auto-fill details, or leave blank to enter manually
                      </small>
                    </div>

                    {/* Invoice Number */}
                    <div className="col-md-6">
                      <label className="form-label">Invoice Number</label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        className="form-control"
                        value={formData.invoiceNumber}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Enter invoice number"
                      />
                    </div>

                    {/* Retention Date */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Retention Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="retentionDate"
                        className={`form-control ${errors.retentionDate ? 'is-invalid' : ''}`}
                        value={formData.retentionDate}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.retentionDate && (
                        <div className="invalid-feedback">{errors.retentionDate}</div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {Object.values(RETENTION_STATUS).map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Retention Calculation */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <Calculator size={18} />
                    Retention Calculation
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {/* Invoice Amount */}
                    <div className="col-md-4">
                      <label className="form-label">
                        Invoice Amount (₹) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="invoiceAmount"
                        className={`form-control ${errors.invoiceAmount ? 'is-invalid' : ''}`}
                        value={formData.invoiceAmount}
                        onChange={handleChange}
                        disabled={loading}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {errors.invoiceAmount && (
                        <div className="invalid-feedback">{errors.invoiceAmount}</div>
                      )}
                    </div>

                    {/* Retention Percentage */}
                    <div className="col-md-4">
                      <label className="form-label">
                        Retention % <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <input
                          type="number"
                          name="retentionPercentage"
                          className={`form-control ${errors.retentionPercentage ? 'is-invalid' : ''}`}
                          value={formData.retentionPercentage}
                          onChange={handleChange}
                          disabled={loading}
                          min="0"
                          max="20"
                          step="0.1"
                          placeholder="10"
                        />
                        <span className="input-group-text">%</span>
                        {errors.retentionPercentage && (
                          <div className="invalid-feedback">{errors.retentionPercentage}</div>
                        )}
                      </div>
                      <small className="text-muted">Typically 5-10%</small>
                    </div>

                    {/* Retention Amount (Auto-calculated) */}
                    <div className="col-md-4">
                      <label className="form-label">Retention Amount (₹)</label>
                      <input
                        type="number"
                        name="retentionAmount"
                        className="form-control bg-light"
                        value={formData.retentionAmount}
                        disabled
                        readOnly
                      />
                      <small className="text-muted">Auto-calculated</small>
                    </div>
                  </div>

                  {/* Quick Percentage Buttons */}
                  <div className="mt-3">
                    <small className="text-muted d-block mb-2">Quick Select:</small>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setFormData(prev => ({ ...prev, retentionPercentage: '5' }))}
                        disabled={loading}
                      >
                        5%
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setFormData(prev => ({ ...prev, retentionPercentage: '10' }))}
                        disabled={loading}
                      >
                        10%
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setFormData(prev => ({ ...prev, retentionPercentage: '15' }))}
                        disabled={loading}
                      >
                        15%
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Release Schedule */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <Calendar size={18} />
                    Release Schedule
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {/* Release Type */}
                    <div className="col-md-12">
                      <label className="form-label">
                        Release Type <span className="text-danger">*</span>
                      </label>
                      <select
                        name="releaseType"
                        className={`form-select ${errors.releaseType ? 'is-invalid' : ''}`}
                        value={formData.releaseType}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {Object.entries(RELEASE_TYPES).map(([key, value]) => (
                          <option key={value} value={value}>
                            {value.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      {errors.releaseType && (
                        <div className="invalid-feedback">{errors.releaseType}</div>
                      )}
                    </div>

                    {/* Defect Liability Period (for TIME_BASED) */}
                    {formData.releaseType === RELEASE_TYPES.TIME_BASED && (
                      <div className="col-md-6">
                        <label className="form-label">Defect Liability Period (Days)</label>
                        <input
                          type="number"
                          name="defectLiabilityPeriod"
                          className="form-control"
                          value={formData.defectLiabilityPeriod}
                          onChange={handleChange}
                          disabled={loading}
                          min="0"
                          placeholder="90"
                        />
                        <small className="text-muted">Release after this many days</small>
                      </div>
                    )}

                    {/* Warranty Period (for WARRANTY_END) */}
                    {formData.releaseType === RELEASE_TYPES.WARRANTY_END && (
                      <div className="col-md-6">
                        <label className="form-label">Warranty Period (Months)</label>
                        <input
                          type="number"
                          name="warrantyPeriod"
                          className="form-control"
                          value={formData.warrantyPeriod}
                          onChange={handleChange}
                          disabled={loading}
                          min="0"
                          placeholder="12"
                        />
                        <small className="text-muted">Release after warranty expires</small>
                      </div>
                    )}

                    {/* Scheduled Release Date */}
                    <div className="col-md-6">
                      <label className="form-label">
                        Scheduled Release Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="scheduledReleaseDate"
                        className={`form-control ${errors.scheduledReleaseDate ? 'is-invalid' : ''}`}
                        value={formData.scheduledReleaseDate}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.scheduledReleaseDate && (
                        <div className="invalid-feedback">{errors.scheduledReleaseDate}</div>
                      )}
                      <small className="text-muted">Auto-calculated based on release type</small>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="alert alert-info d-flex align-items-start gap-2 mt-3 mb-0">
                    <Info size={18} className="mt-1 flex-shrink-0" />
                    <div>
                      <strong>Release Type Explanation:</strong>
                      <ul className="mb-0 mt-1 small">
                        <li><strong>On Completion:</strong> Released immediately upon project completion</li>
                        <li><strong>Time Based:</strong> Released after defect liability period (typically 90 days)</li>
                        <li><strong>Warranty End:</strong> Released after warranty period expires (typically 12 months)</li>
                        <li><strong>Milestone Based:</strong> Released upon achieving specific project milestones</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <FileText size={18} />
                    Additional Details
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        placeholder="Enter retention description..."
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div className="col-12">
                      <label className="form-label">Terms & Conditions</label>
                      <textarea
                        name="terms"
                        className="form-control"
                        value={formData.terms}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        placeholder="Enter retention terms and conditions..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                <X size={16} className="me-1" />
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="me-1" />
                    {retention ? 'Update Retention' : 'Add Retention'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRetentionModal;
