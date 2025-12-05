import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { loadData, saveData, loadDataFromDexie, generateId, getDefaultProject, getCurrentProject, saveCurrentProjectId, getCurrentProjectId } from '../utils/dataManager';
import { useAuth } from './AuthContext';
import db, {
  addProject as addDexieProject,
  updateProject as updateDexieProject,
  deleteProject as deleteDexieProject,
  addInvoice as addDexieInvoice,
  updateInvoice as updateDexieInvoice,
  deleteInvoice as deleteDexieInvoice,
  addQuotation as addDexieQuotation,
  updateQuotation as updateDexieQuotation,
  deleteQuotation as deleteDexieQuotation,
  addPaymentIn as addDexiePaymentIn,
  updatePaymentIn as updateDexiePaymentIn,
  deletePaymentIn as deleteDexiePaymentIn,
  addPaymentOut as addDexiePaymentOut,
  updatePaymentOut as updateDexiePaymentOut,
  deletePaymentOut as deleteDexiePaymentOut,
  addDepartment as addDexieDepartment,
  updateDepartment as updateDexieDepartment,
  deleteDepartment as deleteDexieDepartment,
  addParty as addDexieParty,
  updateParty as updateDexieParty,
  deleteParty as deleteDexieParty,
  getParties as getDexieParties,
  getPartiesByType as getDexiePartiesByType,
  saveSettings as saveDexieSettings,
  addUser as addDexieUser,
  updateUser as updateDexieUser,
  deleteUser as deleteDexieUser,
  addSupplierTransaction as addDexieSupplierTransaction,
  updateSupplierTransaction as updateDexieSupplierTransaction,
  deleteSupplierTransaction as deleteDexieSupplierTransaction,
  getSupplierTransactions as getDexieSupplierTransactions,
  getSupplierTransactionsBySupplier as getDexieSupplierTransactionsBySupplier,
  getSupplierTransactionsByProject as getDexieSupplierTransactionsByProject,
  getSupplierTransactionsBySupplierAndProject as getDexieSupplierTransactionsBySupplierAndProject,
  deleteSupplierTransactionsByProject as deleteDexieSupplierTransactionsByProject,
  // Material/Inventory Management
  addMaterial as addDexieMaterial,
  updateMaterial as updateDexieMaterial,
  deleteMaterial as deleteDexieMaterial,
  addStockTransaction as addDexieStockTransaction,
  updateStockTransaction as updateDexieStockTransaction,
  deleteStockTransaction as deleteDexieStockTransaction,
  addPurchaseOrder as addDexiePurchaseOrder,
  updatePurchaseOrder as updateDexiePurchaseOrder,
  deletePurchaseOrder as deleteDexiePurchaseOrder,
  addMaterialAllocation as addDexieMaterialAllocation,
  updateMaterialAllocation as updateDexieMaterialAllocation,
  deleteMaterialAllocation as deleteDexieMaterialAllocation,
  // Labor/Time Tracking & Payroll
  addWorker as addDexieWorker,
  updateWorker as updateDexieWorker,
  deleteWorker as deleteDexieWorker,
  addAttendance as addDexieAttendance,
  updateAttendance as updateDexieAttendance,
  deleteAttendance as deleteDexieAttendance,
  addTimeSheet as addDexieTimeSheet,
  updateTimeSheet as updateDexieTimeSheet,
  deleteTimeSheet as deleteDexieTimeSheet,
  addPayroll as addDexiePayroll,
  updatePayroll as updateDexiePayroll,
  deletePayroll as deleteDexiePayroll,
  addLeave as addDexieLeave,
  updateLeave as updateDexieLeave,
  deleteLeave as deleteDexieLeave,
  addWorkerAdvance as addDexieWorkerAdvance,
  updateWorkerAdvance as updateDexieWorkerAdvance,
  deleteWorkerAdvance as deleteDexieWorkerAdvance,
  // Budget Planning & Forecasting
  addProjectBudget as addDexieProjectBudget,
  updateProjectBudget as updateDexieProjectBudget,
  deleteProjectBudget as deleteDexieProjectBudget,
  addBudgetLineItem as addDexieBudgetLineItem,
  updateBudgetLineItem as updateDexieBudgetLineItem,
  deleteBudgetLineItem as deleteDexieBudgetLineItem,
  addBudgetAlert as addDexieBudgetAlert,
  updateBudgetAlert as updateDexieBudgetAlert,
  deleteBudgetAlert as deleteDexieBudgetAlert,
  addBudgetRevision as addDexieBudgetRevision,
  updateBudgetRevision as updateDexieBudgetRevision,
  deleteBudgetRevision as deleteDexieBudgetRevision,
  addCostForecast as addDexieCostForecast,
  updateCostForecast as updateDexieCostForecast,
  deleteCostForecast as deleteDexieCostForecast,
  // Retention Management
  addRetentionPolicy as addDexieRetentionPolicy,
  updateRetentionPolicy as updateDexieRetentionPolicy,
  deleteRetentionPolicy as deleteDexieRetentionPolicy,
  addRetentionAccount as addDexieRetentionAccount,
  updateRetentionAccount as updateDexieRetentionAccount,
  deleteRetentionAccount as deleteDexieRetentionAccount,
  addRetentionRelease as addDexieRetentionRelease,
  updateRetentionRelease as updateDexieRetentionRelease,
  deleteRetentionRelease as deleteDexieRetentionRelease,
  addRetentionAlert as addDexieRetentionAlert,
  updateRetentionAlert as updateDexieRetentionAlert,
  deleteRetentionAlert as deleteDexieRetentionAlert,
  // Change Orders
  addChangeOrder as addDexieChangeOrder,
  updateChangeOrder as updateDexieChangeOrder,
  deleteChangeOrder as deleteDexieChangeOrder,
  addChangeOrderLineItem as addDexieChangeOrderLineItem,
  updateChangeOrderLineItem as updateDexieChangeOrderLineItem,
  deleteChangeOrderLineItem as deleteDexieChangeOrderLineItem,
  addChangeOrderHistory as addDexieChangeOrderHistory,
  updateChangeOrderHistory as updateDexieChangeOrderHistory,
  deleteChangeOrderHistory as deleteDexieChangeOrderHistory,
  addChangeOrderImpact as addDexieChangeOrderImpact,
  updateChangeOrderImpact as updateDexieChangeOrderImpact,
  deleteChangeOrderImpact as deleteDexieChangeOrderImpact,
  // Document Management
  addDocument as addDexieDocument,
  updateDocument as updateDexieDocument,
  deleteDocument as deleteDexieDocument,
  addDocumentVersion as addDexieDocumentVersion,
  updateDocumentVersion as updateDexieDocumentVersion,
  deleteDocumentVersion as deleteDexieDocumentVersion,
  addDocumentSharing as addDexieDocumentSharing,
  updateDocumentSharing as updateDexieDocumentSharing,
  deleteDocumentSharing as deleteDexieDocumentSharing,
  addDocumentActivity as addDexieDocumentActivity,
  updateDocumentActivity as updateDexieDocumentActivity,
  deleteDocumentActivity as deleteDexieDocumentActivity
} from '../db/dexieDB';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const [data, setData] = useState(loadData());
  const [loading, setLoading] = useState(true);
  const [dexieLoaded, setDexieLoaded] = useState(false);

  // Load data from Dexie when user is authenticated
  useEffect(() => {
    const loadDexieData = async () => {
      if (user && user.id) {
        setLoading(true);
        try {
          console.log('🔄 Loading data for user:', { id: user.id, username: user.username, role: user.role });
          const dexieData = await loadDataFromDexie(user.id, user.role);
          setData(dexieData);
          setDexieLoaded(true);
          console.log('✅ Data loaded successfully');
        } catch (error) {
          console.error('❌ Error loading Dexie data:', error);
          // Fallback to localStorage
          setData(loadData());
        } finally {
          setLoading(false);
        }
      } else {
        // No user, use localStorage
        setData(loadData());
        setLoading(false);
      }
    };

    loadDexieData();
  }, [user?.id, user?.role]);

  // Get current project
  const currentProject = useMemo(() => {
    if (!data.projects || data.projects.length === 0) return null;
    const projectId = data.currentProjectId || getCurrentProjectId();
    return data.projects.find(p => p.id === projectId) || data.projects[0];
  }, [data.projects, data.currentProjectId]);

  // Auto-save to localStorage for backward compatibility
  useEffect(() => {
    if (!loading && dexieLoaded) {
      saveData(data);
    }
  }, [data, loading, dexieLoaded]);

  // Projects
  const addProject = async (name, totalCommittedAmount, description = '', milestones = []) => {
    const newProject = getDefaultProject(name, totalCommittedAmount);
    newProject.description = description;
    newProject.milestones = milestones;
    newProject.userId = user?.id;
    newProject.synced = false;
    newProject.lastUpdated = new Date().toISOString();

    try {
      // Add to Dexie
      await addDexieProject(newProject, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: [...prev.projects, newProject],
        currentProjectId: newProject.id
      }));

      saveCurrentProjectId(newProject.id);
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      return null;
    }
  };

  const updateProject = async (projectId, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexieProject(projectId, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === projectId ? { ...p, ...updatedData } : p
        )
      }));
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      // Delete from Dexie
      await deleteDexieProject(projectId);

      // Update local state
      setData(prev => {
        const newProjects = prev.projects.filter(p => p.id !== projectId);
        const newCurrentId = prev.currentProjectId === projectId
          ? (newProjects.length > 0 ? newProjects[0].id : null)
          : prev.currentProjectId;

        saveCurrentProjectId(newCurrentId);

        return {
          ...prev,
          projects: newProjects,
          currentProjectId: newCurrentId
        };
      });
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const setCurrentProject = (projectId) => {
    saveCurrentProjectId(projectId);
    setData(prev => ({
      ...prev,
      currentProjectId: projectId
    }));
  };

  // Departments (for current project)
  const addDepartment = async (name) => {
    if (!currentProject) return null;

    const newDepartment = {
      id: generateId(),
      name,
      isDefault: false,
      projectId: currentProject.id,
      userId: user?.id,
      synced: false,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Add to Dexie
      await addDexieDepartment(newDepartment, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? { ...p, departments: [...(p.departments || []), newDepartment], updatedAt: new Date().toISOString() }
            : p
        )
      }));

      return newDepartment;
    } catch (error) {
      console.error('Error adding department:', error);
      return null;
    }
  };

  const deleteDepartment = async (id) => {
    if (!currentProject) return;

    try {
      // Delete from Dexie
      await deleteDexieDepartment(id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? {
                ...p,
                departments: (p.departments || []).filter(d => d.id !== id && !d.isDefault),
                updatedAt: new Date().toISOString()
              }
            : p
        )
      }));
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  // Payments In (for current project)
  const addPaymentIn = async (payment) => {
    if (!currentProject) return null;

    const newPayment = {
      id: generateId(),
      ...payment,
      projectId: currentProject.id,
      userId: user?.id,
      date: payment.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: user?.username || 'Unknown',
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'Unknown',
      synced: false,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Add to Dexie
      await addDexiePaymentIn(newPayment, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? { ...p, paymentsIn: [...(p.paymentsIn || []), newPayment], updatedAt: new Date().toISOString() }
            : p
        )
      }));

      return newPayment;
    } catch (error) {
      console.error('Error adding payment in:', error);
      return null;
    }
  };

  const updatePaymentIn = async (id, updates) => {
    if (!currentProject) return;

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'Unknown',
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexiePaymentIn(id, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? {
                ...p,
                paymentsIn: (p.paymentsIn || []).map(payment =>
                  payment.id === id ? { ...payment, ...updatedData } : payment
                ),
                updatedAt: new Date().toISOString()
              }
            : p
        )
      }));
    } catch (error) {
      console.error('Error updating payment in:', error);
    }
  };

  const deletePaymentIn = async (id) => {
    if (!currentProject) return;

    try {
      // Delete from Dexie
      await deleteDexiePaymentIn(id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? { ...p, paymentsIn: (p.paymentsIn || []).filter(payment => payment.id !== id), updatedAt: new Date().toISOString() }
            : p
        )
      }));
    } catch (error) {
      console.error('Error deleting payment in:', error);
    }
  };

  // Payments Out (for current project)
  const addPaymentOut = async (payment) => {
    if (!currentProject) return null;

    const newPayment = {
      id: generateId(),
      ...payment,
      projectId: currentProject.id,
      userId: user?.id,
      date: payment.date || new Date().toISOString(),
      status: user?.role === 'admin' ? 'approved' : 'pending', // Auto-approve for admin, pending for users
      approvalStatus: user?.role === 'admin' ? 'approved' : 'pending',
      approvedBy: user?.role === 'admin' ? user?.username : null,
      approvedAt: user?.role === 'admin' ? new Date().toISOString() : null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      createdBy: user?.username || 'Unknown',
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'Unknown',
      synced: false,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Add to Dexie
      await addDexiePaymentOut(newPayment, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? { ...p, paymentsOut: [...(p.paymentsOut || []), newPayment], updatedAt: new Date().toISOString() }
            : p
        )
      }));

      return newPayment;
    } catch (error) {
      console.error('Error adding payment out:', error);
      return null;
    }
  };

  const updatePaymentOut = async (id, updates) => {
    if (!currentProject) return;

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'Unknown',
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexiePaymentOut(id, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? {
                ...p,
                paymentsOut: (p.paymentsOut || []).map(payment =>
                  payment.id === id ? { ...payment, ...updatedData } : payment
                ),
                updatedAt: new Date().toISOString()
              }
            : p
        )
      }));
    } catch (error) {
      console.error('Error updating payment out:', error);
    }
  };

  const deletePaymentOut = async (id) => {
    if (!currentProject) return;

    try {
      // Delete from Dexie
      await deleteDexiePaymentOut(id);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? { ...p, paymentsOut: (p.paymentsOut || []).filter(payment => payment.id !== id), updatedAt: new Date().toISOString() }
            : p
        )
      }));
    } catch (error) {
      console.error('Error deleting payment out:', error);
    }
  };

  // Approve Payment Out (Admin only)
  const approvePaymentOut = async (id) => {
    if (!currentProject || user?.role !== 'admin') return;

    try {
      const approvalData = {
        approvalStatus: 'approved',
        status: 'approved',
        approvedBy: user?.username,
        approvedAt: new Date().toISOString(),
        rejectionReason: null,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username,
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexiePaymentOut(id, approvalData);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? {
                ...p,
                paymentsOut: (p.paymentsOut || []).map(payment =>
                  payment.id === id ? { ...payment, ...approvalData } : payment
                ),
                updatedAt: new Date().toISOString()
              }
            : p
        )
      }));
    } catch (error) {
      console.error('Error approving payment out:', error);
    }
  };

  // Reject Payment Out (Admin only)
  const rejectPaymentOut = async (id, rejectionReason) => {
    if (!currentProject || user?.role !== 'admin') return;

    try {
      const rejectionData = {
        approvalStatus: 'rejected',
        status: 'rejected',
        rejectionReason: rejectionReason,
        rejectedBy: user?.username,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username,
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexiePaymentOut(id, rejectionData);

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? {
                ...p,
                paymentsOut: (p.paymentsOut || []).map(payment =>
                  payment.id === id ? { ...payment, ...rejectionData } : payment
                ),
                updatedAt: new Date().toISOString()
              }
            : p
        )
      }));
    } catch (error) {
      console.error('Error rejecting payment out:', error);
    }
  };

  // Bulk add payments out (for import)
  const bulkAddPaymentsOut = async (payments) => {
    if (!currentProject) return [];

    const newPayments = payments.map(payment => ({
      id: generateId(),
      ...payment,
      projectId: currentProject.id,
      userId: user?.id,
      date: payment.date || new Date().toISOString(),
      status: user?.role === 'admin' ? 'approved' : 'pending',
      approvalStatus: user?.role === 'admin' ? 'approved' : 'pending',
      approvedBy: user?.role === 'admin' ? user?.username : null,
      approvedAt: user?.role === 'admin' ? new Date().toISOString() : null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
      createdBy: user?.username || 'Unknown',
      updatedAt: new Date().toISOString(),
      updatedBy: user?.username || 'Unknown',
      synced: false,
      lastUpdated: new Date().toISOString()
    }));

    try {
      // Add all to Dexie
      for (const payment of newPayments) {
        await addDexiePaymentOut(payment, user?.id);
      }

      // Update local state
      setData(prev => ({
        ...prev,
        projects: prev.projects.map(p =>
          p.id === currentProject.id
            ? { ...p, paymentsOut: [...(p.paymentsOut || []), ...newPayments], updatedAt: new Date().toISOString() }
            : p
        )
      }));

      return newPayments;
    } catch (error) {
      console.error('Error bulk adding payments out:', error);
      return [];
    }
  };

  // Users
  const addUser = async (userData) => {
    const newUser = {
      id: generateId(),
      username: userData.username,
      password: userData.password,
      role: userData.role || 'user',
      name: userData.name,
      createdAt: new Date().toISOString(),
      synced: false,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Add to Dexie
      await addDexieUser(newUser);

      // Update local state
      setData(prev => ({
        ...prev,
        users: [...(prev.users || []), newUser]
      }));

      return newUser;
    } catch (error) {
      console.error('Error adding user:', error);
      return null;
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexieUser(userId, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        users: (prev.users || []).map(u =>
          u.id === userId ? { ...u, ...updatedData } : u
        )
      }));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      // Delete from Dexie
      await deleteDexieUser(userId);

      // Update local state
      setData(prev => ({
        ...prev,
        users: (prev.users || []).filter(u => u.id !== userId)
      }));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Company Profile
  const updateCompanyProfile = async (profileData) => {
    try {
      const updatedSettings = {
        ...data.settings,
        companyProfile: {
          ...profileData,
          updatedAt: new Date().toISOString()
        },
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save to Dexie
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        settings: updatedSettings
      }));
    } catch (error) {
      console.error('Error updating company profile:', error);
    }
  };

  // Signature Settings
  const updateSignatureSettings = async (signatureData) => {
    try {
      const updatedSettings = {
        ...data.settings,
        signatureSettings: {
          ...signatureData,
          updatedAt: new Date().toISOString()
        },
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save to Dexie
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        settings: updatedSettings
      }));
    } catch (error) {
      console.error('Error updating signature settings:', error);
    }
  };

  // Invoice Settings
  const updateInvoiceSettings = async (invoiceSettingsData) => {
    try {
      const updatedSettings = {
        ...data.settings,
        invoiceSettings: {
          ...invoiceSettingsData,
          updatedAt: new Date().toISOString()
        },
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save to Dexie
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        settings: updatedSettings
      }));
    } catch (error) {
      console.error('Error updating invoice settings:', error);
    }
  };

  // Quotation Settings
  const updateQuotationSettings = async (quotationSettingsData) => {
    try {
      const updatedSettings = {
        ...data.settings,
        quotationSettings: {
          ...quotationSettingsData,
          updatedAt: new Date().toISOString()
        },
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save to Dexie
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        settings: updatedSettings
      }));
    } catch (error) {
      console.error('Error updating quotation settings:', error);
    }
  };

  // Measurement Units
  const addMeasurementUnit = async (unit) => {
    try {
      // Default measurement units that should always be present
      const defaultUnits = ['sq.ft', 'kg', 'piece', 'meter', 'ft'];
      const currentUnits = data.settings?.measurementUnits || defaultUnits;

      // Check if unit already exists
      if (currentUnits.includes(unit)) {
        return false;
      }

      const updatedSettings = {
        ...data.settings,
        measurementUnits: [...currentUnits, unit],
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save to Dexie
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        settings: updatedSettings
      }));

      return true;
    } catch (error) {
      console.error('Error adding measurement unit:', error);
      return false;
    }
  };

  const removeMeasurementUnit = async (unit) => {
    try {
      // Default measurement units that should always be present
      const defaultUnits = ['sq.ft', 'kg', 'piece', 'meter', 'ft'];
      const currentUnits = data.settings?.measurementUnits || defaultUnits;

      // Prevent removing default units
      if (defaultUnits.includes(unit)) {
        console.warn('Cannot remove default measurement unit:', unit);
        return false;
      }

      const updatedSettings = {
        ...data.settings,
        measurementUnits: currentUnits.filter(u => u !== unit),
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save to Dexie
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        settings: updatedSettings
      }));

      return true;
    } catch (error) {
      console.error('Error removing measurement unit:', error);
      return false;
    }
  };

  // Invoices
  const addInvoice = async (invoiceData) => {
    const newInvoice = {
      id: generateId(),
      ...invoiceData,
      userId: user?.id,
      createdAt: new Date().toISOString(),
      createdBy: user?.username || 'Unknown',
      synced: false,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Add to Dexie
      await addDexieInvoice(newInvoice, user?.id);

      // Update invoice settings to increment next number
      const currentSettings = data.settings?.invoiceSettings || { prefix: 'INV', nextNumber: 1 };
      const nextNumber = currentSettings.nextNumber + 1;

      const updatedSettings = {
        ...data.settings,
        invoiceSettings: {
          ...currentSettings,
          nextNumber
        },
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save updated settings
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        invoices: [...(prev.invoices || []), newInvoice],
        settings: updatedSettings
      }));

      return newInvoice;
    } catch (error) {
      console.error('Error adding invoice:', error);
      return null;
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'Unknown',
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexieInvoice(id, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        invoices: (prev.invoices || []).map(inv =>
          inv.id === id ? { ...inv, ...updatedData } : inv
        )
      }));
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const deleteInvoice = async (id) => {
    try {
      // Delete from Dexie
      await deleteDexieInvoice(id);

      // Update local state
      setData(prev => ({
        ...prev,
        invoices: (prev.invoices || []).filter(inv => inv.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  // Quotations
  const addQuotation = async (quotationData) => {
    const newQuotation = {
      id: generateId(),
      ...quotationData,
      userId: user?.id,
      createdAt: new Date().toISOString(),
      createdBy: user?.username || 'Unknown',
      synced: false,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Add to Dexie
      await addDexieQuotation(newQuotation, user?.id);

      // Update quotation settings to increment next number
      const currentSettings = data.settings?.quotationSettings || { prefix: 'QUO', nextNumber: 1 };
      const nextNumber = currentSettings.nextNumber + 1;

      const updatedSettings = {
        ...data.settings,
        quotationSettings: {
          ...currentSettings,
          nextNumber
        },
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Save updated settings
      await saveDexieSettings(updatedSettings, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        quotations: [...(prev.quotations || []), newQuotation],
        settings: updatedSettings
      }));

      return newQuotation;
    } catch (error) {
      console.error('Error adding quotation:', error);
      return null;
    }
  };

  const updateQuotation = async (id, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'Unknown',
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Update in Dexie
      await updateDexieQuotation(id, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        quotations: (prev.quotations || []).map(quo =>
          quo.id === id ? { ...quo, ...updatedData } : quo
        )
      }));
    } catch (error) {
      console.error('Error updating quotation:', error);
    }
  };

  const deleteQuotation = async (id) => {
    try {
      // Delete from Dexie
      await deleteDexieQuotation(id);

      // Update local state
      setData(prev => ({
        ...prev,
        quotations: (prev.quotations || []).filter(quo => quo.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting quotation:', error);
    }
  };

  // Parties (Customers and Suppliers)
  const addParty = async (partyData) => {
    try {
      const newParty = {
        ...partyData,
        id: generateId(),
        userId: user?.id,
        createdBy: user?.username || user?.name || user?.email || 'Unknown',
        createdByUserId: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
        lastUpdated: new Date().toISOString()
      };

      // Add to Dexie
      await addDexieParty(newParty, user?.id);

      // Update local state
      setData(prev => ({
        ...prev,
        parties: [...(prev.parties || []), newParty]
      }));

      return newParty;
    } catch (error) {
      console.error('Error adding party:', error);
      throw error;
    }
  };

  const updateParty = async (id, updatedData) => {
    try {
      // Update in Dexie
      await updateDexieParty(id, updatedData);

      // Update local state
      setData(prev => ({
        ...prev,
        parties: (prev.parties || []).map(party =>
          party.id === id ? { ...party, ...updatedData, updatedAt: new Date().toISOString() } : party
        )
      }));
    } catch (error) {
      console.error('Error updating party:', error);
      throw error;
    }
  };

  const deleteParty = async (id) => {
    try {
      // Delete from Dexie
      await deleteDexieParty(id);

      // Update local state
      setData(prev => ({
        ...prev,
        parties: (prev.parties || []).filter(party => party.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting party:', error);
      throw error;
    }
  };

  // Supplier Transactions
  const addSupplierTransaction = async (transactionData) => {
    try {
      const newTransaction = {
        ...transactionData,
        id: generateId(),
        userId: user?.id,
        entryBy: user?.username || user?.email || 'Unknown',
        entryDateTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
        lastUpdated: new Date().toISOString()
      };
      await addDexieSupplierTransaction(newTransaction, user?.id);
      setData(prev => ({
        ...prev,
        supplierTransactions: [...(prev.supplierTransactions || []), newTransaction]
      }));
      return newTransaction;
    } catch (error) {
      console.error('Error adding supplier transaction:', error);
      throw error;
    }
  };

  const updateSupplierTransaction = async (id, updatedData) => {
    try {
      await updateDexieSupplierTransaction(id, updatedData);
      setData(prev => ({
        ...prev,
        supplierTransactions: (prev.supplierTransactions || []).map(transaction =>
          transaction.id === id ? { ...transaction, ...updatedData } : transaction
        )
      }));
    } catch (error) {
      console.error('Error updating supplier transaction:', error);
      throw error;
    }
  };

  const deleteSupplierTransaction = async (id) => {
    try {
      await deleteDexieSupplierTransaction(id);
      setData(prev => ({
        ...prev,
        supplierTransactions: (prev.supplierTransactions || []).filter(transaction => transaction.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting supplier transaction:', error);
      throw error;
    }
  };

  const getSupplierTransactionsBySupplier = async (supplierId) => {
    try {
      return await getDexieSupplierTransactionsBySupplier(supplierId);
    } catch (error) {
      console.error('Error getting supplier transactions:', error);
      return [];
    }
  };

  const getSupplierTransactionsByProject = async (projectId) => {
    try {
      return await getDexieSupplierTransactionsByProject(projectId);
    } catch (error) {
      console.error('Error getting supplier transactions by project:', error);
      return [];
    }
  };

  const getSupplierTransactionsBySupplierAndProject = async (supplierId, projectId) => {
    try {
      return await getDexieSupplierTransactionsBySupplierAndProject(supplierId, projectId);
    } catch (error) {
      console.error('Error getting supplier transactions by supplier and project:', error);
      return [];
    }
  };

  // MATERIAL/INVENTORY MANAGEMENT
  // Materials
  const addMaterial = async (materialData) => {
    try {
      const now = new Date().toISOString();
      const newMaterial = {
        ...materialData,
        id: generateId(),
        userId: user?.id,
        createdBy: user?.username || 'Unknown',
        createdAt: now,
        updatedBy: user?.username || 'Unknown',
        updatedAt: now,
        synced: false,
        lastUpdated: now
      };
      await addDexieMaterial(newMaterial, user?.id);
      setData(prev => ({ ...prev, materials: [...(prev.materials || []), newMaterial] }));
      return newMaterial;
    } catch (error) {
      console.error('Error adding material:', error);
      throw error;
    }
  };

  const updateMaterial = async (id, updates) => {
    try {
      const now = new Date().toISOString();
      const updatedData = {
        ...updates,
        updatedBy: user?.username || 'Unknown',
        updatedAt: now,
        synced: false,
        lastUpdated: now
      };
      await updateDexieMaterial(id, updatedData);
      setData(prev => ({ ...prev, materials: (prev.materials || []).map(m => m.id === id ? { ...m, ...updatedData } : m) }));
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  };

  const deleteMaterial = async (id) => {
    try {
      await deleteDexieMaterial(id);
      setData(prev => ({ ...prev, materials: (prev.materials || []).filter(m => m.id !== id) }));
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  };

  // Stock Transactions
  const addStockTransaction = async (transactionData) => {
    try {
      const newTransaction = { ...transactionData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieStockTransaction(newTransaction, user?.id);
      setData(prev => ({ ...prev, stockTransactions: [...(prev.stockTransactions || []), newTransaction] }));
      return newTransaction;
    } catch (error) {
      console.error('Error adding stock transaction:', error);
      throw error;
    }
  };

  const updateStockTransaction = async (id, updates) => {
    try {
      await updateDexieStockTransaction(id, updates);
      setData(prev => ({ ...prev, stockTransactions: (prev.stockTransactions || []).map(t => t.id === id ? { ...t, ...updates } : t) }));
    } catch (error) {
      console.error('Error updating stock transaction:', error);
      throw error;
    }
  };

  const deleteStockTransaction = async (id) => {
    try {
      await deleteDexieStockTransaction(id);
      setData(prev => ({ ...prev, stockTransactions: (prev.stockTransactions || []).filter(t => t.id !== id) }));
    } catch (error) {
      console.error('Error deleting stock transaction:', error);
      throw error;
    }
  };

  // Purchase Orders
  const addPurchaseOrder = async (poData) => {
    try {
      const newPO = { ...poData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexiePurchaseOrder(newPO, user?.id);
      setData(prev => ({ ...prev, purchaseOrders: [...(prev.purchaseOrders || []), newPO] }));
      return newPO;
    } catch (error) {
      console.error('Error adding purchase order:', error);
      throw error;
    }
  };

  const updatePurchaseOrder = async (id, updates) => {
    try {
      await updateDexiePurchaseOrder(id, updates);
      setData(prev => ({ ...prev, purchaseOrders: (prev.purchaseOrders || []).map(po => po.id === id ? { ...po, ...updates } : po) }));
    } catch (error) {
      console.error('Error updating purchase order:', error);
      throw error;
    }
  };

  const deletePurchaseOrder = async (id) => {
    try {
      await deleteDexiePurchaseOrder(id);
      setData(prev => ({ ...prev, purchaseOrders: (prev.purchaseOrders || []).filter(po => po.id !== id) }));
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  };

  // Material Allocation
  const addMaterialAllocation = async (allocationData) => {
    try {
      const newAllocation = { ...allocationData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieMaterialAllocation(newAllocation, user?.id);
      setData(prev => ({ ...prev, materialAllocation: [...(prev.materialAllocation || []), newAllocation] }));
      return newAllocation;
    } catch (error) {
      console.error('Error adding material allocation:', error);
      throw error;
    }
  };

  const updateMaterialAllocation = async (id, updates) => {
    try {
      await updateDexieMaterialAllocation(id, updates);
      setData(prev => ({ ...prev, materialAllocation: (prev.materialAllocation || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating material allocation:', error);
      throw error;
    }
  };

  const deleteMaterialAllocation = async (id) => {
    try {
      await deleteDexieMaterialAllocation(id);
      setData(prev => ({ ...prev, materialAllocation: (prev.materialAllocation || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting material allocation:', error);
      throw error;
    }
  };

  // LABOR/TIME TRACKING & PAYROLL
  // Workers
  const addWorker = async (workerData) => {
    try {
      const newWorker = { ...workerData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieWorker(newWorker, user?.id);
      setData(prev => ({ ...prev, workers: [...(prev.workers || []), newWorker] }));
      return newWorker;
    } catch (error) {
      console.error('Error adding worker:', error);
      throw error;
    }
  };

  const updateWorker = async (id, updates) => {
    try {
      await updateDexieWorker(id, updates);
      setData(prev => ({ ...prev, workers: (prev.workers || []).map(w => w.id === id ? { ...w, ...updates } : w) }));
    } catch (error) {
      console.error('Error updating worker:', error);
      throw error;
    }
  };

  const deleteWorker = async (id) => {
    try {
      await deleteDexieWorker(id);
      setData(prev => ({ ...prev, workers: (prev.workers || []).filter(w => w.id !== id) }));
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw error;
    }
  };

  // Attendance
  const addAttendance = async (attendanceData) => {
    try {
      const newAttendance = { ...attendanceData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieAttendance(newAttendance, user?.id);
      setData(prev => ({ ...prev, attendance: [...(prev.attendance || []), newAttendance] }));
      return newAttendance;
    } catch (error) {
      console.error('Error adding attendance:', error);
      throw error;
    }
  };

  const updateAttendance = async (id, updates) => {
    try {
      await updateDexieAttendance(id, updates);
      setData(prev => ({ ...prev, attendance: (prev.attendance || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  };

  const deleteAttendance = async (id) => {
    try {
      await deleteDexieAttendance(id);
      setData(prev => ({ ...prev, attendance: (prev.attendance || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  };

  // TimeSheets
  const addTimeSheet = async (timeSheetData) => {
    try {
      const newTimeSheet = { ...timeSheetData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieTimeSheet(newTimeSheet, user?.id);
      setData(prev => ({ ...prev, timeSheets: [...(prev.timeSheets || []), newTimeSheet] }));
      return newTimeSheet;
    } catch (error) {
      console.error('Error adding timesheet:', error);
      throw error;
    }
  };

  const updateTimeSheet = async (id, updates) => {
    try {
      await updateDexieTimeSheet(id, updates);
      setData(prev => ({ ...prev, timeSheets: (prev.timeSheets || []).map(t => t.id === id ? { ...t, ...updates } : t) }));
    } catch (error) {
      console.error('Error updating timesheet:', error);
      throw error;
    }
  };

  const deleteTimeSheet = async (id) => {
    try {
      await deleteDexieTimeSheet(id);
      setData(prev => ({ ...prev, timeSheets: (prev.timeSheets || []).filter(t => t.id !== id) }));
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      throw error;
    }
  };

  // Payroll
  const addPayroll = async (payrollData) => {
    try {
      const newPayroll = { ...payrollData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexiePayroll(newPayroll, user?.id);
      setData(prev => ({ ...prev, payroll: [...(prev.payroll || []), newPayroll] }));
      return newPayroll;
    } catch (error) {
      console.error('Error adding payroll:', error);
      throw error;
    }
  };

  const updatePayroll = async (id, updates) => {
    try {
      await updateDexiePayroll(id, updates);
      setData(prev => ({ ...prev, payroll: (prev.payroll || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  };

  const deletePayroll = async (id) => {
    try {
      await deleteDexiePayroll(id);
      setData(prev => ({ ...prev, payroll: (prev.payroll || []).filter(p => p.id !== id) }));
    } catch (error) {
      console.error('Error deleting payroll:', error);
      throw error;
    }
  };

  // Leave Management
  const addLeave = async (leaveData) => {
    try {
      const newLeave = { ...leaveData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieLeave(newLeave, user?.id);
      setData(prev => ({ ...prev, leaveManagement: [...(prev.leaveManagement || []), newLeave] }));
      return newLeave;
    } catch (error) {
      console.error('Error adding leave:', error);
      throw error;
    }
  };

  const updateLeave = async (id, updates) => {
    try {
      await updateDexieLeave(id, updates);
      setData(prev => ({ ...prev, leaveManagement: (prev.leaveManagement || []).map(l => l.id === id ? { ...l, ...updates } : l) }));
    } catch (error) {
      console.error('Error updating leave:', error);
      throw error;
    }
  };

  const deleteLeave = async (id) => {
    try {
      await deleteDexieLeave(id);
      setData(prev => ({ ...prev, leaveManagement: (prev.leaveManagement || []).filter(l => l.id !== id) }));
    } catch (error) {
      console.error('Error deleting leave:', error);
      throw error;
    }
  };

  // Worker Advances
  const addWorkerAdvance = async (advanceData) => {
    try {
      const newAdvance = { ...advanceData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieWorkerAdvance(newAdvance, user?.id);
      setData(prev => ({ ...prev, workerAdvances: [...(prev.workerAdvances || []), newAdvance] }));
      return newAdvance;
    } catch (error) {
      console.error('Error adding worker advance:', error);
      throw error;
    }
  };

  const updateWorkerAdvance = async (id, updates) => {
    try {
      await updateDexieWorkerAdvance(id, updates);
      setData(prev => ({ ...prev, workerAdvances: (prev.workerAdvances || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating worker advance:', error);
      throw error;
    }
  };

  const deleteWorkerAdvance = async (id) => {
    try {
      await deleteDexieWorkerAdvance(id);
      setData(prev => ({ ...prev, workerAdvances: (prev.workerAdvances || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting worker advance:', error);
      throw error;
    }
  };

  // BUDGET PLANNING & FORECASTING
  // Project Budgets
  const addProjectBudget = async (budgetData) => {
    try {
      const newBudget = { ...budgetData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieProjectBudget(newBudget, user?.id);
      setData(prev => ({ ...prev, projectBudgets: [...(prev.projectBudgets || []), newBudget] }));
      return newBudget;
    } catch (error) {
      console.error('Error adding project budget:', error);
      throw error;
    }
  };

  const updateProjectBudget = async (id, updates) => {
    try {
      await updateDexieProjectBudget(id, updates);
      setData(prev => ({ ...prev, projectBudgets: (prev.projectBudgets || []).map(b => b.id === id ? { ...b, ...updates } : b) }));
    } catch (error) {
      console.error('Error updating project budget:', error);
      throw error;
    }
  };

  const deleteProjectBudget = async (id) => {
    try {
      await deleteDexieProjectBudget(id);
      setData(prev => ({ ...prev, projectBudgets: (prev.projectBudgets || []).filter(b => b.id !== id) }));
    } catch (error) {
      console.error('Error deleting project budget:', error);
      throw error;
    }
  };

  // Budget Line Items
  const addBudgetLineItem = async (lineItemData) => {
    try {
      const newLineItem = { ...lineItemData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieBudgetLineItem(newLineItem, user?.id);
      setData(prev => ({ ...prev, budgetLineItems: [...(prev.budgetLineItems || []), newLineItem] }));
      return newLineItem;
    } catch (error) {
      console.error('Error adding budget line item:', error);
      throw error;
    }
  };

  const updateBudgetLineItem = async (id, updates) => {
    try {
      await updateDexieBudgetLineItem(id, updates);
      setData(prev => ({ ...prev, budgetLineItems: (prev.budgetLineItems || []).map(i => i.id === id ? { ...i, ...updates } : i) }));
    } catch (error) {
      console.error('Error updating budget line item:', error);
      throw error;
    }
  };

  const deleteBudgetLineItem = async (id) => {
    try {
      await deleteDexieBudgetLineItem(id);
      setData(prev => ({ ...prev, budgetLineItems: (prev.budgetLineItems || []).filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Error deleting budget line item:', error);
      throw error;
    }
  };

  // Budget Alerts
  const addBudgetAlert = async (alertData) => {
    try {
      const newAlert = { ...alertData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieBudgetAlert(newAlert, user?.id);
      setData(prev => ({ ...prev, budgetAlerts: [...(prev.budgetAlerts || []), newAlert] }));
      return newAlert;
    } catch (error) {
      console.error('Error adding budget alert:', error);
      throw error;
    }
  };

  const updateBudgetAlert = async (id, updates) => {
    try {
      await updateDexieBudgetAlert(id, updates);
      setData(prev => ({ ...prev, budgetAlerts: (prev.budgetAlerts || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating budget alert:', error);
      throw error;
    }
  };

  const deleteBudgetAlert = async (id) => {
    try {
      await deleteDexieBudgetAlert(id);
      setData(prev => ({ ...prev, budgetAlerts: (prev.budgetAlerts || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting budget alert:', error);
      throw error;
    }
  };

  // Budget Revisions
  const addBudgetRevision = async (revisionData) => {
    try {
      const newRevision = { ...revisionData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieBudgetRevision(newRevision, user?.id);
      setData(prev => ({ ...prev, budgetRevisions: [...(prev.budgetRevisions || []), newRevision] }));
      return newRevision;
    } catch (error) {
      console.error('Error adding budget revision:', error);
      throw error;
    }
  };

  const updateBudgetRevision = async (id, updates) => {
    try {
      await updateDexieBudgetRevision(id, updates);
      setData(prev => ({ ...prev, budgetRevisions: (prev.budgetRevisions || []).map(r => r.id === id ? { ...r, ...updates } : r) }));
    } catch (error) {
      console.error('Error updating budget revision:', error);
      throw error;
    }
  };

  const deleteBudgetRevision = async (id) => {
    try {
      await deleteDexieBudgetRevision(id);
      setData(prev => ({ ...prev, budgetRevisions: (prev.budgetRevisions || []).filter(r => r.id !== id) }));
    } catch (error) {
      console.error('Error deleting budget revision:', error);
      throw error;
    }
  };

  // Cost Forecasts
  const addCostForecast = async (forecastData) => {
    try {
      const newForecast = { ...forecastData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieCostForecast(newForecast, user?.id);
      setData(prev => ({ ...prev, costForecasts: [...(prev.costForecasts || []), newForecast] }));
      return newForecast;
    } catch (error) {
      console.error('Error adding cost forecast:', error);
      throw error;
    }
  };

  const updateCostForecast = async (id, updates) => {
    try {
      await updateDexieCostForecast(id, updates);
      setData(prev => ({ ...prev, costForecasts: (prev.costForecasts || []).map(f => f.id === id ? { ...f, ...updates } : f) }));
    } catch (error) {
      console.error('Error updating cost forecast:', error);
      throw error;
    }
  };

  const deleteCostForecast = async (id) => {
    try {
      await deleteDexieCostForecast(id);
      setData(prev => ({ ...prev, costForecasts: (prev.costForecasts || []).filter(f => f.id !== id) }));
    } catch (error) {
      console.error('Error deleting cost forecast:', error);
      throw error;
    }
  };

  // RETENTION MANAGEMENT
  // Retention Policies
  const addRetentionPolicy = async (policyData) => {
    try {
      const newPolicy = { ...policyData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieRetentionPolicy(newPolicy, user?.id);
      setData(prev => ({ ...prev, retentionPolicies: [...(prev.retentionPolicies || []), newPolicy] }));
      return newPolicy;
    } catch (error) {
      console.error('Error adding retention policy:', error);
      throw error;
    }
  };

  const updateRetentionPolicy = async (id, updates) => {
    try {
      await updateDexieRetentionPolicy(id, updates);
      setData(prev => ({ ...prev, retentionPolicies: (prev.retentionPolicies || []).map(p => p.id === id ? { ...p, ...updates } : p) }));
    } catch (error) {
      console.error('Error updating retention policy:', error);
      throw error;
    }
  };

  const deleteRetentionPolicy = async (id) => {
    try {
      await deleteDexieRetentionPolicy(id);
      setData(prev => ({ ...prev, retentionPolicies: (prev.retentionPolicies || []).filter(p => p.id !== id) }));
    } catch (error) {
      console.error('Error deleting retention policy:', error);
      throw error;
    }
  };

  // Retention Accounts
  const addRetentionAccount = async (accountData) => {
    try {
      const newAccount = { ...accountData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieRetentionAccount(newAccount, user?.id);
      setData(prev => ({ ...prev, retentionAccounts: [...(prev.retentionAccounts || []), newAccount] }));
      return newAccount;
    } catch (error) {
      console.error('Error adding retention account:', error);
      throw error;
    }
  };

  const updateRetentionAccount = async (id, updates) => {
    try {
      await updateDexieRetentionAccount(id, updates);
      setData(prev => ({ ...prev, retentionAccounts: (prev.retentionAccounts || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating retention account:', error);
      throw error;
    }
  };

  const deleteRetentionAccount = async (id) => {
    try {
      await deleteDexieRetentionAccount(id);
      setData(prev => ({ ...prev, retentionAccounts: (prev.retentionAccounts || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting retention account:', error);
      throw error;
    }
  };

  // Retention Releases
  const addRetentionRelease = async (releaseData) => {
    try {
      const newRelease = { ...releaseData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieRetentionRelease(newRelease, user?.id);
      setData(prev => ({ ...prev, retentionReleases: [...(prev.retentionReleases || []), newRelease] }));
      return newRelease;
    } catch (error) {
      console.error('Error adding retention release:', error);
      throw error;
    }
  };

  const updateRetentionRelease = async (id, updates) => {
    try {
      await updateDexieRetentionRelease(id, updates);
      setData(prev => ({ ...prev, retentionReleases: (prev.retentionReleases || []).map(r => r.id === id ? { ...r, ...updates } : r) }));
    } catch (error) {
      console.error('Error updating retention release:', error);
      throw error;
    }
  };

  const deleteRetentionRelease = async (id) => {
    try {
      await deleteDexieRetentionRelease(id);
      setData(prev => ({ ...prev, retentionReleases: (prev.retentionReleases || []).filter(r => r.id !== id) }));
    } catch (error) {
      console.error('Error deleting retention release:', error);
      throw error;
    }
  };

  // Retention Alerts
  const addRetentionAlert = async (alertData) => {
    try {
      const newAlert = { ...alertData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieRetentionAlert(newAlert, user?.id);
      setData(prev => ({ ...prev, retentionAlerts: [...(prev.retentionAlerts || []), newAlert] }));
      return newAlert;
    } catch (error) {
      console.error('Error adding retention alert:', error);
      throw error;
    }
  };

  const updateRetentionAlert = async (id, updates) => {
    try {
      await updateDexieRetentionAlert(id, updates);
      setData(prev => ({ ...prev, retentionAlerts: (prev.retentionAlerts || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating retention alert:', error);
      throw error;
    }
  };

  const deleteRetentionAlert = async (id) => {
    try {
      await deleteDexieRetentionAlert(id);
      setData(prev => ({ ...prev, retentionAlerts: (prev.retentionAlerts || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting retention alert:', error);
      throw error;
    }
  };

  // CHANGE ORDERS
  // Change Orders
  const addChangeOrder = async (changeOrderData) => {
    try {
      const newChangeOrder = { ...changeOrderData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieChangeOrder(newChangeOrder, user?.id);
      setData(prev => ({ ...prev, changeOrders: [...(prev.changeOrders || []), newChangeOrder] }));
      return newChangeOrder;
    } catch (error) {
      console.error('Error adding change order:', error);
      throw error;
    }
  };

  const updateChangeOrder = async (id, updates) => {
    try {
      await updateDexieChangeOrder(id, updates);
      setData(prev => ({ ...prev, changeOrders: (prev.changeOrders || []).map(c => c.id === id ? { ...c, ...updates } : c) }));
    } catch (error) {
      console.error('Error updating change order:', error);
      throw error;
    }
  };

  const deleteChangeOrder = async (id) => {
    try {
      await deleteDexieChangeOrder(id);
      setData(prev => ({ ...prev, changeOrders: (prev.changeOrders || []).filter(c => c.id !== id) }));
    } catch (error) {
      console.error('Error deleting change order:', error);
      throw error;
    }
  };

  // Change Order Line Items
  const addChangeOrderLineItem = async (lineItemData) => {
    try {
      const newLineItem = { ...lineItemData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieChangeOrderLineItem(newLineItem, user?.id);
      setData(prev => ({ ...prev, changeOrderLineItems: [...(prev.changeOrderLineItems || []), newLineItem] }));
      return newLineItem;
    } catch (error) {
      console.error('Error adding change order line item:', error);
      throw error;
    }
  };

  const updateChangeOrderLineItem = async (id, updates) => {
    try {
      await updateDexieChangeOrderLineItem(id, updates);
      setData(prev => ({ ...prev, changeOrderLineItems: (prev.changeOrderLineItems || []).map(i => i.id === id ? { ...i, ...updates } : i) }));
    } catch (error) {
      console.error('Error updating change order line item:', error);
      throw error;
    }
  };

  const deleteChangeOrderLineItem = async (id) => {
    try {
      await deleteDexieChangeOrderLineItem(id);
      setData(prev => ({ ...prev, changeOrderLineItems: (prev.changeOrderLineItems || []).filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Error deleting change order line item:', error);
      throw error;
    }
  };

  // Change Order History
  const addChangeOrderHistory = async (historyData) => {
    try {
      const newHistory = { ...historyData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieChangeOrderHistory(newHistory, user?.id);
      setData(prev => ({ ...prev, changeOrderHistory: [...(prev.changeOrderHistory || []), newHistory] }));
      return newHistory;
    } catch (error) {
      console.error('Error adding change order history:', error);
      throw error;
    }
  };

  const updateChangeOrderHistory = async (id, updates) => {
    try {
      await updateDexieChangeOrderHistory(id, updates);
      setData(prev => ({ ...prev, changeOrderHistory: (prev.changeOrderHistory || []).map(h => h.id === id ? { ...h, ...updates } : h) }));
    } catch (error) {
      console.error('Error updating change order history:', error);
      throw error;
    }
  };

  const deleteChangeOrderHistory = async (id) => {
    try {
      await deleteDexieChangeOrderHistory(id);
      setData(prev => ({ ...prev, changeOrderHistory: (prev.changeOrderHistory || []).filter(h => h.id !== id) }));
    } catch (error) {
      console.error('Error deleting change order history:', error);
      throw error;
    }
  };

  // Change Order Impacts
  const addChangeOrderImpact = async (impactData) => {
    try {
      const newImpact = { ...impactData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieChangeOrderImpact(newImpact, user?.id);
      setData(prev => ({ ...prev, changeOrderImpacts: [...(prev.changeOrderImpacts || []), newImpact] }));
      return newImpact;
    } catch (error) {
      console.error('Error adding change order impact:', error);
      throw error;
    }
  };

  const updateChangeOrderImpact = async (id, updates) => {
    try {
      await updateDexieChangeOrderImpact(id, updates);
      setData(prev => ({ ...prev, changeOrderImpacts: (prev.changeOrderImpacts || []).map(i => i.id === id ? { ...i, ...updates } : i) }));
    } catch (error) {
      console.error('Error updating change order impact:', error);
      throw error;
    }
  };

  const deleteChangeOrderImpact = async (id) => {
    try {
      await deleteDexieChangeOrderImpact(id);
      setData(prev => ({ ...prev, changeOrderImpacts: (prev.changeOrderImpacts || []).filter(i => i.id !== id) }));
    } catch (error) {
      console.error('Error deleting change order impact:', error);
      throw error;
    }
  };

  // DOCUMENT MANAGEMENT
  // Documents
  const addDocument = async (documentData) => {
    try {
      const newDocument = { ...documentData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieDocument(newDocument, user?.id);
      setData(prev => ({ ...prev, documents: [...(prev.documents || []), newDocument] }));
      return newDocument;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  };

  const updateDocument = async (id, updates) => {
    try {
      await updateDexieDocument(id, updates);
      setData(prev => ({ ...prev, documents: (prev.documents || []).map(d => d.id === id ? { ...d, ...updates } : d) }));
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  };

  const deleteDocument = async (id) => {
    try {
      await deleteDexieDocument(id);
      setData(prev => ({ ...prev, documents: (prev.documents || []).filter(d => d.id !== id) }));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  // Document Versions
  const addDocumentVersion = async (versionData) => {
    try {
      const newVersion = { ...versionData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieDocumentVersion(newVersion, user?.id);
      setData(prev => ({ ...prev, documentVersions: [...(prev.documentVersions || []), newVersion] }));
      return newVersion;
    } catch (error) {
      console.error('Error adding document version:', error);
      throw error;
    }
  };

  const updateDocumentVersion = async (id, updates) => {
    try {
      await updateDexieDocumentVersion(id, updates);
      setData(prev => ({ ...prev, documentVersions: (prev.documentVersions || []).map(v => v.id === id ? { ...v, ...updates } : v) }));
    } catch (error) {
      console.error('Error updating document version:', error);
      throw error;
    }
  };

  const deleteDocumentVersion = async (id) => {
    try {
      await deleteDexieDocumentVersion(id);
      setData(prev => ({ ...prev, documentVersions: (prev.documentVersions || []).filter(v => v.id !== id) }));
    } catch (error) {
      console.error('Error deleting document version:', error);
      throw error;
    }
  };

  // Document Sharing
  const addDocumentSharing = async (sharingData) => {
    try {
      const newSharing = { ...sharingData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieDocumentSharing(newSharing, user?.id);
      setData(prev => ({ ...prev, documentSharings: [...(prev.documentSharings || []), newSharing] }));
      return newSharing;
    } catch (error) {
      console.error('Error adding document sharing:', error);
      throw error;
    }
  };

  const updateDocumentSharing = async (id, updates) => {
    try {
      await updateDexieDocumentSharing(id, updates);
      setData(prev => ({ ...prev, documentSharings: (prev.documentSharings || []).map(s => s.id === id ? { ...s, ...updates } : s) }));
    } catch (error) {
      console.error('Error updating document sharing:', error);
      throw error;
    }
  };

  const deleteDocumentSharing = async (id) => {
    try {
      await deleteDexieDocumentSharing(id);
      setData(prev => ({ ...prev, documentSharings: (prev.documentSharings || []).filter(s => s.id !== id) }));
    } catch (error) {
      console.error('Error deleting document sharing:', error);
      throw error;
    }
  };

  // Document Activity
  const addDocumentActivity = async (activityData) => {
    try {
      const newActivity = { ...activityData, id: generateId(), userId: user?.id, synced: false, lastUpdated: new Date().toISOString() };
      await addDexieDocumentActivity(newActivity, user?.id);
      setData(prev => ({ ...prev, documentActivities: [...(prev.documentActivities || []), newActivity] }));
      return newActivity;
    } catch (error) {
      console.error('Error adding document activity:', error);
      throw error;
    }
  };

  const updateDocumentActivity = async (id, updates) => {
    try {
      await updateDexieDocumentActivity(id, updates);
      setData(prev => ({ ...prev, documentActivities: (prev.documentActivities || []).map(a => a.id === id ? { ...a, ...updates } : a) }));
    } catch (error) {
      console.error('Error updating document activity:', error);
      throw error;
    }
  };

  const deleteDocumentActivity = async (id) => {
    try {
      await deleteDexieDocumentActivity(id);
      setData(prev => ({ ...prev, documentActivities: (prev.documentActivities || []).filter(a => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting document activity:', error);
      throw error;
    }
  };

  // Restore data
  const restoreData = (newData) => {
    setData(newData);
  };

  const value = {
    data,
    loading,
    currentProject,
    // Projects
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    // Departments
    addDepartment,
    deleteDepartment,
    // Payments In
    addPaymentIn,
    updatePaymentIn,
    deletePaymentIn,
    // Payments Out
    addPaymentOut,
    updatePaymentOut,
    deletePaymentOut,
    // Users
    addUser,
    updateUser,
    deleteUser,
    // Company Profile
    updateCompanyProfile,
    // Signature Settings
    updateSignatureSettings,
    // Invoice Settings
    updateInvoiceSettings,
    // Quotation Settings
    updateQuotationSettings,
    // Measurement Units
    addMeasurementUnit,
    removeMeasurementUnit,
    // Invoices
    addInvoice,
    updateInvoice,
    deleteInvoice,
    // Quotations
    addQuotation,
    updateQuotation,
    deleteQuotation,
    // Parties (Customers and Suppliers)
    addParty,
    updateParty,
    deleteParty,
    // Supplier Transactions
    addSupplierTransaction,
    updateSupplierTransaction,
    deleteSupplierTransaction,
    getSupplierTransactionsBySupplier,
    getSupplierTransactionsByProject,
    getSupplierTransactionsBySupplierAndProject,
    // Payment Out Approval
    approvePaymentOut,
    rejectPaymentOut,
    bulkAddPaymentsOut,
    // Material/Inventory Management
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addStockTransaction,
    updateStockTransaction,
    deleteStockTransaction,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addMaterialAllocation,
    updateMaterialAllocation,
    deleteMaterialAllocation,
    // Labor/Time Tracking & Payroll
    addWorker,
    updateWorker,
    deleteWorker,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    addTimeSheet,
    updateTimeSheet,
    deleteTimeSheet,
    addPayroll,
    updatePayroll,
    deletePayroll,
    addLeave,
    updateLeave,
    deleteLeave,
    addWorkerAdvance,
    updateWorkerAdvance,
    deleteWorkerAdvance,
    // Budget Planning & Forecasting
    addProjectBudget,
    updateProjectBudget,
    deleteProjectBudget,
    addBudgetLineItem,
    updateBudgetLineItem,
    deleteBudgetLineItem,
    addBudgetAlert,
    updateBudgetAlert,
    deleteBudgetAlert,
    addBudgetRevision,
    updateBudgetRevision,
    deleteBudgetRevision,
    addCostForecast,
    updateCostForecast,
    deleteCostForecast,
    // Retention Management
    addRetentionPolicy,
    updateRetentionPolicy,
    deleteRetentionPolicy,
    addRetentionAccount,
    updateRetentionAccount,
    deleteRetentionAccount,
    addRetentionRelease,
    updateRetentionRelease,
    deleteRetentionRelease,
    addRetentionAlert,
    updateRetentionAlert,
    deleteRetentionAlert,
    // Change Orders
    addChangeOrder,
    updateChangeOrder,
    deleteChangeOrder,
    addChangeOrderLineItem,
    updateChangeOrderLineItem,
    deleteChangeOrderLineItem,
    addChangeOrderHistory,
    updateChangeOrderHistory,
    deleteChangeOrderHistory,
    addChangeOrderImpact,
    updateChangeOrderImpact,
    deleteChangeOrderImpact,
    // Document Management
    addDocument,
    updateDocument,
    deleteDocument,
    addDocumentVersion,
    updateDocumentVersion,
    deleteDocumentVersion,
    addDocumentSharing,
    updateDocumentSharing,
    deleteDocumentSharing,
    addDocumentActivity,
    updateDocumentActivity,
    deleteDocumentActivity,
    // Restore
    restoreData
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

