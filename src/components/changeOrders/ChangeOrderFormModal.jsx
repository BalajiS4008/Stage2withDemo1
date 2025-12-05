import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  X,
  Save,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  Users,
  TrendingUp,
  Copy,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  CHANGE_ORDER_STATUS,
  PRIORITY_LEVELS,
  CHANGE_REASONS,
  CHANGE_CATEGORIES,
  ITEM_TYPES,
  generateChangeOrderNumber,
  calculateChangeOrderAmount,
  calculateRevisedContractAmount,
  calculateTimeImpact,
  formatCurrency,
  determineOverallImpactSeverity
} from '../../utils/changeOrderUtils';
import {
  addChangeOrder,
  updateChangeOrder,
  addChangeOrderLineItem,
  updateChangeOrderLineItem,
  deleteChangeOrderLineItem,
  getChangeOrderLineItemsByChangeOrder
} from '../../db/dexieDB';

const ChangeOrderFormModal = ({ show, onClose, changeOrder, onSuccess }) => {
  const { data, user } = useData();

  // Get data
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const allChangeOrders = useMemo(() => data.changeOrders || [], [data.changeOrders]);
  const allParties = useMemo(() => data.parties || [], [data.parties]);

  // Initial form state
  const initialFormData = {
    projectId: '',
    customerId: '',
    changeOrderNumber: '',
    title: '',
    description: '',
    reason: CHANGE_REASONS.CLIENT_REQUEST,
    category: CHANGE_CATEGORIES.ADDITION,
    priority: PRIORITY_LEVELS.MEDIUM,
    status: CHANGE_ORDER_STATUS.DRAFT,
    requestDate: new Date().toISOString().split('T')[0],
    requiredByDate: '',
    submittedDate: '',
    reviewedDate: '',
    approvedDate: '',
    implementedDate: '',
    originalContractAmount: '',
    scheduleImpactDays: '0',
    justification: '',
    approverComments: ''
  };

  // Initial line item
  const initialLineItem = {
    id: null,
    itemType: ITEM_TYPES.MATERIAL,
    description: '',
    unit: '',
    quantity: 0,
    unitRate: 0,
    totalCost: 0,
    notes: '',
    tempId: Date.now()
  };

  const [formData, setFormData] = useState(initialFormData);
  const [lineItems, setLineItems] = useState([{ ...initialLineItem }]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load change order data when editing
  useEffect(() => {
    const loadChangeOrderData = async () => {
      if (changeOrder && show) {
        setFormData({
          projectId: changeOrder.projectId?.toString() || '',
          customerId: changeOrder.customerId?.toString() || '',
          changeOrderNumber: changeOrder.changeOrderNumber || '',
          title: changeOrder.title || '',
          description: changeOrder.description || '',
          reason: changeOrder.reason || CHANGE_REASONS.CLIENT_REQUEST,
          category: changeOrder.category || CHANGE_CATEGORIES.ADDITION,
          priority: changeOrder.priority || PRIORITY_LEVELS.MEDIUM,
          status: changeOrder.status || CHANGE_ORDER_STATUS.DRAFT,
          requestDate: changeOrder.requestDate ? new Date(changeOrder.requestDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          requiredByDate: changeOrder.requiredByDate ? new Date(changeOrder.requiredByDate).toISOString().split('T')[0] : '',
          submittedDate: changeOrder.submittedDate ? new Date(changeOrder.submittedDate).toISOString().split('T')[0] : '',
          reviewedDate: changeOrder.reviewedDate ? new Date(changeOrder.reviewedDate).toISOString().split('T')[0] : '',
          approvedDate: changeOrder.approvedDate ? new Date(changeOrder.approvedDate).toISOString().split('T')[0] : '',
          implementedDate: changeOrder.implementedDate ? new Date(changeOrder.implementedDate).toISOString().split('T')[0] : '',
          originalContractAmount: changeOrder.originalContractAmount?.toString() || '',
          scheduleImpactDays: changeOrder.scheduleImpactDays?.toString() || '0',
          justification: changeOrder.justification || '',
          approverComments: changeOrder.approverComments || ''
        });

        // Load line items
        if (changeOrder.id) {
          const items = await getChangeOrderLineItemsByChangeOrder(changeOrder.id);
          if (items && items.length > 0) {
            setLineItems(items.map(item => ({
              ...item,
              tempId: item.id
            })));
          }
        }
      } else if (!changeOrder && show) {
        setFormData(initialFormData);
        setLineItems([{ ...initialLineItem }]);
        setErrors({});
      }
    };

    loadChangeOrderData();
  }, [changeOrder, show]);

  // Auto-generate change order number when project is selected
  useEffect(() => {
    if (formData.projectId && !changeOrder) {
      const project = allProjects.find(p => p.id === parseInt(formData.projectId));
      const projectCode = project?.code || 'PROJ';
      const projectChangeOrders = allChangeOrders.filter(co => co.projectId === parseInt(formData.projectId));
      const coNumber = generateChangeOrderNumber(projectChangeOrders, projectCode);
      setFormData(prev => ({ ...prev, changeOrderNumber: coNumber }));
    }
  }, [formData.projectId]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle line item change
  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;

    // Auto-calculate total cost when quantity or unit rate changes
    if (field === 'quantity' || field === 'unitRate') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitRate = parseFloat(newItems[index].unitRate) || 0;
      newItems[index].totalCost = quantity * unitRate;
    }

    setLineItems(newItems);
  };

  // Add new line item
  const handleAddLineItem = () => {
    setLineItems([...lineItems, { ...initialLineItem, tempId: Date.now() }]);
  };

  // Remove line item
  const handleRemoveLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Duplicate line item
  const handleDuplicateLineItem = (index) => {
    const itemToDuplicate = lineItems[index];
    const newItem = {
      ...itemToDuplicate,
      id: null,
      tempId: Date.now(),
      description: `${itemToDuplicate.description} (Copy)`
    };
    setLineItems([...lineItems, newItem]);
  };

  // Calculate totals
  const totals = useMemo(() => {
    const changeOrderAmount = lineItems.reduce((sum, item) => sum + (parseFloat(item.totalCost) || 0), 0);
    const originalAmount = parseFloat(formData.originalContractAmount) || 0;
    const revisedAmount = calculateRevisedContractAmount(originalAmount, changeOrderAmount);
    const itemCount = lineItems.length;

    // Calculate by item type
    const byType = {};
    Object.values(ITEM_TYPES).forEach(type => {
      byType[type] = lineItems
        .filter(item => item.itemType === type)
        .reduce((sum, item) => sum + (parseFloat(item.totalCost) || 0), 0);
    });

    return {
      changeOrderAmount,
      originalAmount,
      revisedAmount,
      impactPercentage: originalAmount > 0 ? ((changeOrderAmount / originalAmount) * 100).toFixed(2) : 0,
      itemCount,
      byType
    };
  }, [lineItems, formData.originalContractAmount]);

  // Get overall impact severity
  const impactSeverity = useMemo(() => {
    return determineOverallImpactSeverity(
      totals.changeOrderAmount,
      formData.originalContractAmount,
      formData.scheduleImpactDays
    );
  }, [totals.changeOrderAmount, formData.originalContractAmount, formData.scheduleImpactDays]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
    }
    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Description is required';
    }
    if (!formData.requestDate) {
      newErrors.requestDate = 'Request date is required';
    }
    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    // Validate each line item
    lineItems.forEach((item, index) => {
      if (!item.description || item.description.trim() === '') {
        newErrors[`lineItem_${index}_description`] = 'Description is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`lineItem_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unitRate || parseFloat(item.unitRate) <= 0) {
        newErrors[`lineItem_${index}_unitRate`] = 'Unit rate must be greater than 0';
      }
    });

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
      const changeOrderData = {
        projectId: parseInt(formData.projectId),
        customerId: formData.customerId ? parseInt(formData.customerId) : null,
        changeOrderNumber: formData.changeOrderNumber,
        title: formData.title,
        description: formData.description,
        reason: formData.reason,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        requestDate: formData.requestDate,
        requiredByDate: formData.requiredByDate || null,
        submittedDate: formData.submittedDate || null,
        reviewedDate: formData.reviewedDate || null,
        approvedDate: formData.approvedDate || null,
        implementedDate: formData.implementedDate || null,
        originalContractAmount: parseFloat(formData.originalContractAmount) || 0,
        changeOrderAmount: totals.changeOrderAmount,
        revisedContractAmount: totals.revisedAmount,
        scheduleImpactDays: parseInt(formData.scheduleImpactDays) || 0,
        justification: formData.justification || '',
        approverComments: formData.approverComments || '',
        impactSeverity: impactSeverity,
        createdDate: changeOrder?.createdDate || new Date().toISOString()
      };

      let changeOrderId;
      if (changeOrder?.id) {
        await updateChangeOrder(changeOrder.id, changeOrderData);
        changeOrderId = changeOrder.id;
      } else {
        const result = await addChangeOrder(changeOrderData, user.id);
        changeOrderId = result.id;
      }

      // Save all line items
      for (const item of lineItems) {
        const lineItemData = {
          changeOrderId: changeOrderId,
          itemType: item.itemType,
          description: item.description,
          unit: item.unit || '',
          quantity: parseFloat(item.quantity) || 0,
          unitRate: parseFloat(item.unitRate) || 0,
          totalCost: parseFloat(item.totalCost) || 0,
          notes: item.notes || ''
        };

        if (item.id) {
          await updateChangeOrderLineItem(item.id, lineItemData);
        } else {
          await addChangeOrderLineItem(lineItemData, user.id);
        }
      }

      onSuccess(changeOrder ? 'Change order updated successfully' : 'Change order created successfully');
      handleClose();
    } catch (error) {
      console.error('Error saving change order:', error);
      setErrors({ submit: 'Failed to save change order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData(initialFormData);
    setLineItems([{ ...initialLineItem }]);
    setErrors({});
    onClose();
  };

  // Get severity badge
  const getSeverityBadge = (severity) => {
    const colors = {
      LOW: 'success',
      MEDIUM: 'info',
      HIGH: 'warning',
      CRITICAL: 'danger'
    };

    return (
      <span className={`badge bg-${colors[severity] || 'secondary'}`}>
        {severity}
      </span>
    );
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <FileText size={20} />
              {changeOrder ? 'Edit Change Order' : 'New Change Order'}
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
                        <DollarSign size={16} />
                        <small>Original Contract</small>
                      </div>
                      <h5 className="mb-0 text-dark">{formatCurrency(totals.originalAmount)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-warning bg-opacity-10 h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-warning mb-1">
                        <TrendingUp size={16} />
                        <small>Change Order Amount</small>
                      </div>
                      <h5 className="mb-0 text-warning">{formatCurrency(totals.changeOrderAmount)}</h5>
                      <small className="text-muted">{totals.impactPercentage}% impact</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-info bg-opacity-10 h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-info mb-1">
                        <Calculator size={16} />
                        <small>Revised Contract</small>
                      </div>
                      <h5 className="mb-0 text-info">{formatCurrency(totals.revisedAmount)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-0 bg-danger bg-opacity-10 h-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center gap-2 text-danger mb-1">
                        <AlertTriangle size={16} />
                        <small>Impact Severity</small>
                      </div>
                      <h5 className="mb-0">{getSeverityBadge(impactSeverity)}</h5>
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

                    {/* Customer */}
                    <div className="col-md-6">
                      <label className="form-label">Customer</label>
                      <select
                        name="customerId"
                        className="form-select"
                        value={formData.customerId}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="">Select Customer (Optional)</option>
                        {allParties
                          .filter(p => p.type === 'customer')
                          .map(party => (
                            <option key={party.id} value={party.id}>
                              {party.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Change Order Number */}
                    <div className="col-md-6">
                      <label className="form-label">Change Order Number</label>
                      <input
                        type="text"
                        name="changeOrderNumber"
                        className="form-control bg-light"
                        value={formData.changeOrderNumber}
                        disabled
                        readOnly
                      />
                      <small className="text-muted">Auto-generated</small>
                    </div>

                    {/* Original Contract Amount */}
                    <div className="col-md-6">
                      <label className="form-label">Original Contract Amount (₹)</label>
                      <input
                        type="number"
                        name="originalContractAmount"
                        className="form-control"
                        value={formData.originalContractAmount}
                        onChange={handleChange}
                        disabled={loading}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Title */}
                    <div className="col-12">
                      <label className="form-label">
                        Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                        value={formData.title}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Enter change order title"
                      />
                      {errors.title && (
                        <div className="invalid-feedback">{errors.title}</div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="col-12">
                      <label className="form-label">
                        Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        name="description"
                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        placeholder="Describe the change in detail..."
                      />
                      {errors.description && (
                        <div className="invalid-feedback">{errors.description}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Details */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <FileText size={18} />
                    Change Details
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    {/* Reason */}
                    <div className="col-md-4">
                      <label className="form-label">Reason</label>
                      <select
                        name="reason"
                        className="form-select"
                        value={formData.reason}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {Object.entries(CHANGE_REASONS).map(([key, value]) => (
                          <option key={value} value={value}>
                            {value.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="col-md-4">
                      <label className="form-label">Category</label>
                      <select
                        name="category"
                        className="form-select"
                        value={formData.category}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {Object.entries(CHANGE_CATEGORIES).map(([key, value]) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div className="col-md-4">
                      <label className="form-label">Priority</label>
                      <select
                        name="priority"
                        className="form-select"
                        value={formData.priority}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        className="form-select"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        {Object.entries(CHANGE_ORDER_STATUS).map(([key, value]) => (
                          <option key={value} value={value}>
                            {value.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Request Date */}
                    <div className="col-md-4">
                      <label className="form-label">
                        Request Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="requestDate"
                        className={`form-control ${errors.requestDate ? 'is-invalid' : ''}`}
                        value={formData.requestDate}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      {errors.requestDate && (
                        <div className="invalid-feedback">{errors.requestDate}</div>
                      )}
                    </div>

                    {/* Required By Date */}
                    <div className="col-md-4">
                      <label className="form-label">Required By Date</label>
                      <input
                        type="date"
                        name="requiredByDate"
                        className="form-control"
                        value={formData.requiredByDate}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    {/* Schedule Impact Days */}
                    <div className="col-md-6">
                      <label className="form-label">Schedule Impact (Days)</label>
                      <input
                        type="number"
                        name="scheduleImpactDays"
                        className="form-control"
                        value={formData.scheduleImpactDays}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="0"
                      />
                      <small className="text-muted">Positive = delay, Negative = acceleration</small>
                    </div>

                    {/* Justification */}
                    <div className="col-12">
                      <label className="form-label">Justification</label>
                      <textarea
                        name="justification"
                        className="form-control"
                        value={formData.justification}
                        onChange={handleChange}
                        disabled={loading}
                        rows="3"
                        placeholder="Provide justification for this change..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 d-flex align-items-center gap-2">
                    <Calculator size={18} />
                    Line Items ({totals.itemCount})
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddLineItem}
                    disabled={loading}
                  >
                    <Plus size={16} className="me-1" />
                    Add Item
                  </button>
                </div>
                <div className="card-body">
                  {errors.lineItems && (
                    <div className="alert alert-danger">{errors.lineItems}</div>
                  )}

                  {lineItems.map((item, index) => (
                    <div key={item.tempId} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Item #{index + 1}</h6>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleDuplicateLineItem(index)}
                            disabled={loading}
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleRemoveLineItem(index)}
                              disabled={loading}
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="row g-3">
                        {/* Item Type */}
                        <div className="col-md-3">
                          <label className="form-label small">Item Type</label>
                          <select
                            className="form-select form-select-sm"
                            value={item.itemType}
                            onChange={(e) => handleLineItemChange(index, 'itemType', e.target.value)}
                            disabled={loading}
                          >
                            {Object.entries(ITEM_TYPES).map(([key, value]) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Unit */}
                        <div className="col-md-2">
                          <label className="form-label small">Unit</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                            disabled={loading}
                            placeholder="e.g., sqft, nos"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="col-md-2">
                          <label className="form-label small">Quantity *</label>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${errors[`lineItem_${index}_quantity`] ? 'is-invalid' : ''}`}
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                            disabled={loading}
                            min="0"
                            step="0.01"
                            placeholder="0"
                          />
                          {errors[`lineItem_${index}_quantity`] && (
                            <div className="invalid-feedback">{errors[`lineItem_${index}_quantity`]}</div>
                          )}
                        </div>

                        {/* Unit Rate */}
                        <div className="col-md-2">
                          <label className="form-label small">Unit Rate (₹) *</label>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${errors[`lineItem_${index}_unitRate`] ? 'is-invalid' : ''}`}
                            value={item.unitRate}
                            onChange={(e) => handleLineItemChange(index, 'unitRate', e.target.value)}
                            disabled={loading}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                          {errors[`lineItem_${index}_unitRate`] && (
                            <div className="invalid-feedback">{errors[`lineItem_${index}_unitRate`]}</div>
                          )}
                        </div>

                        {/* Total Cost */}
                        <div className="col-md-3">
                          <label className="form-label small">Total Cost (₹)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm bg-light fw-bold"
                            value={item.totalCost}
                            disabled
                            readOnly
                          />
                        </div>

                        {/* Description */}
                        <div className="col-12">
                          <label className="form-label small">Description *</label>
                          <textarea
                            className={`form-control form-control-sm ${errors[`lineItem_${index}_description`] ? 'is-invalid' : ''}`}
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            disabled={loading}
                            rows="2"
                            placeholder="Describe the item..."
                          />
                          {errors[`lineItem_${index}_description`] && (
                            <div className="invalid-feedback">{errors[`lineItem_${index}_description`]}</div>
                          )}
                        </div>

                        {/* Notes */}
                        <div className="col-12">
                          <label className="form-label small">Notes</label>
                          <textarea
                            className="form-control form-control-sm"
                            value={item.notes}
                            onChange={(e) => handleLineItemChange(index, 'notes', e.target.value)}
                            disabled={loading}
                            rows="1"
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary by Type */}
                  <div className="alert alert-info mb-0">
                    <small className="d-block fw-bold mb-2">Summary by Item Type:</small>
                    <div className="row g-2 small">
                      {Object.entries(totals.byType).map(([type, amount]) => (
                        amount > 0 && (
                          <div key={type} className="col-md-3">
                            <strong>{type}:</strong> {formatCurrency(amount)}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Approver Comments */}
              {(formData.status === CHANGE_ORDER_STATUS.APPROVED || formData.status === CHANGE_ORDER_STATUS.REJECTED) && (
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Approver Comments</h6>
                  </div>
                  <div className="card-body">
                    <textarea
                      name="approverComments"
                      className="form-control"
                      value={formData.approverComments}
                      onChange={handleChange}
                      disabled={loading}
                      rows="3"
                      placeholder="Enter approver comments..."
                    />
                  </div>
                </div>
              )}
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
                    {changeOrder ? 'Update Change Order' : 'Create Change Order'}
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

export default ChangeOrderFormModal;
