import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  DollarSign,
  PieChart as PieChartIcon,
  Building2,
  Target,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  calculateTotalPaymentsIn,
  calculateTotalPaymentsOut,
  calculateBalance,
  needsPaymentReminder,
  getExpensesByDepartment,
  formatCurrency,
  getProjectSummary,
  formatDate
} from '../utils/dataManager';
import { exportToExcel, exportToCSV, exportProjectsToPDF } from '../utils/exportUtils';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Dashboard = () => {
  const { currentProject, data } = useData();
  const { isBootstrap } = useTheme();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const metrics = useMemo(() => {
    if (!currentProject) {
      return {
        totalIn: 0,
        totalOut: 0,
        balance: 0,
        needsReminder: false,
        expensesByDept: [],
        projectSummary: null
      };
    }

    const totalIn = calculateTotalPaymentsIn(currentProject.paymentsIn);
    const totalOut = calculateTotalPaymentsOut(currentProject.paymentsOut);
    const balance = calculateBalance(currentProject.paymentsIn, currentProject.paymentsOut);
    const needsReminder = needsPaymentReminder(currentProject.paymentsIn, currentProject.paymentsOut);
    const expensesByDept = getExpensesByDepartment(currentProject.paymentsOut, currentProject.departments);
    const projectSummary = getProjectSummary(currentProject);

    return {
      totalIn,
      totalOut,
      balance,
      needsReminder,
      expensesByDept,
      projectSummary
    };
  }, [currentProject]);

  const chartData = useMemo(() => {
    return metrics.expensesByDept
      .filter(dept => dept.total > 0)
      .map(dept => ({
        name: dept.name,
        value: dept.total,
        count: dept.count
      }));
  }, [metrics.expensesByDept]);

  const barChartData = useMemo(() => {
    return metrics.expensesByDept
      .filter(dept => dept.total > 0)
      .map(dept => ({
        name: dept.name.length > 10 ? dept.name.substring(0, 10) + '...' : dept.name,
        amount: dept.total
      }));
  }, [metrics.expensesByDept]);

  // Recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    if (!currentProject) return [];

    const paymentsIn = (currentProject.paymentsIn || []).map(p => ({
      ...p,
      type: 'income',
      date: p.date || p.createdAt
    }));

    const paymentsOut = (currentProject.paymentsOut || []).map(p => ({
      ...p,
      type: 'expense',
      date: p.date || p.createdAt
    }));

    return [...paymentsIn, ...paymentsOut]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  }, [currentProject]);

  // Export handlers
  const handleExportDashboard = (format) => {
    if (!currentProject) return;

    const dashboardData = metrics.expensesByDept.map((dept, index) => ({
      'Sr. No.': index + 1,
      'Department': dept.name,
      'Transactions': dept.count,
      'Total Amount': dept.total,
      'Percentage': metrics.totalOut > 0 ? ((dept.total / metrics.totalOut) * 100).toFixed(2) : '0',
      'Average per Transaction': dept.count > 0 ? (dept.total / dept.count).toFixed(2) : '0'
    }));

    const filename = `${currentProject.name.replace(/[^a-z0-9]/gi, '_')}_Dashboard_${new Date().toISOString().split('T')[0]}`;

    if (format === 'excel') {
      exportToExcel(dashboardData, filename, 'Dashboard Report');
    } else if (format === 'csv') {
      exportToCSV(dashboardData, filename);
    }

    setShowExportMenu(false);
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600 mb-6">Please create or select a construction project to view the dashboard</p>
          <a href="#" onClick={() => window.location.reload()} className="btn btn-primary">
            Go to Projects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Project Info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
          </div>
          <p className="text-gray-600">Financial overview and analytics</p>
        </div>

        {/* Export Button */}
        <div className="position-relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-primary d-flex align-items-center gap-2"
            title="Export dashboard data"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>

          {showExportMenu && (
            <>
              <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ zIndex: 999 }}
                onClick={() => setShowExportMenu(false)}
              />
              <div
                className="position-absolute end-0 mt-2 bg-white rounded shadow-lg border"
                style={{
                  width: '200px',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              >
                <div className="py-2">
                  <button
                    onClick={() => handleExportDashboard('excel')}
                    className="w-100 px-4 py-2 text-start border-0 bg-transparent d-flex align-items-center gap-2"
                    style={{ fontSize: '0.875rem', color: '#374151' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileSpreadsheet style={{ width: '16px', height: '16px', color: '#10b981' }} />
                    Export to Excel
                  </button>
                  <button
                    onClick={() => handleExportDashboard('csv')}
                    className="w-100 px-4 py-2 text-start border-0 bg-transparent d-flex align-items-center gap-2"
                    style={{ fontSize: '0.875rem', color: '#374151' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileText style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                    Export to CSV
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Progress Card */}
      {metrics.projectSummary && (
        <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-primary-100 text-sm font-medium mb-1">Contract Payment Progress</p>
              <h2 className="text-4xl font-bold">{metrics.projectSummary.percentageReceived.toFixed(1)}%</h2>
            </div>
            <div className="bg-white/20 p-4 rounded-xl">
              <Target className="w-10 h-10" />
            </div>
          </div>

          <div className="w-full bg-white/20 rounded-full h-3 mb-4">
            <div
              className="bg-white h-3 rounded-full transition-all shadow-lg"
              style={{ width: `${Math.min(metrics.projectSummary.percentageReceived, 100)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-primary-100 text-xs mb-1">Total Contract</p>
              <p className="text-lg font-bold">{formatCurrency(metrics.projectSummary.totalCommitted)}</p>
            </div>
            <div>
              <p className="text-primary-100 text-xs mb-1">Received</p>
              <p className="text-lg font-bold">{formatCurrency(metrics.projectSummary.totalReceived)}</p>
            </div>
            <div>
              <p className="text-primary-100 text-xs mb-1">Remaining</p>
              <p className="text-lg font-bold">{formatCurrency(metrics.projectSummary.remainingBalance)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert for Payment Reminder */}
      {metrics.needsReminder && (
        <div className="bg-warning-50 border-l-4 border-warning-500 p-4 rounded-lg animate-slide-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-900">Payment Reminder</h3>
              <p className="text-warning-700 mt-1">
                Total expenses ({formatCurrency(metrics.totalOut)}) exceed payments received ({formatCurrency(metrics.totalIn)}).
                Consider requesting payment from the client.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Payments In */}
        <div className="metric-card from-success-500 to-success-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">Total Payments In</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(metrics.totalIn)}</h3>
              <p className="text-success-100 text-sm mt-2">{currentProject.paymentsIn.length} transactions</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Payments Out */}
        <div className="metric-card from-danger-500 to-danger-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-danger-100 text-sm font-medium">Total Payments Out</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(metrics.totalOut)}</h3>
              <p className="text-danger-100 text-sm mt-2">{currentProject.paymentsOut.length} transactions</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div className={`metric-card ${metrics.balance >= 0 ? 'from-primary-500 to-primary-700' : 'from-warning-500 to-warning-700'}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">Net Balance</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(metrics.balance)}</h3>
              <p className="text-white/90 text-sm mt-2">
                {metrics.balance >= 0 ? 'Positive' : 'Negative'} balance
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Departments */}
        <div className="metric-card from-purple-500 to-purple-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Departments</p>
              <h3 className="text-3xl font-bold mt-2">{chartData.length}</h3>
              <p className="text-purple-100 text-sm mt-2">of {currentProject.departments.length} total</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <PieChartIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={isBootstrap ? "row g-3" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
        {/* Pie Chart - Expenses by Department */}
        <div className={isBootstrap ? "col-md-6" : ""}>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Department</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No expense data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart - Expenses by Department */}
        <div className={isBootstrap ? "col-md-6" : ""}>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Spending</h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill="#0ea5e9" name="Amount Spent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No expense data available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row - Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Summary */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Summary</h3>
            <span className="text-sm text-gray-500">Last 10 Transactions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Date</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Description</th>
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Type</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 text-xs">Amount</th>
                  <th className="text-center py-3 px-3 font-semibold text-gray-700 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-2 px-3 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs whitespace-nowrap">{formatDate(transaction.date)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-900">
                      <span className="text-xs truncate block max-w-[120px]" title={transaction.description || transaction.clientName || 'No description'}>
                        {transaction.description || transaction.clientName || 'No description'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {transaction.type === 'income' ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUpRight className="w-3 h-3" />
                          <span className="font-medium text-xs">In</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <ArrowDownRight className="w-3 h-3" />
                          <span className="font-medium text-xs">Out</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-semibold text-xs ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {transaction.type === 'income' ? (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Received
                        </span>
                      ) : transaction.approvalStatus === 'approved' ? (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Paid
                        </span>
                      ) : transaction.approvalStatus === 'pending' ? (
                        <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Pending
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Rejected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent transactions</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Summary Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Department Summary</h3>
            <span className="text-sm text-gray-500">{metrics.expensesByDept.length} Active Departments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="text-left py-3 px-3 font-semibold text-gray-700 text-xs">Department</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 text-xs">Txns</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 text-xs">Total Spent</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 text-xs">Avg/Txn</th>
                  <th className="text-right py-3 px-3 font-semibold text-gray-700 text-xs">% Share</th>
                </tr>
              </thead>
              <tbody>
                {metrics.expensesByDept.map((dept, index) => {
                  const percentage = metrics.totalOut > 0 ? ((dept.total / metrics.totalOut) * 100) : 0;
                  const avgPerTxn = dept.count > 0 ? dept.total / dept.count : 0;
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-xs truncate max-w-[100px]" title={dept.name}>{dept.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 text-xs">{dept.count}</td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-900 text-xs">
                        {formatCurrency(dept.total)}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-600 text-xs">
                        {formatCurrency(avgPerTxn)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div className="w-10 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-primary-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700 w-9 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {metrics.expensesByDept.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-400">
                      <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No expenses recorded yet</p>
                    </td>
                  </tr>
                )}
                {metrics.expensesByDept.length > 0 && (
                  <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                    <td className="py-2 px-3 text-xs">TOTAL</td>
                    <td className="py-2 px-3 text-right text-xs">{metrics.expensesByDept.reduce((sum, d) => sum + d.count, 0)}</td>
                    <td className="py-2 px-3 text-right text-gray-900 text-xs">{formatCurrency(metrics.totalOut)}</td>
                    <td className="py-2 px-3 text-right text-xs">
                      {formatCurrency(metrics.expensesByDept.reduce((sum, d) => sum + d.count, 0) > 0
                        ? metrics.totalOut / metrics.expensesByDept.reduce((sum, d) => sum + d.count, 0)
                        : 0)}
                    </td>
                    <td className="py-2 px-3 text-right text-xs">100%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

