import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateSupplierBalance } from '../utils/supplierBalanceUtils';

/**
 * AddPaymentTransactionModal
 *
 * Modal for recording payments made to suppliers.
 * This reduces PAYABLE amount (we owe less to the supplier).
 *
 * TERMINOLOGY:
 * - 'payment': Payment made to supplier (decreases what we owe)
 * - Auto-creates Payment Out entry with bidirectional linking
 * - Links supplier transaction ↔ payment out ↔ project
 */
const AddPaymentTransactionModal = ({
  show,
  onClose,
  supplier,
  preSelectedProjectId = null,
  onSuccess
}) => {
  const { data, addSupplierTransaction, updateSupplierTransaction, addPaymentOut } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    projectId: preSelectedProjectId || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [projectsWithBalance, setProjectsWithBalance] = useState([]);

  // Calculate overall balance
  const [overallBalance, setOverallBalance] = useState({ totalPurchases: 0, totalPayments: 0, outstanding: 0 });

  // Calculate balances when modal opens or data changes
  useEffect(() => {
    if (show && supplier) {
      const transactions = data.supplierTransactions || [];
      const projects = data.projects || [];

      // Calculate overall balance
      const totalPurchases = transactions
        .filter(t => t.supplierId === supplier.id && t.type === 'purchase')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const totalPayments = transactions
        .filter(t => t.supplierId === supplier.id && t.type === 'payment')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      const outstanding = totalPurchases - totalPayments;

      setOverallBalance({ totalPurchases, totalPayments, outstanding });

      // Get projects with outstanding balance
      const projectBalances = projects
        .map(project => {
          const balance = calculateSupplierBalance(transactions, supplier.id, project.id);
          return {
            ...project,
            balance: balance.rawBalance
          };
        })
        .filter(p => p.balance > 0); // Only projects with payable balance

      setProjectsWithBalance(projectBalances);

      // If project is pre-selected, set its balance
      if (preSelectedProjectId) {
        const selectedProject = projectBalances.find(p => p.id === preSelectedProjectId);
        setCurrentBalance(selectedProject ? selectedProject.balance : 0);
      }
    }
  }, [show, supplier, data.supplierTransactions, data.projects, preSelectedProjectId]);

  // Reset form when modal opens/closes or supplier changes
  useEffect(() => {
    if (show) {
      setFormData({
        projectId: preSelectedProjectId || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMode: '',
        description: ''
      });
      setErrors({});
    }
  }, [show, supplier, preSelectedProjectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update current balance when project changes
    if (name === 'projectId') {
      const selectedProject = projectsWithBalance.find(p => p.id === value);
      setCurrentBalance(selectedProject ? selectedProject.balance : 0);
    }
    
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

    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    } else if (amount > currentBalance) {
      newErrors.amount = `Payment amount cannot exceed current balance of ₹${currentBalance.toFixed(2)}`;
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

    if (!formData.paymentMode) {
      newErrors.paymentMode = 'Please select a payment mode';
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
      const amount = parseFloat(formData.amount);
      const entryDateTime = new Date().toISOString();

      console.log('💰 Adding Payment Transaction and Payment Out...');

      // STEP 1: Create Supplier Transaction (Payment)
      const transactionData = {
        supplierId: supplier.id,
        projectId: formData.projectId,
        type: 'payment', // Changed from 'debit' to 'payment'
        amount: amount,
        date: formData.date,
        description: formData.description.trim(),
        paymentMode: formData.paymentMode,
        paymentOutId: null, // Will be updated after Payment Out is created
        entryBy: user?.username || user?.email || 'Unknown',
        entryDateTime: entryDateTime
      };

      const supplierTransaction = await addSupplierTransaction(transactionData);
      console.log('✅ Supplier payment transaction created:', supplierTransaction);

      // STEP 2: Create Payment Out Entry (Auto-create)
      const paymentOutData = {
        projectId: formData.projectId,
        partyId: supplier.id,
        supplierId: supplier.id, // Link to supplier
        supplierTransactionId: supplierTransaction.id, // Link to supplier transaction
        amount: amount,
        date: formData.date,
        category: 'Materials', // or 'Supplier Payment'
        paymentMode: formData.paymentMode,
        description: `Payment to ${supplier.name} - ${formData.description.trim()}`,
        status: 'pending', // Triggers approval workflow
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      };

      const paymentOut = await addPaymentOut(paymentOutData);
      console.log('✅ Payment Out created:', paymentOut);

      // STEP 3: Update Supplier Transaction with Payment Out ID (Bidirectional Link)
      await updateSupplierTransaction(supplierTransaction.id, {
        paymentOutId: paymentOut.id
      });
      console.log('✅ Supplier transaction updated with Payment Out ID');

      console.log('✅ Payment transaction and Payment Out created successfully');
      console.log('🔗 Bidirectional Link Established:', {
        supplierTransaction: {
          id: supplierTransaction.id,
          type: 'payment',
          paymentOutId: paymentOut.id
        },
        paymentOut: {
          id: paymentOut.id,
          supplierTransactionId: supplierTransaction.id
        }
      });

      // Show success message
      if (onSuccess) {
        onSuccess('Payment recorded and added to Payments Out (Pending Approval)');
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('❌ Error adding payment transaction:', error);
      setErrors({ submit: 'Failed to add payment transaction. Please try again.' });
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
              <h2 className="text-xl font-semibold text-gray-900">Record Payment to Supplier</h2>
              <p className="text-sm text-gray-600 mt-1">Supplier: {supplier.name}</p>
              <p className="text-xs text-blue-600 mt-1">
                💡 This reduces PAYABLE and auto-creates Payment Out entry
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
                    ₹{overallBalance.totalPurchases.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total Payments</p>
                  <p className="text-lg font-bold text-green-700">
                    ₹{overallBalance.totalPayments.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Outstanding Balance</p>
                  <p className={`text-lg font-bold ${overallBalance.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{Math.abs(overallBalance.outstanding).toFixed(2)}
                  </p>
                  <p className="text-xs font-normal text-gray-600 mt-1">
                    {overallBalance.outstanding > 0 ? '(You\'ll Pay)' : '(Settled)'}
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

            {/* No Projects with Balance Warning */}
            {projectsWithBalance.length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">No Outstanding Balance</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This supplier has no outstanding balance for any project. Please record a purchase transaction first.
                  </p>
                </div>
              </div>
            )}

            {/* Current Balance Display */}
            {formData.projectId && currentBalance > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Outstanding Balance (You Owe):</span>
                  <span className="text-lg font-bold text-red-600">₹{currentBalance.toFixed(2)}</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">Maximum payment allowed: ₹{currentBalance.toFixed(2)}</p>
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
                disabled={!!preSelectedProjectId || projectsWithBalance.length === 0}
              >
                <option value="">Select a project</option>
                {projectsWithBalance.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} (Balance: ₹{project.balance.toFixed(2)})
                  </option>
                ))}
              </select>
              {errors.projectId && (
                <p className="mt-1 text-sm text-red-500">{errors.projectId}</p>
              )}
            </div>

            {/* Payment Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter payment amount"
                step="0.01"
                min="0"
                max={currentBalance}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Payment <span className="text-red-500">*</span>
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

            {/* Payment Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.paymentMode ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select payment mode</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
              </select>
              {errors.paymentMode && (
                <p className="mt-1 text-sm text-red-500">{errors.paymentMode}</p>
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
                placeholder="Enter description (e.g., Partial payment for cement delivery)"
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
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 mb-2">AUTO-CAPTURED INFORMATION</p>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>Entry By:</strong> {user?.username || user?.email || 'Unknown'}</p>
                <p><strong>Entry Date/Time:</strong> {new Date().toLocaleString()}</p>
                <p><strong>Transaction Type:</strong> Payment (Payment to Supplier)</p>
                <p><strong>Effect:</strong> Reduces PAYABLE (You Owe Less)</p>
              </div>
            </div>

            {/* Payment Out Info */}
            <div className="mb-6 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs font-semibold text-orange-900 mb-2">⚠️ APPROVAL WORKFLOW</p>
              <div className="space-y-1 text-xs text-orange-700">
                <p>• This payment will be added to <strong>Payments Out</strong></p>
                <p>• Status will be set to <strong>"Pending Approval"</strong></p>
                <p>• Admin must approve before payment is finalized</p>
                <p>• Supplier balance will be updated immediately</p>
                <p>• Bidirectional link created: Supplier Transaction ↔ Payment Out</p>
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
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || projectsWithBalance.length === 0}
              >
                {isSubmitting ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentTransactionModal;

