import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Building2, Shield, Upload, X, Save, AlertCircle, Check, Phone, Mail, Globe, CreditCard, Building } from 'lucide-react';

const CompanyProfile = () => {
  const { data, updateCompanyProfile } = useData();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    logo: data.settings?.companyProfile?.logo || '',
    companyName: data.settings?.companyProfile?.companyName || '',
    address: data.settings?.companyProfile?.address || '',
    phone: data.settings?.companyProfile?.phone || '',
    email: data.settings?.companyProfile?.email || '',
    website: data.settings?.companyProfile?.website || '',
    gstNumber: data.settings?.companyProfile?.gstNumber || '',
    panNumber: data.settings?.companyProfile?.panNumber || '',
    cinNumber: data.settings?.companyProfile?.cinNumber || '',
    bankName: data.settings?.companyProfile?.bankName || '',
    accountNumber: data.settings?.companyProfile?.accountNumber || '',
    ifscCode: data.settings?.companyProfile?.ifscCode || '',
    branchName: data.settings?.companyProfile?.branchName || ''
  });

  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState(data.settings?.companyProfile?.logo || '');

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-20 h-20 mx-auto mb-4 text-danger-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate phone number (Indian format)
  const validatePhone = (phone) => {
    const re = /^[+]?[0-9\s-]{10,15}$/;
    return re.test(phone);
  };

  // Validate GST number (India format: 22AAAAA0000A1Z5)
  const validateGST = (gst) => {
    if (!gst) return true; // Optional field
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return re.test(gst);
  };

  // Validate PAN number (India format: AAAAA0000A)
  const validatePAN = (pan) => {
    if (!pan) return true; // Optional field
    const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return re.test(pan);
  };

  // Validate URL
  const validateURL = (url) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate IFSC code (India format: AAAA0000000)
  const validateIFSC = (ifsc) => {
    if (!ifsc) return true; // Optional field
    const re = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return re.test(ifsc);
  };

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, logo: 'Please upload a valid image (JPG, PNG, or WebP)' });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logo: 'Image size must be less than 2MB' });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setFormData({ ...formData, logo: reader.result });
      setErrors({ ...errors, logo: '' });
    };
    reader.readAsDataURL(file);
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData({ ...formData, logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Optional fields validation
    if (formData.website && !validateURL(formData.website)) {
      newErrors.website = 'Please enter a valid URL (e.g., https://example.com)';
    }

    if (formData.gstNumber && !validateGST(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST format (e.g., 22AAAAA0000A1Z5)';
    }

    if (formData.panNumber && !validatePAN(formData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN format (e.g., AAAAA0000A)';
    }

    if (formData.ifscCode && !validateIFSC(formData.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC format (e.g., ABCD0123456)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    updateCompanyProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
        <p className="text-gray-600 mt-1">Manage your company information for invoices and quotations</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-success-600" />
          <p className="text-success-800 font-medium">Company profile saved successfully!</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Logo */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-600" />
            Company Logo
          </h3>
          
          <div className="space-y-4">
            {logoPreview ? (
              <div className="flex items-start gap-4">
                <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={logoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Current logo</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary text-sm"
                    >
                      Change Logo
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn btn-secondary text-sm flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium">Click to upload company logo</p>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG or WebP (Max 2MB)</p>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            {errors.logo && (
              <p className="text-sm text-danger-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.logo}
              </p>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-600" />
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label className="label">
                Company Name <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className={`input ${errors.companyName ? 'border-danger-500' : ''}`}
                placeholder="Enter company name"
              />
              {errors.companyName && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="label">
                Address <span className="text-danger-600">*</span>
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`input ${errors.address ? 'border-danger-500' : ''}`}
                placeholder="Enter complete business address"
                rows="3"
              />
              {errors.address && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary-600" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="label">
                Phone Number <span className="text-danger-600">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`input ${errors.phone ? 'border-danger-500' : ''}`}
                placeholder="+91 98765 43210"
              />
              {errors.phone && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">
                Email Address <span className="text-danger-600">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input ${errors.email ? 'border-danger-500' : ''}`}
                placeholder="info@company.com"
              />
              {errors.email && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="label">Website (Optional)</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className={`input ${errors.website ? 'border-danger-500' : ''}`}
                placeholder="https://www.company.com"
              />
              {errors.website && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.website}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            Tax & Registration Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GST Number */}
            <div>
              <label className="label">GST Number (Optional)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                className={`input ${errors.gstNumber ? 'border-danger-500' : ''}`}
                placeholder="22AAAAA0000A1Z5"
                maxLength="15"
              />
              {errors.gstNumber && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.gstNumber}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
            </div>

            {/* PAN Number */}
            <div>
              <label className="label">PAN Number (Optional)</label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                className={`input ${errors.panNumber ? 'border-danger-500' : ''}`}
                placeholder="AAAAA0000A"
                maxLength="10"
              />
              {errors.panNumber && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.panNumber}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Format: AAAAA0000A (10 characters)</p>
            </div>

            {/* CIN Number */}
            <div className="md:col-span-2">
              <label className="label">CIN/Registration Number (Optional)</label>
              <input
                type="text"
                value={formData.cinNumber}
                onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value.toUpperCase() })}
                className="input"
                placeholder="U12345AB2020PTC123456"
              />
              <p className="text-xs text-gray-500 mt-1">Corporate Identity Number or Business Registration Number</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            Bank Details (Optional)
          </h3>
          <p className="text-sm text-gray-600 mb-4">Bank details will appear on invoices for payment reference</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Name */}
            <div>
              <label className="label">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="input"
                placeholder="State Bank of India"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="label">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="input"
                placeholder="1234567890"
              />
            </div>

            {/* IFSC Code */}
            <div>
              <label className="label">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                className={`input ${errors.ifscCode ? 'border-danger-500' : ''}`}
                placeholder="SBIN0001234"
                maxLength="11"
              />
              {errors.ifscCode && (
                <p className="text-sm text-danger-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ifscCode}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">Format: ABCD0123456 (11 characters)</p>
            </div>

            {/* Branch Name */}
            <div>
              <label className="label">Branch Name</label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className="input"
                placeholder="Main Branch, City Name"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Company Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;

