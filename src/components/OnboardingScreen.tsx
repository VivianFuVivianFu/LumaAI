import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Star, Shield, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface OnboardingScreenProps {
  currentScreen: number;
  onNext: () => void;
  onGetStarted: () => void;
}

export function OnboardingScreen({ currentScreen, onNext, onGetStarted }: OnboardingScreenProps) {
  const screens = [
    {
      id: 1,
      icon: Sparkles,
      title: "Meet Luma",
      description: "Meet Luma, your science-backed guide for healing, growth, and shine.",
      primaryAction: "Continue",
      secondaryAction: null,
      onPrimaryClick: onNext
    },
    {
      id: 2,
      icon: Star,
      title: "Personalized Support",
      description: "Your conversations, journals, and reflections adapt intelligently to your mood and needs.",
      primaryAction: "Show me how",
      secondaryAction: null,
      onPrimaryClick: onNext
    },
    {
      id: 3,
      icon: Shield,
      title: "Your Privacy Matters",
      description: "Luma is built with care and meets high data safety standards. You're always in control — your data can be deleted anytime.",
      primaryAction: "Get started",
      secondaryAction: null,
      onPrimaryClick: onGetStarted
    }
  ];

  const screen = screens[currentScreen - 1];
  const IconComponent = screen.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center space-y-8">
          {/* Animated Icon */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut",
              delay: 0.2
            }}
          >
            <motion.div
              className="relative"
              animate={{ 
                rotate: currentScreen === 1 ? [0, 5, -5, 0] : 0 
              }}
              transition={{ 
                duration: 2,
                repeat: currentScreen === 1 ? Infinity : 0,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                <IconComponent className="w-10 h-10 text-white" />
              </div>
              {currentScreen === 1 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-3 h-3 text-yellow-700" />
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
              {screen.title}
            </h1>
            <p className="text-gray-600 leading-relaxed px-2">
              {screen.description}
            </p>
            {currentScreen === 1 && (
              <p className="text-xs text-gray-500 leading-relaxed px-2 pt-2">
                🌱 Luma is your AI emotional companion, here to support your journey. She isn't a therapist or medical professional.
              </p>
            )}
            {currentScreen === 2 && (
              <p className="text-xs text-gray-500 leading-relaxed px-2 pt-2">
                🔒 Your data is private and securely stored — used only to personalize your experience.
              </p>
            )}
            {currentScreen === 3 && (
              <p className="text-xs text-gray-500 leading-relaxed px-2 pt-2">
                By continuing, you agree to Luma's terms and conditions.
              </p>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            className="space-y-4 pt-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button
              onClick={screen.onPrimaryClick}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {screen.primaryAction}
            </Button>
            
            {screen.secondaryAction && (
              <button className="text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center justify-center gap-1">
                {screen.secondaryAction}
                {screen.secondaryAction.includes('→') ? null : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Progress Indicator */}
      <motion.div
        className="pb-8 px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex justify-center items-center space-x-3">
          <div className="flex space-x-2">
            {[1, 2, 3].map((step) => (
              <motion.div
                key={step}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === currentScreen 
                    ? 'w-8 bg-gradient-to-r from-purple-600 to-pink-600' 
                    : step < currentScreen
                    ? 'w-2 bg-gray-400'
                    : 'w-2 bg-gray-300'
                }`}
                initial={step === currentScreen ? { width: 8 } : { width: 8 }}
                animate={step === currentScreen ? { width: 32 } : { width: 8 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500 ml-3">
            {currentScreen} / 3
          </span>
        </div>
      </motion.div>
    </div>
  );
}