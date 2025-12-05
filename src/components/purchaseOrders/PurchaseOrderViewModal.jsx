import React from 'react';
import { useData } from '../../context/DataContext';
import { X, Calendar, Package, FileText, User, MapPin } from 'lucide-react';
import {
  getPOStatusColor,
  formatCurrency
} from '../../utils/materialUtils';

const PurchaseOrderViewModal = ({ show, onClose, purchaseOrder }) => {
  const { data } = useData();

  if (!show || !purchaseOrder) return null;

  // Get supplier details
  const supplier = (data.parties || []).find(p => p.id === purchaseOrder.supplierId);

  // Get project details
  const project = (data.projects || []).find(p => p.id === purchaseOrder.projectId);

  // Get material details
  const getMaterialName = (materialId) => {
    const material = (data.materials || []).find(m => m.id === materialId);
    return material ? material.name : 'Unknown Material';
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div>
              <h5 className="modal-title mb-1">Purchase Order Details</h5>
              <div className="text-muted small">PO #{purchaseOrder.poNumber}</div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Status Badge */}
            <div className="mb-4">
              <span className={`badge bg-${getPOStatusColor(purchaseOrder.status)} fs-6`}>
                {purchaseOrder.status}
              </span>
            </div>

            {/* PO Information Grid */}
            <div className="row g-4 mb-4">
              {/* Supplier Details */}
              <div className="col-md-6">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body">
                    <h6 className="card-title d-flex align-items-center gap-2 mb-3">
                      <User size={18} className="text-primary" />
                      Supplier Information
                    </h6>
                    <div className="mb-2">
                      <strong>Name:</strong> {supplier?.name || 'N/A'}
                    </div>
                    {supplier?.phone && (
                      <div className="mb-2">
                        <strong>Phone:</strong> {supplier.phone}
                      </div>
                    )}
                    {supplier?.email && (
                      <div className="mb-2">
                        <strong>Email:</strong> {supplier.email}
                      </div>
                    )}
                    {supplier?.address && (
                      <div className="mb-2">
                        <strong>Address:</strong> {supplier.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="col-md-6">
                <div className="card border-0 bg-light h-100">
                  <div className="card-body">
                    <h6 className="card-title d-flex align-items-center gap-2 mb-3">
                      <FileText size={18} className="text-primary" />
                      Order Information
                    </h6>
                    <div className="mb-2">
                      <strong>Project:</strong> {project?.name || 'N/A'}
                    </div>
                    <div className="mb-2">
                      <strong>Order Date:</strong>{' '}
                      {new Date(purchaseOrder.orderDate).toLocaleDateString('en-IN')}
                    </div>
                    {purchaseOrder.expectedDeliveryDate && (
                      <div className="mb-2">
                        <strong>Expected Delivery:</strong>{' '}
                        {new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString('en-IN')}
                      </div>
                    )}
                    <div className="mb-2">
                      <strong>Total Items:</strong> {purchaseOrder.items?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-4">
              <h6 className="mb-3">Order Items</h6>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '30%' }}>Material</th>
                      <th style={{ width: '25%' }}>Description</th>
                      <th style={{ width: '10%' }} className="text-end">Quantity</th>
                      <th style={{ width: '10%' }}>Unit</th>
                      <th style={{ width: '10%' }} className="text-end">Rate</th>
                      <th style={{ width: '10%' }} className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(purchaseOrder.items || []).map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{getMaterialName(item.materialId)}</td>
                        <td>{item.description || '-'}</td>
                        <td className="text-end">
                          {parseFloat(item.quantity || 0).toFixed(2)}
                        </td>
                        <td>{item.unit}</td>
                        <td className="text-end">
                          {formatCurrency(item.rate || 0)}
                        </td>
                        <td className="text-end">
                          {formatCurrency(item.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="6" className="text-end fw-semibold">Subtotal:</td>
                      <td className="text-end fw-semibold">
                        {formatCurrency(purchaseOrder.subtotal || 0)}
                      </td>
                    </tr>
                    {purchaseOrder.taxPercentage > 0 && (
                      <tr>
                        <td colSpan="6" className="text-end">
                          Tax ({purchaseOrder.taxPercentage}%):
                        </td>
                        <td className="text-end">
                          {formatCurrency(purchaseOrder.taxAmount || 0)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">Total Amount:</td>
                      <td className="text-end fw-bold text-primary fs-5">
                        {formatCurrency(purchaseOrder.totalAmount || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes and Terms */}
            {(purchaseOrder.notes || purchaseOrder.terms) && (
              <div className="row g-3">
                {purchaseOrder.notes && (
                  <div className="col-md-6">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <h6 className="card-title mb-2">Notes</h6>
                        <p className="mb-0 small">{purchaseOrder.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {purchaseOrder.terms && (
                  <div className="col-md-6">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <h6 className="card-title mb-2">Terms & Conditions</h6>
                        <p className="mb-0 small">{purchaseOrder.terms}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-4 pt-3 border-top">
              <div className="row text-muted small">
                {purchaseOrder.createdAt && (
                  <div className="col-md-6">
                    <strong>Created:</strong>{' '}
                    {new Date(purchaseOrder.createdAt).toLocaleString('en-IN')}
                  </div>
                )}
                {purchaseOrder.lastUpdated && (
                  <div className="col-md-6">
                    <strong>Last Updated:</strong>{' '}
                    {new Date(purchaseOrder.lastUpdated).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                window.print();
              }}
            >
              <FileText size={16} className="me-1" />
              Print PO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderViewModal;
