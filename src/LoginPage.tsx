import React, { useState } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  // ✅ Password validation function
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number';
    if (!/[!@#$%^&*]/.test(pwd)) return 'Password must contain a special character';
    return '';
  };

  // ✅ Auth handler (with weak password check)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Block weak passwords on signup
    if (isSignUp && passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-500 flex items-center justify-center">
      <div className="max-w-md w-full p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Email Input */}
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-1 font-semibold text-gray-700 dark:text-gray-200">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-1 font-semibold text-gray-700 dark:text-gray-200">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (isSignUp) setPasswordError(validatePassword(e.target.value));
              }}
              disabled={loading}
              className={`p-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                passwordError ? 'border-red-500 animate-shake' : 'border-gray-300 dark:border-gray-600'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-red-600 dark:text-red-200 text-sm">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (isSignUp && passwordError)}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition w-full flex items-center justify-center ${
              loading || (isSignUp && passwordError) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              isSignUp ? 'Sign Up' : 'Login'
            )}
          </button>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
            disabled={loading}
          >
            {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
