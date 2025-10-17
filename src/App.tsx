import { useState, useEffect, lazy, Suspense } from "react";
import { LoadingScreen } from "./components/LoadingScreen";
import { CookieConsent } from "./components/CookieConsent";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OfflineIndicator } from "./components/OfflineIndicator";
import {
  AuthProvider,
  useAuth,
} from "./components/AuthContext";

// Lazy load all major screens for better performance
const OnboardingScreen = lazy(() => import("./components/OnboardingScreen").then(m => ({ default: m.OnboardingScreen })));
const WelcomeRegistration = lazy(() => import("./components/WelcomeRegistration").then(m => ({ default: m.WelcomeRegistration })));
const LoginScreen = lazy(() => import("./components/LoginScreen").then(m => ({ default: m.LoginScreen })));
const Dashboard = lazy(() => import("./components/Dashboard").then(m => ({ default: m.Dashboard })));
const ProfileScreen = lazy(() => import("./components/ProfileScreen").then(m => ({ default: m.ProfileScreen })));
const GoalsScreen = lazy(() => import("./components/GoalsScreen").then(m => ({ default: m.GoalsScreen })));
const ToolsScreen = lazy(() => import("./components/ToolsScreen").then(m => ({ default: m.ToolsScreen })));
const JournalScreen = lazy(() => import("./components/JournalScreen").then(m => ({ default: m.JournalScreen })));
const ChatScreen = lazy(() => import("./components/ChatScreen").then(m => ({ default: m.ChatScreen })));
const TermsOfService = lazy(() => import("./components/TermsOfService").then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const PrivacyPolicyModal = lazy(() => import("./components/PrivacyPolicyModal").then(m => ({ default: m.PrivacyPolicyModal })));

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [userName, setUserName] = useState("");
  const {
    user,
    isLoading,
    isAuthenticated,
    setUserAsExisting,
  } = useAuth();

  const handleNext = () => {
    if (currentScreen < 3) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleGetStarted = () => {
    // Move to registration/login phase
    setCurrentScreen(4);
  };

  const handleRegistrationComplete = (name: string) => {
    setUserName(name);
    // Don't automatically complete - let the auth context handle it
  };

  const handleShowLogin = () => {
    setShowLogin(true);
  };

  const handleBackToRegistration = () => {
    setShowLogin(false);
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setShowGoals(false);
    setShowTools(false);
    setShowJournal(false);
    setShowChat(false);
    setShowTerms(false);
    setShowPrivacy(false);
  };

  const handleShowTerms = () => {
    setShowTerms(true);
    setShowPrivacy(false);
  };

  const handleShowPrivacy = () => {
    setShowPrivacy(true);
    setShowTerms(false);
  };

  const handleBackFromTerms = () => {
    setShowTerms(false);
    setShowPrivacy(false);
  };

  const handleShowGoals = () => {
    // Reset all other views first
    setShowProfile(false);
    setShowTools(false);
    setShowJournal(false);
    setShowChat(false);
    setShowGoals(true);
  };

  const handleShowTools = () => {
    // Reset all other views first
    setShowProfile(false);
    setShowGoals(false);
    setShowJournal(false);
    setShowChat(false);
    setShowTools(true);
  };

  const handleShowJournal = () => {
    // Reset all other views first
    setShowProfile(false);
    setShowGoals(false);
    setShowTools(false);
    setShowChat(false);
    setShowJournal(true);
  };

  const handleShowChat = () => {
    // Reset all other views first
    setShowProfile(false);
    setShowGoals(false);
    setShowTools(false);
    setShowJournal(false);
    setShowChat(true);
  };

  // Update user name when user changes
  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    }
  }, [user]);

  // Mark user as no longer new after they complete onboarding
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.is_new_user === true &&
      currentScreen > 3
    ) {
      setUserAsExisting();
    }
  }, [isAuthenticated, user, currentScreen, setUserAsExisting]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, show dashboard
  if (isAuthenticated && user) {
    // If it's a new user, show onboarding first
    if (user.is_new_user && currentScreen < 4) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <OnboardingScreen
            currentScreen={currentScreen}
            onNext={handleNext}
            onGetStarted={handleGetStarted}
          />
        </Suspense>
      );
    }

    // Show profile screen if requested
    if (showProfile) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <ProfileScreen onBack={handleBackToDashboard} />
        </Suspense>
      );
    }

    // Show chat screen if requested
    if (showChat) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <ChatScreen
            onBack={handleBackToDashboard}
            onShowGoals={handleShowGoals}
            onShowJournal={handleShowJournal}
            onShowTools={handleShowTools}
          />
        </Suspense>
      );
    }

    // Show goals screen if requested
    if (showGoals) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <GoalsScreen
            onBack={handleBackToDashboard}
            onShowChat={handleShowChat}
            onShowJournal={handleShowJournal}
            onShowTools={handleShowTools}
          />
        </Suspense>
      );
    }

    // Show tools screen if requested
    if (showTools) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <ToolsScreen
            onBack={handleBackToDashboard}
            onShowChat={handleShowChat}
            onShowGoals={handleShowGoals}
            onShowJournal={handleShowJournal}
          />
        </Suspense>
      );
    }

    // Show journal screen if requested
    if (showJournal) {
      return (
        <Suspense fallback={<LoadingScreen />}>
          <JournalScreen
            onBack={handleBackToDashboard}
            onShowChat={handleShowChat}
            onShowGoals={handleShowGoals}
            onShowTools={handleShowTools}
          />
        </Suspense>
      );
    }

    // Show dashboard for authenticated users
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Dashboard
          userName={user.name}
          onShowProfile={handleShowProfile}
          onShowGoals={handleShowGoals}
          onShowTools={handleShowTools}
          onShowJournal={handleShowJournal}
          onShowChat={handleShowChat}
          onShowTerms={handleShowTerms}
          onShowPrivacy={handleShowPrivacy}
        />
      </Suspense>
    );
  }

  // For non-authenticated users
  if (currentScreen < 4) {
    // Show onboarding for new users
    return (
      <Suspense fallback={<LoadingScreen />}>
        <OnboardingScreen
          currentScreen={currentScreen}
          onNext={handleNext}
          onGetStarted={handleGetStarted}
        />
      </Suspense>
    );
  }

  // Show Terms if requested (full screen)
  if (showTerms) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <TermsOfService onBack={handleBackFromTerms} />
      </Suspense>
    );
  }

  // Show login or registration screens with Privacy modal overlay
  if (showLogin) {
    return (
      <>
        <Suspense fallback={<LoadingScreen />}>
          <LoginScreen onBack={handleBackToRegistration} onShowTerms={handleShowTerms} onShowPrivacy={handleShowPrivacy} />
        </Suspense>
        {showPrivacy && (
          <Suspense fallback={null}>
            <PrivacyPolicyModal onClose={handleBackFromTerms} />
          </Suspense>
        )}
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <WelcomeRegistration
          onComplete={handleRegistrationComplete}
          onShowLogin={handleShowLogin}
          onShowPrivacy={handleShowPrivacy}
        />
      </Suspense>
      {showPrivacy && (
        <Suspense fallback={null}>
          <PrivacyPolicyModal onClose={handleBackFromTerms} />
        </Suspense>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OfflineIndicator />
        <AppContent />
        <CookieConsent />
      </AuthProvider>
    </ErrorBoundary>
  );
}