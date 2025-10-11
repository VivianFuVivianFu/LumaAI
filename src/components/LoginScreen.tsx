import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from './AuthContext';

interface LoginScreenProps {
  onBack?: () => void;
}

export function LoginScreen({ onBack }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (provider: 'google' | 'hotmail') => {
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await login(provider);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
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

          {/* Login Options */}
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="space-y-3">
              <Button
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 hover:shadow-md"
                onClick={() => handleLogin('google')}
              >
                <div className="flex items-center justify-center gap-3">
                  {loadingProvider === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">G</span>
                    </div>
                  )}
                  <span className="text-gray-700">Continue with Google</span>
                </div>
              </Button>
              
              <Button
                disabled={isLoading}
                variant="outline"
                className="w-full h-12 border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 hover:shadow-md"
                onClick={() => handleLogin('hotmail')}
              >
                <div className="flex items-center justify-center gap-3">
                  {loadingProvider === 'hotmail' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5 text-blue-600" />
                  )}
                  <span className="text-gray-700">Continue with Hotmail</span>
                </div>
              </Button>
            </div>
          </motion.div>

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