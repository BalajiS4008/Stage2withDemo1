/**
 * Project Analytics Utilities
 * Comprehensive calculations for project profit, expenses, revenue, and margins
 */

import { calculateTotalPaymentsIn, calculateTotalPaymentsOut } from './dataManager';

/**
 * Calculate revenue for a single project
 * Revenue = Total Payments In (actual money received)
 */
export const calculateProjectRevenue = (project) => {
  if (!project) return 0;
  return calculateTotalPaymentsIn(project.paymentsIn || []);
};

/**
 * Calculate expenses for a single project
 * Expenses = Total Payments Out (approved expenses only)
 */
export const calculateProjectExpenses = (project) => {
  if (!project) return 0;
  return calculateTotalPaymentsOut(project.paymentsOut || []);
};

/**
 * Calculate profit for a single project
 * Profit = Revenue - Expenses
 */
export const calculateProjectProfit = (project) => {
  if (!project) return 0;
  const revenue = calculateProjectRevenue(project);
  const expenses = calculateProjectExpenses(project);
  return revenue - expenses;
};

/**
 * Calculate profit margin percentage for a single project
 * Profit Margin % = (Profit / Revenue) × 100
 * Returns 0 if revenue is 0 to avoid division by zero
 */
export const calculateProjectProfitMargin = (project) => {
  if (!project) return 0;
  const revenue = calculateProjectRevenue(project);
  if (revenue === 0) return 0;
  const profit = calculateProjectProfit(project);
  return (profit / revenue) * 100;
};

/**
 * Calculate budget vs actual for a single project
 * Budget = totalCommittedAmount
 * Actual = Revenue (payments received)
 * Collection Rate = (Actual / Budget) × 100
 */
export const calculateBudgetVsActual = (project) => {
  if (!project) return { budget: 0, actual: 0, collectionRate: 0, remaining: 0 };
  
  const budget = parseFloat(project.totalCommittedAmount) || 0;
  const actual = calculateProjectRevenue(project);
  const remaining = budget - actual;
  const collectionRate = budget > 0 ? (actual / budget) * 100 : 0;

  return {
    budget,
    actual,
    remaining,
    collectionRate: Math.min(collectionRate, 100) // Cap at 100%
  };
};

/**
 * Get comprehensive analytics for a single project
 */
export const getProjectAnalytics = (project) => {
  if (!project) return null;

  const revenue = calculateProjectRevenue(project);
  const expenses = calculateProjectExpenses(project);
  const profit = calculateProjectProfit(project);
  const profitMargin = calculateProjectProfitMargin(project);
  const budgetVsActual = calculateBudgetVsActual(project);

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    revenue,
    expenses,
    profit,
    profitMargin,
    ...budgetVsActual,
    isProfitable: profit > 0,
    isLoss: profit < 0,
    isBreakEven: profit === 0
  };
};

/**
 * Calculate aggregate analytics for multiple projects
 */
export const calculateAggregateAnalytics = (projects) => {
  if (!projects || projects.length === 0) {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      totalProfit: 0,
      averageProfitMargin: 0,
      totalBudget: 0,
      totalActual: 0,
      overallCollectionRate: 0,
      projectCount: 0,
      activeProjectCount: 0,
      profitableProjectCount: 0,
      lossProjectCount: 0
    };
  }

  const totalRevenue = projects.reduce((sum, p) => sum + calculateProjectRevenue(p), 0);
  const totalExpenses = projects.reduce((sum, p) => sum + calculateProjectExpenses(p), 0);
  const totalProfit = totalRevenue - totalExpenses;
  const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  
  const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.totalCommittedAmount) || 0), 0);
  const totalActual = totalRevenue;
  const overallCollectionRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  const activeProjectCount = projects.filter(p => p.status === 'active').length;
  const profitableProjectCount = projects.filter(p => calculateProjectProfit(p) > 0).length;
  const lossProjectCount = projects.filter(p => calculateProjectProfit(p) < 0).length;

  return {
    totalRevenue,
    totalExpenses,
    totalProfit,
    averageProfitMargin,
    totalBudget,
    totalActual,
    overallCollectionRate: Math.min(overallCollectionRate, 100),
    projectCount: projects.length,
    activeProjectCount,
    profitableProjectCount,
    lossProjectCount
  };
};

/**
 * Get top N most profitable projects
 */
export const getTopProfitableProjects = (projects, limit = 5) => {
  if (!projects || projects.length === 0) return [];

  return projects
    .map(project => getProjectAnalytics(project))
    .filter(analytics => analytics !== null)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
};

/**
 * Get expense breakdown by category for projects
 */
export const getExpenseBreakdown = (projects) => {
  if (!projects || projects.length === 0) return [];

  const categoryTotals = {};

  projects.forEach(project => {
    const paymentsOut = project.paymentsOut || [];
    const approvedPayments = paymentsOut.filter(p => p.approvalStatus === 'approved');

    approvedPayments.forEach(payment => {
      const category = payment.category || 'Other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += parseFloat(payment.amount) || 0;
    });
  });

  // Convert to array format for charts
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Filter projects by timeline
 */
export const filterProjectsByTimeline = (projects, timelineFilter, customDateRange = {}) => {
  if (!projects || projects.length === 0) return [];
  if (timelineFilter === 'all') return projects;

  const now = new Date();

  return projects.filter(project => {
    const createdDate = new Date(project.createdAt);

    switch (timelineFilter) {
      case 'this-month':
        return createdDate.getMonth() === now.getMonth() &&
               createdDate.getFullYear() === now.getFullYear();

      case 'this-quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const projectQuarter = Math.floor(createdDate.getMonth() / 3);
        return projectQuarter === currentQuarter &&
               createdDate.getFullYear() === now.getFullYear();

      case 'this-year':
        return createdDate.getFullYear() === now.getFullYear();

      case 'last-30':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return createdDate >= thirtyDaysAgo;

      case 'last-90':
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return createdDate >= ninetyDaysAgo;

      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          const start = new Date(customDateRange.startDate);
          const end = new Date(customDateRange.endDate);
          end.setHours(23, 59, 59, 999);
          return createdDate >= start && createdDate <= end;
        }
        return true;

      default:
        return true;
    }
  });
};

/**
 * Filter projects by status
 */
export const filterProjectsByStatus = (projects, statusFilter) => {
  if (!projects || projects.length === 0) return [];
  if (statusFilter === 'all') return projects;

  return projects.filter(project => project.status === statusFilter);
};

/**
 * Get profit margin category (for color coding)
 */
export const getProfitMarginCategory = (profitMargin) => {
  if (profitMargin >= 20) return 'excellent'; // Green
  if (profitMargin >= 10) return 'good'; // Yellow/Orange
  if (profitMargin >= 0) return 'low'; // Light Red
  return 'loss'; // Red
};

/**
 * Get profit margin color
 */
export const getProfitMarginColor = (profitMargin) => {
  const category = getProfitMarginCategory(profitMargin);

  switch (category) {
    case 'excellent':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    case 'good':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    case 'low':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' };
    case 'loss':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };
  }
};

