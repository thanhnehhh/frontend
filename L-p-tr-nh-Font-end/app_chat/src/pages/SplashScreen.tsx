import React, { useEffect } from "react";
import "../styles/app.css";
import "../styles/splash.css";
import logo from "../assets/logo.png";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { reLoginAsync } from "../redux/slices/authSlice";

interface SplashProps {
    onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashProps) {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    useEffect(() => {
        // Nếu chưa authenticated, kiểm tra localStorage có RE_LOGIN_CODE không
        if (!isAuthenticated) {
            const username = localStorage.getItem("username");
            const reLoginCode = localStorage.getItem("reLoginCode");
            
            if (username && reLoginCode) {
                console.log("[SplashScreen] Auto RE_LOGIN from localStorage");
                dispatch(reLoginAsync({ user: username, code: reLoginCode }));
            }
        }
    }, [isAuthenticated, dispatch]);

    useEffect(() => {
        // Splash delay dựa trên authentication status
        const timer = setTimeout(() => {
            onDone();
        }, 1800);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="splash-container">
            <img src={logo} alt="logo" className="splash-logo" />
        </div>
    );
}
