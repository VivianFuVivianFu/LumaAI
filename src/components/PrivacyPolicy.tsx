import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        {/* Content */}
        <div className="prose prose-purple max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Luma. We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use
              our mental wellness application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Data We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We collect the following types of information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Account Information:</strong> Name, email address, password (encrypted)
              </li>
              <li>
                <strong>Wellness Data:</strong> Journal entries, goals, mood check-ins, tool usage
              </li>
              <li>
                <strong>Chat Data:</strong> Conversations with Luma AI assistant
              </li>
              <li>
                <strong>Usage Data:</strong> App interactions, feature usage, timestamps
              </li>
              <li>
                <strong>Technical Data:</strong> IP address, device type, browser information
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Data</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use your data to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>Provide personalized mental wellness support and AI guidance</li>
              <li>Generate insights and recommendations based on your patterns</li>
              <li>Improve our services and develop new features</li>
              <li>Send you important updates about your account</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data is stored securely using industry-standard encryption (AES-256).
              All data transmission uses HTTPS/TLS encryption. We use Supabase (PostgreSQL)
              for data storage with Row Level Security (RLS) policies to ensure data isolation.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              Your data is stored on servers located in the United States.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Supabase:</strong> Database and authentication services
              </li>
              <li>
                <strong>DeepSeek:</strong> AI language model for chat and guidance
              </li>
              <li>
                <strong>Langfuse:</strong> AI observability and quality monitoring
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              These services are bound by their own privacy policies and data processing agreements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under GDPR, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Right of Access:</strong> View a summary of your personal data
              </li>
              <li>
                <strong>Right to Data Portability:</strong> Export all your data in JSON format
              </li>
              <li>
                <strong>Right to Erasure:</strong> Delete your account and all associated data
              </li>
              <li>
                <strong>Right to Rectification:</strong> Update your profile information
              </li>
              <li>
                <strong>Right to Object:</strong> Object to processing of your data
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, go to Profile → Privacy & Data or contact us at{' '}
              <a href="mailto:privacy@luma-app.com" className="text-purple-600 hover:underline">
                privacy@luma-app.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your data for as long as your account is active. If you delete your account,
              all your data is permanently deleted within 30 days. Backup copies are deleted within 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies for authentication and session management. We do NOT use
              tracking cookies, advertising cookies, or third-party analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Luma is not intended for users under 18 years old. We do not knowingly collect data
              from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes
              by email and by updating the "Last updated" date at the top of this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this privacy policy or your data, please contact us:
            </p>
            <div className="mt-3 text-gray-700">
              <p>Email: <a href="mailto:privacy@luma-app.com" className="text-purple-600 hover:underline">privacy@luma-app.com</a></p>
              <p className="mt-1">Data Protection Officer: <a href="mailto:dpo@luma-app.com" className="text-purple-600 hover:underline">dpo@luma-app.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
