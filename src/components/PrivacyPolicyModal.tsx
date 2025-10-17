import React from 'react';
import { X, Shield } from 'lucide-react';
import { motion } from 'motion/react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Privacy & Data Protection</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
          {/* Emotional Support Companion Section */}
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Emotional Support Companion</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Luma is an AI-powered emotional support companion designed to assist with reflection,
              self-development, and mental wellbeing.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong className="text-gray-900">Important:</strong> Luma is not a replacement for professional
                medical advice, diagnosis, or treatment. She is not a therapist, psychologist, or licensed mental
                health professional. If you're experiencing a mental health crisis or need professional support,
                please contact a qualified healthcare provider or crisis service immediately.
              </p>
            </div>
          </section>

          {/* What Data We Collect */}
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">What Data We Collect</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Account information (name, email)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Journal entries and reflections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Conversation history with Luma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Goals and progress tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>App usage patterns and preferences</span>
              </li>
            </ul>
          </section>

          {/* How Your Data Is Used */}
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">How Your Data Is Used</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Your personal data is used exclusively to:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Personalize your Luma experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Provide tailored emotional support and insights</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Track your progress and achievements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Improve our AI models and features</span>
              </li>
            </ul>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-3">
              <p className="text-sm text-gray-800 leading-relaxed">
                <strong className="text-green-800">We never sell your data.</strong> Your information is never
                shared with third parties for advertising or marketing purposes.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Data Security</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We protect your data using industry-standard encryption (AES-256) and secure storage practices.
              All data transmission uses HTTPS/TLS encryption. Your data is stored on secure servers with
              Row Level Security policies ensuring complete data isolation.
            </p>
          </section>

          {/* Your Data Rights */}
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Your Data Rights</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Access your personal data at any time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Export all your data in a portable format</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Request correction of inaccurate data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Delete your account and all associated data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>Opt out of data processing for AI improvements</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              You can manage these settings anytime from your Profile.
            </p>
          </section>

          {/* Need Immediate Help */}
          <section className="bg-pink-50 border border-pink-200 rounded-xl p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Need Immediate Help?</h3>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              If you're in crisis or experiencing thoughts of self-harm, please reach out:
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-medium text-gray-900">NZ Crisis Helpline:</p>
                <p className="text-gray-700">0800 543 354 (24/7)</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Lifeline:</p>
                <p className="text-gray-700">0800 543 354</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Samaritans:</p>
                <p className="text-gray-700">0800 726 666</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Emergency:</p>
                <p className="text-gray-700">111</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <p className="text-sm text-gray-600 leading-relaxed">
              For privacy questions or data requests, contact us at{' '}
              <a href="mailto:privacy@luma.app" className="text-purple-600 hover:text-purple-700 underline">
                privacy@luma.app
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl h-12 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
