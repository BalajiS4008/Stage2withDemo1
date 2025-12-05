import { useState, useEffect, useMemo } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { useData } from '../context/DataContext';
import { calculateRunningBalance } from '../utils/supplierBalanceUtils';
import { generateTransactionHistoryPDF } from '../utils/supplierReportUtils';
import * as XLSX from 'xlsx';

const TransactionHistoryModal = ({ 
  show, 
  onClose, 
  supplier,
  projectId = null,
  projectName = null
}) => {
  const { data } = useData();
  const [transactions, setTransactions] = useState([]);

  // Load and process transactions
  useEffect(() => {
    if (show && supplier) {
      let allTransactions = data.supplierTransactions || [];
      
      // Filter by supplier
      allTransactions = allTransactions.filter(t => t.supplierId === supplier.id);
      
      // Filter by project if specified
      if (projectId) {
        allTransactions = allTransactions.filter(t => t.projectId === projectId);
      }
      
      // Sort by date (newest first)
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Calculate running balance
      const transactionsWithBalance = calculateRunningBalance(allTransactions);
      
      console.log('📊 Transaction History:', {
        supplierId: supplier.id,
        projectId: projectId || 'All Projects',
        totalTransactions: transactionsWithBalance.length
      });
      
      setTransactions(transactionsWithBalance);
    }
  }, [show, supplier, projectId, data.supplierTransactions]);

  // Get project name from ID
  const getProjectName = (pId) => {
    const project = (data.projects || []).find(p => p.id === pId);
    return project ? project.name : 'Unknown Project';
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const exportData = transactions.map(t => ({
      'Date': new Date(t.date).toLocaleDateString(),
      'Project': getProjectName(t.projectId),
      'Type': (t.type === 'purchase' || t.type === 'credit') ? 'Purchase' : 'Payment',
      'Description': t.description,
      'Purchase (₹)': (t.type === 'purchase' || t.type === 'credit') ? t.amount.toFixed(2) : '',
      'Payment (₹)': (t.type === 'payment' || t.type === 'debit') ? t.amount.toFixed(2) : '',
      'Balance (₹)': t.runningBalance.toFixed(2),
      'Payment Mode': t.paymentMode || '-',
      'Entry By': t.entryBy,
      'Entry Date/Time': new Date(t.entryDateTime).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    const fileName = projectName 
      ? `${supplier.name}_${projectName}_Transactions.xlsx`
      : `${supplier.name}_All_Transactions.xlsx`;
    
    XLSX.writeFile(wb, fileName);
    
    console.log('✅ Excel exported:', fileName);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    try {
      // Prepare company settings
      const companyProfile = data.settings?.companyProfile || {};
      const companySettings = {
        companyName: companyProfile.companyName || 'Company Name',
        companyLogo: companyProfile.logo || null,
        companyAddress: companyProfile.address || '',
        companyPhone: companyProfile.phone || '',
        companyEmail: companyProfile.email || ''
      };

      // Generate PDF
      generateTransactionHistoryPDF(
        supplier,
        transactions,
        data.projects || [],
        projectName,
        companySettings
      );

      console.log('✅ Transaction History PDF exported successfully');
    } catch (error) {
      console.error('❌ Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
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
          className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-600 mt-1">
                Supplier: {supplier.name}
                {projectName && ` • Project: ${projectName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Export Buttons */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Total Transactions: <span className="font-semibold">{transactions.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  disabled={transactions.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  disabled={transactions.length === 0}
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No transactions found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {projectName
                    ? `No transactions for this project`
                    : `Record a purchase or payment transaction to get started`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      {!projectId && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchase (₹)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment (₹)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance (₹)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entry By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={transaction.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          index === 0 ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        {!projectId && (
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getProjectName(transaction.projectId)}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            (transaction.type === 'purchase' || transaction.type === 'credit')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {(transaction.type === 'purchase' || transaction.type === 'credit') ? 'Purchase' : 'Payment'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={transaction.description}>
                          {transaction.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {(transaction.type === 'purchase' || transaction.type === 'credit') ? `₹${transaction.amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-orange-600">
                          {(transaction.type === 'payment' || transaction.type === 'debit') ? `₹${transaction.amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                          <span className={
                            transaction.runningBalance > 0
                              ? 'text-red-600'
                              : transaction.runningBalance < 0
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }>
                            ₹{Math.abs(transaction.runningBalance).toFixed(2)}
                            <span className="text-xs ml-1">
                              {transaction.runningBalance > 0 ? '(Owe)' :
                               transaction.runningBalance < 0 ? '(Overpaid)' :
                               '(Settled)'}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {transaction.entryBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              {transactions.length > 0 && (
                <>
                  Outstanding Balance:
                  <span className={`ml-2 font-bold ${
                    transactions[0].runningBalance > 0
                      ? 'text-red-600'
                      : transactions[0].runningBalance < 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}>
                    ₹{Math.abs(transactions[0].runningBalance).toFixed(2)}
                    <span className="text-xs ml-1">
                      {transactions[0].runningBalance > 0 ? '(You Owe)' :
                       transactions[0].runningBalance < 0 ? '(Overpaid)' :
                       '(Settled)'}
                    </span>
                  </span>
                </>
              )}
            </div>
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
  );
};

export default TransactionHistoryModal;

