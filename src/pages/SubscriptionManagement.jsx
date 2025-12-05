import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Crown,
  TrendingUp,
  Check,
  X,
  Calendar,
  CreditCard,
  AlertCircle,
  ArrowRight,
  Zap,
  Building2,
  Rocket
} from 'lucide-react';
import { SUBSCRIPTION_TIERS, getSubscriptionStatus } from '../utils/subscriptionManager';

const SubscriptionManagement = () => {
  const { user, isAdmin } = useAuth();
  const [currentTier, setCurrentTier] = useState('starter');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const loadSubscription = async () => {
      if (user) {
        const tier = user.subscriptionTier || 'starter';
        setCurrentTier(tier);
        const status = await getSubscriptionStatus(tier, user.id, isAdmin());
        setSubscriptionStatus(status);
      }
    };
    loadSubscription();
  }, [user, isAdmin]);

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    setShowComparisonModal(true);
  };

  const confirmUpgrade = () => {
    // TODO: Implement actual upgrade logic
    alert(`Upgrading to ${selectedPlan} plan with ${billingCycle} billing`);
    setShowComparisonModal(false);
  };

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getTierIcon = (tierId) => {
    switch (tierId) {
      case 'starter':
        return Zap;
      case 'professional':
        return Building2;
      case 'enterprise':
        return Rocket;
      default:
        return Crown;
    }
  };

  const getTierColor = (tierId) => {
    switch (tierId) {
      case 'starter':
        return 'blue';
      case 'professional':
        return 'purple';
      case 'enterprise':
        return 'pink';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-1">Manage your subscription plan and billing</p>
      </div>

      {/* Current Plan Card */}
      {subscriptionStatus && (
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {subscriptionStatus.tier.name} Plan
                </h2>
                <p className="text-gray-600">
                  ${getPrice(subscriptionStatus.tier)}/month • {billingCycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              Active
            </span>
          </div>

          {/* Usage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionStatus.users.current} / {subscriptionStatus.users.limit === -1 ? '∞' : subscriptionStatus.users.limit}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Devices</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionStatus.devices.current} / {subscriptionStatus.devices.limit === -1 ? '∞' : subscriptionStatus.devices.limit}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptionStatus.projects.current} / {subscriptionStatus.projects.limit === -1 ? '∞' : subscriptionStatus.projects.limit}
              </p>
            </div>
          </div>

          {/* Next Billing */}
          <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Next billing date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-semibold text-gray-900">${getPrice(subscriptionStatus.tier)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_TIERS).map((plan) => {
            const Icon = getTierIcon(plan.id);
            const color = getTierColor(plan.id);
            const isCurrentPlan = plan.id === currentTier;

            return (
              <div
                key={plan.id}
                className={`card ${
                  isCurrentPlan
                    ? 'border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50'
                    : 'hover:shadow-xl transition-shadow'
                }`}
              >
                {isCurrentPlan && (
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className={`bg-gradient-to-br from-${color}-100 to-${color}-200 p-4 rounded-lg mb-4`}>
                  <Icon className={`w-8 h-8 text-${color}-600 mb-2`} />
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-gray-900">
                      ${getPrice(plan)}
                    </span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-gray-600 mt-1">
                      Billed ${plan.annualPrice * 12}/year
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">
                      {plan.userLimit === -1 ? 'Unlimited' : plan.userLimit} Users
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">
                      {plan.projectLimit === -1 ? 'Unlimited' : plan.projectLimit} Projects
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">
                      {plan.storageLimit / (1024 * 1024 * 1024)} GB Storage
                    </span>
                  </div>
                </div>

                {!isCurrentPlan && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {plan.monthlyPrice > SUBSCRIPTION_TIERS[currentTier].monthlyPrice ? 'Upgrade' : 'Downgrade'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Billing History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Sample billing history - Replace with actual data */}
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 text-sm text-gray-900">
                  {new Date().toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-700">
                  {SUBSCRIPTION_TIERS[currentTier].name} Plan - Monthly
                </td>
                <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                  ${getPrice(SUBSCRIPTION_TIERS[currentTier])}
                </td>
                <td className="py-3 px-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Paid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>No additional billing history available</p>
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Plan Change</h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Current Plan */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Current Plan</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {SUBSCRIPTION_TIERS[currentTier].name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${getPrice(SUBSCRIPTION_TIERS[currentTier])}/mo
                  </p>
                </div>

                {/* New Plan */}
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">New Plan</p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {SUBSCRIPTION_TIERS[selectedPlan].name}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${getPrice(SUBSCRIPTION_TIERS[selectedPlan])}/mo
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">What happens next?</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your plan will be updated immediately. You'll be charged the prorated amount
                      for the remainder of your billing cycle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpgrade}
                  className="btn btn-primary flex-1"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;

