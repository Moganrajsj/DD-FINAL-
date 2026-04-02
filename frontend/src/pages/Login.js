import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn, FiPhone, FiMessageCircle } from 'react-icons/fi';

function Login() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  
  // Email/Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone/OTP login state
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(null);

  // All country codes with full country names
  const countryCodes = [
    { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
    { code: '+7', country: 'Russia / Kazakhstan', flag: '🇷🇺' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+40', country: 'Romania', flag: '🇷🇴' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+977', country: 'Nepal', flag: '🇳🇵' },
    { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  ];
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    const fullPhone = countryCode + phoneDigits;
    setSendingOtp(true);
    try {
      const res = await axios.post('/api/auth/send-otp', { phone: fullPhone });
      setOtpSent(true);
      setError('');
      if (res.data.otp) {
        setDevOtp(res.data.otp);
      } else {
        setDevOtp(null);
      }
      setOtpTimer(300);
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const phoneDigits = phone.replace(/\D/g, '');
    const fullPhone = countryCode + phoneDigits;
    try {
      const res = await axios.post('/api/auth/verify-otp', { phone: fullPhone, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.is_admin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-effect rounded-xl p-8 max-w-md w-full border border-dark-border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">Login</h2>
          <p className="text-dark-muted">Access your supplier dashboard</p>
        </div>

        {/* Login Method Toggle */}
        <div className="mb-6 flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setError(''); setOtpSent(false); setOtpTimer(0); }}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              loginMethod === 'email' ? 'bg-white text-accent-purple shadow-sm' : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            <FiMail className="inline mr-2" size={16} />
            Email
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('phone'); setError(''); setOtpSent(false); setOtpTimer(0); }}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              loginMethod === 'phone' ? 'bg-white text-accent-purple shadow-sm' : 'text-dark-muted hover:text-dark-text'
            }`}
          >
            <FiPhone className="inline mr-2" size={16} />
            Phone OTP
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loginMethod === 'email' ? (
          /* Email/Password Login */
          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-dark-text">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-dark-text">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-accent-purple hover:text-accent-pink transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiLogIn size={20} />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          /* Phone/OTP Login */
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-semibold text-dark-text">Phone Number</label>
              <div className="relative mb-3">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={otpSent}
                  className="w-full pl-3 pr-10 py-3 rounded-lg bg-white border border-gray-200 text-dark-text focus:border-accent-purple focus:outline-none transition-colors appearance-none cursor-pointer text-sm disabled:bg-gray-100"
                >
                  {countryCodes.map((cc) => (
                    <option key={cc.code} value={cc.code}>
                      {cc.flag} {cc.code} - {cc.country}
                    </option>
                  ))}
                </select>
                <FiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-muted pointer-events-none" size={16} />
              </div>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setPhone(value.slice(0, 15));
                  }}
                  disabled={otpSent}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors disabled:bg-gray-100"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {otpSent && (
              <div>
                <label className="block mb-2 text-sm font-semibold text-dark-text">Enter OTP</label>
                <div className="relative">
                  <FiMessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted" size={20} />
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none transition-colors text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength="6"
                  />
                </div>
                <div className="mt-2 text-sm text-dark-muted text-center">
                  {otpTimer > 0 ? (
                    <span>OTP expires in: <strong>{formatTimer(otpTimer)}</strong></span>
                  ) : (
                    <span className="text-red-500">OTP expired. Please request a new one.</span>
                  )}
                </div>
                {devOtp && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800 font-semibold mb-1">Development Mode - OTP:</p>
                    <p className="text-2xl font-bold text-yellow-900 text-center tracking-widest">{devOtp}</p>
                    <p className="text-xs text-yellow-700 mt-1 text-center">Check console or email for OTP in production</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setOtpTimer(0); }}
                  className="mt-2 text-sm text-accent-blue hover:text-accent-pink transition-colors w-full"
                >
                  Change phone number
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || sendingOtp || (otpSent && otp.length !== 6)}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {otpSent ? (
                <><FiLogIn size={20} />{loading ? 'Verifying...' : 'Verify & Login'}</>
              ) : (
                <><FiMessageCircle size={20} />{sendingOtp ? 'Sending OTP...' : 'Send OTP'}</>
              )}
            </button>

            {otpSent && otpTimer === 0 && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="w-full px-6 py-3 rounded-lg bg-gray-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sendingOtp ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-sm text-dark-muted">
          New supplier?{' '}
          <Link to="/register" className="text-accent-blue hover:text-accent-pink transition-colors font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
