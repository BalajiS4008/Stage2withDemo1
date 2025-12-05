import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { X, Plus, Trash2, AlertCircle, Eye, Building2, User } from 'lucide-react';
import { generateId } from '../utils/dataManager';
import InvoicePreviewModal from './InvoicePreviewModal';

const InvoiceFormModal = ({ invoice, onClose, onSave }) => {
  const { data } = useData();
  const companyProfile = data.settings?.companyProfile || {};
  const invoiceSettings = data.settings?.invoiceSettings || { prefix: 'INV', nextNumber: 1 };
  const measurementUnits = data.settings?.measurementUnits || ['sq.ft', 'kg', 'piece', 'meter', 'ft'];

  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || `${invoiceSettings.prefix}-${String(invoiceSettings.nextNumber).padStart(4, '0')}`,
    date: invoice?.date || new Date().toISOString().split('T')[0],
    
    // Client details
    clientName: invoice?.clientName || '',
    clientAddress: invoice?.clientAddress || '',
    clientPhone: invoice?.clientPhone || '',
    clientEmail: invoice?.clientEmail || '',
    
    // Company details (editable per invoice)
    companyName: invoice?.companyName || companyProfile.companyName || '',
    companyAddress: invoice?.companyAddress || companyProfile.address || '',
    companyPhone: invoice?.companyPhone || companyProfile.phone || '',
    companyEmail: invoice?.companyEmail || companyProfile.email || '',
    companyGST: invoice?.companyGST || companyProfile.gstNumber || '',
    companyLogo: invoice?.companyLogo || companyProfile.logo || '',
    
    // Line items
    items: invoice?.items || [{ id: generateId(), description: '', measurementValue: 0, unit: '', quantity: 1, rate: 0, amount: 0, gstRate: 18, gstValue: 0 }],
    
    // Payment details
    paymentMethod: invoice?.paymentMethod || 'CASH',
    gstEnabled: invoice?.gstEnabled !== undefined ? invoice.gstEnabled : true,
    gstPercentage: invoice?.gstPercentage || 18,
    itemGstEnabled: invoice?.itemGstEnabled !== undefined ? invoice.itemGstEnabled : true,
    
    // Calculated fields
    subtotal: invoice?.subtotal || 0,
    gstAmount: invoice?.gstAmount || 0,
    discount: invoice?.discount || 0,
    discountType: invoice?.discountType || 'amount', // 'amount' or 'percentage'
    discountAmount: invoice?.discountAmount || 0, // Calculated discount amount
    grandTotal: invoice?.grandTotal || 0,

    status: invoice?.status || 'pending',
    dueDate: invoice?.dueDate || '',
    notes: invoice?.notes || '',
    termsAndConditions: invoice?.termsAndConditions || ''
  });

  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Calculate totals whenever items, GST, or discount changes
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.gstEnabled, formData.gstPercentage, formData.discount, formData.discountType]);

  // Recalculate all items when itemGstEnabled changes
  useEffect(() => {
    const newItems = formData.items.map(item => {
      const measurementValue = parseFloat(item.measurementValue) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;

      // Calculate base amount: If area is 0, use qty × rate, otherwise use area × qty × rate
      const baseAmount = measurementValue > 0 ? (measurementValue * quantity * rate) : (quantity * rate);
      const gstValue = formData.itemGstEnabled ? (baseAmount * gstRate) / 100 : 0;

      return {
        ...item,
        gstValue,
        amount: baseAmount + gstValue
      };
    });

    setFormData(prev => ({ ...prev, items: newItems }));
  }, [formData.itemGstEnabled]);

  const calculateTotals = () => {
    // Calculate subtotal (base amounts without GST)
    const subtotal = formData.items.reduce((sum, item) => {
      const measurementValue = parseFloat(item.measurementValue) || 0;
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      // Calculate base amount: If area is 0, use qty × rate, otherwise use area × qty × rate
      const baseAmount = measurementValue > 0 ? (measurementValue * quantity * rate) : (quantity * rate);
      return sum + baseAmount;
    }, 0);

    let gstAmount = 0;
    let totalBeforeDiscount = 0;
    let discountAmount = 0;
    let grandTotal = 0;

    if (formData.gstEnabled) {
      // Overall GST Mode: Apply single percentage to subtotal
      gstAmount = (subtotal * formData.gstPercentage) / 100;
      totalBeforeDiscount = subtotal + gstAmount;
    } else if (formData.itemGstEnabled) {
      // Per-Item GST Mode: Sum GST from all items
      gstAmount = formData.items.reduce((sum, item) => {
        return sum + (item.gstValue || 0);
      }, 0);
      totalBeforeDiscount = formData.items.reduce((sum, item) => {
        return sum + (item.amount || 0);
      }, 0);
    } else {
      // No GST Mode
      gstAmount = 0;
      totalBeforeDiscount = subtotal;
    }

    // Calculate discount
    const discountValue = parseFloat(formData.discount) || 0;
    if (formData.discountType === 'percentage') {
      discountAmount = (totalBeforeDiscount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    // Grand total after discount
    grandTotal = Math.max(0, totalBeforeDiscount - discountAmount);

    setFormData(prev => ({
      ...prev,
      subtotal,
      gstAmount,
      discountAmount, // Store calculated discount amount
      grandTotal
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-calculate GST and amount when area, qty, rate, or gstRate changes
    if (field === 'measurementValue' || field === 'quantity' || field === 'rate' || field === 'gstRate') {
      const measurementValue = parseFloat(newItems[index].measurementValue) || 0;
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const rate = parseFloat(newItems[index].rate) || 0;
      const gstRate = parseFloat(newItems[index].gstRate) || 0;

      // Calculate base amount: If area is 0, use qty × rate, otherwise use area × qty × rate
      const baseAmount = measurementValue > 0 ? (measurementValue * quantity * rate) : (quantity * rate);

      // Calculate GST value only if itemGstEnabled is true
      const gstValue = formData.itemGstEnabled ? (baseAmount * gstRate) / 100 : 0;

      // Total amount includes GST: baseAmount + gstValue
      newItems[index].gstValue = gstValue;
      newItems[index].amount = baseAmount + gstValue;
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleIncrement = (index, field) => {
    const newItems = [...formData.items];
    const currentValue = parseFloat(newItems[index][field]) || 0;
    // Round to whole number when using increment buttons
    newItems[index][field] = Math.round(currentValue) + 1;

    // Recalculate GST and amount
    const measurementValue = parseFloat(newItems[index].measurementValue) || 0;
    const quantity = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    const gstRate = parseFloat(newItems[index].gstRate) || 0;

    // Calculate base amount: If area is 0, use qty × rate, otherwise use area × qty × rate
    const baseAmount = measurementValue > 0 ? (measurementValue * quantity * rate) : (quantity * rate);
    const gstValue = formData.itemGstEnabled ? (baseAmount * gstRate) / 100 : 0;
    newItems[index].gstValue = gstValue;
    newItems[index].amount = baseAmount + gstValue;

    setFormData({ ...formData, items: newItems });
  };

  const handleDecrement = (index, field) => {
    const newItems = [...formData.items];
    const currentValue = parseFloat(newItems[index][field]) || 0;
    // Round to whole number when using decrement buttons, minimum 0
    newItems[index][field] = Math.max(0, Math.round(currentValue) - 1);

    // Recalculate GST and amount
    const measurementValue = parseFloat(newItems[index].measurementValue) || 0;
    const quantity = parseFloat(newItems[index].quantity) || 0;
    const rate = parseFloat(newItems[index].rate) || 0;
    const gstRate = parseFloat(newItems[index].gstRate) || 0;

    // Calculate base amount: If area is 0, use qty × rate, otherwise use area × qty × rate
    const baseAmount = measurementValue > 0 ? (measurementValue * quantity * rate) : (quantity * rate);
    const gstValue = formData.itemGstEnabled ? (baseAmount * gstRate) / 100 : 0;
    newItems[index].gstValue = gstValue;
    newItems[index].amount = baseAmount + gstValue;

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: generateId(), description: '', measurementValue: 0, unit: '', quantity: 1, rate: 0, amount: 0, gstRate: 18, gstValue: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (formData.items.length === 0 || !formData.items.some(item => item.description.trim())) {
      newErrors.items = 'At least one item with description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }
    setShowPreview(true);
  };

  const handleSave = (finalData) => {
    onSave(finalData);
  };

  if (showPreview) {
    return (
      <InvoicePreviewModal
        formData={formData}
        onBack={() => setShowPreview(false)}
        onSave={handleSave}
        isEditing={!!invoice}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto"
      onClick={onClose}
      style={{ margin: 0 }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full my-auto max-h-[95vh] flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: 'auto', marginBottom: 'auto' }}
      >
        {/* Premium Header with Gradient */}
        <div className="relative px-8 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shrink-0">
          {/* Decorative Elements - smaller and more subtle */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-60"></div>

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-white mb-0.5 truncate">
                  {invoice ? 'Edit Invoice' : 'Create New Invoice'}
                </h2>
                <p className="text-white/90 text-xs font-medium">Fill in the details below to generate a professional invoice</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-300 group shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <form className="space-y-6">
            {/* Invoice Header Section with Premium Design */}
            <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-2xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>

              <h3 className="relative text-xl font-bold mb-5 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Invoice Details
                </span>
              </h3>
              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Invoice Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl font-bold text-indigo-600 text-lg outline-none cursor-not-allowed"
                      readOnly
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-600 bg-white px-2 py-1 rounded-full">Auto</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 ml-1">Automatically generated</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Invoice Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Invoice Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-medium appearance-none cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

          {/* Payment Details */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-600 rounded"></div>
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Payment Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="input"
                >
                  <option value="CASH">CASH</option>
                  <option value="ONLINE">ONLINE</option>
                  <option value="CHEQUE">CHEQUE</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              {formData.status === 'pending' && (
                <div>
                  <label className="label">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input"
                    min={formData.date}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Payment deadline for this invoice
                  </p>
                </div>
              )}
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows="1"
                  placeholder="Additional payment notes"
                />
              </div>
            </div>
          </div>

          {/* Company and Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Details */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                Your Company Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Company Name <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={`input ${errors.companyName ? 'border-danger-500' : ''}`}
                    placeholder="Your Company Name"
                  />
                  {errors.companyName && (
                    <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.companyName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                    className="input"
                    rows="2"
                    placeholder="Company address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="text"
                      value={formData.companyPhone}
                      onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                      className="input"
                      placeholder="Phone"
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                      className="input"
                      placeholder="Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">GST Number</label>
                  <input
                    type="text"
                    value={formData.companyGST}
                    onChange={(e) => setFormData({ ...formData, companyGST: e.target.value })}
                    className="input"
                    placeholder="GST Number"
                  />
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-success-600" />
                Client Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    Client Name <span className="text-danger-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className={`input ${errors.clientName ? 'border-danger-500' : ''}`}
                    placeholder="Client name"
                  />
                  {errors.clientName && (
                    <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.clientName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={formData.clientAddress}
                    onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                    className="input"
                    rows="2"
                    placeholder="Client address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="text"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="input"
                      placeholder="Phone"
                    />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="input"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-primary-600 rounded"></div>
                Line Items
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-secondary text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            {errors.items && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-sm text-danger-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.items}
                </p>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
                    <th className="text-left py-4 px-3 text-sm font-bold text-gray-800" style={{width: formData.itemGstEnabled ? '18%' : '23%'}}>Description</th>
                    <th className="text-center py-4 px-2 text-sm font-bold text-gray-800" style={{width: '12%'}}>Area</th>
                    <th className="text-left py-4 px-2 text-sm font-bold text-gray-800" style={{width: '8%'}}>Unit</th>
                    <th className="text-center py-4 px-2 text-sm font-bold text-gray-800" style={{width: '13%'}}>Qty</th>
                    <th className="text-center py-4 px-2 text-sm font-bold text-gray-800" style={{width: '13%'}}>Rate (₹)</th>
                    {formData.itemGstEnabled && (
                      <th className="text-center py-4 px-2 text-sm font-bold text-gray-800" style={{width: '10%'}}>GST</th>
                    )}
                    <th className="text-right py-4 px-3 text-sm font-bold text-gray-800" style={{width: formData.itemGstEnabled ? '14%' : '19%'}}>Amount (₹)</th>
                    <th className="text-center py-4 px-2 text-sm font-bold text-gray-800" style={{width: '4%'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="Item description"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => handleDecrement(index, 'measurementValue')}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-sm"
                            title="Decrease measurement value"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.measurementValue}
                            onChange={(e) => handleItemChange(index, 'measurementValue', e.target.value)}
                            className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            min="0"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(index, 'measurementValue')}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-sm"
                            title="Increase measurement value"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        >
                          <option value="">Unit</option>
                          {measurementUnits.map((unit, idx) => (
                            <option key={idx} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => handleDecrement(index, 'quantity')}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-sm"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(index, 'quantity')}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-sm"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            type="button"
                            onClick={() => handleDecrement(index, 'rate')}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-sm"
                            title="Decrease rate"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            className="w-full px-2 py-2 text-sm text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            min="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleIncrement(index, 'rate')}
                            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-sm"
                            title="Increase rate"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      {formData.itemGstEnabled && (
                        <td className="py-3 px-2">
                          <div className="flex flex-col items-center gap-1">
                            {/* GST Rate Input with +/- buttons */}
                            <div className="flex items-center gap-0.5 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  const newRate = Math.max(0, Math.round(item.gstRate || 18) - 1);
                                  handleItemChange(index, 'gstRate', newRate);
                                }}
                                className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-xs"
                                title="Decrease GST rate"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={Math.round(item.gstRate || 18)}
                                onChange={(e) => handleItemChange(index, 'gstRate', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                min="0"
                                max="100"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newRate = Math.min(100, Math.round(item.gstRate || 18) + 1);
                                  handleItemChange(index, 'gstRate', newRate);
                                }}
                                className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-700 font-bold transition-all text-xs"
                                title="Increase GST rate"
                              >
                                +
                              </button>
                            </div>
                            {/* Display calculated GST value */}
                            <div className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded w-full text-center">
                              ₹{(item.gstValue || 0).toFixed(2)}
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <div className="text-right font-bold text-base text-gray-900 bg-gray-50 px-2 py-2 rounded-md">
                          ₹{item.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className={`p-2 rounded-md transition-all ${
                            formData.items.length === 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-danger-600 hover:bg-danger-100'
                          }`}
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-full md:w-1/2 lg:w-1/3 space-y-3 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <span className="font-semibold text-gray-900">₹{formData.subtotal.toFixed(2)}</span>
                </div>
                {formData.gstEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">GST ({formData.gstPercentage}%):</span>
                    <span className="font-semibold text-gray-900">₹{formData.gstAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Discount Section */}
                <div className="border-t border-gray-300 pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 font-medium">Discount:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        className="input py-1 px-2 text-sm w-24"
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="input py-1 px-2 text-sm w-24"
                      >
                        <option value="amount">₹</option>
                        <option value="percentage">%</option>
                      </select>
                    </div>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span className="font-medium">Discount Applied:</span>
                      <span className="font-semibold">
                        - ₹{formData.discountType === 'percentage'
                          ? (((formData.subtotal + formData.gstAmount) * formData.discount) / 100).toFixed(2)
                          : formData.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-lg border-t-2 border-gray-300 pt-3">
                  <span className="font-bold text-gray-900">Grand Total:</span>
                  <span className="font-bold text-primary-600">₹{formData.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* GST Configuration */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-yellow-600 rounded"></div>
              GST Configuration
            </h3>
            <div className="space-y-4">
              {/* GST Mode Selection */}
              <div className="bg-white rounded-lg p-4 border border-yellow-300">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Choose GST Application Method:
                </label>
                <div className="space-y-3">
                  {/* No GST Option */}
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <input
                      type="radio"
                      name="gstMode"
                      checked={!formData.itemGstEnabled && !formData.gstEnabled}
                      onChange={() => setFormData({ ...formData, itemGstEnabled: false, gstEnabled: false })}
                      className="w-5 h-5 text-primary-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">No GST</span>
                      <p className="text-xs text-gray-600 mt-1">Invoice without any GST</p>
                    </div>
                  </label>

                  {/* Per Item GST Option */}
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                    <input
                      type="radio"
                      name="gstMode"
                      checked={formData.itemGstEnabled && !formData.gstEnabled}
                      onChange={() => setFormData({ ...formData, itemGstEnabled: true, gstEnabled: false })}
                      className="w-5 h-5 text-primary-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">GST on Each Row</span>
                      <p className="text-xs text-gray-600 mt-1">Apply different GST rates to individual line items</p>
                    </div>
                  </label>

                  {/* Overall GST Option */}
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200">
                    <input
                      type="radio"
                      name="gstMode"
                      checked={formData.gstEnabled}
                      onChange={() => setFormData({ ...formData, itemGstEnabled: false, gstEnabled: true })}
                      className="w-5 h-5 text-primary-600 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">Overall GST ({formData.gstPercentage}%)</span>
                      <p className="text-xs text-gray-600 mt-1">Apply single GST rate to entire invoice subtotal</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Per-Item GST Info */}
              {formData.itemGstEnabled && !formData.gstEnabled && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900">
                      <strong>ℹ️ Per-Item GST Mode:</strong> You can set different GST rates for each line item in the table above.
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-900">Total GST Amount (Sum of all items)</p>
                    <p className="text-lg font-bold text-green-700">₹{formData.gstAmount.toFixed(2)}</p>
                  </div>
                </>
              )}

              {/* Overall GST Settings */}
              {formData.gstEnabled && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-900">
                      <strong>ℹ️ Overall GST Mode:</strong> A single {formData.gstPercentage}% GST will be applied to the entire invoice subtotal.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Overall GST Percentage (%)</label>
                      <input
                        type="number"
                        value={formData.gstPercentage}
                        onChange={(e) => setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })}
                        className="input"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g., 18"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Common rates: 5%, 12%, 18%, 28%
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                      <div>
                        <p className="text-sm font-medium text-green-900">Total GST Amount</p>
                        <p className="text-lg font-bold text-green-700">₹{formData.gstAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-600 rounded"></div>
              Terms & Conditions
            </h3>
            <div>
              <label className="label">Terms & Conditions (Optional)</label>
              <textarea
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="input"
                rows="4"
                placeholder="Enter terms and conditions for this invoice (e.g., payment terms, warranties, return policy, etc.)"
              />
              <p className="text-xs text-gray-500 mt-2">
                These terms will be displayed at the bottom of the invoice PDF.
              </p>
            </div>
          </div>
          </form>
        </div>

        {/* Premium Footer Actions */}
        <div className="relative px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-indigo-100">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              className="group relative px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Eye className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Preview Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceFormModal;

