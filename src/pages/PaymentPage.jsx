import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import {
  CreditCard,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Crown,
  Calendar
} from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '../utils/subscriptionManager';

const PaymentPage = ({ selectedPlan, billingCycle }) => {
  const { navigate } = useNavigation();
  const [formData, setFormData] = useState({
    // Company Information
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    
    // Payment Information
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    
    // Billing
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    sameAsCompany: true
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Get plan details from localStorage if not passed as props
  const [plan, setPlan] = useState(null);
  const [cycle, setCycle] = useState('monthly');

  useEffect(() => {
    // Get plan details from localStorage
    const storedPlan = localStorage.getItem('bycodez_selected_plan');
    const storedCycle = localStorage.getItem('bycodez_billing_cycle');
    
    if (storedPlan) {
      setPlan(SUBSCRIPTION_TIERS[storedPlan]);
      setCycle(storedCycle || 'monthly');
    } else if (selectedPlan) {
      setPlan(SUBSCRIPTION_TIERS[selectedPlan]);
      setCycle(billingCycle || 'monthly');
    } else {
      // No plan selected, redirect to pricing
      navigate('pricing');
    }
  }, [selectedPlan, billingCycle, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Company Information
    if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    // Payment Information
    if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
    else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number (16 digits required)';
    }
    if (!formData.cardName.trim()) newErrors.cardName = 'Cardholder name is required';
    if (!formData.expiryMonth) newErrors.expiryMonth = 'Expiry month is required';
    if (!formData.expiryYear) newErrors.expiryYear = 'Expiry year is required';
    if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
    else if (!/^\d{3,4}$/.test(formData.cvv)) newErrors.cvv = 'Invalid CVV';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setPaymentSuccess(true);
      
      // Clear stored plan data
      localStorage.removeItem('bycodez_selected_plan');
      localStorage.removeItem('bycodez_billing_cycle');
      
      // Redirect to subscription page after 3 seconds
      setTimeout(() => {
        navigate('subscription');
      }, 3000);
    }, 2000);
  };

  const getPrice = () => {
    if (!plan) return 0;
    return cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const getTotalAmount = () => {
    const price = getPrice();
    const tax = price * 0.18; // 18% GST
    return price + tax;
  };

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="card text-center">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for subscribing to the <strong>{plan.name}</strong> plan.
          </p>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-semibold text-gray-900">{cycle === 'monthly' ? 'Monthly' : 'Annual'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-gray-900">₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            A confirmation email has been sent to <strong>{formData.email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to subscription management...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('pricing')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pricing
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
        <p className="text-gray-600 mt-1">Subscribe to {plan.name} plan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ABC Construction Pvt Ltd"
                  />
                  {errors.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.contactPerson && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactPerson}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123 Main Street"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mumbai"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Maharashtra"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.zipCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="400001"
                  />
                  {errors.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">Payment Information</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cardholder Name *
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.cardName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="JOHN DOE"
                  />
                  {errors.cardName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardName}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Month *
                    </label>
                    <select
                      name="expiryMonth"
                      value={formData.expiryMonth}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.expiryMonth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    {errors.expiryMonth && (
                      <p className="mt-1 text-sm text-red-600">{errors.expiryMonth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Year *
                    </label>
                    <select
                      name="expiryYear"
                      value={formData.expiryYear}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.expiryYear ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {errors.expiryYear && (
                      <p className="mt-1 text-sm text-red-600">{errors.expiryYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV *
                    </label>
                    <input
                      type="text"
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.cvv ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123"
                      maxLength="4"
                    />
                    {errors.cvv && (
                      <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold text-blue-900">Secure Payment</p>
                  <p>Your payment information is encrypted and secure.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full btn btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay ₹{getTotalAmount().toFixed(2)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-8">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <h3 className="font-bold text-gray-900 text-lg mb-2">{plan.name} Plan</h3>
                <p className="text-sm text-gray-600 mb-3">{cycle === 'monthly' ? 'Monthly' : 'Annual'} Billing</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{plan.userLimit === -1 ? 'Unlimited' : plan.userLimit} Users</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{plan.projectLimit === -1 ? 'Unlimited' : plan.projectLimit} Projects</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>{plan.storageLimit / (1024 * 1024 * 1024)} GB Storage</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subscription ({cycle})</span>
                  <span>₹{getPrice()}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>GST (18%)</span>
                  <span>₹{(getPrice() * 0.18).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              {cycle === 'annual' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-semibold">
                    🎉 You're saving ₹{((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(2)}/year with annual billing!
                  </p>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Billing Cycle</p>
                    <p className="text-sm text-gray-600">
                      {cycle === 'monthly'
                        ? 'Billed monthly. Cancel anytime.'
                        : `Billed annually. Next payment on ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

