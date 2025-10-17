import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Cookie Consent Banner Component
 *
 * GDPR-compliant cookie consent banner
 * Shows on first visit and stores user's consent preference
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('luma_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('luma_cookie_consent', 'accepted');
    localStorage.setItem('luma_cookie_consent_date', new Date().toISOString());
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('luma_cookie_consent', 'declined');
    localStorage.setItem('luma_cookie_consent_date', new Date().toISOString());

    // Clear any existing tracking cookies/data if user declines
    localStorage.removeItem('luma_remember_me');

    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-purple-200 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🍪 Cookie Consent
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              We use essential cookies to provide our services and improve your experience.
              We do NOT use tracking or advertising cookies. Your data stays private and secure.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <a
                href="/privacy-policy"
                className="underline hover:text-purple-600 transition-colors"
              >
                Privacy Policy
              </a>
              <span>•</span>
              <a
                href="/terms-of-service"
                className="underline hover:text-purple-600 transition-colors"
              >
                Terms of Service
              </a>
              <span>•</span>
              <span>Essential cookies only</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
