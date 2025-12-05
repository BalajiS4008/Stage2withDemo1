import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  generateMaterialCode,
  calculateStockValue
} from '../../utils/materialUtils';

const MaterialFormModal = ({ show, onClose, material, onSuccess }) => {
  const { user, data, addMaterial: addMaterialToContext, updateMaterial: updateMaterialInContext } = useData();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    materialCode: '',
    name: '',
    description: '',
    category: '',
    unit: '',
    currentStock: 0,
    reorderLevel: 0,
    reorderQuantity: 0,
    unitPrice: 0,
    supplier: '',
    location: '',
    lastPurchaseDate: '',
    isActive: true
  });

  // Initialize form when material prop changes
  useEffect(() => {
    if (material) {
      setFormData({
        materialCode: material.materialCode || '',
        name: material.name || '',
        description: material.description || '',
        category: material.category || '',
        unit: material.unit || '',
        currentStock: material.currentStock || 0,
        reorderLevel: material.reorderLevel || 0,
        reorderQuantity: material.reorderQuantity || 0,
        unitPrice: material.unitPrice || 0,
        supplier: material.supplier || '',
        location: material.location || '',
        lastPurchaseDate: material.lastPurchaseDate || '',
        isActive: material.isActive !== undefined ? material.isActive : true
      });
    } else if (show && !material && data.materials) {
      // Generate material code for new material when modal is shown
      const existingMaterials = data.materials || [];
      const newCode = generateMaterialCode(existingMaterials);
      setFormData(prev => ({ ...prev, materialCode: newCode }));
    }
  }, [material, show, data.materials]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Material name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.unit) {
      newErrors.unit = 'Unit of measurement is required';
    }
    if (parseFloat(formData.reorderLevel) < 0) {
      newErrors.reorderLevel = 'Reorder level cannot be negative';
    }
    if (parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
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
      const materialData = {
        ...formData,
        currentStock: parseFloat(formData.currentStock) || 0,
        reorderLevel: parseFloat(formData.reorderLevel) || 0,
        reorderQuantity: parseFloat(formData.reorderQuantity) || 0,
        unitPrice: parseFloat(formData.unitPrice) || 0
      };

      if (material) {
        // Update existing material using DataContext
        await updateMaterialInContext(material.id, materialData);
      } else {
        // Add new material using DataContext
        await addMaterialToContext(materialData);
      }

      onSuccess(material ? 'Material updated successfully' : 'Material added successfully');
      handleClose();
    } catch (error) {
      console.error('Error saving material:', error);
      setErrors({ submit: 'Failed to save material. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      materialCode: '',
      name: '',
      description: '',
      category: '',
      unit: '',
      currentStock: 0,
      reorderLevel: 0,
      reorderQuantity: 0,
      unitPrice: 0,
      supplier: '',
      location: '',
      lastPurchaseDate: '',
      isActive: true
    });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  const stockValue = calculateStockValue(formData.currentStock, formData.unitPrice);

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
                {material ? 'Edit Material' : 'Add New Material'}
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
              <form onSubmit={handleSubmit} id="materialForm">
                {/* Error Alert */}
                {errors.submit && (
                  <div className="alert alert-danger" role="alert">
                    {errors.submit}
                  </div>
                )}

                {/* Material Code (Read-only) */}
                <div className="mb-3">
                  <label className="form-label">Material Code</label>
                  <input
                    type="text"
                    className="form-control bg-light"
                    value={formData.materialCode}
                    readOnly
                  />
                  <small className="form-text text-muted">
                    Auto-generated code for this material
                  </small>
                </div>

                <div className="row">
                  {/* Material Name */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Material Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Portland Cement"
                      disabled={loading}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name}</div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Category</option>
                      {MATERIAL_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <div className="invalid-feedback">{errors.category}</div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Additional details about the material"
                    disabled={loading}
                  />
                </div>

                <div className="row">
                  {/* Unit */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Unit of Measurement <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${errors.unit ? 'is-invalid' : ''}`}
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select Unit</option>
                      {MATERIAL_UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                    {errors.unit && (
                      <div className="invalid-feedback">{errors.unit}</div>
                    )}
                  </div>

                  {/* Current Stock */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Current Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                    <small className="form-text text-muted">
                      Opening balance (use Stock Transactions for regular updates)
                    </small>
                  </div>
                </div>

                <div className="row">
                  {/* Reorder Level */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      className={`form-control ${errors.reorderLevel ? 'is-invalid' : ''}`}
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                    {errors.reorderLevel && (
                      <div className="invalid-feedback">{errors.reorderLevel}</div>
                    )}
                    <small className="form-text text-muted">
                      Alert when stock falls below this level
                    </small>
                  </div>

                  {/* Reorder Quantity */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Reorder Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      name="reorderQuantity"
                      value={formData.reorderQuantity}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                    <small className="form-text text-muted">
                      Suggested quantity to reorder
                    </small>
                  </div>
                </div>

                <div className="row">
                  {/* Unit Price */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Unit Price (₹)</label>
                    <input
                      type="number"
                      className={`form-control ${errors.unitPrice ? 'is-invalid' : ''}`}
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      disabled={loading}
                    />
                    {errors.unitPrice && (
                      <div className="invalid-feedback">{errors.unitPrice}</div>
                    )}
                  </div>

                  {/* Stock Value (Calculated) */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Stock Value (₹)</label>
                    <input
                      type="text"
                      className="form-control bg-light"
                      value={`₹${stockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                      readOnly
                    />
                    <small className="form-text text-muted">
                      Current Stock × Unit Price
                    </small>
                  </div>
                </div>

                <div className="row">
                  {/* Supplier */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Preferred Supplier</label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      placeholder="Supplier name"
                      disabled={loading}
                    />
                  </div>

                  {/* Location */}
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Storage Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Warehouse A, Site Store"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Last Purchase Date */}
                <div className="mb-3">
                  <label className="form-label">Last Purchase Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="lastPurchaseDate"
                    value={formData.lastPurchaseDate}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Active Status */}
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Active Material
                  </label>
                  <small className="form-text text-muted d-block">
                    Inactive materials will be hidden from stock transactions
                  </small>
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
                form="materialForm"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  material ? 'Update Material' : 'Add Material'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MaterialFormModal;
