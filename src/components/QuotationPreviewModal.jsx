import React, { useState } from 'react';
import { X, ArrowLeft, Download, Settings as SettingsIcon, Check } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager';
import { generateQuotationPDF } from '../utils/quotationTemplates';
import { useData } from '../context/DataContext';

const QuotationPreviewModal = ({ formData: initialFormData, onBack, onSave, isEditing }) => {
  const { data, updateQuotationSettings } = useData();
  const signatureSettings = data.settings?.signatureSettings || { type: 'none' };
  const quotationSettings = data.settings?.quotationSettings || {};
  const defaultTemplate = quotationSettings.defaultTemplate || 'classic';

  const [formData, setFormData] = useState(initialFormData);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [customMessage, setCustomMessage] = useState(formData.notes || '');
  const [showSettings, setShowSettings] = useState(true);

  const templates = [
    {
      id: 'liceria',
      name: 'Liceria & Co.',
      description: 'Professional blue corporate design with modern layout',
      preview: '/templates/liceria-preview.png'
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional business template with elegant styling',
      preview: '/templates/corporate-preview.png'
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
    }
  ];

  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);

    // Save as default template
    updateQuotationSettings({
      ...quotationSettings,
      defaultTemplate: templateId
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
    const finalData = {
      ...formData,
      notes: customMessage,
      template: selectedTemplate,
      signatureSettings
    };

    generateQuotationPDF(finalData);
  };

  const handleSaveQuotation = () => {
    const finalData = {
      ...formData,
      notes: customMessage,
      template: selectedTemplate
    };

    onSave(finalData);
  };

  // Get template-specific styles
  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case 'modern':
        return {
          container: 'bg-white',
          header: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg',
          title: 'text-white',
          accent: 'text-purple-600',
          table: 'border-purple-200',
          totals: 'bg-purple-50 border-purple-200'
        };
      case 'minimal':
        return {
          container: 'bg-white border-2 border-gray-900',
          header: 'border-b-4 border-gray-900 pb-4',
          title: 'text-gray-900',
          accent: 'text-gray-900',
          table: 'border-gray-900',
          totals: 'bg-gray-100 border-gray-900'
        };
      case 'professional':
        return {
          container: 'bg-white',
          header: 'bg-gray-800 text-white p-6 rounded-t-lg',
          title: 'text-white',
          accent: 'text-gray-800',
          table: 'border-gray-300',
          totals: 'bg-gray-50 border-gray-300'
        };
      default: // classic
        return {
          container: 'bg-white',
          header: 'border-b-2 border-blue-600 pb-4',
          title: 'text-blue-600',
          accent: 'text-blue-600',
          table: 'border-blue-200',
          totals: 'bg-blue-50 border-blue-200'
        };
    }
  };

  const templateStyles = getTemplateStyles();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full my-8 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
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
                <h2 className="text-2xl font-bold text-gray-900">Quotation Preview</h2>
                <p className="text-sm text-gray-600 mt-1">Review your quotation before saving</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-white/50 text-gray-600'
                }`}
                aria-label="Toggle settings"
                title="Toggle settings panel"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Settings Sidebar */}
          {showSettings && (
            <div className="w-80 bg-gray-50 border-r border-gray-200 p-6 overflow-y-auto flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Quotation Settings
              </h3>

              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Template
                </label>
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateChange(template.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {template.name}
                            {selectedTemplate === template.id && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* GST Settings */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  GST Configuration
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">Enable GST</span>
                    <button
                      onClick={() => handleGSTToggle(!formData.gstEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.gstEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.gstEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {formData.gstEnabled && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <label className="block text-xs text-gray-600 mb-2">GST Percentage</label>
                      <input
                        type="number"
                        value={formData.gstPercentage}
                        onChange={(e) => handleGSTPercentageChange(parseFloat(e.target.value) || 0)}
                        className="input w-full text-sm"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Message */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Terms & Conditions
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="input w-full text-sm"
                  rows="4"
                  placeholder="Add terms and conditions..."
                />
              </div>
            </div>
          )}

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          <div className={`max-w-4xl mx-auto shadow-xl rounded-lg p-12 ${templateStyles.container}`} id="quotation-preview">
            {/* Quotation Header */}
            <div className={`flex justify-between items-start mb-8 ${templateStyles.header}`}>
              <div className="flex items-start gap-4">
                {formData.companyLogo && (
                  <img src={formData.companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
                )}
                <div>
                  <h1 className={`text-2xl font-bold ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white' : 'text-gray-900'}`}>
                    {formData.companyName}
                  </h1>
                  <p className={`text-sm whitespace-pre-line mt-1 ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                    {formData.companyAddress}
                  </p>
                  {formData.companyPhone && (
                    <p className={`text-sm ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                      Phone: {formData.companyPhone}
                    </p>
                  )}
                  {formData.companyEmail && (
                    <p className={`text-sm ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                      Email: {formData.companyEmail}
                    </p>
                  )}
                  {formData.companyGST && (
                    <p className={`text-sm ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                      GST: {formData.companyGST}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <h2 className={`text-3xl font-bold ${templateStyles.title}`}>QUOTATION</h2>
                <p className={`text-sm mt-2 ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                  Quotation No: <span className="font-semibold">{formData.quotationNumber}</span>
                </p>
                <p className={`text-sm ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                  Date: <span className="font-semibold">{formatDate(formData.date)}</span>
                </p>
                <p className={`text-sm ${selectedTemplate === 'modern' || selectedTemplate === 'professional' ? 'text-white/90' : 'text-gray-600'}`}>
                  Valid Until: <span className="font-semibold">{formatDate(formData.expiryDate)}</span>
                </p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  formData.status === 'accepted' ? 'bg-success-100 text-success-700' :
                  formData.status === 'rejected' ? 'bg-danger-100 text-danger-700' :
                  formData.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                  formData.status === 'expired' ? 'bg-warning-100 text-warning-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {formData.status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Client Details */}
            <div className="border-t border-b border-gray-200 py-4 mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">QUOTATION FOR:</h3>
              <p className="font-semibold text-gray-900">{formData.clientName}</p>
              {formData.clientAddress && <p className="text-sm text-gray-600 whitespace-pre-line">{formData.clientAddress}</p>}
              {formData.clientPhone && <p className="text-sm text-gray-600">Phone: {formData.clientPhone}</p>}
              {formData.clientEmail && <p className="text-sm text-gray-600">Email: {formData.clientEmail}</p>}
            </div>

            {/* Line Items Table */}
            <div className="mb-8">
              <table className="w-full">
                <thead>
                  <tr className={`border-b-2 ${templateStyles.table} ${selectedTemplate === 'minimal' ? 'bg-white' : 'bg-gray-50'}`}>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Measurement</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Rate</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className={`border-b ${templateStyles.table}`}>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{item.measurement || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-8">
              <div className={`w-full md:w-1/2 space-y-2 p-4 border rounded-lg ${templateStyles.totals}`}>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(formData.subtotal)}</span>
                </div>
                {formData.gstEnabled && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">GST ({formData.gstPercentage}%):</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(formData.gstAmount)}</span>
                  </div>
                )}
                <div className={`flex justify-between py-3 border-t-2 ${templateStyles.table}`}>
                  <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                  <span className={`text-lg font-bold ${templateStyles.accent}`}>{formatCurrency(formData.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Payment Method:</span> {formData.paymentMethod}
              </p>
            </div>

            {/* Custom Message */}
            {customMessage && (
              <div className="border-t border-gray-200 pt-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions:</h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">{customMessage}</p>
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
              <p className="text-xs text-gray-400 mt-1">This quotation is valid until {formatDate(formData.expiryDate)}</p>
            </div>
          </div>
        </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <button
            onClick={onBack}
            className="btn btn-secondary px-6"
          >
            Back to Edit
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
              onClick={handleSaveQuotation}
              className="btn btn-primary px-8 flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
            >
              {isEditing ? 'Update Quotation' : 'Save Quotation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreviewModal;

