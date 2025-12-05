import React, { useEffect } from 'react';
import { X, Download, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager.jsx';
import { generateQuotationPDF } from '../utils/quotationTemplates.jsx';

const QuotationViewModal = ({ quotation, onClose, onConvertToInvoice }) => {
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDownloadPDF = () => {
    generateQuotationPDF(quotation);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Quotation Preview</h2>
          <div className="flex items-center gap-2">
            {quotation.status === 'accepted' && (
              <button
                onClick={onConvertToInvoice}
                className="btn btn-success text-sm flex items-center gap-2"
                title="Convert to Invoice"
              >
                <RefreshCw className="w-4 h-4" />
                Convert to Invoice
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="btn btn-secondary text-sm flex items-center gap-2"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quotation Content */}
        <div className="p-8 space-y-6" id="quotation-content">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {quotation.companyLogo && (
                <img src={quotation.companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quotation.companyName}</h1>
                <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{quotation.companyAddress}</p>
                <p className="text-sm text-gray-600">Phone: {quotation.companyPhone}</p>
                {quotation.companyGST && <p className="text-sm text-gray-600">GST: {quotation.companyGST}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-blue-600">QUOTATION</h2>
              <p className="text-sm text-gray-600 mt-2">Quotation No: <span className="font-semibold">{quotation.quotationNumber}</span></p>
              <p className="text-sm text-gray-600">Date: <span className="font-semibold">{formatDate(quotation.date)}</span></p>
              <p className="text-sm text-gray-600">Valid Until: <span className="font-semibold">{formatDate(quotation.expiryDate)}</span></p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                quotation.status === 'accepted' ? 'bg-success-100 text-success-700' :
                quotation.status === 'rejected' ? 'bg-danger-100 text-danger-700' :
                quotation.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                quotation.status === 'expired' ? 'bg-warning-100 text-warning-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {quotation.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Client Details */}
          <div className="border-t border-b border-gray-200 py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">QUOTATION FOR:</h3>
            <p className="font-semibold text-gray-900">{quotation.clientName}</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{quotation.clientAddress}</p>
            {quotation.clientPhone && <p className="text-sm text-gray-600">Phone: {quotation.clientPhone}</p>}
            {quotation.clientEmail && <p className="text-sm text-gray-600">Email: {quotation.clientEmail}</p>}
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Measurement</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Rate</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-sm text-gray-900">{item.description}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{item.measurement || '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                    <td className="py-3 px-2 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(quotation.subtotal)}</span>
              </div>
              {quotation.gstEnabled && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">GST ({quotation.gstPercentage}%):</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(quotation.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg">
                <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(quotation.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Payment Method:</span> {quotation.paymentMethod}
            </p>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Terms & Conditions:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{quotation.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">Thank you for your business!</p>
            <p className="text-xs text-gray-400 mt-1">This quotation is valid until {formatDate(quotation.expiryDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationViewModal;

