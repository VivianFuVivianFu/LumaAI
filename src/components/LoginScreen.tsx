import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from './AuthContext';

interface LoginScreenProps {
  onBack?: () => void;
  onShowTerms?: () => void;
  onShowPrivacy?: () => void;
}

export function LoginScreen({ onBack, onShowTerms, onShowPrivacy }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Default to true for better UX
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <motion.div
            className="text-center space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg mx-auto"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-2xl">✨</span>
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Continue your journey with Luma
              </p>
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.form
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleLogin}
          >
            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-sm bg-red-50 p-3 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </div>
              ) : (
                'Login'
              )}
            </Button>
          </motion.form>

          {/* Back to Registration */}
          {onBack && (
            <motion.div
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Don't have an account? Sign up
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subtle bottom decoration */}
      <motion.div
        className="pb-8 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex justify-center">
          <div className="w-12 h-1 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full"></div>
        </div>
      </motion.div>
    </div>
  );
}
