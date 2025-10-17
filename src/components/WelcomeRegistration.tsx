import { useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Loader2, Mail, Lock, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from './AuthContext';

interface WelcomeRegistrationProps {
  onComplete: (name: string) => void;
  onShowLogin: () => void;
  onShowPrivacy?: () => void;
}

export function WelcomeRegistration({ onComplete, onShowLogin, onShowPrivacy }: WelcomeRegistrationProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      onComplete(name.trim());
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
      console.error('Registration failed:', error);
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
              <Heart className="w-8 h-8 text-white" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                Create your account
              </h1>
              <p className="text-gray-600 leading-relaxed">
                Start your journey to better mental wellness
              </p>
            </div>
          </motion.div>

          {/* Registration Form */}
          <motion.form
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onSubmit={handleRegister}
          >
            {/* Name Input */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>

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
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm shadow-sm"
              />
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

            {/* Register Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </motion.form>

          {/* Login Section */}
          <motion.div
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <button
              onClick={onShowLogin}
              className="text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Already have an account? <span className="font-medium text-purple-600 hover:text-purple-700">Login</span>
            </button>
          </motion.div>

          {/* Terms and Privacy Links */}
          <motion.div
            className="text-center text-xs text-gray-500"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            By signing up, you agree to Luma's{' '}
            <button
              onClick={onShowPrivacy}
              className="text-gray-500 hover:text-gray-700 underline"
            >
              terms and conditions
            </button>
          </motion.div>
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
