import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const AddPartyModal = ({ show, onClose, onSave, party, defaultType = 'customer', existingParties = [] }) => {
  const { isBootstrap } = useTheme();
  const { data } = useData();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternateNumber: '',
    email: '',
    address: '',
    openingBalance: '',
    balanceType: 'receivable', // 'receivable' (You Got) or 'payable' (You Gave)
    type: defaultType, // 'customer' or 'supplier'
    gstNumber: '',
    defaultProjectId: '', // NEW FIELD - for suppliers
    billingAddress: {
      flatBuilding: '',
      areaLocality: '',
      pinCode: '',
      city: '',
      state: ''
    },
    sameAsBilling: true
  });
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Load party data if editing
  useEffect(() => {
    if (party) {
      setFormData({
        name: party.name || '',
        phone: party.phone || '',
        alternateNumber: party.alternateNumber || '',
        email: party.email || '',
        address: party.address || '',
        openingBalance: party.openingBalance || '',
        balanceType: party.balanceType || 'receivable',
        type: party.type || defaultType,
        gstNumber: party.gstNumber || '',
        defaultProjectId: party.defaultProjectId || '',
        billingAddress: party.billingAddress || {
          flatBuilding: '',
          areaLocality: '',
          pinCode: '',
          city: '',
          state: ''
        },
        sameAsBilling: party.sameAsBilling !== undefined ? party.sameAsBilling : true
      });
      if (party.gstNumber || party.billingAddress?.flatBuilding) {
        setShowAddressSection(true);
      }
    } else {
      // Reset form for new party
      setFormData({
        name: '',
        phone: '',
        alternateNumber: '',
        email: '',
        address: '',
        openingBalance: '',
        balanceType: 'receivable',
        type: defaultType,
        gstNumber: '',
        defaultProjectId: '',
        billingAddress: {
          flatBuilding: '',
          areaLocality: '',
          pinCode: '',
          city: '',
          state: ''
        },
        sameAsBilling: true
      });
      setShowAddressSection(false);
    }
    setErrors({});
  }, [party, defaultType, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Clear duplicate warning when name or phone changes
    if (name === 'name' || name === 'phone') {
      setDuplicateWarning(null);
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.duplicate;
        return newErrors;
      });
    }

    if (name.startsWith('billing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Party name is required';
    }

    // Email validation (if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone number validation (if provided)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    // Alternate number validation (if provided)
    if (formData.alternateNumber && formData.alternateNumber.trim()) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.alternateNumber.replace(/\s/g, ''))) {
        newErrors.alternateNumber = 'Please enter a valid 10-digit phone number';
      }
    }

    // Duplicate supplier validation (Name + Contact Number)
    // Only check for duplicates when adding new supplier or when name/phone changed
    if (formData.type === 'supplier' && formData.name.trim() && formData.phone.trim()) {
      const duplicate = existingParties.find(p => {
        // Skip checking against the same party when editing
        if (party && p.id === party.id) return false;

        // Check if name and phone match (case-insensitive name, exact phone)
        return (
          p.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          p.phone.replace(/\s/g, '') === formData.phone.replace(/\s/g, '')
        );
      });

      if (duplicate) {
        setDuplicateWarning({
          name: duplicate.name,
          phone: duplicate.phone,
          email: duplicate.email || 'N/A',
          address: duplicate.address || 'N/A'
        });
        newErrors.duplicate = 'A supplier with this name and contact number already exists';
      } else {
        setDuplicateWarning(null);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // For customers, set balance to 0 (calculated from invoices/payments)
    // For suppliers, use the entered opening balance
    const isCustomer = formData.type === 'customer';

    const partyData = {
      ...formData,
      currentBalance: isCustomer ? 0 : (parseFloat(formData.openingBalance) || 0),
      openingBalance: isCustomer ? 0 : (parseFloat(formData.openingBalance) || 0),
      balanceType: isCustomer ? 'receivable' : formData.balanceType,
      transactions: []
    };

    onSave(partyData);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              {party ? 'Edit Party' : 'Add New Party'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4">
            {/* Party Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Party Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter Party Name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg">
                  +91
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter Contact Number"
                  className={`flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Alternate Number - NEW FIELD */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alternate Number <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg">
                  +91
                </span>
                <input
                  type="tel"
                  name="alternateNumber"
                  value={formData.alternateNumber}
                  onChange={handleChange}
                  placeholder="Enter Alternate Number"
                  className={`flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.alternateNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.alternateNumber && (
                <p className="text-red-500 text-xs mt-1">{errors.alternateNumber}</p>
              )}
            </div>

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Duplicate Supplier Found
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-1">A supplier with this name and contact number already exists:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Name:</strong> {duplicateWarning.name}</li>
                        <li><strong>Phone:</strong> {duplicateWarning.phone}</li>
                        <li><strong>Email:</strong> {duplicateWarning.email}</li>
                        <li><strong>Address:</strong> {duplicateWarning.address}</li>
                      </ul>
                      <p className="mt-2 font-medium">Please use a different name or contact number.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email ID - NEW FIELD */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email ID <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter Email ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Address - NEW FIELD */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter Address"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Opening Balance - ONLY FOR SUPPLIERS */}
            {formData.type === 'supplier' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Balance <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="openingBalance"
                      value={formData.openingBalance}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <select
                    name="balanceType"
                    value={formData.balanceType}
                    onChange={handleChange}
                    className={`w-full sm:w-auto px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formData.balanceType === 'receivable' ? 'border-green-500 text-green-600 font-medium' : 'border-red-500 text-red-600 font-medium'
                    }`}
                  >
                    <option value="receivable" className="text-green-600">To Receive</option>
                    <option value="payable" className="text-red-600">To Pay</option>
                  </select>
                </div>
              </div>
            )}

            {/* Who are they? */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who are they?
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="customer"
                    checked={formData.type === 'customer'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Customer</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="supplier"
                    checked={formData.type === 'supplier'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Supplier</span>
                </label>
              </div>
            </div>

            {/* Default Project - Only for Suppliers */}
            {formData.type === 'supplier' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Project <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <select
                  name="defaultProjectId"
                  value={formData.defaultProjectId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">-- Select Project --</option>
                  {data.projects
                    ?.filter(p => p.status === 'active')
                    .map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This project will be pre-selected when adding transactions for this supplier
                </p>
              </div>
            )}

            {/* Add GSTIN & Address (Optional) - Collapsible */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowAddressSection(!showAddressSection)}
                className="flex items-center justify-between w-full text-left text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <span>Add GSTIN & Address (Optional)</span>
                {showAddressSection ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAddressSection && (
                <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  {/* GSTIN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="Add GSTIN"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                {party ? 'Update' : 'Add'} {formData.type === 'customer' ? 'Customer' : 'Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPartyModal;


