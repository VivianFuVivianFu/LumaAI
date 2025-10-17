import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Luma Terms of Service</h1>
              <p className="text-sm text-gray-500 mt-1">Last updated: January 2025</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-purple max-w-none space-y-6">
            {/* Privacy & Data Protection */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Data Protection</h2>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">Emotional Support Companion</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Luma is an AI-powered emotional support companion designed to assist with reflection,
                self-development, and mental wellbeing.
              </p>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                <p className="text-amber-900 font-semibold mb-2">⚠️ Important Notice</p>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Luma is not a replacement for professional medical advice, diagnosis, or treatment.
                  She is not a therapist, psychologist, or licensed mental health professional.
                  If you're experiencing a mental health crisis or need professional support, please
                  contact a qualified healthcare provider or crisis service immediately.
                </p>
              </div>
            </section>

            {/* What Data We Collect */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What Data We Collect</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Account information (name, email)</li>
                <li>Journal entries and reflections</li>
                <li>Conversation history with Luma</li>
                <li>Goals and progress tracking</li>
                <li>App usage patterns and preferences</li>
              </ul>
            </section>

            {/* How Your Data Is Used */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How Your Data Is Used</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Your personal data is used exclusively to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-4">
                <li>Personalize your Luma experience</li>
                <li>Provide tailored emotional support and insights</li>
                <li>Track your progress and achievements</li>
                <li>Improve our AI models and features</li>
              </ul>
              <p className="text-gray-700 font-medium">
                We never sell your data to third parties. Your reflections remain private and secure.
              </p>
            </section>

            {/* Data Security & Protection */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Security & Protection</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                Luma is built in compliance with New Zealand's Privacy Act 2020. All data is encrypted
                in transit and at rest. We use industry-standard security measures to protect your information.
              </p>

              <h4 className="text-md font-semibold text-gray-900 mb-2 mt-4">Your Data Rights:</h4>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>Delete your account and all associated data</li>
                <li>Opt out of data processing for AI improvements</li>
              </ul>
              <p className="text-gray-600 mt-3">
                You can manage these settings anytime from your Profile.
              </p>
            </section>

            {/* Crisis Support */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Immediate Help?</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-900 font-semibold mb-3">
                  If you're in crisis or experiencing thoughts of self-harm, please reach out:
                </p>
                <ul className="space-y-2 text-red-800">
                  <li><strong>NZ Crisis Helpline:</strong> <a href="tel:0800543354" className="underline hover:text-red-900">0800 543 354</a> (24/7)</li>
                  <li><strong>AU Lifeline:</strong> <a href="tel:131114" className="underline hover:text-red-900">13 11 14</a></li>
                  <li><strong>USA Lifeline:</strong> <a href="tel:800-273-8255" className="underline hover:text-red-900">800-273-TALK</a></li>
                </ul>
              </div>
            </section>

            {/* Agreement */}
            <section className="pt-4 border-t border-gray-200">
              <p className="text-gray-600 leading-relaxed">
                By creating an account and using Luma, you agree to these Terms of Service and acknowledge
                that you have read and understood this agreement.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
