import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, User, AlertCircle, ArrowRight, Sparkles, Shield, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Human Verification (CAPTCHA) State
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Generate simple math CAPTCHA
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer;
    let question;

    switch(operator) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '×':
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
    }

    setCaptchaQuestion(question);
    setCaptchaAnswer(answer.toString());
    setUserCaptchaInput('');
    setCaptchaVerified(false);
  };

  // Generate CAPTCHA on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Verify CAPTCHA when user types
  useEffect(() => {
    if (userCaptchaInput === captchaAnswer) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
    }
  }, [userCaptchaInput, captchaAnswer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    // Check CAPTCHA verification
    if (!captchaVerified) {
      setError('Please solve the verification challenge correctly');
      setLoading(false);
      return;
    }

    console.log('🔐 Attempting login with username:', username);
    const result = await login(username, password);
    console.log('🔐 Login result:', result);

    if (!result.success) {
      setError(result.error);
      console.error('❌ Login failed:', result.error);
      // Generate new CAPTCHA on failed login
      generateCaptcha();
    } else {
      console.log('✅ Login successful!');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary purple blob - top right */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500 to-indigo-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>

        {/* Secondary indigo blob - bottom left */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-500 to-purple-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        {/* Accent purple blob - center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-500 to-indigo-400 rounded-full mix-blend-screen filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>

        {/* Additional subtle accent - top left */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-indigo-400 to-purple-300 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-6000"></div>

        {/* Grid overlay for depth */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Features */}
        <div className="hidden lg:block text-white space-y-8 px-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-purple-400/20 shadow-lg shadow-purple-500/10">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-purple-100">Professional Construction Management</span>
            </div>

            <h1 className="text-6xl font-bold leading-tight">
              Welcome to
              <span className="block bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-300 bg-clip-text text-transparent mt-2">
                ByCodez
              </span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed">
              Your complete solution for tracking construction project expenses, managing multiple sites, and maintaining financial clarity.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-5 rounded-xl border border-white/10 hover:border-purple-400/30 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-white">Multi-Site Management</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Manage multiple construction sites with independent financial tracking</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-5 rounded-xl border border-white/10 hover:border-indigo-400/30 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-white">Real-Time Analytics</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Track payments, expenses, and project progress with live dashboards</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-md p-5 rounded-xl border border-white/10 hover:border-purple-400/30 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 p-3 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1 text-white">Secure & Reliable</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Your data is safe with automatic backups and restore capabilities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-2xl shadow-purple-500/30 mb-4 transform hover:scale-105 transition-transform">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-2">ByCodez</h1>
            <p className="text-slate-300">Construction Expense Tracker</p>
          </div>

          {/* Login Card - Glass Morphism Design */}
          <div
            className="backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Gradient Border Effect */}
            <div
              className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)',
                filter: 'blur(20px)'
              }}
            ></div>
            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-2">
                Sign In
              </h2>
              <p className="text-white/70">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div
                className="mb-6 p-4 rounded-lg flex items-start gap-3 animate-slide-in relative z-10"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderLeft: '4px solid #EF4444',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-purple-300" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl transition-all text-white placeholder-white/40"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Enter your username"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-purple-300" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl transition-all text-white placeholder-white/40"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                    onFocus={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Human Verification (CAPTCHA) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white/90 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Human Verification
                </label>
                <div className="flex gap-3 items-center">
                  {/* CAPTCHA Question Display */}
                  <div
                    className="flex-shrink-0 px-6 py-3 rounded-xl font-mono text-xl font-bold text-center min-w-[140px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                      border: '2px dashed rgba(139, 92, 246, 0.4)',
                      backdropFilter: 'blur(10px)',
                      color: '#E9D5FF'
                    }}
                  >
                    {captchaQuestion} = ?
                  </div>

                  {/* CAPTCHA Input */}
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userCaptchaInput}
                      onChange={(e) => setUserCaptchaInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl transition-all text-white placeholder-white/40 text-center font-semibold text-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: captchaVerified
                          ? '2px solid rgba(34, 197, 94, 0.6)'
                          : '1px solid rgba(139, 92, 246, 0.3)',
                        backdropFilter: 'blur(10px)'
                      }}
                      onFocus={(e) => {
                        if (!captchaVerified) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                          e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!captchaVerified) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                      placeholder="Answer"
                      disabled={loading}
                      autoComplete="off"
                    />
                    {captchaVerified && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                    )}
                  </div>

                  {/* Refresh CAPTCHA Button */}
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="flex-shrink-0 p-3 rounded-xl transition-all duration-200 hover:scale-110"
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      backdropFilter: 'blur(10px)'
                    }}
                    title="Generate new challenge"
                  >
                    <RefreshCw className="w-5 h-5 text-purple-300" />
                  </button>
                </div>

                {/* CAPTCHA Status Message */}
                {userCaptchaInput && (
                  <p className={`text-xs flex items-center gap-1 ${captchaVerified ? 'text-green-300' : 'text-orange-300'}`}>
                    {captchaVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Verification successful!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        Incorrect answer, please try again
                      </>
                    )}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !captchaVerified}
                className="w-full py-3.5 rounded-xl font-semibold text-lg text-white transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.4), 0 8px 10px -6px rgba(139, 92, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading && captchaVerified) {
                    e.target.style.background = 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)';
                    e.target.style.boxShadow = '0 20px 35px -5px rgba(139, 92, 246, 0.5), 0 10px 15px -6px rgba(139, 92, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)';
                  e.target.style.boxShadow = '0 10px 25px -5px rgba(139, 92, 246, 0.4), 0 8px 10px -6px rgba(139, 92, 246, 0.3)';
                }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div
              className="mt-8 pt-6 relative z-10"
              style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <p className="text-sm text-white/80 mb-4 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Demo Credentials
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <p className="font-semibold text-purple-200 mb-2 text-sm flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Admin Access
                  </p>
                  <p className="text-xs text-purple-100">
                    <span
                      className="font-mono px-2 py-1 rounded shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                      }}
                    >admin</span>
                  </p>
                  <p className="text-xs text-purple-100 mt-1">
                    <span
                      className="font-mono px-2 py-1 rounded shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                      }}
                    >admin123</span>
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <p className="font-semibold text-indigo-200 mb-2 text-sm flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    User Access
                  </p>
                  <p className="text-xs text-indigo-100">
                    <span
                      className="font-mono px-2 py-1 rounded shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >user</span>
                  </p>
                  <p className="text-xs text-indigo-100 mt-1">
                    <span
                      className="font-mono px-2 py-1 rounded shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >user123</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-white/60 mt-6 text-sm">
            © 2025 ByCodez. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

