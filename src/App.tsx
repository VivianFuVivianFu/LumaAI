import { useState, useEffect } from "react";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { WelcomeRegistration } from "./components/WelcomeRegistration";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { ProfileScreen } from "./components/ProfileScreen";
import { GoalsScreen } from "./components/GoalsScreen";
import { ToolsScreen } from "./components/ToolsScreen";
import { JournalScreen } from "./components/JournalScreen";
import { ChatScreen } from "./components/ChatScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import {
  AuthProvider,
  useAuth,
} from "./components/AuthContext";

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState(1);
  const [showLogin, setShowLogin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showChat, setShowChat] = useState(false);
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
        <OnboardingScreen
          currentScreen={currentScreen}
          onNext={handleNext}
          onGetStarted={handleGetStarted}
        />
      );
    }

    // Show profile screen if requested
    if (showProfile) {
      return <ProfileScreen onBack={handleBackToDashboard} />;
    }

    // Show chat screen if requested
    if (showChat) {
      return (
        <ChatScreen
          onBack={handleBackToDashboard}
          onShowGoals={handleShowGoals}
          onShowJournal={handleShowJournal}
          onShowTools={handleShowTools}
        />
      );
    }

    // Show goals screen if requested
    if (showGoals) {
      return (
        <GoalsScreen
          onBack={handleBackToDashboard}
          onShowChat={handleShowChat}
          onShowJournal={handleShowJournal}
          onShowTools={handleShowTools}
        />
      );
    }

    // Show tools screen if requested
    if (showTools) {
      return (
        <ToolsScreen
          onBack={handleBackToDashboard}
          onShowChat={handleShowChat}
          onShowGoals={handleShowGoals}
          onShowJournal={handleShowJournal}
        />
      );
    }

    // Show journal screen if requested
    if (showJournal) {
      return (
        <JournalScreen
          onBack={handleBackToDashboard}
          onShowChat={handleShowChat}
          onShowGoals={handleShowGoals}
          onShowTools={handleShowTools}
        />
      );
    }

    // Show dashboard for authenticated users
    return (
      <Dashboard
        userName={user.name}
        onShowProfile={handleShowProfile}
        onShowGoals={handleShowGoals}
        onShowTools={handleShowTools}
        onShowJournal={handleShowJournal}
        onShowChat={handleShowChat}
      />
    );
  }

  // For non-authenticated users
  if (currentScreen < 4) {
    // Show onboarding for new users
    return (
      <OnboardingScreen
        currentScreen={currentScreen}
        onNext={handleNext}
        onGetStarted={handleGetStarted}
      />
    );
  }

  // Show login or registration screens
  if (showLogin) {
    return <LoginScreen onBack={handleBackToRegistration} />;
  }

  return (
    <WelcomeRegistration
      onComplete={handleRegistrationComplete}
      onShowLogin={handleShowLogin}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}