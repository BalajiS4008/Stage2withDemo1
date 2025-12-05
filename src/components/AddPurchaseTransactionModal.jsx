import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

/**
 * AddPurchaseTransactionModal
 *
 * Modal for recording material purchases on credit from suppliers.
 * This creates a PAYABLE amount (we owe the supplier).
 *
 * TERMINOLOGY:
 * - 'purchase': Material purchased on credit (increases what we owe)
 * - Does NOT create Payment Out entry (only payment transactions do that)
 */
const AddPurchaseTransactionModal = ({
  show,
  onClose,
  supplier,
  preSelectedProjectId = null,
  onSuccess
}) => {
  const { data, addSupplierTransaction } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    projectId: preSelectedProjectId || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or supplier changes
  useEffect(() => {
    if (show) {
      setFormData({
        projectId: preSelectedProjectId || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setErrors({});
    }
  }, [show, supplier, preSelectedProjectId]);

  // Get active projects
  const activeProjects = (data.projects || []).filter(p => p.status === 'active');

  // Calculate supplier balance
  const calculateSupplierBalance = () => {
    // Return zeros if supplier is null
    if (!supplier || !supplier.id) {
      return { totalPurchases: 0, totalPayments: 0, outstanding: 0 };
    }

    const transactions = (data.supplierTransactions || []).filter(
      t => t.supplierId === supplier.id
    );

    const totalPurchases = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalPayments = transactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const outstanding = totalPurchases - totalPayments;

    return { totalPurchases, totalPayments, outstanding };
  };

  const balance = calculateSupplierBalance();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const transactionData = {
        supplierId: supplier.id,
        projectId: formData.projectId,
        type: 'purchase', // Changed from 'credit' to 'purchase'
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description.trim(),
        paymentMode: null,
        paymentOutId: null, // Purchase transactions don't create Payment Out
        entryBy: user?.username || user?.email || 'Unknown',
        entryDateTime: new Date().toISOString()
      };

      console.log('🛒 Adding Purchase Transaction:', transactionData);

      await addSupplierTransaction(transactionData);

      console.log('✅ Purchase transaction added successfully');

      // Show success message
      if (onSuccess) {
        onSuccess('Purchase transaction added successfully');
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('❌ Error adding credit transaction:', error);
      setErrors({ submit: 'Failed to add credit transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show || !supplier) return null;

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
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Record Material Purchase (Credit)</h2>
              <p className="text-sm text-gray-600 mt-1">Supplier: {supplier.name}</p>
              <p className="text-xs text-blue-600 mt-1">
                💡 This creates a PAYABLE amount (you owe the supplier)
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Overall Balance Summary */}
          <div className="px-6 pt-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mb-4">
              <h3 className="text-xs font-semibold text-blue-900 mb-3 uppercase tracking-wide">Overall Balance</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total Purchases</p>
                  <p className="text-lg font-bold text-blue-900">
                    ₹{balance.totalPurchases.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total Payments</p>
                  <p className="text-lg font-bold text-green-700">
                    ₹{balance.totalPayments.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Outstanding Balance</p>
                  <p className={`text-lg font-bold ${balance.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.abs(balance.outstanding).toFixed(2)}
                  </p>
                  <p className="text-xs font-normal text-gray-600 mt-1">
                    {balance.outstanding > 0 ? '(You\'ll Pay)' : '(Settled)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6">
            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Project Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.projectId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!!preSelectedProjectId}
              >
                <option value="">Select a project</option>
                {activeProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-red-500">{errors.projectId}</p>
              )}
            </div>

            {/* Purchase Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter purchase amount"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Amount of material purchased on credit
              </p>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description (e.g., Cement and steel delivery for foundation)"
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Auto-captured Info */}
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">AUTO-CAPTURED INFORMATION</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>Entry By:</strong> {user?.username || user?.email || 'Unknown'}</p>
                <p><strong>Entry Date/Time:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Transaction Type:</strong> Purchase (Material Purchased on Credit)</p>
                <p><strong>Effect:</strong> Creates PAYABLE (You Owe Supplier)</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record Purchase'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseTransactionModal;

