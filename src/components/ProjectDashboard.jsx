import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Building2, Award, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  calculateAggregateAnalytics,
  getTopProfitableProjects,
  getExpenseBreakdown,
  getProfitMarginColor
} from '../utils/projectAnalytics';
import { formatCurrency } from '../utils/dataManager';

const ProjectDashboard = ({ projects }) => {
  // Calculate aggregate analytics
  const analytics = useMemo(() => {
    return calculateAggregateAnalytics(projects);
  }, [projects]);

  // Get top 5 profitable projects
  const topProjects = useMemo(() => {
    return getTopProfitableProjects(projects, 5);
  }, [projects]);

  // Get expense breakdown
  const expenseBreakdown = useMemo(() => {
    return getExpenseBreakdown(projects);
  }, [projects]);

  // Prepare data for Budget vs Actual chart
  const budgetVsActualData = useMemo(() => {
    return [
      { name: 'Budget', value: analytics.totalBudget },
      { name: 'Actual Revenue', value: analytics.totalActual },
      { name: 'Expenses', value: analytics.totalExpenses }
    ];
  }, [analytics]);

  // Colors for charts
  const EXPENSE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const BUDGET_COLORS = ['#60a5fa', '#34d399', '#fbbf24'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue Card */}
        <div className="metric-card from-success-500 to-success-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">Total Revenue</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(analytics.totalRevenue)}</h3>
              <p className="text-success-100 text-sm mt-2">
                Collection Rate: {analytics.overallCollectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="metric-card from-danger-500 to-danger-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-danger-100 text-sm font-medium">Total Expenses</p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(analytics.totalExpenses)}</h3>
              <p className="text-danger-100 text-sm mt-2">
                {analytics.projectCount} Project{analytics.projectCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Profit/Loss Card */}
        <div className={`metric-card ${
          analytics.totalProfit >= 0
            ? 'from-primary-500 to-primary-700'
            : 'from-warning-500 to-warning-700'
        }`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">
                {analytics.totalProfit >= 0 ? 'Total Profit' : 'Total Loss'}
              </p>
              <h3 className="text-3xl font-bold mt-2">{formatCurrency(Math.abs(analytics.totalProfit))}</h3>
              <p className="text-white/90 text-sm mt-2">
                Margin: {analytics.averageProfitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="metric-card from-purple-500 to-purple-700">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Projects</p>
              <h3 className="text-3xl font-bold mt-2">{analytics.activeProjectCount}</h3>
              <p className="text-purple-100 text-sm mt-2">
                {analytics.profitableProjectCount} Profitable | {analytics.lossProjectCount} Loss
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget vs Actual Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">Budget vs Actual</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetVsActualData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" fill="#3b82f6">
                {budgetVsActualData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BUDGET_COLORS[index % BUDGET_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Collection Rate:</strong> {analytics.overallCollectionRate.toFixed(1)}% of total budget collected
            </p>
          </div>
        </div>

        {/* Expense Breakdown Chart */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">Expense Breakdown</h3>
          </div>
          {expenseBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <p>No expense data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Most Profitable Projects */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-bold text-gray-900">Top 5 Most Profitable Projects</h3>
        </div>
        {topProjects.length > 0 ? (
          <div className="space-y-3">
            {topProjects.map((project, index) => {
              const marginColor = getProfitMarginColor(project.profitMargin);
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

              return (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{medals[index]}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          Revenue: {formatCurrency(project.revenue)}
                        </span>
                        <span className="text-sm text-gray-600">
                          Expenses: {formatCurrency(project.expenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      project.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(project.profit)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${marginColor.bg} ${marginColor.text} ${marginColor.border} border`}>
                      {project.profitMargin.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No project data available</p>
          </div>
        )}
      </div>

      {/* Expense Category Insights */}
      {expenseBreakdown.length > 0 && (
        <div
          className="card shadow-md"
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 50%, #EDE9FE 100%)',
            borderLeft: '4px solid #6366F1'
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: '#E0E7FF' }}
            >
              <PieChartIcon className="w-6 h-6" style={{ color: '#4F46E5' }} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <span>Expense Insights</span>
              </h4>
              <div className="space-y-3">
                {expenseBreakdown.slice(0, 3).map((category, index) => {
                  const totalExpenses = expenseBreakdown.reduce((sum, cat) => sum + cat.value, 0);
                  const percentage = ((category.value / totalExpenses) * 100).toFixed(1);

                  return (
                    <div
                      key={index}
                      className="rounded-lg p-3"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        border: '1px solid #E0E7FF'
                      }}
                    >
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold" style={{ color: '#4338CA' }}>{category.name}</span> accounts for{' '}
                        <span className="font-bold" style={{ color: '#312E81' }}>{percentage}%</span> of total expenses
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatCurrency(category.value)}
                        {parseFloat(percentage) > 40 && (
                          <span className="ml-2 font-semibold" style={{ color: '#EA580C' }}>⚠️ High cost category</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDashboard;

