import React, { useEffect, useState } from 'react';
import { X, Download, Printer, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/dataManager.jsx';
import { generateInvoicePDF } from '../utils/invoiceTemplates.jsx';
import * as XLSX from 'xlsx';

const InvoiceViewModal = ({ invoice, onClose }) => {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState(invoice.clientPhone || '');

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
    // Close modal if clicking on the backdrop (not the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(invoice);
  };

  const handleDownloadExcel = () => {
    // Prepare data for Excel
    const excelData = [
      ['INVOICE'],
      [],
      ['Invoice Number:', invoice.invoiceNumber],
      ['Date:', formatDate(invoice.date)],
      ['Status:', invoice.status?.toUpperCase()],
      [],
      ['COMPANY DETAILS'],
      ['Company Name:', invoice.companyName],
      ['Address:', invoice.companyAddress],
      ['Phone:', invoice.companyPhone],
      ['GST:', invoice.companyGST],
      [],
      ['CLIENT DETAILS'],
      ['Client Name:', invoice.clientName],
      ['Address:', invoice.clientAddress],
      ['Phone:', invoice.clientPhone],
      ['Email:', invoice.clientEmail],
      [],
      ['LINE ITEMS'],
      ['Description', 'Measurement Value', 'Unit', 'Quantity', 'Rate', 'Amount'],
      ...invoice.items.map(item => [
        item.description,
        item.measurementValue || '-',
        item.unit || '-',
        item.quantity,
        item.rate,
        item.amount
      ]),
      [],
      ['', '', '', 'Subtotal:', invoice.subtotal],
    ];

    if (invoice.gstEnabled) {
      excelData.push(['', '', '', `GST (${invoice.gstPercentage}%):`, invoice.gstAmount]);
    }

    excelData.push(['', '', '', 'Grand Total:', invoice.grandTotal]);
    excelData.push([]);
    excelData.push(['Payment Method:', invoice.paymentMethod]);
    
    if (invoice.notes) {
      excelData.push([]);
      excelData.push(['Notes:', invoice.notes]);
    }

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

    // Save Excel file
    XLSX.writeFile(wb, `${invoice.invoiceNumber}.xlsx`);
  };

  const handleWhatsAppShare = () => {
    setShowWhatsAppModal(true);
  };

  const sendWhatsAppMessage = () => {
    // Validate phone number
    let phoneNumber = whatsappPhone.trim();
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    // Remove any non-digit characters except +
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Ensure phone number starts with country code
    if (!phoneNumber.startsWith('+')) {
      // Default to India country code if not specified
      phoneNumber = '+91' + phoneNumber;
    }

    // Create WhatsApp message
    const message = `*Invoice Details*\n\n` +
      `Invoice No: ${invoice.invoiceNumber}\n` +
      `Date: ${formatDate(invoice.date)}\n` +
      `Client: ${invoice.clientName}\n` +
      `Amount: ${formatCurrency(invoice.grandTotal)}\n` +
      `Status: ${invoice.status?.toUpperCase()}\n` +
      `Payment Method: ${invoice.paymentMethod}\n\n` +
      `${invoice.notes ? `Notes: ${invoice.notes}\n\n` : ''}` +
      `Thank you for your business!`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Close modal
    setShowWhatsAppModal(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="btn btn-secondary text-sm flex items-center gap-2"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={handleDownloadExcel}
              className="btn btn-secondary text-sm flex items-center gap-2"
              title="Download Excel"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="btn btn-secondary text-sm flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100"
              title="Share via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-secondary text-sm flex items-center gap-2"
              title="Print"
            >
              <Printer className="w-4 h-4" />
              Print
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

        {/* Invoice Content */}
        <div className="p-8 space-y-6" id="invoice-content">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {invoice.companyLogo && (
                <img src={invoice.companyLogo} alt="Company Logo" className="w-20 h-20 object-contain" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{invoice.companyName}</h1>
                <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{invoice.companyAddress}</p>
                <p className="text-sm text-gray-600">Phone: {invoice.companyPhone}</p>
                {invoice.companyGST && <p className="text-sm text-gray-600">GST: {invoice.companyGST}</p>}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary-600">INVOICE</h2>
              <p className="text-sm text-gray-600 mt-2">Invoice No: <span className="font-semibold">{invoice.invoiceNumber}</span></p>
              <p className="text-sm text-gray-600">Date: <span className="font-semibold">{formatDate(invoice.date)}</span></p>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                invoice.status === 'paid' ? 'bg-success-100 text-success-700' :
                invoice.status === 'cancelled' ? 'bg-danger-100 text-danger-700' :
                'bg-warning-100 text-warning-700'
              }`}>
                {invoice.status?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Client Details */}
          <div className="border-t border-b border-gray-200 py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">BILL TO:</h3>
            <p className="font-semibold text-gray-900">{invoice.clientName}</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.clientAddress}</p>
            {invoice.clientPhone && <p className="text-sm text-gray-600">Phone: {invoice.clientPhone}</p>}
            {invoice.clientEmail && <p className="text-sm text-gray-600">Email: {invoice.clientEmail}</p>}
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 h-10">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Measurement Value</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Unit</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Qty</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Rate</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 h-10">
                    <td className="py-3 px-2 text-sm text-gray-900">{item.description}</td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-center">{item.measurementValue || '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{item.unit || '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-center">{item.quantity}</td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-center">{formatCurrency(item.rate)}</td>
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
                <span className="font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.gstEnabled && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">GST ({invoice.gstPercentage}%):</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoice.gstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 bg-primary-50 px-4 rounded-lg">
                <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                <span className="text-lg font-bold text-primary-600">{formatCurrency(invoice.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Payment Method:</span> {invoice.paymentMethod}
            </p>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500">Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <MessageCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Share via WhatsApp</h3>
                    <p className="text-sm text-gray-500">Send invoice details to client</p>
                  </div>
                </div>
              </div>

              {/* Invoice Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice No:</span>
                    <span className="font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-semibold text-gray-900">{invoice.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-primary-600">{formatCurrency(invoice.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="mb-6">
                <label className="label">WhatsApp Number *</label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="input"
                  placeholder="+91 9876543210"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter phone number with country code (e.g., +91 for India)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={sendWhatsAppMessage}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceViewModal;

