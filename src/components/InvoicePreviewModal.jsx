import React, { useState } from 'react';
import { X, ArrowLeft, Download, Settings as SettingsIcon, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager';
import { generateInvoicePDF } from '../utils/invoiceTemplates';
import { useData } from '../context/DataContext';

const InvoicePreviewModal = ({ formData: initialFormData, onBack, onSave, isEditing }) => {
  const { data, updateInvoiceSettings } = useData();
  const signatureSettings = data.settings?.signatureSettings || { type: 'none' };
  const invoiceSettings = data.settings?.invoiceSettings || {};
  const defaultTemplate = invoiceSettings.defaultTemplate || 'classic';

  const [formData, setFormData] = useState(initialFormData);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [customMessage, setCustomMessage] = useState(formData.notes || '');
  const [showSettings, setShowSettings] = useState(true);
  const [showGSTColumn, setShowGSTColumn] = useState(initialFormData.itemGstEnabled || false);
  const [fontSize, setFontSize] = useState(invoiceSettings.fontSize || 'medium');

  const templates = [
    {
      id: 'liceria',
      name: 'Liceria & Co.',
      description: 'Professional blue corporate design with modern layout',
      preview: '/templates/liceria-preview.png'
    },
    {
      id: 'classic',
      name: 'Classic',
      description: 'Traditional layout with clean design',
      preview: '/templates/classic-preview.png'
    },
    {
      id: 'modern',
      name: 'Modern',
      description: 'Contemporary design with colored accents',
      preview: '/templates/modern-preview.png'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple black & white layout',
      preview: '/templates/minimal-preview.png'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Formal design with structured sections',
      preview: '/templates/professional-preview.png'
    },
    {
      id: 'corporate',
      name: 'Corporate Blue',
      description: 'Modern corporate design with navy blue and gold accents',
      preview: '/templates/corporate-preview.png'
    }
  ];

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);

    // Save as default template
    updateInvoiceSettings({
      ...invoiceSettings,
      defaultTemplate: templateId
    });
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    updateInvoiceSettings({
      ...invoiceSettings,
      fontSize: size
    });
  };

  const handleGSTToggle = (enabled) => {
    const subtotal = formData.subtotal;
    const gstAmount = enabled ? (subtotal * formData.gstPercentage) / 100 : 0;
    const grandTotal = subtotal + gstAmount;

    setFormData({
      ...formData,
      gstEnabled: enabled,
      gstAmount,
      grandTotal
    });
  };

  const handleGSTPercentageChange = (percentage) => {
    const subtotal = formData.subtotal;
    const gstAmount = formData.gstEnabled ? (subtotal * percentage) / 100 : 0;
    const grandTotal = subtotal + gstAmount;

    setFormData({
      ...formData,
      gstPercentage: percentage,
      gstAmount,
      grandTotal
    });
  };

  const handleGeneratePDF = () => {
    try {
      const finalData = {
        ...formData,
        notes: customMessage,
        template: selectedTemplate,
        signatureSettings,
        itemGstEnabled: showGSTColumn
      };

      console.log('Generating PDF with data:', finalData);
      generateInvoicePDF(finalData);
      console.log('PDF generation completed');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  };

  const handleSaveInvoice = () => {
    const finalData = {
      ...formData,
      notes: customMessage,
      template: selectedTemplate,
      signatureSettings,
      itemGstEnabled: showGSTColumn
    };

    onSave(finalData);
  };

  const handleGSTColumnToggle = (enabled) => {
    setShowGSTColumn(enabled);
    setFormData({
      ...formData,
      itemGstEnabled: enabled
    });
  };

  // Get font size classes based on selected size
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'small':
        return {
          header: 'text-[10px]',
          body: 'text-[10px]',
          rowHeight: 'h-[28px]',
          padding: 'py-1.5'
        };
      case 'medium':
        return {
          header: 'text-xs',
          body: 'text-xs',
          rowHeight: 'h-[30px]',
          padding: 'py-2'
        };
      case 'large':
        return {
          header: 'text-sm',
          body: 'text-sm',
          rowHeight: 'h-[32px]',
          padding: 'py-2'
        };
      default:
        return {
          header: 'text-xs',
          body: 'text-xs',
          rowHeight: 'h-[30px]',
          padding: 'py-2'
        };
    }
  };

  const fontSizeClasses = getFontSizeClasses();

  // Get template-specific styles - Enhanced Professional UI
  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case 'liceria':
        return {
          container: 'bg-white shadow-2xl overflow-hidden',
          header: 'bg-gradient-to-br from-[#1e3a5f] via-[#2d5986] to-[#1e3a5f] text-white p-0 relative',
          headerOverlay: 'absolute inset-0 opacity-10',
          invoiceTitle: 'text-6xl font-black text-white tracking-tight',
          companyText: 'text-white/95',
          detailsBox: 'bg-white text-[#1e3a5f] p-6 rounded-none',
          table: 'bg-white',
          tableHeader: 'bg-[#1e3a5f] text-white font-bold uppercase text-xs tracking-wider',
          tableRow: 'hover:bg-blue-50/30 transition-colors border-b border-gray-200',
          totalsBox: 'bg-white border-t-4 border-[#1e3a5f] p-6'
        };
      case 'modern':
        return {
          container: 'bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-100',
          header: 'bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 text-white p-10 relative',
          headerOverlay: 'absolute inset-0 bg-black/5',
          invoiceTitle: 'text-5xl font-black text-white drop-shadow-lg tracking-tight',
          companyText: 'text-white/90',
          detailsBox: 'bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20',
          table: 'border-b-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50',
          tableHeader: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold uppercase text-xs tracking-wide',
          tableRow: 'hover:bg-blue-50/50 transition-colors border-b border-gray-200',
          totalsBox: 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300 rounded-xl shadow-lg'
        };
      case 'minimal':
        return {
          container: 'bg-white shadow-lg border-2 border-gray-900',
          header: 'border-b-4 border-gray-900 pb-6',
          headerOverlay: '',
          invoiceTitle: 'text-5xl font-thin text-gray-900 tracking-wider uppercase',
          companyText: 'text-gray-700',
          detailsBox: 'border-2 border-gray-900 p-4',
          table: 'border-b-4 border-gray-900',
          tableHeader: 'bg-gray-900 text-white font-medium uppercase text-xs',
          tableRow: 'hover:bg-gray-50 transition-colors border-b border-gray-400',
          totalsBox: 'border-t-4 border-gray-900 pt-6 bg-gray-50'
        };
      case 'professional':
        return {
          container: 'bg-white shadow-2xl border-8 border-double border-blue-600 rounded-lg',
          header: 'bg-gradient-to-r from-gray-50 to-blue-50 border-b-4 border-blue-600 pb-8',
          headerOverlay: '',
          invoiceTitle: 'text-5xl font-black text-blue-600 uppercase tracking-widest drop-shadow-sm',
          companyText: 'text-gray-700',
          detailsBox: 'bg-blue-100 border-2 border-blue-600 rounded-lg p-4 shadow-inner',
          table: 'border-b-4 border-blue-600 bg-gray-50',
          tableHeader: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold uppercase text-sm',
          tableRow: 'hover:bg-blue-50 transition-colors border-b-2 border-gray-300',
          totalsBox: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-2xl'
        };
      case 'corporate':
        return {
          container: 'bg-white shadow-2xl overflow-hidden border border-gray-200',
          header: 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-10 relative',
          headerOverlay: 'absolute inset-0 bg-gradient-to-tr from-transparent to-black/20',
          invoiceTitle: 'text-6xl font-black text-yellow-400 drop-shadow-2xl tracking-tight',
          companyText: 'text-white/95',
          detailsBox: 'bg-yellow-400/10 backdrop-blur-sm rounded-lg p-4 border-2 border-yellow-400/30',
          table: 'border-b-4 border-blue-900 bg-gray-50',
          tableHeader: 'bg-gradient-to-r from-blue-900 to-blue-800 text-white font-bold uppercase text-xs tracking-wide',
          tableRow: 'hover:bg-blue-50 transition-colors border-b border-gray-300',
          totalsBox: 'bg-gradient-to-br from-blue-900 to-blue-800 text-white p-6 rounded-xl shadow-2xl border-2 border-yellow-400/30'
        };
      case 'classic':
      default:
        return {
          container: 'bg-white shadow-xl rounded-xl border border-gray-200',
          header: 'border-b-2 border-gray-300 pb-8 bg-gradient-to-b from-white to-gray-50',
          headerOverlay: '',
          invoiceTitle: 'text-5xl font-bold text-blue-600 drop-shadow-sm',
          companyText: 'text-gray-700',
          detailsBox: 'bg-blue-50 border-2 border-blue-200 rounded-lg p-4',
          table: 'border-b-2 border-blue-300 bg-blue-50/50',
          tableHeader: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold uppercase text-xs',
          tableRow: 'hover:bg-blue-50 transition-colors border-b border-gray-200',
          totalsBox: 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-md'
        };
    }
  };

  const templateStyles = getTemplateStyles();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onBack}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full my-8 flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Invoice Preview & Settings</h2>
                <p className="text-sm text-gray-600 mt-1">Customize your invoice before generating PDF</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Settings Panel */}
          {showSettings && (
            <div className="w-96 border-r border-gray-200 overflow-y-auto bg-gray-50 p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-primary-600" />
                  Invoice Settings
                </h3>
              </div>

              {/* GST Settings */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">GST Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gstEnabled}
                      onChange={(e) => handleGSTToggle(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Include Overall GST</span>
                  </label>

                  {formData.gstEnabled && (
                    <div>
                      <label className="label text-xs">GST Percentage (%)</label>
                      <input
                        type="number"
                        value={formData.gstPercentage}
                        onChange={(e) => handleGSTPercentageChange(parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        GST Amount: ₹{formData.gstAmount.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGSTColumn}
                        onChange={(e) => handleGSTColumnToggle(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">Show GST Column in Table</span>
                        <p className="text-xs text-gray-500 mt-0.5">Display item-wise GST breakdown</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Font Size Settings */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Font Size & Row Height</h4>
                <p className="text-xs text-gray-500 mb-3">Adjust table text size and row spacing</p>
                <div className="space-y-2">
                  {[
                    { id: 'small', label: 'Small (Compact)', desc: '28px rows' },
                    { id: 'medium', label: 'Medium (Standard)', desc: '30px rows' },
                    { id: 'large', label: 'Large (Spacious)', desc: '32px rows' }
                  ].map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handleFontSizeChange(option.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        fontSize === option.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          fontSize === option.id
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {fontSize === option.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm">{option.label}</h5>
                          <p className="text-xs text-gray-600 mt-0.5">{option.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Message */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Custom Message</h4>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value.slice(0, 500))}
                  className="input text-sm"
                  rows="4"
                  maxLength="500"
                  placeholder="Enter payment terms, delivery notes, or thank you message..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customMessage.length}/500 characters
                </p>
              </div>

              {/* Template Selection */}
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Select Template</h4>
                <p className="text-xs text-gray-500 mb-3">Your selection will be saved as the default template</p>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateChange(template.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          selectedTemplate === template.id
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTemplate === template.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm">{template.name}</h5>
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
                <h4 className="font-semibold text-gray-900 mb-3">Invoice Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">₹{formData.subtotal.toFixed(2)}</span>
                  </div>
                  {formData.gstEnabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST ({formData.gstPercentage}%):</span>
                      <span className="font-semibold">₹{formData.gstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base border-t border-primary-300 pt-2">
                    <span className="font-bold">Grand Total:</span>
                    <span className="font-bold text-primary-600">₹{formData.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            {selectedTemplate === 'liceria' ? (
              /* Liceria Template - Custom Layout */
              <div className="max-w-4xl mx-auto bg-white shadow-2xl" id="invoice-preview" style={{ width: '210mm', minHeight: '297mm' }}>
                {/* Decorative Top Stripe */}
                <div className="h-12 bg-gradient-to-r from-[#26a9e0] via-[#1e3a5f] to-[#26a9e0] relative overflow-hidden">
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="absolute h-full w-8 bg-white/10 transform -skew-x-12" style={{ left: `${i * 7}%` }}></div>
                    ))}
                  </div>
                </div>

                {/* Header Section with Logo */}
                <div className="relative px-12 pt-10 pb-8">
                  {/* Company Logo and Name - Top Right */}
                  <div className="absolute top-10 right-12 flex flex-col items-end">
                    {formData.companyLogo ? (
                      <div className="flex items-center gap-3 bg-white border-2 border-[#26a9e0] rounded-lg p-3 shadow-lg">
                        <img src={formData.companyLogo} alt="Company Logo" className="h-14 w-14 object-contain" />
                        <div className="text-right">
                          <p className="font-black text-lg text-[#1e3a5f]">{formData.companyName}</p>
                          {formData.companyGST && (
                            <p className="text-xs text-gray-600">GST: {formData.companyGST}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-gradient-to-br from-[#1e3a5f] to-[#26a9e0] rounded-lg p-4 shadow-lg">
                        <div className="flex gap-1">
                          <div className="w-8 h-8 bg-white transform rotate-45 opacity-80"></div>
                          <div className="w-8 h-8 bg-[#26a9e0] transform rotate-45 -ml-4"></div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-white">{formData.companyName || 'Liceria & Co.'}</p>
                          {formData.companyGST && (
                            <p className="text-xs text-white/80">GST: {formData.companyGST}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* INVOICE Title */}
                  <h1 className="text-7xl font-black text-[#1e3a5f] mb-2 tracking-tight">INVOICE</h1>

                  {/* Status Badge */}
                  <div className="mb-6">
                    <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                      formData.status === 'paid' ? 'bg-green-500 text-white' :
                      formData.status === 'cancelled' ? 'bg-red-500 text-white' :
                      'bg-yellow-400 text-gray-900'
                    }`}>
                      {formData.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  {/* Invoice Details and Payment Method Row */}
                  <div className="grid grid-cols-2 gap-8 text-sm mb-6">
                    {/* Left: Invoice Details */}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-gray-500 font-medium w-32">INVOICE NO:</span>
                        <span className="font-bold text-[#1e3a5f] text-base">{formData.invoiceNumber}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-gray-500 font-medium w-32">INVOICE DATE:</span>
                        <span className="font-semibold text-gray-900">{formatDate(formData.date)}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-gray-500 font-medium w-32">DUE DATE:</span>
                        <span className={`font-semibold ${formData.status === 'pending' && formData.dueDate ? 'text-red-600' : 'text-gray-900'}`}>
                          {formData.dueDate ? formatDate(formData.dueDate) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Payment Method */}
                    <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5986] text-white p-4 rounded-lg shadow-md">
                      <h3 className="text-sm font-bold mb-3 tracking-wide border-b border-white/20 pb-2">PAYMENT METHOD</h3>
                      <div className="space-y-1.5 text-xs">
                        <p><span className="opacity-80">Method:</span> <span className="font-semibold">{formData.paymentMethod}</span></p>
                        <p><span className="opacity-80">Account No:</span> <span className="font-semibold">{formData.companyPhone || 'N/A'}</span></p>
                        <p><span className="opacity-80">Account Name:</span> <span className="font-semibold">{formData.clientName}</span></p>
                        <p><span className="opacity-80">Branch:</span> <span className="font-semibold">{formData.companyName}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Company Contact Info & Client Details */}
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    {/* Left: Company Contact */}
                    <div className="bg-gray-50 border-l-4 border-[#26a9e0] p-4 rounded-r-lg">
                      <h3 className="text-xs font-bold text-[#1e3a5f] mb-3 uppercase tracking-wide">Company Contact</h3>
                      <div className="space-y-1.5 text-xs text-gray-700">
                        <p className="flex items-center gap-2">
                          <span className="text-[#26a9e0]">📞</span>
                          <span className="font-medium">{formData.companyPhone || 'N/A'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-[#26a9e0]">✉️</span>
                          <span className="font-medium">{formData.companyEmail || 'N/A'}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-[#26a9e0] mt-0.5">📍</span>
                          <span className="font-medium">{formData.companyAddress || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Bill To */}
                    <div className="bg-[#1e3a5f]/5 border-l-4 border-[#1e3a5f] p-4 rounded-r-lg">
                      <h3 className="text-xs font-bold text-[#1e3a5f] mb-3 uppercase tracking-wide">Bill To</h3>
                      <p className="font-bold text-base text-[#1e3a5f] mb-2">{formData.clientName}</p>
                      <div className="space-y-1.5 text-xs text-gray-700">
                        {formData.clientAddress && (
                          <p className="font-medium">{formData.clientAddress}</p>
                        )}
                        {formData.clientPhone && (
                          <p className="flex items-center gap-2">
                            <span className="text-[#1e3a5f]">📞</span>
                            <span className="font-medium">{formData.clientPhone}</span>
                          </p>
                        )}
                        {formData.clientEmail && (
                          <p className="flex items-center gap-2">
                            <span className="text-[#1e3a5f]">✉️</span>
                            <span className="font-medium">{formData.clientEmail}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Section */}
                <div className="px-12 pb-8">
                  <table className="w-full border-collapse shadow-md rounded-lg overflow-hidden">
                    <thead>
                      <tr className={`bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] text-white ${fontSizeClasses.rowHeight}`}>
                        <th className={`text-center ${fontSizeClasses.padding} px-2 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>S.NO</th>
                        <th className={`text-left ${fontSizeClasses.padding} px-4 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>DESCRIPTION</th>
                        {formData.items.some(item => item.measurementValue > 0) && (
                          <>
                            <th className={`text-center ${fontSizeClasses.padding} px-3 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>AREA</th>
                            <th className={`text-center ${fontSizeClasses.padding} px-3 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>UNIT</th>
                          </>
                        )}
                        <th className={`text-center ${fontSizeClasses.padding} px-3 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>QTY</th>
                        <th className={`text-right ${fontSizeClasses.padding} px-4 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>RATE (₹)</th>
                        {showGSTColumn && (
                          <th className={`text-center ${fontSizeClasses.padding} px-3 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>GST</th>
                        )}
                        <th className={`text-right ${fontSizeClasses.padding} px-4 font-bold uppercase ${fontSizeClasses.header} tracking-wider`}>AMOUNT (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {formData.items.map((item, index) => (
                        <tr key={index} className={`border-b border-gray-200 transition-colors ${fontSizeClasses.rowHeight} ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-[#26a9e0]/10`}>
                          <td className={`${fontSizeClasses.padding} px-2 ${fontSizeClasses.body} text-center font-bold text-gray-700`}>{index + 1}</td>
                          <td className={`${fontSizeClasses.padding} px-4 ${fontSizeClasses.body} font-semibold text-[#1e3a5f]`}>{item.description}</td>
                          {formData.items.some(i => i.measurementValue > 0) && (
                            <>
                              <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-center text-gray-700`}>{item.measurementValue || '-'}</td>
                              <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-center text-gray-600 uppercase`}>{item.unit || '-'}</td>
                            </>
                          )}
                          <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-center font-semibold text-gray-900`}>{item.quantity}</td>
                          <td className={`${fontSizeClasses.padding} px-4 ${fontSizeClasses.body} text-right text-gray-900`}>{(parseFloat(item.rate) || 0).toFixed(2)}</td>
                          {showGSTColumn && (
                            <td className={`${fontSizeClasses.padding} px-3 text-center`}>
                              <div className="inline-flex flex-col items-center bg-green-50 border border-green-200 rounded px-2 py-0.5">
                                <span className={`${fontSizeClasses.body} font-bold text-green-800`}>{Math.round(item.gstRate || 0)}%</span>
                                <span className={`${fontSizeClasses.body} font-semibold text-green-700`}>{(parseFloat(item.gstValue) || 0).toFixed(2)}</span>
                              </div>
                            </td>
                          )}
                          <td className={`${fontSizeClasses.padding} px-4 ${fontSizeClasses.body} text-right font-black text-[#1e3a5f]`}>{(parseFloat(item.amount) || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Section */}
                <div className="px-12 pb-10 grid grid-cols-2 gap-8">
                  {/* Left: Terms and Notes */}
                  <div className="space-y-6">
                    {/* Terms and Conditions */}
                    {formData.termsAndConditions && (
                      <div className="bg-gray-50 border-l-4 border-[#26a9e0] p-4 rounded-r-lg">
                        <h3 className="text-sm font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
                          <span>📋</span>
                          <span className="uppercase tracking-wide">Terms and Conditions</span>
                        </h3>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                          {formData.termsAndConditions}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {customMessage && (
                      <div className="bg-blue-50 border-l-4 border-[#1e3a5f] p-4 rounded-r-lg">
                        <h3 className="text-sm font-bold text-[#1e3a5f] mb-3 flex items-center gap-2">
                          <span>📝</span>
                          <span className="uppercase tracking-wide">Notes</span>
                        </h3>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                          {customMessage}
                        </p>
                      </div>
                    )}

                    {/* Thank You Section */}
                    <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5986] text-white p-5 rounded-lg shadow-md">
                      <h3 className="text-sm font-bold mb-3 flex items-center gap-2 border-b border-white/20 pb-2">
                        <span>💼</span>
                        <span className="uppercase tracking-wide">Thank You For Your Business!</span>
                      </h3>
                      <div className="space-y-2 text-xs">
                        <p className="flex items-center gap-2">
                          <span className="text-[#26a9e0]">📞</span>
                          <span className="font-medium">{formData.companyPhone || 'N/A'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-[#26a9e0]">🌐</span>
                          <span className="font-medium">{formData.companyEmail || 'N/A'}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-[#26a9e0] mt-0.5">📍</span>
                          <span className="font-medium">{formData.companyAddress ? formData.companyAddress.split('\n')[0] : 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Totals */}
                  <div>
                    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b-2 border-[#1e3a5f]">
                        <h3 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide">Invoice Summary</h3>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-sm text-gray-600 font-medium">Subtotal:</span>
                          <span className="text-base font-bold text-gray-900">{formatCurrency(formData.subtotal)}</span>
                        </div>

                        {showGSTColumn && formData.items.some(item => item.gstValue > 0) && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">Item GST:</span>
                            <span className="text-base font-bold text-green-600">{formatCurrency(formData.items.reduce((sum, item) => sum + (item.gstValue || 0), 0))}</span>
                          </div>
                        )}

                        {formData.gstEnabled && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">Tax ({formData.gstPercentage}%):</span>
                            <span className="text-base font-bold text-green-600">{formatCurrency(formData.gstAmount)}</span>
                          </div>
                        )}

                        {(formData.discount && formData.discount > 0) && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-sm text-gray-600 font-medium">
                              Discount {formData.discountType === 'percentage' ? `(${formData.discount}%)` : ''}:
                            </span>
                            <span className="text-base font-bold text-red-600">
                              - {formatCurrency(formData.discountAmount || 0)}
                            </span>
                          </div>
                        )}

                        {/* Grand Total */}
                        <div className="mt-4 bg-gradient-to-r from-[#1e3a5f] to-[#2d5986] text-white p-5 rounded-lg shadow-md">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-bold uppercase tracking-wide">Grand Total:</span>
                            <span className="text-3xl font-black">{formatCurrency(formData.grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Bottom Stripe */}
                <div className="h-16 bg-gradient-to-r from-[#26a9e0] via-[#1e3a5f] to-[#26a9e0] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white transform rotate-45 translate-x-32 -translate-y-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white transform rotate-45 -translate-x-24 translate-y-24"></div>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Templates */
              <div className={`max-w-4xl mx-auto p-12 ${templateStyles.container}`} id="invoice-preview" style={{ width: '210mm', minHeight: '297mm' }}>
                {/* Invoice Header */}
                <div className={`flex justify-between items-start mb-10 ${templateStyles.header}`}>
                {templateStyles.headerOverlay && <div className={templateStyles.headerOverlay}></div>}
                <div className="flex items-start gap-6 relative z-10">
                  {formData.companyLogo && (
                    <div className="bg-white rounded-lg p-2 shadow-lg">
                      <img src={formData.companyLogo} alt="Company Logo" className="w-24 h-24 object-contain" />
                    </div>
                  )}
                  <div>
                    <h1 className={`text-3xl font-black mb-3 ${templateStyles.companyText}`}>{formData.companyName}</h1>
                    <div className={`space-y-1 text-sm ${templateStyles.companyText}`}>
                      <p className="whitespace-pre-line font-medium">{formData.companyAddress}</p>
                      {formData.companyPhone && <p className="flex items-center gap-2"><span className="font-semibold">📞</span> {formData.companyPhone}</p>}
                      {formData.companyEmail && <p className="flex items-center gap-2"><span className="font-semibold">✉️</span> {formData.companyEmail}</p>}
                      {formData.companyGST && <p className="flex items-center gap-2"><span className="font-semibold">🏢</span> GST: {formData.companyGST}</p>}
                    </div>
                  </div>
                </div>
                <div className={`text-right relative z-10 ${templateStyles.detailsBox}`}>
                  <h2 className={`mb-4 ${templateStyles.invoiceTitle}`}>INVOICE</h2>
                  <div className="space-y-2 text-sm">
                    <p className={`font-medium ${templateStyles.companyText}`}>
                      <span className="opacity-70">Invoice No:</span> <span className="font-bold text-lg">{formData.invoiceNumber}</span>
                    </p>
                    <p className={`font-medium ${templateStyles.companyText}`}>
                      <span className="opacity-70">Date:</span> <span className="font-semibold">{formatDate(formData.date)}</span>
                    </p>
                    {formData.status === 'pending' && formData.dueDate && (
                      <p className="text-red-500 font-bold animate-pulse">
                        <span className="opacity-90">Due:</span> {formatDate(formData.dueDate)}
                      </p>
                    )}
                    <div className="pt-2">
                      <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-md ${
                        formData.status === 'paid' ? 'bg-green-500 text-white' :
                        formData.status === 'cancelled' ? 'bg-red-500 text-white' :
                        'bg-yellow-400 text-gray-900'
                      }`}>
                        {formData.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Details */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl p-6 mb-8 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Bill To:</h3>
                </div>
                <p className="font-bold text-xl text-gray-900 mb-2">{formData.clientName}</p>
                <div className="space-y-1 text-sm text-gray-700">
                  {formData.clientAddress && <p className="whitespace-pre-line font-medium">{formData.clientAddress}</p>}
                  {formData.clientPhone && <p className="flex items-center gap-2"><span className="font-semibold">📞</span> {formData.clientPhone}</p>}
                  {formData.clientEmail && <p className="flex items-center gap-2"><span className="font-semibold">✉️</span> {formData.clientEmail}</p>}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="mb-8 overflow-hidden rounded-xl border-2 border-gray-300 shadow-lg">
                <table className="w-full">
                  <thead>
                    <tr className={`${templateStyles.tableHeader} ${fontSizeClasses.rowHeight}`}>
                      <th className={`text-center ${fontSizeClasses.padding} px-2 ${fontSizeClasses.header}`}>S.No</th>
                      <th className={`text-left ${fontSizeClasses.padding} px-4 ${fontSizeClasses.header}`}>Description</th>
                      <th className={`text-center ${fontSizeClasses.padding} px-3 ${fontSizeClasses.header}`}>Area</th>
                      <th className={`text-center ${fontSizeClasses.padding} px-3 ${fontSizeClasses.header}`}>Unit</th>
                      <th className={`text-center ${fontSizeClasses.padding} px-3 ${fontSizeClasses.header}`}>Qty</th>
                      <th className={`text-right ${fontSizeClasses.padding} px-3 ${fontSizeClasses.header}`}>Rate (₹)</th>
                      {showGSTColumn && (
                        <th className={`text-center ${fontSizeClasses.padding} px-3 ${fontSizeClasses.header}`}>GST</th>
                      )}
                      <th className={`text-right ${fontSizeClasses.padding} px-4 ${fontSizeClasses.header}`}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {formData.items.map((item, index) => (
                      <tr key={index} className={`${templateStyles.tableRow} ${fontSizeClasses.rowHeight}`}>
                        <td className={`${fontSizeClasses.padding} px-2 ${fontSizeClasses.body} text-center font-bold text-gray-700`}>{index + 1}</td>
                        <td className={`${fontSizeClasses.padding} px-4 ${fontSizeClasses.body} font-medium text-gray-900`}>{item.description}</td>
                        <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-gray-700 text-center font-semibold`}>{item.measurementValue || '-'}</td>
                        <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-gray-600 text-center`}>{item.unit || '-'}</td>
                        <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-gray-700 text-center font-semibold`}>{item.quantity}</td>
                        <td className={`${fontSizeClasses.padding} px-3 ${fontSizeClasses.body} text-gray-900 text-right font-semibold`}>{(parseFloat(item.rate) || 0).toFixed(2)}</td>
                        {showGSTColumn && (
                          <td className={`${fontSizeClasses.padding} px-3 text-gray-900 text-center`}>
                            <div className="flex flex-col items-center gap-0.5 bg-green-50 rounded-lg py-1 px-2 border border-green-200">
                              <span className={`${fontSizeClasses.body} font-bold text-green-800`}>{Math.round(item.gstRate || 0)}%</span>
                              <span className={`${fontSizeClasses.body} font-black text-green-700`}>{(parseFloat(item.gstValue) || 0).toFixed(2)}</span>
                            </div>
                          </td>
                        )}
                        <td className={`${fontSizeClasses.padding} px-4 ${fontSizeClasses.body} font-black text-gray-900 text-right`}>{(parseFloat(item.amount) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-10">
                <div className={`w-full md:w-2/5 space-y-3 p-6 ${templateStyles.totalsBox}`}>
                  <div className="flex justify-between py-2 border-b border-white/20">
                    <span className="font-semibold text-base">Subtotal:</span>
                    <span className="font-bold text-lg">{formatCurrency(formData.subtotal)}</span>
                  </div>
                  {showGSTColumn && formData.items.some(item => item.gstValue > 0) && (
                    <div className="flex justify-between py-2 border-b border-white/20">
                      <span className="font-semibold text-base">Item GST:</span>
                      <span className="font-bold text-lg text-green-600">{formatCurrency(formData.items.reduce((sum, item) => sum + (item.gstValue || 0), 0))}</span>
                    </div>
                  )}
                  {formData.gstEnabled && (
                    <div className="flex justify-between py-2 border-b border-white/20">
                      <span className="font-semibold text-base">Additional GST ({formData.gstPercentage}%):</span>
                      <span className="font-bold text-lg text-green-600">{formatCurrency(formData.gstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-4 bg-black/10 backdrop-blur-sm px-5 rounded-xl mt-3 border-2 border-white/30 shadow-xl">
                    <span className="text-xl font-black uppercase tracking-wide">Grand Total:</span>
                    <span className="text-2xl font-black">{formatCurrency(formData.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3 mb-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Payment Method</p>
                    <p className="text-sm font-bold text-gray-900">{formData.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {customMessage && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-3 mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📝</span>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Notes</h3>
                  </div>
                  <p className="text-xs text-gray-800 whitespace-pre-line leading-snug font-medium">{customMessage}</p>
                </div>
              )}

              {/* Terms & Conditions */}
              {formData.termsAndConditions && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-3 mb-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📋</span>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Terms & Conditions</h3>
                  </div>
                  <p className="text-xs text-gray-800 whitespace-pre-line leading-snug font-medium">{formData.termsAndConditions}</p>
                </div>
              )}

              {/* Signature */}
              {signatureSettings.type !== 'none' && (
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="flex justify-end">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Authorized Signature</p>
                      {signatureSettings.type === 'image' && signatureSettings.image && (
                        <img
                          src={signatureSettings.image}
                          alt="Signature"
                          className="h-16 mx-auto mb-2"
                        />
                      )}
                      {signatureSettings.type === 'text' && signatureSettings.text && (
                        <div className="mb-2">
                          <span style={{
                            fontFamily: signatureSettings.font === 'cursive' ? "'Dancing Script', cursive" :
                                       signatureSettings.font === 'handwritten' ? "'Caveat', cursive" :
                                       signatureSettings.font === 'formal' ? "'Playfair Display', serif" :
                                       "'Montserrat', sans-serif",
                            fontSize: '28px',
                            fontStyle: signatureSettings.font === 'formal' ? 'italic' : 'normal',
                            fontWeight: signatureSettings.font === 'modern' ? '600' : 'normal'
                          }}>
                            {signatureSettings.text}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-400 w-48 mx-auto"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-6 text-center">
                <p className="text-sm text-gray-500">Thank you for your business!</p>
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary px-6"
          >
            {showSettings ? 'Hide' : 'Show'} Settings
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGeneratePDF}
              className="btn btn-secondary px-6 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={handleSaveInvoice}
              className="btn btn-primary px-8 flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              {isEditing ? 'Update Invoice' : 'Save Invoice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreviewModal;

