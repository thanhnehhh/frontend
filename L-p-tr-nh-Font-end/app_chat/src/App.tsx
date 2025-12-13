import React, { useState, useEffect } from "react";
import './App.css';
import SplashScreen from "./pages/SplashScreen";
import LoginScreen from "./pages/LoginScreen";
import RegisterScreen from "./pages/RegisterScreen";
import ChatScreen from "./pages/ChatScreen";
import "./styles/animations.css";
import { useAppSelector, useAppDispatch } from "./redux/hooks";
import { logoutDirect } from "./redux/slices/authSlice";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<"login" | "register">("login");
  const [nextScreen, setNextScreen] = useState<"login" | "register">("login");
  const [isAnimating, setIsAnimating] = useState(false);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { error: chatError } = useAppSelector((state) => state.chat);
  const dispatch = useAppDispatch();

  // Nếu chat có auth error, logout
  useEffect(() => {
    if (chatError && (chatError.includes("User not Login") || chatError.includes("AUTH"))) {
      console.log("[App] Auth error detected, logging out");
      dispatch(logoutDirect());
    }
  }, [chatError, dispatch]);

  function handleSwitchScreen(screen: "login" | "register") {
    if (isAnimating) return;
    setNextScreen(screen);
    setIsAnimating(true);
  }

  function handleAnimationEnd() {
    setCurrentScreen(nextScreen);
    setIsAnimating(false);
  }

  return (
  <div className={`app-container ${isAuthenticated ? 'chat-mode' : ''}`}>
      {showSplash ? (
        <SplashScreen onDone={() => setShowSplash(false)} />
      ) : isAuthenticated ? (
        <ChatScreen />
      ) : (
        <div
          className={`screen-wrapper ${
            isAnimating
              ? currentScreen === "login"
                ? "slide-out-left"
                : "slide-out-right"
              : "slide-in"
          }`}
          onAnimationEnd={handleAnimationEnd}
        >
          {currentScreen === "login" ? (
            <LoginScreen onRegisterClick={() => handleSwitchScreen("register")} />
          ) : (
            <RegisterScreen onBackClick={() => handleSwitchScreen("login")} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;



