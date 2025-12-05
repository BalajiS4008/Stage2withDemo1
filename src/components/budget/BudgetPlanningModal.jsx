import { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  X,
  Calculator,
  Building2,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  Info,
  Save,
  CheckCircle,
  Edit3,
  Copy
} from 'lucide-react';
import { CATEGORY_TYPES } from '../../utils/budgetUtils';

const BudgetPlanningModal = ({ show, onClose, budget, onSuccess }) => {
  const { data, user, addProjectBudget, updateProjectBudget, addBudgetLineItem, updateBudgetLineItem, deleteBudgetLineItem } = useData();

  // Initial form data
  const initialFormData = {
    projectId: '',
    budgetName: '',
    budgetVersion: 1,
    description: '',
    startDate: '',
    endDate: '',
    contingencyPercentage: 10,
    isApproved: false
  };

  const initialLineItem = {
    id: null, // null for new, number for existing
    category: CATEGORY_TYPES.MATERIAL,
    itemName: '',
    description: '',
    unit: '',
    quantity: 0,
    unitCost: 0,
    budgetAmount: 0,
    actualCost: 0,
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [lineItems, setLineItems] = useState([{ ...initialLineItem, tempId: Date.now() }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedItems, setExpandedItems] = useState(new Set());

  // Get active projects
  const activeProjects = useMemo(() =>
    (data.projects || []).filter(p => p.status && p.status.toLowerCase() === 'active'),
    [data.projects]
  );

  // Get selected project details
  const selectedProject = useMemo(() => {
    if (!formData.projectId) return null;
    return activeProjects.find(p => p.id === parseInt(formData.projectId));
  }, [formData.projectId, activeProjects]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.budgetAmount) || 0), 0);
    const actualCost = lineItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0);
    const contingency = (subtotal * parseFloat(formData.contingencyPercentage || 0)) / 100;
    const totalBudget = subtotal + contingency;
    const variance = totalBudget - actualCost;

    // Category breakdown
    const byCategory = {};
    Object.values(CATEGORY_TYPES).forEach(cat => {
      byCategory[cat] = lineItems
        .filter(item => item.category === cat)
        .reduce((sum, item) => sum + (parseFloat(item.budgetAmount) || 0), 0);
    });

    return {
      subtotal,
      contingency,
      totalBudget,
      actualCost,
      variance,
      byCategory,
      itemCount: lineItems.length
    };
  }, [lineItems, formData.contingencyPercentage]);

  // Load budget data when editing
  useEffect(() => {
    if (show && budget) {
      setFormData({
        projectId: budget.projectId || '',
        budgetName: budget.budgetName || '',
        budgetVersion: budget.version || 1,
        description: budget.description || '',
        startDate: budget.startDate || '',
        endDate: budget.endDate || '',
        contingencyPercentage: budget.contingencyPercentage || 10,
        isApproved: budget.isApproved || false
      });

      // Load existing line items
      const existingItems = (data.budgetLineItems || [])
        .filter(item => item.budgetId === budget.id)
        .map(item => ({
          id: item.id,
          category: item.category || CATEGORY_TYPES.MATERIAL,
          itemName: item.itemName || '',
          description: item.description || '',
          unit: item.unit || '',
          quantity: item.quantity || 0,
          unitCost: item.unitCost || 0,
          budgetAmount: item.budgetAmount || 0,
          actualCost: item.actualCost || 0,
          notes: item.notes || ''
        }));

      if (existingItems.length > 0) {
        setLineItems(existingItems);
      } else {
        setLineItems([{ ...initialLineItem, tempId: Date.now() }]);
      }
    } else if (show && !budget) {
      setFormData(initialFormData);
      setLineItems([{ ...initialLineItem, tempId: Date.now() }]);
    }
  }, [show, budget, data.budgetLineItems]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle line item change
  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;

    // Auto-calculate budget amount when quantity or unit cost changes
    if (field === 'quantity' || field === 'unitCost') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const unitCost = parseFloat(newItems[index].unitCost) || 0;
      newItems[index].budgetAmount = quantity * unitCost;
    }

    setLineItems(newItems);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([...lineItems, { ...initialLineItem, tempId: Date.now() }]);
  };

  // Duplicate line item
  const duplicateLineItem = (index) => {
    const itemToDuplicate = lineItems[index];
    const newItem = {
      ...itemToDuplicate,
      id: null, // New item, not saved yet
      tempId: Date.now(),
      itemName: `${itemToDuplicate.itemName} (Copy)`,
      actualCost: 0 // Don't copy actual cost
    };
    const newItems = [...lineItems];
    newItems.splice(index + 1, 0, newItem);
    setLineItems(newItems);
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (lineItems.length === 1) {
      alert('Budget must have at least one line item');
      return;
    }
    const newItems = lineItems.filter((_, i) => i !== index);
    setLineItems(newItems);
  };

  // Toggle item expansion
  const toggleItemExpansion = (index) => {
    const newExpanded = new Set(expandedItems);
    const key = index.toString();
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  // Quick fill line items (template)
  const applyTemplate = (templateType) => {
    const templates = {
      construction: [
        { category: CATEGORY_TYPES.MATERIAL, itemName: 'Cement', unit: 'bags', quantity: 100, unitCost: 350 },
        { category: CATEGORY_TYPES.MATERIAL, itemName: 'Steel', unit: 'tons', quantity: 5, unitCost: 55000 },
        { category: CATEGORY_TYPES.MATERIAL, itemName: 'Bricks', unit: 'pcs', quantity: 10000, unitCost: 8 },
        { category: CATEGORY_TYPES.LABOR, itemName: 'Mason', unit: 'days', quantity: 30, unitCost: 800 },
        { category: CATEGORY_TYPES.LABOR, itemName: 'Helper', unit: 'days', quantity: 30, unitCost: 500 },
        { category: CATEGORY_TYPES.EQUIPMENT, itemName: 'Excavator', unit: 'days', quantity: 5, unitCost: 5000 },
        { category: CATEGORY_TYPES.OVERHEAD, itemName: 'Site Office', unit: 'month', quantity: 6, unitCost: 15000 }
      ],
      renovation: [
        { category: CATEGORY_TYPES.LABOR, itemName: 'Skilled Worker', unit: 'days', quantity: 20, unitCost: 1000 },
        { category: CATEGORY_TYPES.MATERIAL, itemName: 'Paint', unit: 'liters', quantity: 50, unitCost: 450 },
        { category: CATEGORY_TYPES.MATERIAL, itemName: 'Tiles', unit: 'sqft', quantity: 500, unitCost: 80 },
        { category: CATEGORY_TYPES.EQUIPMENT, itemName: 'Tools & Equipment', unit: 'lump', quantity: 1, unitCost: 25000 }
      ]
    };

    const template = templates[templateType];
    if (template) {
      const newItems = template.map((item, index) => ({
        ...initialLineItem,
        ...item,
        budgetAmount: item.quantity * item.unitCost,
        tempId: Date.now() + index
      }));
      setLineItems(newItems);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (!formData.budgetName) {
      newErrors.budgetName = 'Budget name is required';
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    }

    // Validate line items
    const itemErrors = [];
    lineItems.forEach((item, index) => {
      const errors = {};
      if (!item.itemName) errors.itemName = 'Item name required';
      if (!item.unit) errors.unit = 'Unit required';
      if (parseFloat(item.quantity) <= 0) errors.quantity = 'Quantity must be > 0';
      if (parseFloat(item.unitCost) <= 0) errors.unitCost = 'Unit cost must be > 0';

      if (Object.keys(errors).length > 0) {
        itemErrors[index] = errors;
      }
    });

    if (itemErrors.length > 0) {
      newErrors.itemErrors = itemErrors;
    }

    if (totals.totalBudget === 0) {
      newErrors.totalBudget = 'Total budget cannot be zero';
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
      const budgetData = {
        projectId: parseInt(formData.projectId),
        budgetName: formData.budgetName,
        version: formData.budgetVersion,
        description: formData.description,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        contingencyPercentage: parseFloat(formData.contingencyPercentage) || 0,
        totalBudget: totals.totalBudget,
        isApproved: formData.isApproved,
        isActive: true
      };

      let budgetId;

      if (budget?.id) {
        // Update existing budget
        await updateProjectBudget(budget.id, budgetData);
        budgetId = budget.id;

        // Update/delete existing line items
        const existingLineItemIds = (data.budgetLineItems || [])
          .filter(item => item.budgetId === budget.id)
          .map(item => item.id);

        // Delete removed items
        for (const itemId of existingLineItemIds) {
          const stillExists = lineItems.find(item => item.id === itemId);
          if (!stillExists) {
            await deleteBudgetLineItem(itemId);
          }
        }

        onSuccess('Budget updated successfully');
      } else {
        // Add new budget
        const result = await addProjectBudget(budgetData);
        budgetId = result.id;
        onSuccess('Budget created successfully');
      }

      // Save line items
      for (const item of lineItems) {
        const lineItemData = {
          budgetId: budgetId,
          projectId: parseInt(formData.projectId),
          category: item.category,
          itemName: item.itemName,
          description: item.description,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          unitCost: parseFloat(item.unitCost) || 0,
          budgetAmount: parseFloat(item.budgetAmount) || 0,
          actualCost: parseFloat(item.actualCost) || 0,
          notes: item.notes || ''
        };

        if (item.id) {
          // Update existing line item
          await updateBudgetLineItem(item.id, lineItemData);
        } else {
          // Add new line item
          await addBudgetLineItem(lineItemData);
        }
      }

      handleClose();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setFormData(initialFormData);
    setLineItems([{ ...initialLineItem, tempId: Date.now() }]);
    setErrors({});
    setExpandedItems(new Set());
    onClose();
  };

  if (!show) return null;

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

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
      >
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header bg-primary text-white">
              <div>
                <h5 className="modal-title mb-1">
                  <Calculator className="me-2" size={20} />
                  {budget ? 'Edit Budget' : 'Create Budget'}
                </h5>
                {selectedProject && (
                  <small>
                    <Building2 size={14} className="me-1" />
                    {selectedProject.name}
                  </small>
                )}
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={handleClose}
                disabled={loading}
              />
            </div>

            {/* Body */}
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Budget Header */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <Building2 size={16} className="me-1" />
                      Project <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.projectId ? 'is-invalid' : ''}`}
                      value={formData.projectId}
                      onChange={(e) => handleChange('projectId', e.target.value)}
                      disabled={loading || !!budget}
                    >
                      <option value="">Select Project</option>
                      {activeProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {errors.projectId && (
                      <div className="invalid-feedback">{errors.projectId}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      Budget Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.budgetName ? 'is-invalid' : ''}`}
                      placeholder="e.g., Main Construction Budget"
                      value={formData.budgetName}
                      onChange={(e) => handleChange('budgetName', e.target.value)}
                      disabled={loading}
                    />
                    {errors.budgetName && (
                      <div className="invalid-feedback">{errors.budgetName}</div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Contingency %</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.contingencyPercentage}
                      onChange={(e) => handleChange('contingencyPercentage', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={loading}
                    />
                    <small className="text-muted">Buffer for unforeseen costs</small>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Budget description..."
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isApproved"
                        checked={formData.isApproved}
                        onChange={(e) => handleChange('isApproved', e.target.checked)}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="isApproved">
                        Mark as Approved
                      </label>
                    </div>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Quick Templates</h6>
                        <small className="text-muted">Apply predefined budget templates</small>
                      </div>
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => applyTemplate('construction')}
                          disabled={loading}
                        >
                          Construction
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => applyTemplate('renovation')}
                          disabled={loading}
                        >
                          Renovation
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                      Budget Line Items ({lineItems.length})
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={addLineItem}
                      disabled={loading}
                    >
                      <Plus size={16} className="me-1" />
                      Add Line Item
                    </button>
                  </div>

                  {errors.lineItems && (
                    <div className="alert alert-danger d-flex align-items-center mb-3">
                      <AlertCircle size={20} className="me-2" />
                      {errors.lineItems}
                    </div>
                  )}

                  {errors.totalBudget && (
                    <div className="alert alert-danger d-flex align-items-center mb-3">
                      <AlertCircle size={20} className="me-2" />
                      {errors.totalBudget}
                    </div>
                  )}

                  <div className="row g-3">
                    {lineItems.map((item, index) => {
                      const isExpanded = expandedItems.has(index.toString());
                      const itemKey = item.id || item.tempId;
                      const itemErrors = errors.itemErrors?.[index] || {};

                      return (
                        <div key={itemKey} className="col-12">
                          <div className="card border">
                            <div className="card-header bg-light border-bottom">
                              <div className="row align-items-center">
                                <div className="col-md-2">
                                  <select
                                    className="form-select form-select-sm"
                                    value={item.category}
                                    onChange={(e) => handleLineItemChange(index, 'category', e.target.value)}
                                    disabled={loading}
                                  >
                                    {Object.values(CATEGORY_TYPES).map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="col-md-4">
                                  <input
                                    type="text"
                                    className={`form-control form-control-sm ${itemErrors.itemName ? 'is-invalid' : ''}`}
                                    placeholder="Item name *"
                                    value={item.itemName}
                                    onChange={(e) => handleLineItemChange(index, 'itemName', e.target.value)}
                                    disabled={loading}
                                  />
                                </div>

                                <div className="col-md-2">
                                  <div className="fw-bold text-primary">
                                    {formatCurrency(item.budgetAmount)}
                                  </div>
                                </div>

                                <div className="col-md-4 text-end">
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary"
                                      onClick={() => toggleItemExpansion(index)}
                                      title="Expand/Collapse"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-info"
                                      onClick={() => duplicateLineItem(index)}
                                      title="Duplicate"
                                      disabled={loading}
                                    >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger"
                                      onClick={() => removeLineItem(index)}
                                      title="Remove"
                                      disabled={loading || lineItems.length === 1}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="card-body">
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <label className="form-label small">Description</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Item description"
                                      value={item.description}
                                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                      disabled={loading}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small">Unit *</label>
                                    <input
                                      type="text"
                                      className={`form-control form-control-sm ${itemErrors.unit ? 'is-invalid' : ''}`}
                                      placeholder="e.g., bags"
                                      value={item.unit}
                                      onChange={(e) => handleLineItemChange(index, 'unit', e.target.value)}
                                      disabled={loading}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small">Quantity *</label>
                                    <input
                                      type="number"
                                      className={`form-control form-control-sm ${itemErrors.quantity ? 'is-invalid' : ''}`}
                                      value={item.quantity}
                                      onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                      min="0"
                                      step="0.01"
                                      disabled={loading}
                                    />
                                  </div>

                                  <div className="col-md-2">
                                    <label className="form-label small">Unit Cost *</label>
                                    <input
                                      type="number"
                                      className={`form-control form-control-sm ${itemErrors.unitCost ? 'is-invalid' : ''}`}
                                      value={item.unitCost}
                                      onChange={(e) => handleLineItemChange(index, 'unitCost', e.target.value)}
                                      min="0"
                                      step="0.01"
                                      disabled={loading}
                                    />
                                  </div>

                                  <div className="col-md-4">
                                    <label className="form-label small">Actual Cost</label>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={item.actualCost}
                                      onChange={(e) => handleLineItemChange(index, 'actualCost', e.target.value)}
                                      min="0"
                                      step="0.01"
                                      disabled={loading}
                                    />
                                  </div>

                                  <div className="col-md-8">
                                    <label className="form-label small">Notes</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      placeholder="Additional notes"
                                      value={item.notes}
                                      onChange={(e) => handleLineItemChange(index, 'notes', e.target.value)}
                                      disabled={loading}
                                    />
                                  </div>

                                  <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                      <span className="small">Budget Amount:</span>
                                      <strong className="text-primary">{formatCurrency(item.budgetAmount)}</strong>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="card border-info mb-4">
                  <div className="card-header bg-info bg-opacity-10 border-info">
                    <h6 className="mb-0 text-info">
                      <DollarSign size={18} className="me-2" />
                      Category Breakdown
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-2 small">
                      {Object.entries(totals.byCategory).map(([category, amount]) => (
                        amount > 0 && (
                          <div key={category} className="col-md-4">
                            <div className="d-flex justify-content-between align-items-center">
                              <span>{category}:</span>
                              <strong>{formatCurrency(amount)}</strong>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="card bg-primary text-white">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="small mb-1">Subtotal</div>
                        <div className="fs-5 fw-bold">{formatCurrency(totals.subtotal)}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="small mb-1">Contingency ({formData.contingencyPercentage}%)</div>
                        <div className="fs-5 fw-bold">{formatCurrency(totals.contingency)}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="small mb-1">Total Budget</div>
                        <div className="fs-4 fw-bold">{formatCurrency(totals.totalBudget)}</div>
                      </div>
                      <div className="col-md-3">
                        <div className="small mb-1">Actual Cost</div>
                        <div className="fs-5 fw-bold">{formatCurrency(totals.actualCost)}</div>
                      </div>
                    </div>
                  </div>
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
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={loading || totals.totalBudget === 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="me-2" />
                    {budget ? 'Update Budget' : 'Create Budget'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BudgetPlanningModal;
