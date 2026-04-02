import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiLoader } from 'react-icons/fi';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setStatus('success');
      setMessage(res.data.message || 'If that email exists, a reset link has been sent.');
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Something went wrong. Please try again.');
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
        {/* Back to login */}
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
              <FiMail className="text-white" size={28} />
            </div>
          </div>

          {status === 'success' ? (
            /* Success State */
            <div className="text-center animate-scale-in">
              <div className="flex justify-center mb-4">
                <FiCheckCircle className="text-emerald-500" size={48} />
              </div>
              <h2 className="text-2xl font-black text-dark-text mb-3">Check Your Email</h2>
              <p className="text-dark-muted text-sm leading-6 mb-6">{message}</p>
              <p className="text-xs text-dark-muted mb-6">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setStatus('idle'); setEmail(''); setMessage(''); }}
                  className="text-accent-purple hover:text-accent-pink font-semibold transition-colors"
                >
                  try again
                </button>.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                <FiArrowLeft size={16} />
                Return to Login
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-dark-text mb-2">Forgot Password?</h2>
                <p className="text-dark-muted text-sm leading-6">
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              {status === 'error' && (
                <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-slide-up">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block mb-2 text-sm font-bold text-dark-text">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-dark-text placeholder-dark-muted focus:border-accent-purple focus:outline-none focus:ring-2 focus:ring-accent-purple/10 transition-all text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading' || !email}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent-purple/20"
                >
                  {status === 'loading' ? (
                    <>
                      <FiLoader size={18} className="animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <FiMail size={18} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-dark-muted">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-accent-purple hover:text-accent-pink font-bold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
