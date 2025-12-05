import { useState, useEffect } from 'react';
import { X, Plus, FileText, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getProjectWiseBreakdown, getOverallSupplierBalance } from '../utils/supplierBalanceUtils';

const SupplierDetailModal = ({ 
  show, 
  onClose, 
  supplier,
  onAddCredit,
  onAddPayment,
  onViewTransactions,
  onGenerateReport
}) => {
  const { data } = useData();
  const [projectBreakdown, setProjectBreakdown] = useState([]);
  const [overallBalance, setOverallBalance] = useState(null);

  useEffect(() => {
    if (supplier && show) {
      const transactions = data.supplierTransactions || [];
      const projects = data.projects || [];

      console.log('📊 Supplier Detail Modal - Data:', {
        supplierId: supplier.id,
        supplierName: supplier.name,
        totalTransactions: transactions.length,
        supplierTransactions: transactions.filter(t => t.supplierId === supplier.id).length,
        totalProjects: projects.length
      });

      // Calculate overall balance
      const overall = getOverallSupplierBalance(transactions, supplier.id);
      setOverallBalance(overall);

      console.log('💰 Overall Balance:', overall);

      // Get project-wise breakdown
      const breakdown = getProjectWiseBreakdown(transactions, supplier.id, projects);
      setProjectBreakdown(breakdown);

      console.log('📋 Project Breakdown:', breakdown);
    }
  }, [supplier, show, data.supplierTransactions, data.projects]);

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
          className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{supplier.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {supplier.phone && (
                  <span className="flex items-center gap-1">
                    📞 {supplier.phone}
                  </span>
                )}
                {supplier.email && (
                  <span className="flex items-center gap-1">
                    📧 {supplier.email}
                  </span>
                )}
              </div>
              {supplier.address && (
                <p className="text-sm text-gray-600 mt-1">📍 {supplier.address}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Overall Balance Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">OVERALL BALANCE</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total Purchases</p>
                  <p className="text-lg font-bold text-blue-900">
                    ₹{overallBalance ? overallBalance.totalPurchases.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total Payments</p>
                  <p className="text-lg font-bold text-blue-900">
                    ₹{overallBalance ? overallBalance.totalPayments.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Outstanding Balance</p>
                  <p className={`text-lg font-bold ${
                    overallBalance?.balanceType === 'payable' ? 'text-red-600' :
                    overallBalance?.balanceType === 'overpaid' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    ₹{overallBalance ? overallBalance.outstandingBalance.toFixed(2) : '0.00'}
                    <span className="text-xs ml-1">
                      ({overallBalance?.balanceType === 'payable' ? "You Owe" :
                        overallBalance?.balanceType === 'overpaid' ? "Overpaid" :
                        'Settled'})
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Project-wise Breakdown */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">PROJECT-WISE BREAKDOWN</h3>

              {projectBreakdown.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500">No transactions found for this supplier</p>
                  <p className="text-sm text-gray-400 mt-1">Record a purchase transaction to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectBreakdown.map((project) => (
                    <div
                      key={project.projectId}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">🏗️ {project.projectName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>Purchases: ₹{project.totalPurchases.toFixed(2)}</span>
                            <span>Payments: ₹{project.totalPayments.toFixed(2)}</span>
                            <span className={`font-semibold ${
                              project.balanceType === 'payable' ? 'text-red-600' :
                              project.balanceType === 'overpaid' ? 'text-green-600' :
                              'text-gray-600'
                            }`}>
                              Outstanding: ₹{project.outstandingBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewTransactions(supplier, project.projectId, project.projectName)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Transactions
                        </button>
                        <button
                          onClick={() => onAddCredit(supplier, project.projectId)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Record Purchase
                        </button>
                        {project.rawBalance > 0 && (
                          <button
                            onClick={() => onAddPayment(supplier, project.projectId)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => onGenerateReport(supplier)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailModal;

