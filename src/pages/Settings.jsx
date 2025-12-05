import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  Download,
  Upload,
  Database,
  AlertCircle,
  CheckCircle,
  Settings as SettingsIcon,
  FileArchive,
  Shield,
  Users,
  Smartphone,
  Briefcase,
  TrendingUp,
  Crown,
  Key,
  RefreshCw
} from 'lucide-react';
import { getSubscriptionStatus, SUBSCRIPTION_TIERS } from '../utils/subscriptionManager';
import { activateLicenseKey, getLicenseInfo } from '../utils/licenseManager';
import {
  createBackup,
  createCompressedBackup,
  createEncryptedBackup,
  restoreFromBackup,
  clearAllData
} from '../utils/dataManager';
import SignatureSettings from '../components/SignatureSettings';
import InvoiceSettings from '../components/InvoiceSettings';
import MeasurementUnitsSettings from '../components/MeasurementUnitsSettings';
import PasswordModal from '../components/PasswordModal';
import { useNavigation } from '../context/NavigationContext';

const Settings = () => {
  const { data, restoreData } = useData();
  const { user, isAdmin } = useAuth();
  const { navigate } = useNavigation();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, mode: 'encrypt', file: null });
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [licenseLoading, setLicenseLoading] = useState(false);

  // Load subscription status and license info
  useEffect(() => {
    const loadSubscriptionStatus = async () => {
      if (user) {
        const subscriptionTier = user.subscriptionTier || 'starter';
        const status = await getSubscriptionStatus(subscriptionTier, user.id, isAdmin());
        setSubscriptionStatus(status);

        // Load license info
        const license = await getLicenseInfo(user.id);
        setLicenseInfo(license);
      }
    };
    loadSubscriptionStatus();
  }, [user, isAdmin]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      showMessage('error', 'Please enter a license key');
      return;
    }

    setLicenseLoading(true);
    try {
      const result = await activateLicenseKey(licenseKey.trim(), user.id);

      if (result.success) {
        showMessage('success', 'License activated successfully!');
        setLicenseKey('');

        // Reload license info
        const license = await getLicenseInfo(user.id);
        setLicenseInfo(license);
      } else {
        showMessage('error', result.error);
      }
    } catch (error) {
      showMessage('error', 'Failed to activate license. Please try again.');
    }
    setLicenseLoading(false);
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const success = createBackup(data);
      if (success) {
        showMessage('success', 'Backup created successfully! File downloaded to your device.');
      } else {
        showMessage('error', 'Failed to create backup. Please try again.');
      }
    } catch (error) {
      showMessage('error', 'Error creating backup: ' + error.message);
    }
    setLoading(false);
  };

  const handleCreateCompressedBackup = async () => {
    setLoading(true);
    try {
      const success = createCompressedBackup(data);
      if (success) {
        showMessage('success', 'Compressed backup created successfully! File downloaded to your device.');
      } else {
        showMessage('error', 'Failed to create compressed backup. Please try again.');
      }
    } catch (error) {
      showMessage('error', 'Error creating compressed backup: ' + error.message);
    }
    setLoading(false);
  };

  const handleCreateEncryptedBackup = () => {
    setPasswordModal({ isOpen: true, mode: 'encrypt', file: null });
  };

  const handleEncryptedBackupWithPassword = async (password) => {
    setLoading(true);
    try {
      const success = await createEncryptedBackup(data, password);
      if (success) {
        showMessage('success', 'Encrypted backup created successfully! File downloaded to your device.');
        setPasswordModal({ isOpen: false, mode: 'encrypt', file: null });
      } else {
        showMessage('error', 'Failed to create encrypted backup. Please try again.');
      }
    } catch (error) {
      showMessage('error', 'Error creating encrypted backup: ' + error.message);
    }
    setLoading(false);
  };

  const handleRestoreBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.ttf') && !file.name.endsWith('.json.gz') && !file.name.endsWith('.ttfe')) {
      showMessage('error', 'Invalid file format. Please select a .ttf, .json.gz, or .ttfe backup file.');
      return;
    }

    // Check if file is encrypted
    if (file.name.endsWith('.ttfe')) {
      // Show password modal for encrypted files
      setPasswordModal({ isOpen: true, mode: 'decrypt', file: file });
      event.target.value = '';
      return;
    }

    if (!window.confirm('Restoring a backup will replace all current data. Are you sure you want to continue?')) {
      event.target.value = '';
      return;
    }

    setLoading(true);
    try {
      const restoredData = await restoreFromBackup(file);
      restoreData(restoredData);
      showMessage('success', 'Backup restored successfully! Page will reload in 2 seconds.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage('error', 'Error restoring backup: ' + error.message);
    }
    setLoading(false);
    event.target.value = '';
  };

  const handleRestoreEncryptedBackup = async (password) => {
    const file = passwordModal.file;
    if (!file) return;

    if (!window.confirm('Restoring a backup will replace all current data. Are you sure you want to continue?')) {
      setPasswordModal({ isOpen: false, mode: 'decrypt', file: null });
      return;
    }

    setLoading(true);
    try {
      const restoredData = await restoreFromBackup(file, password);
      restoreData(restoredData);
      showMessage('success', 'Encrypted backup restored successfully! Page will reload in 2 seconds.');
      setPasswordModal({ isOpen: false, mode: 'decrypt', file: null });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage('error', 'Error restoring encrypted backup: ' + error.message);
      setLoading(false);
    }
  };

  const handleClearData = () => {
    if (!window.confirm('WARNING: This will delete ALL data permanently. This action cannot be undone. Are you sure?')) {
      return;
    }

    if (!window.confirm('This is your final warning. All data will be lost. Continue?')) {
      return;
    }

    setLoading(true);
    try {
      clearAllData();
      showMessage('success', 'All data cleared. Page will reload in 2 seconds.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage('error', 'Error clearing data: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your application settings and data</p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-start gap-3 animate-slide-in ${
          message.type === 'success'
            ? 'bg-success-50 border border-success-200'
            : 'bg-danger-50 border border-danger-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={message.type === 'success' ? 'text-success-700' : 'text-danger-700'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Subscription Status Section */}
      {subscriptionStatus && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-lg shadow-sm">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Subscription & Usage</h2>
              <p className="text-gray-600 text-sm">Current plan: {subscriptionStatus.tier.name}</p>
            </div>
          </div>

          {/* Warning Banner */}
          {subscriptionStatus.hasWarnings && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Approaching Limit</p>
                <p className="text-sm text-yellow-700">
                  You're approaching your subscription limits. Consider upgrading your plan.
                </p>
              </div>
            </div>
          )}

          {/* Over Limit Banner */}
          {subscriptionStatus.isOverLimit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Limit Reached</p>
                <p className="text-sm text-red-700">
                  You've reached your subscription limits. Please upgrade to continue.
                </p>
              </div>
            </div>
          )}

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Users */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Users</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {subscriptionStatus.users.current}
                  </span>
                  <span className="text-gray-600">
                    / {subscriptionStatus.users.limit === -1 ? '∞' : subscriptionStatus.users.limit}
                  </span>
                </div>
                {subscriptionStatus.users.limit !== -1 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          subscriptionStatus.users.isNearLimit ? 'bg-yellow-500' : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${(subscriptionStatus.users.current / subscriptionStatus.users.limit) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {subscriptionStatus.users.remaining} remaining
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Devices */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Devices</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {subscriptionStatus.devices.current}
                  </span>
                  <span className="text-gray-600">
                    / {subscriptionStatus.devices.limit === -1 ? '∞' : subscriptionStatus.devices.limit}
                  </span>
                </div>
                {subscriptionStatus.devices.limit !== -1 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          subscriptionStatus.devices.isNearLimit ? 'bg-yellow-500' : 'bg-green-600'
                        }`}
                        style={{
                          width: `${(subscriptionStatus.devices.current / subscriptionStatus.devices.limit) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {subscriptionStatus.devices.remaining} remaining
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Projects */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Active Projects</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {subscriptionStatus.projects.current}
                  </span>
                  <span className="text-gray-600">
                    / {subscriptionStatus.projects.limit === -1 ? '∞' : subscriptionStatus.projects.limit}
                  </span>
                </div>
                {subscriptionStatus.projects.limit !== -1 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          subscriptionStatus.projects.isNearLimit ? 'bg-yellow-500' : 'bg-purple-600'
                        }`}
                        style={{
                          width: `${(subscriptionStatus.projects.current / subscriptionStatus.projects.limit) * 100}%`
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {subscriptionStatus.projects.remaining} remaining
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Want more capacity?</p>
                <p className="text-sm text-gray-600">Upgrade your plan to unlock more users, devices, and projects.</p>
              </div>
              <button
                onClick={() => navigate('subscription')}
                className="btn btn-primary flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* License Key Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-3 rounded-lg shadow-sm">
            <Key className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">License Key</h2>
            <p className="text-gray-600 text-sm">Activate or manage your license key</p>
          </div>
        </div>

        {/* Current License Info */}
        {licenseInfo && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900">Active License</p>
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p><strong>Tier:</strong> {licenseInfo.tier.charAt(0).toUpperCase() + licenseInfo.tier.slice(1)}</p>
                  <p><strong>Expires:</strong> {new Date(licenseInfo.expiresAt).toLocaleDateString()}</p>
                  <p><strong>Days Remaining:</strong> {licenseInfo.daysRemaining}</p>
                </div>
                {licenseInfo.isNearExpiry && (
                  <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                    ⚠️ Your license will expire soon. Please renew to continue using all features.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* License Activation Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter License Key
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                maxLength={24}
              />
              <button
                onClick={handleActivateLicense}
                disabled={licenseLoading || !licenseKey.trim()}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                {licenseLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Activate
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Enter your license key in the format: XXXX-XXXX-XXXX-XXXX-XXXX
            </p>
          </div>

          {/* License Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold text-blue-900 mb-1">About License Keys</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>License keys are provided when you purchase a subscription</li>
                  <li>Each license key is tied to a specific subscription tier</li>
                  <li>License keys can be activated on one organization only</li>
                  <li>Contact support if you need to transfer a license</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-3 rounded-lg shadow-sm">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Backup & Restore</h2>
            <p className="text-gray-600 text-sm">Protect your data with regular backups</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Create Backup */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Create Backup (.ttf)</h3>
                <p className="text-sm text-gray-600">
                  Download a backup of all your data in native .ttf format. This file contains all your 
                  payments, departments, and settings in JSON format.
                </p>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={loading}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Create Backup
              </button>
            </div>
          </div>

          {/* Create Compressed Backup */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Create Compressed Backup (.json.gz)</h3>
                <p className="text-sm text-gray-600">
                  Download a compressed backup for easier sharing and storage. This format is smaller
                  and ideal for portability.
                </p>
              </div>
              <button
                onClick={handleCreateCompressedBackup}
                disabled={loading}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <FileArchive className="w-4 h-4" />
                Compressed
              </button>
            </div>
          </div>

          {/* Create Encrypted Backup */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">Create Encrypted Backup (.ttfe)</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    Secure
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Download a password-protected encrypted backup. This prevents unauthorized access
                  and ensures your data remains secure. You'll need the password to restore this backup.
                </p>
              </div>
              <button
                onClick={handleCreateEncryptedBackup}
                disabled={loading}
                className="btn btn-primary flex items-center gap-2 whitespace-nowrap bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Shield className="w-4 h-4" />
                Encrypted
              </button>
            </div>
          </div>

          {/* Restore Backup */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Restore from Backup</h3>
                <p className="text-sm text-gray-600">
                  Upload a previously created backup file (.ttf, .json.gz, or .ttfe encrypted) to restore your data.
                  This will replace all current data. For encrypted backups, you'll be prompted for the password.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                Restore
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ttf,.gz,.ttfe"
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={passwordModal.isOpen}
        onClose={() => setPasswordModal({ isOpen: false, mode: 'encrypt', file: null })}
        onSubmit={passwordModal.mode === 'encrypt' ? handleEncryptedBackupWithPassword : handleRestoreEncryptedBackup}
        mode={passwordModal.mode}
        loading={loading}
      />

      {/* Data Management Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-orange-100 to-yellow-100 p-3 rounded-lg shadow-sm">
            <SettingsIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Data Management</h2>
            <p className="text-gray-600 text-sm">Manage your application data</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Data Statistics */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Current Data Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Projects</p>
                <p className="text-2xl font-bold text-gray-900">{data.projects?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{data.invoices?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quotations</p>
                <p className="text-2xl font-bold text-gray-900">{data.quotations?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.users?.length || 0}</p>
              </div>
            </div>
          </div>

          {/* Clear All Data */}
          <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-danger-900 mb-1">Clear All Data</h3>
                <p className="text-sm text-danger-700">
                  Permanently delete all data from the application. This action cannot be undone. 
                  Make sure to create a backup before proceeding.
                </p>
              </div>
              <button
                onClick={handleClearData}
                disabled={loading}
                className="btn btn-danger flex items-center gap-2 whitespace-nowrap"
              >
                <AlertCircle className="w-4 h-4" />
                Clear Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-primary-900 mb-3">Backup Best Practices</h3>
        <ul className="space-y-2 text-sm text-primary-800">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Create regular backups to prevent data loss</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Store backup files in a safe location (cloud storage, external drive)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Use .ttf format for native backups, .json.gz for compressed backups, and .ttfe for encrypted backups</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span><strong>Use encrypted backups (.ttfe)</strong> when storing sensitive data or sharing backups over unsecured channels</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span><strong>Remember your encryption password!</strong> Lost passwords cannot be recovered, and encrypted backups cannot be restored without them</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Test your backups periodically by restoring them in a test environment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>Keep multiple backup versions from different dates</span>
          </li>
        </ul>
      </div>

      {/* Invoice Settings Section */}
      <div className="card">
        <InvoiceSettings />
      </div>

      {/* Measurement Units Settings Section */}
      <div className="card">
        <MeasurementUnitsSettings />
      </div>

      {/* Signature Settings Section */}
      <div className="card">
        <SignatureSettings />
      </div>
    </div>
  );
};

export default Settings;

