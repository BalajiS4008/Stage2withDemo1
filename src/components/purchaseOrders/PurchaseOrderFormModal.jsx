import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  PO_STATUS,
  generatePONumber,
  calculatePOTotals,
  formatCurrency
} from '../../utils/materialUtils';
import {
  getPurchaseOrders,
  getMaterials
} from '../../db/dexieDB';

const PurchaseOrderFormModal = ({ show, onClose, purchaseOrder, onSuccess }) => {
  const { user, data, addPurchaseOrder: addPOToContext, updatePurchaseOrder: updatePOInContext } = useData();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [materials, setMaterials] = useState([]);

  const [formData, setFormData] = useState({
    poNumber: '',
    orderDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    projectId: '',
    expectedDeliveryDate: '',
    status: PO_STATUS.DRAFT,
    items: [],
    taxPercentage: 0,
    notes: '',
    terms: ''
  });

  // Load materials
  useEffect(() => {
    const loadMaterials = async () => {
      if (user) {
        const materialsData = await getMaterials(user.id, user.role === 'admin');
        setMaterials(materialsData.filter(m => m.isActive));
      }
    };
    loadMaterials();
  }, [user]);

  // Initialize form when purchaseOrder prop changes
  useEffect(() => {
    const initializeForm = async () => {
      if (purchaseOrder) {
        // Edit mode
        setFormData({
          poNumber: purchaseOrder.poNumber || '',
          orderDate: purchaseOrder.orderDate ?
            new Date(purchaseOrder.orderDate).toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0],
          supplierId: purchaseOrder.supplierId || '',
          projectId: purchaseOrder.projectId || '',
          expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ?
            new Date(purchaseOrder.expectedDeliveryDate).toISOString().split('T')[0] : '',
          status: purchaseOrder.status || PO_STATUS.DRAFT,
          items: purchaseOrder.items || [],
          taxPercentage: purchaseOrder.taxPercentage || 0,
          notes: purchaseOrder.notes || '',
          terms: purchaseOrder.terms || ''
        });
      } else {
        // Add mode - Generate PO number
        const existingPOs = await getPurchaseOrders(user.id, user.role === 'admin');
        const newPONumber = generatePONumber(existingPOs);
        setFormData(prev => ({
          ...prev,
          poNumber: newPONumber,
          items: []
        }));
      }
    };

    if (show && user) {
      initializeForm();
    }
  }, [purchaseOrder, user, show]);

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

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          materialId: '',
          materialName: '',
          description: '',
          quantity: 0,
          unit: '',
          rate: 0,
          amount: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };

      // If material is selected, auto-fill details
      if (field === 'materialId') {
        const material = materials.find(m => m.id === parseInt(value));
        if (material) {
          newItems[index].materialName = material.name;
          newItems[index].description = material.description || '';
          newItems[index].unit = material.unit;
          newItems[index].rate = material.unitPrice || 0;
        }
      }

      // Calculate amount
      if (field === 'quantity' || field === 'rate') {
        const qty = parseFloat(newItems[index].quantity) || 0;
        const rate = parseFloat(newItems[index].rate) || 0;
        newItems[index].amount = qty * rate;
      }

      return { ...prev, items: newItems };
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.poNumber.trim()) {
      newErrors.poNumber = 'PO number is required';
    }
    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required';
    }
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }
    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.materialId) {
        newErrors[`item_${index}_material`] = 'Material is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        newErrors[`item_${index}_rate`] = 'Valid rate is required';
      }
    });

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
      // Calculate totals
      const totals = calculatePOTotals(formData.items, formData.taxPercentage);

      const poData = {
        poNumber: formData.poNumber,
        orderDate: new Date(formData.orderDate).toISOString(),
        supplierId: parseInt(formData.supplierId),
        projectId: parseInt(formData.projectId),
        expectedDeliveryDate: formData.expectedDeliveryDate ?
          new Date(formData.expectedDeliveryDate).toISOString() : null,
        status: formData.status,
        items: formData.items,
        subtotal: totals.subtotal,
        taxPercentage: parseFloat(formData.taxPercentage) || 0,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        notes: formData.notes,
        terms: formData.terms
      };

      if (purchaseOrder) {
        // Update existing PO using DataContext
        await updatePOInContext(purchaseOrder.id, poData);
        onSuccess?.('Purchase order updated successfully');
      } else {
        // Add new PO using DataContext
        await addPOToContext(poData);
        onSuccess?.('Purchase order created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      setErrors({ submit: 'Failed to save purchase order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for display
  const totals = calculatePOTotals(formData.items, formData.taxPercentage);

  // Get suppliers (vendors)
  const suppliers = (data.parties || []).filter(p =>
    p.type === 'Vendor' || p.type === 'Both'
  );

  // Get projects
  const projects = data.projects || [];

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">
              {purchaseOrder ? 'Edit Purchase Order' : 'New Purchase Order'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label">PO Number *</label>
                  <input
                    type="text"
                    className={`form-control ${errors.poNumber ? 'is-invalid' : ''}`}
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleChange}
                    readOnly
                  />
                  {errors.poNumber && <div className="invalid-feedback">{errors.poNumber}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label">Order Date *</label>
                  <input
                    type="date"
                    className={`form-control ${errors.orderDate ? 'is-invalid' : ''}`}
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleChange}
                  />
                  {errors.orderDate && <div className="invalid-feedback">{errors.orderDate}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label">Expected Delivery</label>
                  <input
                    type="date"
                    className="form-control"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {Object.values(PO_STATUS).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Supplier *</label>
                  <select
                    className={`form-select ${errors.supplierId ? 'is-invalid' : ''}`}
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && <div className="invalid-feedback">{errors.supplierId}</div>}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Project *</label>
                  <select
                    className={`form-select ${errors.projectId ? 'is-invalid' : ''}`}
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.projectId && <div className="invalid-feedback">{errors.projectId}</div>}
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Items *</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleAddItem}
                  >
                    <Plus size={16} className="me-1" />
                    Add Item
                  </button>
                </div>

                {errors.items && (
                  <div className="alert alert-danger">{errors.items}</div>
                )}

                {formData.items.length === 0 ? (
                  <div className="alert alert-info">
                    No items added. Click "Add Item" to get started.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '25%' }}>Material *</th>
                          <th style={{ width: '20%' }}>Description</th>
                          <th style={{ width: '12%' }}>Quantity *</th>
                          <th style={{ width: '10%' }}>Unit</th>
                          <th style={{ width: '12%' }}>Rate *</th>
                          <th style={{ width: '15%' }}>Amount</th>
                          <th style={{ width: '6%' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <select
                                className={`form-select form-select-sm ${errors[`item_${index}_material`] ? 'is-invalid' : ''}`}
                                value={item.materialId}
                                onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                              >
                                <option value="">Select Material</option>
                                {materials.map(material => (
                                  <option key={material.id} value={material.id}>
                                    {material.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                placeholder="Optional"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className={`form-control form-control-sm ${errors[`item_${index}_quantity`] ? 'is-invalid' : ''}`}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={item.unit}
                                readOnly
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className={`form-control form-control-sm ${errors[`item_${index}_rate`] ? 'is-invalid' : ''}`}
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={formatCurrency(item.amount || 0)}
                                readOnly
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveItem(index)}
                                title="Remove Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="5" className="text-end fw-semibold">Subtotal:</td>
                          <td colSpan="2" className="fw-semibold">{formatCurrency(totals.subtotal)}</td>
                        </tr>
                        <tr>
                          <td colSpan="4" className="text-end">
                            <label className="form-label mb-0">Tax (%):</label>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              name="taxPercentage"
                              value={formData.taxPercentage}
                              onChange={handleChange}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </td>
                          <td colSpan="2" className="fw-semibold">{formatCurrency(totals.taxAmount)}</td>
                        </tr>
                        <tr>
                          <td colSpan="5" className="text-end fw-bold">Total Amount:</td>
                          <td colSpan="2" className="fw-bold text-primary">{formatCurrency(totals.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Additional Details */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Internal notes (optional)"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Terms & Conditions</label>
                  <textarea
                    className="form-control"
                    name="terms"
                    rows="3"
                    value={formData.terms}
                    onChange={handleChange}
                    placeholder="Payment terms, delivery terms, etc. (optional)"
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="alert alert-danger mt-3">{errors.submit}</div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>
                  {purchaseOrder ? 'Update' : 'Create'} Purchase Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderFormModal;
