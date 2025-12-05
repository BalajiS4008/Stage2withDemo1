import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { X, AlertCircle } from 'lucide-react';
import {
  TRANSACTION_TYPES,
  generateTransactionNumber,
  calculateTransactionAmount,
  calculateRunningBalance,
  formatStockQuantity
} from '../../utils/materialUtils';
import {
  getStockTransactions
} from '../../db/dexieDB';

const StockTransactionFormModal = ({ show, onClose, transaction, onSuccess }) => {
  const { data, user, addStockTransaction: addTransactionToContext, updateStockTransaction: updateTransactionInContext, updateMaterial: updateMaterialInContext } = useData();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    transactionNumber: '',
    transactionType: TRANSACTION_TYPES.IN,
    materialId: '',
    projectId: '',
    quantity: 0,
    rate: 0,
    amount: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
    performedBy: ''
  });

  // Debug log to check user object
  useEffect(() => {
    console.log('🔍 StockTransactionFormModal - User object:', user);
    console.log('🔍 StockTransactionFormModal - Modal show:', show);
    console.log('🔍 StockTransactionFormModal - Transaction:', transaction);
    console.log('🔍 Current formData.transactionNumber:', formData.transactionNumber);
  }, [user, show, transaction, formData.transactionNumber]);

  // Get materials and projects from data
  const activeMaterials = useMemo(() =>
    (data.materials || []).filter(m => m.isActive),
    [data.materials]
  );

  const activeProjects = useMemo(() => {
    const projects = data.projects || [];
    console.log('🔍 All projects:', projects.length, projects);
    const filtered = projects.filter(p => {
      const hasStatus = p.status && typeof p.status === 'string';
      if (!hasStatus) {
        console.log('⚠️ Project missing status:', p);
        return false;
      }
      const statusLower = p.status.toLowerCase();
      const isActive = statusLower === 'active' || statusLower === 'ongoing' || statusLower === 'in-progress';
      console.log(`📊 Project "${p.name}" - Status: "${p.status}" (${statusLower}) - Active: ${isActive}`);
      return isActive;
    });
    console.log('✅ Filtered active projects:', filtered.length, filtered);
    return filtered;
  }, [data.projects]);

  // Get selected material details
  const selectedMaterial = useMemo(() =>
    activeMaterials.find(m => m.id === parseInt(formData.materialId)),
    [activeMaterials, formData.materialId]
  );

  // Calculate new stock balance
  const newStockBalance = useMemo(() => {
    if (!selectedMaterial) return 0;
    return calculateRunningBalance(
      selectedMaterial.currentStock,
      formData.transactionType,
      parseFloat(formData.quantity) || 0
    );
  }, [selectedMaterial, formData.transactionType, formData.quantity]);

  // Initialize form when transaction prop changes or modal opens
  useEffect(() => {
    console.log('🔍 useEffect triggered - show:', show, 'transaction:', !!transaction, 'user.id:', user?.id);

    if (!show) {
      console.log('⏸️ Modal not shown, skipping initialization');
      return; // Don't do anything if modal is not shown
    }

    if (transaction) {
      // Editing existing transaction
      console.log('✏️ Editing existing transaction:', transaction.transactionNumber);
      setInitializing(false);
      setFormData({
        transactionNumber: transaction.transactionNumber || '',
        transactionType: transaction.transactionType || TRANSACTION_TYPES.IN,
        materialId: transaction.materialId || '',
        projectId: transaction.projectId || '',
        quantity: transaction.quantity || 0,
        rate: transaction.rate || 0,
        amount: transaction.amount || 0,
        transactionDate: transaction.transactionDate || new Date().toISOString().split('T')[0],
        referenceNumber: transaction.referenceNumber || '',
        notes: transaction.notes || '',
        performedBy: transaction.performedBy || user?.username || ''
      });
    } else if (user?.id) {
      // Adding new transaction - generate transaction number and set performed by
      console.log('➕ Adding new transaction, generating number...');
      const generateNumber = async () => {
        setInitializing(true);
        try {
          console.log('🔍 Generating transaction number for user:', user.username, 'User ID:', user.id);
          const existingTransactions = await getStockTransactions(user.id, user.role === 'admin');
          console.log('🔍 Existing transactions count:', existingTransactions?.length || 0);
          console.log('🔍 Existing transactions:', existingTransactions);
          const newNumber = generateTransactionNumber(existingTransactions || []);
          console.log('✅ Generated transaction number:', newNumber);

          setFormData({
            transactionNumber: newNumber,
            transactionType: TRANSACTION_TYPES.IN,
            materialId: '',
            projectId: '',
            quantity: 0,
            rate: 0,
            amount: 0,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceNumber: '',
            notes: '',
            performedBy: user.username || ''
          });
          setInitializing(false);
        } catch (error) {
          console.error('❌ Error generating transaction number:', error);
          // Generate a fallback transaction number based on timestamp
          const fallbackNumber = `TXN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
          console.log('⚠️ Using fallback transaction number:', fallbackNumber);

          setFormData({
            transactionNumber: fallbackNumber,
            transactionType: TRANSACTION_TYPES.IN,
            materialId: '',
            projectId: '',
            quantity: 0,
            rate: 0,
            amount: 0,
            transactionDate: new Date().toISOString().split('T')[0],
            referenceNumber: '',
            notes: '',
            performedBy: user.username || ''
          });
          setInitializing(false);
        }
      };
      generateNumber();
    } else {
      console.warn('⚠️ User object not available or missing ID. User:', user);
      setInitializing(false);
    }
  }, [transaction, show, user?.id, user?.username, user?.role]);

  // Auto-calculate amount when quantity or rate changes
  useEffect(() => {
    const calculatedAmount = calculateTransactionAmount(
      parseFloat(formData.quantity) || 0,
      parseFloat(formData.rate) || 0
    );
    setFormData(prev => ({ ...prev, amount: calculatedAmount }));
  }, [formData.quantity, formData.rate]);

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

    if (!formData.materialId || formData.materialId === '') {
      newErrors.materialId = 'Please select a material';
    } else {
      const parsedId = parseInt(formData.materialId);
      if (isNaN(parsedId)) {
        newErrors.materialId = 'Invalid material selected';
      }
    }

    if (!formData.transactionType) {
      newErrors.transactionType = 'Transaction type is required';
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    // Validate rate for IN transactions
    if (formData.transactionType === TRANSACTION_TYPES.IN) {
      const rate = parseFloat(formData.rate);
      if (isNaN(rate) || rate <= 0) {
        newErrors.rate = 'Rate is required for Stock IN transactions';
      }
    }

    // Check sufficient stock for OUT transactions
    if (formData.transactionType === TRANSACTION_TYPES.OUT && selectedMaterial) {
      if (quantity > selectedMaterial.currentStock) {
        newErrors.quantity = `Insufficient stock. Available: ${formatStockQuantity(selectedMaterial.currentStock, selectedMaterial.unit)}`;
      }

      // Require project for OUT transactions
      if (!formData.projectId) {
        newErrors.projectId = 'Project is required for Stock OUT transactions';
      }
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Transaction date is required';
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
      const parsedMaterialId = parseInt(formData.materialId);
      const parsedProjectId = formData.projectId ? parseInt(formData.projectId) : null;

      console.log('🔍 Submitting transaction with materialId:', formData.materialId, '→ parsed:', parsedMaterialId);

      const transactionData = {
        ...formData,
        materialId: parsedMaterialId,
        projectId: parsedProjectId,
        quantity: parseFloat(formData.quantity),
        rate: parseFloat(formData.rate) || 0,
        amount: parseFloat(formData.amount),
        runningBalance: newStockBalance
      };

      if (transaction) {
        // Update existing transaction using DataContext
        await updateTransactionInContext(transaction.id, transactionData);
      } else {
        // Add new transaction using DataContext
        await addTransactionToContext(transactionData);
      }

      // Update material's current stock using DataContext
      if (selectedMaterial) {
        await updateMaterialInContext(selectedMaterial.id, {
          currentStock: newStockBalance
        });
      }

      onSuccess(transaction ? 'Stock transaction updated successfully' : 'Stock transaction recorded successfully');
      handleClose();
    } catch (error) {
      console.error('Error saving stock transaction:', error);
      setErrors({ submit: 'Failed to save transaction. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form data - performedBy and transactionNumber will be regenerated when modal reopens
    setFormData({
      transactionNumber: '',
      transactionType: TRANSACTION_TYPES.IN,
      materialId: '',
      projectId: '',
      quantity: 0,
      rate: 0,
      amount: 0,
      transactionDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      notes: '',
      performedBy: ''
    });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  const isOutTransaction = formData.transactionType === TRANSACTION_TYPES.OUT;
  const isInTransaction = formData.transactionType === TRANSACTION_TYPES.IN;

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
        <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title">
                {transaction ? 'Edit Stock Transaction' : 'New Stock Transaction'}
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
              {initializing ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Initializing transaction form...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} id="stockTransactionForm">
                  {/* Error Alert */}
                  {errors.submit && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <AlertCircle size={20} className="me-2" />
                      {errors.submit}
                    </div>
                  )}

                  {/* Transaction Number (Read-only) */}
                  <div className="mb-3">
                    <label className="form-label">Transaction Number</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={formData.transactionNumber}
                      readOnly
                    />
                    <small className="form-text text-muted">
                      Auto-generated transaction number
                    </small>
                  </div>

                <div className="row">
                  {/* Transaction Type */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Transaction Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.transactionType ? 'is-invalid' : ''}`}
                      name="transactionType"
                      value={formData.transactionType}
                      onChange={handleChange}
                      disabled={loading || transaction}
                    >
                      <option value={TRANSACTION_TYPES.IN}>Stock IN (Purchase/Receipt)</option>
                      <option value={TRANSACTION_TYPES.OUT}>Stock OUT (Issue/Usage)</option>
                      <option value={TRANSACTION_TYPES.ADJUSTMENT}>Adjustment</option>
                      <option value={TRANSACTION_TYPES.RETURN}>Return</option>
                    </select>
                    {errors.transactionType && (
                      <div className="invalid-feedback">{errors.transactionType}</div>
                    )}
                    {transaction && (
                      <small className="form-text text-muted">
                        Transaction type cannot be changed after creation
                      </small>
                    )}
                  </div>

                  {/* Transaction Date */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Transaction Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.transactionDate ? 'is-invalid' : ''}`}
                      name="transactionDate"
                      value={formData.transactionDate}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {errors.transactionDate && (
                      <div className="invalid-feedback">{errors.transactionDate}</div>
                    )}
                  </div>
                </div>

                {/* Material Selection */}
                <div className="mb-3">
                  <label className="form-label">
                    Material <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${errors.materialId ? 'is-invalid' : ''}`}
                    name="materialId"
                    value={formData.materialId}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select Material</option>
                    {activeMaterials.length === 0 ? (
                      <option value="" disabled>(No active materials available)</option>
                    ) : (
                      activeMaterials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.materialCode} - {material.name} | Stock: {formatStockQuantity(material.currentStock, material.unit)}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.materialId && (
                    <div className="invalid-feedback">{errors.materialId}</div>
                  )}
                  {activeMaterials.length === 0 && (
                    <small className="form-text text-warning">
                      No active materials found. Please add materials first.
                    </small>
                  )}
                </div>

                {/* Current Stock Info */}
                {selectedMaterial && (
                  <div className="alert alert-info mb-3">
                    <strong>Current Stock:</strong> {formatStockQuantity(selectedMaterial.currentStock, selectedMaterial.unit)}
                    <br />
                    <strong>After Transaction:</strong> {formatStockQuantity(newStockBalance, selectedMaterial.unit)}
                    {newStockBalance < selectedMaterial.reorderLevel && (
                      <div className="text-warning mt-1">
                        <AlertCircle size={16} className="me-1" />
                        Warning: Stock will be below reorder level
                      </div>
                    )}
                  </div>
                )}

                <div className="row">
                  {/* Quantity */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Quantity <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {errors.quantity && (
                      <div className="invalid-feedback">{errors.quantity}</div>
                    )}
                    {selectedMaterial && (
                      <small className="form-text text-muted">
                        Unit: {selectedMaterial.unit}
                      </small>
                    )}
                  </div>

                  {/* Rate */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Rate (₹) {isInTransaction && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.rate ? 'is-invalid' : ''}`}
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      disabled={loading}
                    />
                    {errors.rate && (
                      <div className="invalid-feedback">{errors.rate}</div>
                    )}
                    <small className="form-text text-muted">
                      {isInTransaction ? 'Purchase rate per unit' : 'Rate per unit (optional)'}
                    </small>
                  </div>

                  {/* Amount (Calculated) */}
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Amount (₹)</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={`₹${parseFloat(formData.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      readOnly
                    />
                    <small className="form-text text-muted">
                      Quantity × Rate
                    </small>
                  </div>
                </div>

                {/* Project (Required for OUT transactions) */}
                {isOutTransaction && (
                  <div className="mb-3">
                    <label className="form-label">
                      Project <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.projectId ? 'is-invalid' : ''}`}
                      name="projectId"
                      value={formData.projectId}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Project</option>
                      {activeProjects.length === 0 ? (
                        <option value="" disabled>(No active projects available)</option>
                      ) : (
                        activeProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))
                      )}
                    </select>
                    {errors.projectId && (
                      <div className="invalid-feedback">{errors.projectId}</div>
                    )}
                    {activeProjects.length === 0 && (
                      <small className="form-text text-warning">
                        No active projects found. Please add projects first.
                      </small>
                    )}
                    {activeProjects.length > 0 && (
                      <small className="form-text text-muted">
                        Project where material is being used
                      </small>
                    )}
                  </div>
                )}

                {/* Reference Number */}
                <div className="mb-3">
                  <label className="form-label">Reference Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    placeholder={isInTransaction ? 'PO Number / Bill Number' : 'Issue Voucher / Reference'}
                    disabled={loading}
                  />
                  <small className="form-text text-muted">
                    {isInTransaction
                      ? 'Purchase Order or Bill number'
                      : 'Issue voucher or reference number'}
                  </small>
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

                {/* Performed By */}
                <div className="mb-3">
                  <label className="form-label">Performed By</label>
                  <input
                    type="text"
                    className="form-control"
                    name="performedBy"
                    value={formData.performedBy}
                    onChange={handleChange}
                    placeholder="Enter name of person performing transaction"
                    disabled={loading}
                  />
                  <small className="form-text text-muted">
                    Name of the person recording this transaction
                  </small>
                </div>
              </form>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading || initializing}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="stockTransactionForm"
                className="btn btn-primary"
                disabled={loading || initializing}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : initializing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Initializing...
                  </>
                ) : (
                  transaction ? 'Update Transaction' : 'Record Transaction'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StockTransactionFormModal;
