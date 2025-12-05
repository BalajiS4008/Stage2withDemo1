import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  performEVMAnalysis,
  calculateSPI,
  calculateCPI,
  formatCurrency,
  getBudgetStatusColor
} from '../utils/budgetUtils';

const BudgetTrackingPage = () => {
  const { data } = useData();

  // State management
  const [selectedProject, setSelectedProject] = useState('');

  // Get data
  const allProjects = useMemo(() => data.projects || [], [data.projects]);
  const allBudgets = useMemo(() => data.projectBudgets || [], [data.projectBudgets]);
  const budgetLineItems = useMemo(() => data.budgetLineItems || [], [data.budgetLineItems]);

  // Get selected project budget
  const selectedBudget = useMemo(() => {
    if (!selectedProject) return null;
    return allBudgets.find(b => b.projectId === parseInt(selectedProject) && b.isActive);
  }, [allBudgets, selectedProject]);

  // Calculate budget totals
  const budgetData = useMemo(() => {
    if (!selectedBudget) return null;

    const items = budgetLineItems.filter(item => item.budgetId === selectedBudget.id);
    const totalBudget = items.reduce((sum, item) => sum + (parseFloat(item.budgetAmount) || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0);

    // Get project completion percentage (from project data or default)
    const project = allProjects.find(p => p.id === selectedBudget.projectId);
    const actualPercentage = project?.completionPercentage || 0;
    const plannedPercentage = project?.plannedPercentage || 0;

    // Perform EVM analysis
    const evmData = performEVMAnalysis(totalBudget, actualPercentage, plannedPercentage, totalActual);

    return {
      totalBudget,
      totalActual,
      actualPercentage,
      plannedPercentage,
      evm: evmData,
      items
    };
  }, [selectedBudget, budgetLineItems, allProjects]);

  // Get project name
  const getProjectName = (projectId) => {
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Render EVM metrics card
  const renderEVMCard = (title, value, icon, color, subtitle = null) => {
    const Icon = icon;
    return (
    <div className="col-md-4 col-lg-3 mb-3">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between mb-2">
            <div className={`bg-${color} bg-opacity-10 rounded p-2`}>
              <Icon className={`text-${color}`} size={20} />
            </div>
          </div>
          <h6 className="text-muted mb-1">{title}</h6>
          <h4 className={`mb-0 text-${color}`}>{value}</h4>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      </div>
    </div>
    );
  };

  // Render summary section
  const renderSummary = () => {
    if (!budgetData) {
      return (
        <div className="alert alert-info">
          <AlertTriangle size={20} className="me-2" />
          Please select a project to view budget tracking and EVM analysis.
        </div>
      );
    }

    const { evm } = budgetData;

    return (
      <>
        {/* EVM Core Metrics */}
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3">Earned Value Management (EVM) Metrics</h5>
          </div>

          {renderEVMCard(
            'Planned Value (PV)',
            formatCurrency(evm.plannedValue),
            Target,
            'info',
            'Budgeted cost of work scheduled'
          )}

          {renderEVMCard(
            'Earned Value (EV)',
            formatCurrency(evm.earnedValue),
            CheckCircle,
            'success',
            'Budgeted cost of work performed'
          )}

          {renderEVMCard(
            'Actual Cost (AC)',
            formatCurrency(evm.actualCost),
            DollarSign,
            'warning',
            'Actual cost of work performed'
          )}

          {renderEVMCard(
            'Budget at Completion',
            formatCurrency(budgetData.totalBudget),
            BarChart3,
            'primary',
            'Total project budget'
          )}
        </div>

        {/* Variance Analysis */}
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3">Variance Analysis</h5>
          </div>

          {renderEVMCard(
            'Cost Variance (CV)',
            formatCurrency(evm.costVariance),
            evm.costVariance >= 0 ? TrendingUp : TrendingDown,
            evm.costVariance >= 0 ? 'success' : 'danger',
            evm.status.costStatus
          )}

          {renderEVMCard(
            'Schedule Variance (SV)',
            formatCurrency(evm.scheduleVariance),
            evm.scheduleVariance >= 0 ? TrendingUp : TrendingDown,
            evm.scheduleVariance >= 0 ? 'success' : 'danger',
            evm.status.scheduleStatus
          )}

          {renderEVMCard(
            'Variance at Completion',
            formatCurrency(evm.varianceAtCompletion),
            evm.varianceAtCompletion >= 0 ? CheckCircle : AlertTriangle,
            evm.varianceAtCompletion >= 0 ? 'success' : 'danger',
            'Projected final variance'
          )}
        </div>

        {/* Performance Indices */}
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3">Performance Indices</h5>
          </div>

          {renderEVMCard(
            'Cost Performance Index',
            evm.costPerformanceIndex.toFixed(3),
            Activity,
            evm.costPerformanceIndex >= 1 ? 'success' : 'danger',
            `${evm.costPerformanceIndex >= 1 ? 'Efficient' : 'Over Budget'}`
          )}

          {renderEVMCard(
            'Schedule Performance Index',
            evm.schedulePerformanceIndex.toFixed(3),
            Activity,
            evm.schedulePerformanceIndex >= 1 ? 'success' : 'danger',
            `${evm.schedulePerformanceIndex >= 1 ? 'On Track' : 'Behind Schedule'}`
          )}

          {renderEVMCard(
            'To-Complete Performance Index',
            evm.toCompletePerformanceIndex.toFixed(3),
            Target,
            evm.toCompletePerformanceIndex <= 1 ? 'success' : 'warning',
            'Required efficiency to complete'
          )}
        </div>

        {/* Forecasts */}
        <div className="row mb-4">
          <div className="col-12">
            <h5 className="mb-3">Cost Forecasts</h5>
          </div>

          {renderEVMCard(
            'Estimate at Completion',
            formatCurrency(evm.estimateAtCompletion),
            PieChart,
            'info',
            'Projected total cost'
          )}

          {renderEVMCard(
            'Estimate to Complete',
            formatCurrency(evm.estimateToComplete),
            TrendingUp,
            'warning',
            'Remaining cost to complete'
          )}
        </div>

        {/* Progress Bars */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h5 className="mb-0">Project Progress</h5>
              </div>
              <div className="card-body">
                {/* Planned Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Planned Progress</span>
                    <span className="fw-semibold">{budgetData.plannedPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="progress" style={{ height: '20px' }}>
                    <div
                      className="progress-bar bg-info"
                      role="progressbar"
                      style={{ width: `${budgetData.plannedPercentage}%` }}
                    >
                      {budgetData.plannedPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Actual Progress */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Actual Progress</span>
                    <span className="fw-semibold">{budgetData.actualPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="progress" style={{ height: '20px' }}>
                    <div
                      className={`progress-bar bg-${budgetData.actualPercentage >= budgetData.plannedPercentage ? 'success' : 'warning'}`}
                      role="progressbar"
                      style={{ width: `${budgetData.actualPercentage}%` }}
                    >
                      {budgetData.actualPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Budget Utilization */}
                <div className="mb-0">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Budget Utilization</span>
                    <span className="fw-semibold">
                      {((budgetData.totalActual / budgetData.totalBudget) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '20px' }}>
                    <div
                      className={`progress-bar bg-${(budgetData.totalActual / budgetData.totalBudget) <= 1 ? 'primary' : 'danger'}`}
                      role="progressbar"
                      style={{ width: `${Math.min((budgetData.totalActual / budgetData.totalBudget) * 100, 100)}%` }}
                    >
                      {((budgetData.totalActual / budgetData.totalBudget) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Budget Tracking & EVM Analysis</h2>
          <p className="text-muted mb-0">Monitor budget performance and cost forecasts</p>
        </div>
      </div>

      {/* Project Selector */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Select Project</label>
              <select
                className="form-select form-select-lg"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">-- Select a Project --</option>
                {allProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedBudget && (
              <div className="col-md-6">
                <div className="alert alert-info mb-0 mt-3 mt-md-0">
                  <strong>Budget Version:</strong> {selectedBudget.version || 1}
                  {selectedBudget.isApproved && (
                    <span className="badge bg-success ms-2">Approved</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {renderSummary()}
    </div>
  );
};

export default BudgetTrackingPage;
