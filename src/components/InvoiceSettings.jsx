import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { FileText, Check, AlertCircle } from 'lucide-react';

const InvoiceSettings = () => {
  const { data, updateInvoiceSettings } = useData();
  const invoiceSettings = data.settings?.invoiceSettings || {
    prefix: 'INV',
    nextNumber: 1,
    showGSTColumn: true,
    defaultGSTPercentage: 18,
    showQuantityColumn: true
  };

  const [settings, setSettings] = useState({
    prefix: invoiceSettings.prefix || 'INV',
    showGSTColumn: invoiceSettings.showGSTColumn !== undefined ? invoiceSettings.showGSTColumn : true,
    defaultGSTPercentage: invoiceSettings.defaultGSTPercentage || 18,
    showQuantityColumn: invoiceSettings.showQuantityColumn !== undefined ? invoiceSettings.showQuantityColumn : true
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validate GST percentage
    if (settings.defaultGSTPercentage < 0 || settings.defaultGSTPercentage > 100) {
      setError('GST percentage must be between 0 and 100');
      return;
    }

    // Update settings
    updateInvoiceSettings({
      ...invoiceSettings,
      ...settings
    });

    setSaveSuccess(true);
    setError('');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600" />
          Invoice Settings
        </h3>
        <p className="text-sm text-gray-600">Configure default settings for invoice generation</p>
      </div>

      {saveSuccess && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-success-600" />
          <p className="text-success-800 font-medium">Invoice settings saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600" />
          <p className="text-danger-800 font-medium">{error}</p>
        </div>
      )}

      {/* Invoice Prefix */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Invoice Numbering</h4>
        <div className="space-y-4">
          <div>
            <label className="label">Invoice Prefix</label>
            <input
              type="text"
              value={settings.prefix}
              onChange={(e) => setSettings({ ...settings, prefix: e.target.value.toUpperCase() })}
              className="input max-w-xs"
              placeholder="INV"
              maxLength="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: {settings.prefix}-0001, {settings.prefix}-0002
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Next Invoice Number:</strong> {settings.prefix}-{String(invoiceSettings.nextNumber).padStart(4, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* GST Settings */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">GST Configuration</h4>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showGSTColumn}
                onChange={(e) => setSettings({ ...settings, showGSTColumn: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Show GST Column in Invoices</span>
                <p className="text-xs text-gray-500">Display GST amount as a separate column in invoice tables</p>
              </div>
            </label>
          </div>

          <div>
            <label className="label">Default GST Percentage (%)</label>
            <input
              type="number"
              value={settings.defaultGSTPercentage}
              onChange={(e) => setSettings({ ...settings, defaultGSTPercentage: parseFloat(e.target.value) || 0 })}
              className="input max-w-xs"
              min="0"
              max="100"
              step="0.01"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be the default GST percentage for new invoices (can be changed per invoice)
            </p>
          </div>

          {settings.showGSTColumn && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ GST column will be visible in all invoice tables and previews
              </p>
            </div>
          )}

          {!settings.showGSTColumn && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠ GST column will be hidden. GST can still be calculated, but won't show as a separate column.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quantity Column Settings */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Line Items Configuration</h4>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showQuantityColumn}
                onChange={(e) => setSettings({ ...settings, showQuantityColumn: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Show Quantity Column in Line Items</span>
                <p className="text-xs text-gray-500">Display quantity and rate columns separately in invoice line items</p>
              </div>
            </label>
          </div>

          {settings.showQuantityColumn && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ Line items will show: Description | Measurement | Quantity | Rate | Amount
              </p>
            </div>
          )}

          {!settings.showQuantityColumn && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠ Quantity column will be hidden. Line items will show: Description | Measurement | Amount
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl p-6 border-2 border-primary-200">
        <h4 className="font-semibold text-gray-900 mb-4">Preview: Invoice Table Structure</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Description</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Measurement</th>
                {settings.showQuantityColumn && (
                  <>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Rate</th>
                  </>
                )}
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-3 text-gray-600">Sample Item</td>
                <td className="py-2 px-3 text-gray-600">sq ft</td>
                {settings.showQuantityColumn && (
                  <>
                    <td className="py-2 px-3 text-right text-gray-600">100</td>
                    <td className="py-2 px-3 text-right text-gray-600">₹50</td>
                  </>
                )}
                <td className="py-2 px-3 text-right font-semibold text-gray-900">₹5,000</td>
              </tr>
            </tbody>
          </table>
        </div>

        {settings.showGSTColumn && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-end">
              <div className="space-y-2 w-64">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">₹5,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({settings.defaultGSTPercentage}%):</span>
                  <span className="font-semibold">₹{(5000 * settings.defaultGSTPercentage / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base border-t border-gray-300 pt-2">
                  <span className="font-bold">Grand Total:</span>
                  <span className="font-bold text-primary-600">₹{(5000 + (5000 * settings.defaultGSTPercentage / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary px-8"
        >
          Save Invoice Settings
        </button>
      </div>
    </div>
  );
};

export default InvoiceSettings;

