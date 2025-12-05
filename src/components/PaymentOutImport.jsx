import React, { useState } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const PaymentOutImport = ({ onImport, onClose, departments }) => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const downloadTemplate = () => {
    const template = [
      {
        'Date (DD/MM/YYYY)': '01/01/2024',
        'Amount': '5000',
        'Department': 'Mason',
        'Category': 'material',
        'Description': 'Cement and sand purchase',
        'Vendor': 'ABC Suppliers'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Out Template');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 40 },
      { wch: 25 }
    ];

    XLSX.writeFile(wb, 'payment_out_template.xlsx');
  };

  const parseDate = (dateStr) => {
    // Try to parse DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    // Try to parse as ISO string
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    return null;
  };

  const validateRow = (row, index) => {
    const errors = [];
    const rowNum = index + 2; // +2 because index starts at 0 and Excel has header row

    if (!row['Date (DD/MM/YYYY)']) {
      errors.push(`Row ${rowNum}: Date is required`);
    } else if (!parseDate(row['Date (DD/MM/YYYY)'])) {
      errors.push(`Row ${rowNum}: Invalid date format. Use DD/MM/YYYY`);
    }

    if (!row['Amount'] || isNaN(parseFloat(row['Amount'])) || parseFloat(row['Amount']) <= 0) {
      errors.push(`Row ${rowNum}: Valid amount is required`);
    }

    if (!row['Department']) {
      errors.push(`Row ${rowNum}: Department is required`);
    } else {
      const dept = departments.find(d => d.name.toLowerCase() === row['Department'].toLowerCase());
      if (!dept) {
        errors.push(`Row ${rowNum}: Department "${row['Department']}" not found`);
      }
    }

    const validCategories = ['material', 'labor', 'equipment', 'transport', 'other'];
    if (!row['Category'] || !validCategories.includes(row['Category'].toLowerCase())) {
      errors.push(`Row ${rowNum}: Category must be one of: ${validCategories.join(', ')}`);
    }

    return errors;
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setErrors([]);
    setPreviewData([]);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        setErrors(['The file is empty or has no valid data']);
        setIsProcessing(false);
        return;
      }

      // Validate all rows
      const allErrors = [];
      const validRows = [];

      jsonData.forEach((row, index) => {
        const rowErrors = validateRow(row, index);
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors);
        } else {
          const dept = departments.find(d => d.name.toLowerCase() === row['Department'].toLowerCase());
          validRows.push({
            date: parseDate(row['Date (DD/MM/YYYY)']),
            amount: parseFloat(row['Amount']),
            departmentId: dept.id,
            departmentName: dept.name,
            category: row['Category'].toLowerCase(),
            description: row['Description'] || '',
            vendor: row['Vendor'] || '',
            rowNumber: index + 2
          });
        }
      });

      setErrors(allErrors);
      setPreviewData(validRows);
    } catch (error) {
      setErrors([`Error reading file: ${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      alert('No valid data to import');
      return;
    }

    onImport(previewData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Payment Out Entries</h2>
              <p className="text-blue-100 text-sm">Upload Excel or CSV file to bulk import expenses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Download Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download the Excel template with the correct format and column headers
                </p>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Upload File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel/CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File
              </label>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Processing file...</p>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Validation Errors</h3>
                  <ul className="space-y-1 text-sm text-red-700 max-h-40 overflow-y-auto">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {previewData.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">
                  Preview ({previewData.length} valid entries)
                </h3>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Date</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Amount</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Department</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Category</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Description</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Vendor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2">{new Date(row.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 font-medium">₹{row.amount.toLocaleString()}</td>
                          <td className="px-4 py-2">{row.departmentName}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              row.category === 'material' ? 'bg-blue-100 text-blue-700' :
                              row.category === 'labor' ? 'bg-green-100 text-green-700' :
                              row.category === 'equipment' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {row.category}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{row.description || '-'}</td>
                          <td className="px-4 py-2 text-gray-600">{row.vendor || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {previewData.length > 0 && (
              <span className="font-medium text-green-600">
                {previewData.length} entries ready to import
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={previewData.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {previewData.length > 0 && `(${previewData.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOutImport;

