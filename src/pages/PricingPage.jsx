import React, { useState } from 'react';
import { Check, X, Zap, Building2, Crown, TrendingUp } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

const PricingPage = () => {
  const { navigate } = useNavigation();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      icon: Zap,
      color: 'blue',
      monthlyPrice: 49,
      annualPrice: 39, // 20% discount
      description: 'Perfect for small contractors and freelancers',
      users: 3,
      projects: 10,
      storage: '5 GB',
      features: [
        { name: 'Up to 3 users', included: true },
        { name: 'Up to 10 active projects', included: true },
        { name: '5 GB storage', included: true },
        { name: 'Invoices & Quotations', included: true },
        { name: 'Payments In/Out tracking', included: true },
        { name: 'Basic Reports', included: true },
        { name: 'PDF/Excel Export', included: true },
        { name: 'Email Support', included: true },
        { name: 'WhatsApp Integration', included: false },
        { name: 'Advanced Analytics', included: false },
        { name: 'Supplier/Customer Management', included: false },
        { name: 'Priority Support', included: false },
      ],
      popular: false,
    },
    {
      id: 'professional',
      name: 'Professional',
      icon: Building2,
      color: 'primary',
      monthlyPrice: 149,
      annualPrice: 119, // 20% discount
      description: 'Ideal for growing construction companies',
      users: 10,
      projects: 50,
      storage: '25 GB',
      features: [
        { name: 'Up to 10 users', included: true },
        { name: 'Up to 50 active projects', included: true },
        { name: '25 GB storage', included: true },
        { name: 'Invoices & Quotations', included: true },
        { name: 'Payments In/Out tracking', included: true },
        { name: 'Advanced Reports & Analytics', included: true },
        { name: 'PDF/Excel Export', included: true },
        { name: 'WhatsApp Integration', included: true },
        { name: 'Profit & Expense Dashboard', included: true },
        { name: 'Supplier/Customer Management', included: true },
        { name: 'Role-based Access Control', included: true },
        { name: 'Priority Support', included: true },
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Crown,
      color: 'purple',
      monthlyPrice: 399,
      annualPrice: 319, // 20% discount
      description: 'For large organizations with advanced needs',
      users: 'Unlimited',
      projects: 'Unlimited',
      storage: '100 GB',
      features: [
        { name: 'Unlimited users', included: true },
        { name: 'Unlimited projects', included: true },
        { name: '100 GB storage', included: true },
        { name: 'All Professional features', included: true },
        { name: 'Custom Branding', included: true },
        { name: 'API Access', included: true },
        { name: 'Dedicated Support', included: true },
        { name: 'Custom Integrations', included: true },
        { name: 'On-premise Deployment Option', included: true },
        { name: 'Training & Onboarding', included: true },
        { name: 'SLA Guarantee', included: true },
        { name: '24/7 Phone Support', included: true },
      ],
      popular: false,
    },
  ];

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getSavings = (plan) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const annualCost = plan.annualPrice * 12;
    return monthlyCost - annualCost;
  };

  const handleChoosePlan = (planId) => {
    // Store selected plan and billing cycle in localStorage
    localStorage.setItem('bycodez_selected_plan', planId);
    localStorage.setItem('bycodez_billing_cycle', billingCycle);

    // Navigate to payment page
    navigate('payment');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Flexible pricing for construction businesses of all sizes
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-primary-500' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 bg-${plan.color}-100 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    {billingCycle === 'annual' && (
                      <p className="text-sm text-green-600 mt-2">
                        Save ${savings}/year with annual billing
                      </p>
                    )}
                  </div>

                  {/* Choose Plan Button */}
                  <button
                    onClick={() => handleChoosePlan(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    Choose {plan.name}
                  </button>

                  {/* Plan Details */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Users</span>
                        <span className="font-semibold text-gray-900">{plan.users}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Projects</span>
                        <span className="font-semibold text-gray-900">{plan.projects}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Storage</span>
                        <span className="font-semibold text-gray-900">{plan.storage}</span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Features:</p>
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={`text-sm ${
                              feature.included ? 'text-gray-700' : 'text-gray-400'
                            }`}
                          >
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change plans later?</h3>
              <p className="text-gray-600 text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600 text-sm">
                We accept all major credit cards, debit cards, and bank transfers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Yes! All plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely. Cancel anytime with no penalties. Your data remains accessible for 30 days.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">500+ Active Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-600">Award-Winning Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

