import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiArrowLeft, FiCheckCircle, FiLoader, FiEye, FiEyeOff, FiAlertTriangle } from 'react-icons/fi';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const getPasswordStrength = (pw) => {
    if (!pw) return { strength: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: 'bg-red-400' },
      { strength: 2, label: 'Fair', color: 'bg-amber-400' },
      { strength: 3, label: 'Good', color: 'bg-emerald-400' },
      { strength: 4, label: 'Strong', color: 'bg-emerald-500' },
    ];
    return { ...map[score], width: `${(score / 4) * 100}%` };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match. Please try again.');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters long.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/reset-password', { token, password });
      setStatus('success');
      setMessage(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Something went wrong. The link may have expired.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/40 to-white flex items-center justify-center py-12 px-4">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent-purple/8 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-accent-pink/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-dark-muted hover:text-accent-purple transition-colors mb-6"
        >
          <FiArrowLeft size={16} />
          Back to Login
        </Link>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center shadow-lg shadow-accent-purple/20">
              <FiLock className="text-white" size={28} />
            </div>
          </div>

          {status === 'success' ? (
            <div className="text-center animate-scale-in">
              <div className="flex justify-center mb-4">
                <FiCheckCircle className="text-emerald-500" size={48} />
              </div>
              <h2 className="text-2xl font-black text-dark-text mb-3">Password Reset!</h2>
              <p className="text-dark-muted text-sm leading-6 mb-6">{message}</p>
              <p className="text-xs text-dark-muted mb-6">Redirecting you to login in 3 seconds...</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Go to Login
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <FiAlertTriangle className="text-amber-500" size={48} />
              </div>
              <h2 className="text-2xl font-black text-dark-text mb-3">Invalid Link</h2>
              <p className="text-dark-muted text-sm leading-6 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Request New Link
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-dark-text mb-2">Create New Password</h2>
                <p className="text-dark-muted text-sm leading-6">
                  Your new password must be at least 8 characters.
                </p>
              </div>

              {status === 'error' && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-slide-up">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block mb-2 text-sm font-bold text-dark-text">New Password</label>
                  <div className="relative">
                    <FiLock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted"
                      size={18}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/10 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-accent-purple transition-colors"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {password && (
                    <div className="mt-2 animate-fade-in">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className={`text-xs mt-1 font-semibold ${
                        passwordStrength.strength >= 3 ? 'text-emerald-600' : 'text-amber-600'
                      }`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block mb-2 text-sm font-bold text-dark-text">Confirm Password</label>
                  <div className="relative">
                    <FiLock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted"
                      size={18}
                    />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-white border text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 transition-all text-sm ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-gray-200 focus:border-accent-purple focus:ring-accent-purple/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-accent-purple transition-colors"
                    >
                      {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 font-semibold animate-fade-in">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !password || !confirmPassword}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-purple/20"
                >
                  {status === 'loading' ? (
                    <>
                      <FiLoader size={18} className="animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <FiLock size={18} />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
