import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Heart, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from './AuthContext';

interface WelcomeRegistrationProps {
  onComplete: (name: string) => void;
  onShowLogin: () => void;
}

export function WelcomeRegistration({ onComplete, onShowLogin }: WelcomeRegistrationProps) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const { register } = useAuth();

  const handleNameSubmit = async () => {
    if (name.trim()) {
      setIsLoading(true);
      try {
        // Register user with a default provider when they continue with just name
        await register(name.trim(), 'google');
        onComplete(name.trim());
      } catch (error) {
        console.error('Registration failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    }
  };

  const handleRegister = async (provider: 'google' | 'hotmail') => {
    if (!name.trim()) {
      return;
    }
    
    setIsLoading(true);
    setLoadingProvider(provider);
    try {
      await register(name.trim(), provider);
    } catch (error) {
      console.error('Registration failed:', error);
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
              <Heart className="w-8 h-8 text-white" />
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                What should I call you?
              </h1>
              <p className="text-gray-600 leading-relaxed">
                I'd love to know your name so our conversations feel more personal.
              </p>
            </div>
          </motion.div>

          {/* Name Input */}
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter your name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-12 px-4 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>
          </motion.div>

          {/* Sign Up Section */}
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="space-y-3">
              <h3 className="text-gray-900 font-medium">Sign up</h3>
              <div className="space-y-3">
                <Button
                  disabled={!name.trim() || isLoading}
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50"
                  onClick={() => handleRegister('google')}
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
                  disabled={!name.trim() || isLoading}
                  variant="outline"
                  className="w-full h-12 border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50"
                  onClick={() => handleRegister('hotmail')}
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
            </div>
          </motion.div>

          {/* Login Section */}
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="space-y-3">
              <button
                onClick={onShowLogin}
                className="text-gray-600 text-sm hover:text-gray-800 transition-colors"
              >
                Already have an account? <span className="font-medium text-purple-600 hover:text-purple-700">Login</span>
              </button>
            </div>
          </motion.div>

          {/* Continue Button - Only shown when name is entered */}
          {name.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={handleNameSubmit}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isLoading && !loadingProvider ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  `Continue as ${name}`
                )}
              </Button>
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